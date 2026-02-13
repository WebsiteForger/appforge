import type { LLMMessage } from '../llm/client';

/**
 * Smart context management — keeps conversation within token budget.
 * Estimates tokens and trims older messages when needed.
 */

const CHARS_PER_TOKEN = 4; // rough estimate

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function estimateMessageTokens(messages: LLMMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      total += estimateTokens(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text' && part.text) {
          total += estimateTokens(part.text);
        } else if (part.type === 'image_url') {
          total += 1000; // rough estimate for image tokens
        }
      }
    }
    // Tool calls
    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        total += estimateTokens(tc.function.name + tc.function.arguments);
      }
    }
  }
  return total;
}

/**
 * Trim conversation to fit within a token budget.
 * Keeps the system prompt + first user message + most recent messages.
 */
export function trimConversation(
  messages: LLMMessage[],
  maxTokens: number,
): LLMMessage[] {
  const totalTokens = estimateMessageTokens(messages);
  if (totalTokens <= maxTokens) return messages;

  // Always keep first message (usually system or first user prompt)
  // and progressively remove oldest messages from the middle
  const result: LLMMessage[] = [];
  const firstMsg = messages[0];

  if (firstMsg) {
    result.push(firstMsg);
  }

  // Add messages from the end until we hit the budget
  let currentTokens = estimateMessageTokens(result);
  const recentMessages: LLMMessage[] = [];

  for (let i = messages.length - 1; i >= 1; i--) {
    const msg = messages[i];
    const msgTokens = estimateMessageTokens([msg]);

    if (currentTokens + msgTokens > maxTokens) {
      break;
    }

    recentMessages.unshift(msg);
    currentTokens += msgTokens;
  }

  // Add a summary message if we trimmed
  if (recentMessages.length < messages.length - 1) {
    const trimmedCount = messages.length - 1 - recentMessages.length;
    result.push({
      role: 'system',
      content: `[${trimmedCount} earlier messages trimmed for context length. The conversation continues from here.]`,
    });
  }

  result.push(...recentMessages);
  return result;
}

/**
 * Truncate a tool result if it's too long
 */
export function truncateToolResult(result: string, maxChars: number = 8000): string {
  if (result.length <= maxChars) return result;
  const half = Math.floor(maxChars / 2);
  return (
    result.slice(0, half) +
    `\n\n... [truncated ${result.length - maxChars} characters] ...\n\n` +
    result.slice(-half)
  );
}
