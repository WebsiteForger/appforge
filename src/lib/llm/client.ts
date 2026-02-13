import type { LLMConfig } from './config';
import { isUsingProxy } from './config';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | LLMContentPart[];
  tool_calls?: LLMToolCall[];
  tool_call_id?: string;
}

export interface LLMContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface LLMToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface StreamChunk {
  type: 'text' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_end' | 'done' | 'error';
  text?: string;
  toolCall?: Partial<LLMToolCall>;
  error?: string;
}

export async function* streamChatCompletion(
  config: LLMConfig,
  messages: LLMMessage[],
  tools?: LLMToolDefinition[],
  signal?: AbortSignal,
): AsyncGenerator<StreamChunk> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    max_tokens: config.maxTokens,
    stream: true,
  };

  if (tools && tools.length > 0 && config.supportsToolUse) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  // When using the platform proxy, POST directly to the proxy endpoint
  // (it forwards to OpenRouter). Otherwise hit the provider's /chat/completions.
  const url = isUsingProxy()
    ? config.baseUrl
    : `${config.baseUrl}/chat/completions`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isUsingProxy()) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    yield { type: 'error', error: `LLM API error ${response.status}: ${errText}` };
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Track tool calls being assembled
  const pendingToolCalls: Map<number, { id: string; name: string; args: string }> = new Map();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') {
        // Emit any completed tool calls
        for (const [, tc] of pendingToolCalls) {
          yield {
            type: 'tool_call_end',
            toolCall: {
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: tc.args },
            },
          };
        }
        yield { type: 'done' };
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const choice = parsed.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta;

        // Text content
        if (delta?.content) {
          yield { type: 'text', text: delta.content };
        }

        // Tool calls
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (tc.id) {
              // New tool call starting
              pendingToolCalls.set(idx, {
                id: tc.id,
                name: tc.function?.name ?? '',
                args: tc.function?.arguments ?? '',
              });
              yield {
                type: 'tool_call_start',
                toolCall: {
                  id: tc.id,
                  type: 'function',
                  function: { name: tc.function?.name ?? '', arguments: '' },
                },
              };
            } else {
              // Continuation of existing tool call
              const existing = pendingToolCalls.get(idx);
              if (existing) {
                if (tc.function?.name) existing.name += tc.function.name;
                if (tc.function?.arguments) existing.args += tc.function.arguments;
                yield {
                  type: 'tool_call_delta',
                  toolCall: {
                    id: existing.id,
                    type: 'function',
                    function: { name: existing.name, arguments: tc.function?.arguments ?? '' },
                  },
                };
              }
            }
          }
        }

        // Finish reason
        if (choice.finish_reason === 'tool_calls' || choice.finish_reason === 'stop') {
          for (const [, tc] of pendingToolCalls) {
            yield {
              type: 'tool_call_end',
              toolCall: {
                id: tc.id,
                type: 'function',
                function: { name: tc.name, arguments: tc.args },
              },
            };
          }
          pendingToolCalls.clear();
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }

  yield { type: 'done' };
}

/**
 * Non-streaming call for simple use cases
 */
export async function chatCompletion(
  config: LLMConfig,
  messages: LLMMessage[],
  tools?: LLMToolDefinition[],
): Promise<{ text: string; toolCalls: LLMToolCall[] }> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    max_tokens: config.maxTokens,
  };

  if (tools && tools.length > 0 && config.supportsToolUse) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const url = isUsingProxy()
    ? config.baseUrl
    : `${config.baseUrl}/chat/completions`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isUsingProxy()) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`LLM API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  return {
    text: choice?.message?.content ?? '',
    toolCalls: choice?.message?.tool_calls ?? [],
  };
}
