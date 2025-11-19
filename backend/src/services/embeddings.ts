import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

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
    const chunks = chunkText(content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generate embedding
      if (!openai) {
        throw new Error('OpenAI client not initialized. Please check OPENAI_API_KEY environment variable.');
      }
      const response = await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
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
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      input: query,
      dimensions: EMBEDDING_DIMENSIONS, // Match Pinecone index dimensions
    });

    const queryEmbedding = response.data[0].embedding;

    // Get all URL IDs for the site
    const siteUrls = await prisma.siteUrl.findMany({
      where: { siteId, isActive: true, isExcluded: false },
      select: { id: true },
    });

    const siteUrlIds = siteUrls.map(url => url.id);

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