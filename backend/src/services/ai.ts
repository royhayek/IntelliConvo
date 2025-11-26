import { OpenAI } from 'openai';
import { prisma } from '../lib/prisma';
import { searchContent } from './embeddings';
import { logger } from '../utils/logger';
import { ConversationRole } from '@prisma/client';
import { settings } from '../lib/settings';
import { countTokens, countMessageTokens, truncateToTokenLimit } from '../utils/tokenCounter';

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

interface ConversationContext {
  siteId: string;
  conversationId: string;
  message: string;
}

/**
 * Filter conversation messages to fit within a token budget
 * Keeps most recent messages first, then adds older ones until budget is reached
 */
function filterMessagesByTokenBudget(
  messages: Array<{ role: ConversationRole; content: string; timestamp: Date }>,
  maxTokens: number
): Array<{ role: string; content: string }> {
  const filtered: Array<{ role: string; content: string }> = [];
  let currentTokens = 0;

  // Process messages in reverse chronological order (most recent first)
  for (const msg of messages) {
    const messageTokens = countTokens(msg.content) + 4; // +4 for formatting overhead

    if (currentTokens + messageTokens <= maxTokens) {
      filtered.unshift({
        role: msg.role === ConversationRole.USER ? 'user' : 'assistant',
        content: msg.content,
      });
      currentTokens += messageTokens;
    } else {
      // Budget exceeded, stop adding messages
      break;
    }
  }

  return filtered;
}

function buildSystemPrompt(
  site: any,
  relevantContent: string[],
  descriptionLimit: number,
  instructionsLimit: number,
  contentChunkLimit: number
): string {
  let prompt = `You are an AI assistant for ${site.siteName}.`;

  if (site.siteDescription) {
    const truncatedDescription = truncateToTokenLimit(site.siteDescription, descriptionLimit);
    prompt += `\n\n${truncatedDescription}`;
  }

  if (site.specialInstructions) {
    const truncatedInstructions = truncateToTokenLimit(site.specialInstructions, instructionsLimit);
    prompt += `\n\n${truncatedInstructions}`;
  }

  prompt += `\n\nGuidelines:\n- Answer based only on provided context\n- Be concise and helpful\n- Admit if you don't know something`;

  if (relevantContent.length > 0) {
    prompt += '\n\nContext:\n';
    for (const content of relevantContent) {
      const truncatedContent = truncateToTokenLimit(content, contentChunkLimit);
      prompt += `\n${truncatedContent}\n`;
    }
  }

  return prompt;
}

/**
 * Calculate the cost of an OpenAI API call based on token usage and model
 * Pricing as of January 2025 (per 1M tokens)
 */
function calculateCost(promptTokens: number, completionTokens: number, model: string): number {
  // Pricing per 1M tokens in dollars
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4-turbo-preview': { input: 10, output: 30 },
    'gpt-4-turbo': { input: 10, output: 30 },
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  };

  // Default to gpt-4o-mini pricing if model not found
  const modelPricing = pricing[model] || pricing['gpt-4o-mini'];

  // Calculate costs in dollars
  const inputCostDollars = (promptTokens / 1_000_000) * modelPricing.input;
  const outputCostDollars = (completionTokens / 1_000_000) * modelPricing.output;

  const totalCostDollars = inputCostDollars + outputCostDollars;
  const totalCostCents = totalCostDollars * 100;

  console.log(`Cost breakdown for model ${model}:`);
  console.log(`  Prompt tokens: ${promptTokens}, Cost: $${inputCostDollars.toFixed(6)}`);
  console.log(`  Completion tokens: ${completionTokens}, Cost: $${outputCostDollars.toFixed(6)}`);
  console.log(`  Total cost: $${totalCostDollars.toFixed(6)} (${totalCostCents.toFixed(4)} cents)`);

  // Return exact cost in cents (no rounding to preserve accuracy)
  // Database stores as Float, so fractional cents are preserved
  return totalCostCents;
}

export interface StreamResult {
  tokensUsed: number;
  costInCents: number;
}

// Stream response for real-time chat with usage tracking
export async function streamResponseWithUsage(
  context: ConversationContext,
  onChunk: (chunk: string) => void
): Promise<StreamResult> {
  try {
    // Get site information
    const site = await prisma.site.findUnique({
      where: { id: context.siteId },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    // Get AI settings from database
    const [
      model,
      temperature,
      maxTokens,
      maxResponseTokens,
      maxHistoryTokens,
      maxContentChunkTokens,
      maxTotalInputTokens,
      vectorSearchTopK,
      systemPromptDescriptionLimit,
      systemPromptInstructionsLimit,
    ] = await Promise.all([
      settings.getAIModel(),
      settings.getAITemperature(),
      settings.getAIMaxTokens(),
      settings.getAIMaxResponseTokens(),
      settings.getAIMaxHistoryTokens(),
      settings.getAIMaxContentChunkTokens(),
      settings.getAIMaxTotalInputTokens(),
      settings.getAIVectorSearchTopK(),
      settings.getAISystemPromptDescriptionLimit(),
      settings.getAISystemPromptInstructionsLimit(),
    ]);

    // Get conversation history (fetch more than needed, then filter by tokens)
    const previousMessages = await prisma.message.findMany({
      where: { conversationId: context.conversationId },
      orderBy: { timestamp: 'desc' },
      take: 20, // Fetch more, then filter by token budget
    });

    // Search for relevant content
    const relevantContent = await searchContent(context.siteId, context.message, vectorSearchTopK);

    // Build system prompt with configurable limits
    const systemPrompt = buildSystemPrompt(
      site,
      relevantContent,
      systemPromptDescriptionLimit,
      systemPromptInstructionsLimit,
      maxContentChunkTokens
    );

    // Build messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history with smart token-based filtering
    const filteredHistory = filterMessagesByTokenBudget(previousMessages, maxHistoryTokens);
    messages.push(...filteredHistory);

    // Add current message
    messages.push({ role: 'user', content: context.message });

    // Safety check: Log warning if total input exceeds budget
    const totalInputTokens = countMessageTokens(messages);
    if (totalInputTokens > maxTotalInputTokens) {
      logger.warn(`Input token count (${totalInputTokens}) exceeds budget (${maxTotalInputTokens}) for site ${context.siteId}`);
    }

    // Generate streaming response with usage tracking
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check OPENAI_API_KEY environment variable.');
    }

    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: Math.min(maxTokens, maxResponseTokens),
      stream: true,
      stream_options: { include_usage: true },
    });

    let tokensUsed = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk(content);
      }
      // Capture usage from the final chunk
      if (chunk.usage) {
        tokensUsed = chunk.usage.total_tokens || 0;
        promptTokens = chunk.usage.prompt_tokens || 0;
        completionTokens = chunk.usage.completion_tokens || 0;
      }
    }

    // Calculate cost with accurate model-specific pricing
    const costInCents = calculateCost(promptTokens, completionTokens, model);
    return { tokensUsed, costInCents };
  } catch (error) {
    logger.error('Failed to stream AI response:', error);
    throw error;
  }
}
