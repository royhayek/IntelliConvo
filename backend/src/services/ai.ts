import { OpenAI } from 'openai';
import { prisma } from '../lib/prisma';
import { searchContent } from './embeddings';
import { logger } from '../utils/logger';
import { ConversationRole } from '@prisma/client';
import { settings } from '../lib/settings';

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

export async function generateResponse(context: ConversationContext): Promise<{
  response: string;
  tokensUsed: number;
  costInCents: number;
}> {
  try {
    // Get site information
    const site = await prisma.site.findUnique({
      where: { id: context.siteId },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    // Get conversation history
    const previousMessages = await prisma.message.findMany({
      where: { conversationId: context.conversationId },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Search for relevant content
    const relevantContent = await searchContent(context.siteId, context.message);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(site, relevantContent);

    // Build messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (in reverse order)
    for (const msg of previousMessages.reverse()) {
      messages.push({
        role: msg.role === ConversationRole.USER ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current message
    messages.push({ role: 'user', content: context.message });

    // Generate response
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check OPENAI_API_KEY environment variable.');
    }

    // Get AI settings from database
    const [model, temperature, maxTokens] = await Promise.all([
      settings.getAIModel(),
      settings.getAITemperature(),
      settings.getAIMaxTokens(),
    ]);

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: Math.min(maxTokens, 500), // Cap at 500 for responses
    });

    const response = completion.choices[0].message.content || 'I apologize, but I was unable to generate a response.';
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Calculate cost (rough estimate)
    const costInCents = calculateCost(tokensUsed);

    return { response, tokensUsed, costInCents };
  } catch (error) {
    logger.error('Failed to generate AI response:', error);
    throw error;
  }
}

function buildSystemPrompt(site: any, relevantContent: string[]): string {
  let prompt = `You are an intelligent AI assistant for ${site.siteName}.`;

  if (site.siteDescription) {
    prompt += `\n\n${site.siteDescription}`;
  }

  if (site.specialInstructions) {
    prompt += `\n\nSpecial Instructions: ${site.specialInstructions}`;
  }

  prompt += `\n\nYour role is to:
- Answer questions about ${site.siteName} based on the provided context
- Guide users to relevant information on the website
- Maintain a helpful and professional tone
- Never make up information - only use the provided context
- If you don't know something, admit it and suggest where to find the answer

Important guidelines:
- Be concise and helpful
- Reference specific information when relevant
- Always stay in character for ${site.siteName}`;

  if (relevantContent.length > 0) {
    prompt += '\n\nRelevant Information:\n';
    for (const content of relevantContent) {
      prompt += `\n${content}\n`;
    }
  }

  return prompt;
}

function calculateCost(tokens: number): number {
  // GPT-4 Turbo pricing (approximate)
  // Input: $0.01 per 1K tokens
  // Output: $0.03 per 1K tokens
  // Using average of $0.02 per 1K tokens
  return Math.ceil((tokens / 1000) * 2); // 2 cents per 1K tokens
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

    // Get conversation history
    const previousMessages = await prisma.message.findMany({
      where: { conversationId: context.conversationId },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Search for relevant content
    const relevantContent = await searchContent(context.siteId, context.message);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(site, relevantContent);

    // Build messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of previousMessages.reverse()) {
      messages.push({
        role: msg.role === ConversationRole.USER ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current message
    messages.push({ role: 'user', content: context.message });

    // Generate streaming response with usage tracking
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check OPENAI_API_KEY environment variable.');
    }

    // Get AI settings from database
    const [model, temperature, maxTokens] = await Promise.all([
      settings.getAIModel(),
      settings.getAITemperature(),
      settings.getAIMaxTokens(),
    ]);

    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: Math.min(maxTokens, 500),
      stream: true,
      stream_options: { include_usage: true },
    });

    let tokensUsed = 0;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk(content);
      }
      // Capture usage from the final chunk
      if (chunk.usage) {
        tokensUsed = chunk.usage.total_tokens || 0;
      }
    }

    const costInCents = calculateCost(tokensUsed);
    return { tokensUsed, costInCents };
  } catch (error) {
    logger.error('Failed to stream AI response:', error);
    throw error;
  }
}

// Legacy stream response for real-time chat (kept for backwards compatibility)
export async function* streamResponse(context: ConversationContext): AsyncGenerator<string> {
  try {
    // Get site information
    const site = await prisma.site.findUnique({
      where: { id: context.siteId },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    // Get conversation history
    const previousMessages = await prisma.message.findMany({
      where: { conversationId: context.conversationId },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Search for relevant content
    const relevantContent = await searchContent(context.siteId, context.message);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(site, relevantContent);

    // Build messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of previousMessages.reverse()) {
      messages.push({
        role: msg.role === ConversationRole.USER ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current message
    messages.push({ role: 'user', content: context.message });

    // Generate streaming response
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check OPENAI_API_KEY environment variable.');
    }

    // Get AI settings from database
    const [model, temperature, maxTokens] = await Promise.all([
      settings.getAIModel(),
      settings.getAITemperature(),
      settings.getAIMaxTokens(),
    ]);

    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: Math.min(maxTokens, 500),
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    logger.error('Failed to stream AI response:', error);
    throw error;
  }
}