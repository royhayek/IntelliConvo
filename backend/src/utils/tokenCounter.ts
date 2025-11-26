/**
 * Token counting utilities for OpenAI models
 * Uses gpt-tokenizer for accurate token estimation
 */

import { encode } from 'gpt-tokenizer';

/**
 * Count tokens in a text string
 * Uses cl100k_base encoding (used by GPT-4, GPT-3.5-turbo, and text-embedding models)
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  try {
    return encode(text).length;
  } catch (error) {
    // Fallback: rough estimation if encoding fails
    // Average: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens in an array of messages (ChatGPT format)
 * Includes overhead for message formatting
 */
export function countMessageTokens(messages: Array<{ role: string; content: string }>): number {
  let totalTokens = 0;

  for (const message of messages) {
    // Each message has overhead: role + formatting
    totalTokens += 4; // Overhead per message
    totalTokens += countTokens(message.role);
    totalTokens += countTokens(message.content);
  }

  // Add base overhead for message array
  totalTokens += 2;

  return totalTokens;
}

/**
 * Truncate text to fit within a token budget
 * Returns truncated text that fits within maxTokens
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  if (!text) return '';

  const tokens = countTokens(text);

  if (tokens <= maxTokens) {
    return text;
  }

  // Binary search to find the right length
  let low = 0;
  let high = text.length;
  let result = '';

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const truncated = text.substring(0, mid);
    const truncatedTokens = countTokens(truncated);

    if (truncatedTokens <= maxTokens) {
      result = truncated;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}
