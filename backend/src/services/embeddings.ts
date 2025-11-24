import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { settings } from '../lib/settings';
import pLimit from 'p-limit';

// Batch processing configuration
const OPENAI_BATCH_SIZE = 100; // OpenAI supports up to 2048 inputs per request, but 100 is safer
const PINECONE_BATCH_SIZE = 100; // Pinecone recommended batch size for upserts
const URL_CONCURRENCY = 5; // Process 5 URLs in parallel

// Initialize OpenAI only if API key is properly configured
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    logger.error('Failed to initialize OpenAI client:', error);
  }
}

let pinecone: Pinecone | null = null;
let index: any = null;

// Pinecone index dimension - must match your index configuration
// text-embedding-3-small default is 1536, but can be reduced to 512, 256, etc.
const EMBEDDING_DIMENSIONS = parseInt(process.env.PINECONE_DIMENSIONS || '512');

// Only initialize Pinecone if API key is properly configured
if (process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY !== 'your_pinecone_api_key_here') {
  try {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'intelligentconvo');
    logger.info(`Pinecone initialized with ${EMBEDDING_DIMENSIONS}-dimensional embeddings`);
  } catch (error) {
    logger.warn('Pinecone initialization failed, running without vector storage:', error);
  }
}

// Chunk text into smaller segments
export function chunkText(text: string, maxTokens: number = 500): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (const word of words) {
    // Rough token estimation (1 word ≈ 1.3 tokens)
    const wordTokens = Math.ceil(word.length / 4);

    if (currentTokens + wordTokens > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
      currentTokens = 0;
    }

    currentChunk.push(word);
    currentTokens += wordTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

// Generate embeddings for content
export async function generateEmbeddings(siteUrlId: string, content: string): Promise<void> {
  try {
    // First, delete any existing embeddings for this URL to avoid unique constraint violations
    await deleteEmbeddings(siteUrlId);

    const chunks = chunkText(content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generate embedding
      if (!openai) {
        throw new Error('OpenAI client not initialized. Please check OPENAI_API_KEY environment variable.');
      }

      // Get embedding model from settings
      const embeddingModel = await settings.getEmbeddingModel();

      const response = await openai.embeddings.create({
        model: embeddingModel,
        input: chunk,
        dimensions: EMBEDDING_DIMENSIONS, // Match Pinecone index dimensions
      });

      const embedding = response.data[0].embedding;

      // Generate unique ID for vector
      const vectorId = `${siteUrlId}_chunk_${i}`;

      // Store in Pinecone (if available)
      if (index) {
        try {
          await index.upsert([
            {
              id: vectorId,
              values: embedding,
              metadata: {
                siteUrlId,
                chunkIndex: i,
                content: chunk.substring(0, 1000), // Store truncated content in metadata
              },
            },
          ]);
        } catch (error) {
          logger.warn('Failed to store in Pinecone:', error);
        }
      }

      // Store reference in database
      await prisma.embedding.create({
        data: {
          siteUrlId,
          content: chunk,
          contentChunk: chunk,
          chunkIndex: i,
          vectorId,
        },
      });
    }

    logger.info(`Generated ${chunks.length} embeddings for URL ${siteUrlId}`);
  } catch (error) {
    logger.error(`Failed to generate embeddings for ${siteUrlId}:`, error);
    throw error;
  }
}

// Generate embeddings for content using batch processing (OPTIMIZED)
export async function generateBatchEmbeddings(siteUrlId: string, content: string): Promise<number> {
  try {
    // First, delete any existing embeddings for this URL
    await deleteEmbeddings(siteUrlId);

    const chunks = chunkText(content);
    if (chunks.length === 0) {
      return 0;
    }

    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check OPENAI_API_KEY environment variable.');
    }

    // Get embedding model from settings
    const embeddingModel = await settings.getEmbeddingModel();

    // Process chunks in batches for OpenAI API
    const allEmbeddings: { chunkIndex: number; embedding: number[]; chunk: string }[] = [];

    for (let batchStart = 0; batchStart < chunks.length; batchStart += OPENAI_BATCH_SIZE) {
      const batchChunks = chunks.slice(batchStart, batchStart + OPENAI_BATCH_SIZE);

      // Generate embeddings for batch in a single API call
      const response = await openai.embeddings.create({
        model: embeddingModel,
        input: batchChunks,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      // Map embeddings to their chunk indices
      for (let i = 0; i < response.data.length; i++) {
        allEmbeddings.push({
          chunkIndex: batchStart + i,
          embedding: response.data[i].embedding,
          chunk: batchChunks[i],
        });
      }
    }

    // Batch upsert to Pinecone
    if (index) {
      const vectors = allEmbeddings.map(({ chunkIndex, embedding, chunk }) => ({
        id: `${siteUrlId}_chunk_${chunkIndex}`,
        values: embedding,
        metadata: {
          siteUrlId,
          chunkIndex,
          content: chunk.substring(0, 1000),
        },
      }));

      // Upsert in batches
      for (let i = 0; i < vectors.length; i += PINECONE_BATCH_SIZE) {
        const batch = vectors.slice(i, i + PINECONE_BATCH_SIZE);
        try {
          await index.upsert(batch);
        } catch (error) {
          logger.warn(`Failed to store batch ${i / PINECONE_BATCH_SIZE + 1} in Pinecone:`, error);
        }
      }
    }

    // Batch insert to database
    const dbRecords = allEmbeddings.map(({ chunkIndex, chunk }) => ({
      siteUrlId,
      content: chunk,
      contentChunk: chunk,
      chunkIndex,
      vectorId: `${siteUrlId}_chunk_${chunkIndex}`,
    }));

    await prisma.embedding.createMany({
      data: dbRecords,
    });

    logger.info(`Generated ${chunks.length} embeddings for URL ${siteUrlId} (batch mode)`);
    return chunks.length;
  } catch (error) {
    logger.error(`Failed to generate batch embeddings for ${siteUrlId}:`, error);
    throw error;
  }
}

// Progress callback type for embedding generation
export interface EmbeddingProgress {
  siteId: string;
  phase: 'embedding';
  completed: number;
  total: number;
  currentUrl?: string;
  estimatedSecondsRemaining?: number;
}

export type EmbeddingProgressCallback = (progress: EmbeddingProgress) => void;

// Callback for individual URL completion (enables progressive availability)
export interface UrlCompletionCallbacks {
  onUrlSuccess?: (urlId: string) => Promise<void> | void;
  onUrlFailure?: (urlId: string, error?: string) => Promise<void> | void;
  shouldAbort?: () => Promise<boolean> | boolean;
}

// Process multiple URLs in parallel with progress tracking and real-time status updates
export async function processSiteEmbeddingsParallel(
  siteId: string,
  urls: { id: string; url: string; content: string }[],
  onProgress?: EmbeddingProgressCallback,
  urlCallbacks?: UrlCompletionCallbacks
): Promise<{ successCount: number; failCount: number; failedUrls: string[] }> {
  const limit = pLimit(URL_CONCURRENCY);
  let completed = 0;
  let successCount = 0;
  let failCount = 0;
  const failedUrls: string[] = [];
  const startTime = Date.now();

  // Track average time per URL for ETA calculation
  const processingTimes: number[] = [];

  const processUrl = async (urlData: { id: string; url: string; content: string }) => {
    // Check if we should abort (paused)
    if (urlCallbacks?.shouldAbort && await urlCallbacks.shouldAbort()) {
      logger.info(`Embedding paused, skipping: ${urlData.url}`);
      return;
    }

    const urlStartTime = Date.now();

    try {
      const chunkCount = await generateBatchEmbeddings(urlData.id, urlData.content);
      successCount++;

      // Track processing time for ETA
      processingTimes.push(Date.now() - urlStartTime);

      // Notify of individual URL success (for progressive availability)
      if (urlCallbacks?.onUrlSuccess) {
        await urlCallbacks.onUrlSuccess(urlData.id);
      }

      logger.debug(`Embedded URL ${urlData.id}: ${chunkCount} chunks`);
    } catch (error) {
      failCount++;
      failedUrls.push(urlData.id);

      // Extract error message
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Notify of individual URL failure with error details
      if (urlCallbacks?.onUrlFailure) {
        await urlCallbacks.onUrlFailure(urlData.id, errorMessage);
      }

      logger.error(`Failed to embed URL ${urlData.id}:`, error);
    } finally {
      completed++;

      // Calculate ETA based on average processing time
      const avgTime = processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 3000; // Default 3 seconds per URL
      const remaining = urls.length - completed;
      const estimatedMs = (remaining * avgTime) / URL_CONCURRENCY;

      if (onProgress) {
        onProgress({
          siteId,
          phase: 'embedding',
          completed,
          total: urls.length,
          currentUrl: urlData.url,
          estimatedSecondsRemaining: Math.ceil(estimatedMs / 1000),
        });
      }
    }
  };

  // Process all URLs with concurrency limit
  await Promise.all(urls.map(url => limit(() => processUrl(url))));

  const totalTime = (Date.now() - startTime) / 1000;
  logger.info(`Processed ${urls.length} URLs in ${totalTime.toFixed(1)}s (${successCount} success, ${failCount} failed)`);

  return { successCount, failCount, failedUrls };
}

// Search for relevant content
export async function searchContent(
  siteId: string,
  query: string,
  topK: number = 5
): Promise<string[]> {
  try {
    // Generate embedding for query
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check OPENAI_API_KEY environment variable.');
    }

    // Get embedding model from settings
    const embeddingModel = await settings.getEmbeddingModel();

    const response = await openai.embeddings.create({
      model: embeddingModel,
      input: query,
      dimensions: EMBEDDING_DIMENSIONS, // Match Pinecone index dimensions
    });

    const queryEmbedding = response.data[0].embedding;

    // Get all URL IDs for the site that have READY embeddings (enables progressive availability)
    const siteUrls = await prisma.siteUrl.findMany({
      where: {
        siteId,
        isActive: true,
        isExcluded: false,
        embeddingStatus: 'READY', // Only search URLs with completed embeddings
      },
      select: { id: true },
    });

    const siteUrlIds = siteUrls.map(url => url.id);

    // Return empty if no URLs are ready yet
    if (siteUrlIds.length === 0) {
      logger.info(`No READY embeddings found for site ${siteId}`);
      return [];
    }

    // If Pinecone is not available, fall back to database search
    if (!index) {
      logger.warn('Pinecone not available, falling back to database search');
      const embeddings = await prisma.embedding.findMany({
        where: { siteUrlId: { in: siteUrlIds } },
        select: { content: true },
        take: topK,
      });
      return embeddings.map(e => e.content);
    }

    try {
      // Search in Pinecone
      const searchResults = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter: {
          siteUrlId: { $in: siteUrlIds },
        },
      });

      // Extract content from results
      const relevantContent: string[] = [];

      for (const match of searchResults.matches || []) {
        if (match.metadata?.content) {
          relevantContent.push(match.metadata.content as string);
        }
      }

      return relevantContent;
    } catch (error) {
      logger.warn('Pinecone search failed, falling back to database:', error);
      const embeddings = await prisma.embedding.findMany({
        where: { siteUrlId: { in: siteUrlIds } },
        select: { content: true },
        take: topK,
      });
      return embeddings.map(e => e.content);
    }
  } catch (error) {
    logger.error(`Search failed for site ${siteId}:`, error);
    throw error;
  }
}

// Delete embeddings for a URL
export async function deleteEmbeddings(siteUrlId: string): Promise<void> {
  try {
    // Get all embeddings for this URL
    const embeddings = await prisma.embedding.findMany({
      where: { siteUrlId },
      select: { vectorId: true },
    });

    if (embeddings.length > 0) {
      // Delete from Pinecone (if available)
      if (index) {
        try {
          const vectorIds = embeddings.map(e => e.vectorId);
          await index.deleteMany(vectorIds);
        } catch (error) {
          logger.warn('Failed to delete from Pinecone:', error);
        }
      }

      // Delete from database
      await prisma.embedding.deleteMany({
        where: { siteUrlId },
      });

      logger.info(`Deleted ${embeddings.length} embeddings for URL ${siteUrlId}`);
    }
  } catch (error) {
    logger.error(`Failed to delete embeddings for ${siteUrlId}:`, error);
    throw error;
  }
}

// Delete embeddings by vector IDs (for direct embedding deletion)
export async function deleteEmbeddingsByVectorIds(vectorIds: string[]): Promise<void> {
  if (vectorIds.length === 0) return;

  try {
    // Delete from Pinecone (if available)
    if (index) {
      try {
        await index.deleteMany(vectorIds);
        logger.info(`Deleted ${vectorIds.length} vectors from Pinecone`);
      } catch (error) {
        logger.warn('Failed to delete from Pinecone:', error);
      }
    }
  } catch (error) {
    logger.error('Failed to delete embeddings by vector IDs:', error);
    throw error;
  }
}

// Delete all embeddings for a site (bulk operation)
export async function deleteSiteEmbeddings(siteId: string): Promise<number> {
  try {
    // Get all URLs for the site
    const urls = await prisma.siteUrl.findMany({
      where: { siteId },
      select: { id: true },
    });

    if (urls.length === 0) {
      return 0;
    }

    const urlIds = urls.map(u => u.id);

    // Get all embeddings for these URLs
    const embeddings = await prisma.embedding.findMany({
      where: { siteUrlId: { in: urlIds } },
      select: { vectorId: true },
    });

    if (embeddings.length > 0) {
      // Delete from Pinecone in batches (Pinecone has limits on batch size)
      if (index) {
        const vectorIds = embeddings.map(e => e.vectorId);
        const batchSize = 1000; // Pinecone recommended batch size

        for (let i = 0; i < vectorIds.length; i += batchSize) {
          const batch = vectorIds.slice(i, i + batchSize);
          try {
            await index.deleteMany(batch);
          } catch (error) {
            logger.warn(`Failed to delete batch ${i / batchSize + 1} from Pinecone:`, error);
          }
        }

        logger.info(`Deleted ${vectorIds.length} vectors from Pinecone for site ${siteId}`);
      }
    }

    return embeddings.length;
  } catch (error) {
    logger.error(`Failed to delete site embeddings for ${siteId}:`, error);
    throw error;
  }
}

// Delete embeddings for multiple URLs (bulk operation)
export async function deleteEmbeddingsForUrls(urlIds: string[]): Promise<number> {
  if (urlIds.length === 0) return 0;

  try {
    // Get all embeddings for these URLs
    const embeddings = await prisma.embedding.findMany({
      where: { siteUrlId: { in: urlIds } },
      select: { vectorId: true },
    });

    if (embeddings.length > 0 && index) {
      const vectorIds = embeddings.map(e => e.vectorId);
      const batchSize = 1000;

      for (let i = 0; i < vectorIds.length; i += batchSize) {
        const batch = vectorIds.slice(i, i + batchSize);
        try {
          await index.deleteMany(batch);
        } catch (error) {
          logger.warn(`Failed to delete batch from Pinecone:`, error);
        }
      }

      logger.info(`Deleted ${vectorIds.length} vectors from Pinecone for ${urlIds.length} URLs`);
    }

    return embeddings.length;
  } catch (error) {
    logger.error('Failed to delete embeddings for URLs:', error);
    throw error;
  }
}

// Delete ALL vectors from Pinecone index (DANGER: This wipes the entire index)
export async function deleteAllPineconeVectors(): Promise<{ success: boolean; message: string }> {
  try {
    if (!pinecone) {
      return {
        success: false,
        message: 'Pinecone is not configured or initialized',
      };
    }

    const indexName = process.env.PINECONE_INDEX_NAME || 'intelligentconvo';
    const targetIndex = pinecone.index(indexName);

    await targetIndex.namespace('').deleteAll();

    const result = await prisma.embedding.deleteMany({});

    logger.warn(`ADMIN ACTION: Deleted all vectors from Pinecone index "${indexName}" and ${result.count} database records`);

    return {
      success: true,
      message: `Successfully deleted all vectors from Pinecone index "${indexName}" and ${result.count} records from database`,
    };
  } catch (error) {
    logger.error('Failed to delete all Pinecone vectors:', error);
    throw error;
  }
}