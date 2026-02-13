export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  /** Max output tokens per response (sent as max_tokens to the API) */
  maxOutputTokens: number;
  supportsToolUse: boolean;
  supportsVision: boolean;
}

const STORAGE_KEY = 'appforge-llm-config';

// The proxy path routes through our Netlify Function which injects the
// real OpenRouter API key server-side — users never see it.
const PROXY_BASE_URL = '/.netlify/functions/llm-proxy';

const DEFAULT_CONFIG: LLMConfig = {
  baseUrl: PROXY_BASE_URL,
  apiKey: 'platform',        // placeholder — proxy ignores this
  model: 'openrouter/aurora-alpha',
  maxTokens: 128000,          // context budget for conversation trimming
  maxOutputTokens: 16384,     // max output per LLM response (sent as max_tokens)
  supportsToolUse: true,
  supportsVision: true,
};

export function getLLMConfig(): LLMConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration: if config has old VITE_DEFAULT_LLM_KEY approach or
      // stale "platform" apiKey with a direct provider URL, reset it
      if (
        parsed.apiKey === 'platform' &&
        parsed.baseUrl &&
        parsed.baseUrl !== PROXY_BASE_URL
      ) {
        localStorage.removeItem(STORAGE_KEY);
        return DEFAULT_CONFIG;
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_CONFIG;
}

export function saveLLMConfig(config: Partial<LLMConfig>) {
  const current = getLLMConfig();
  const merged = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function clearLLMConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isConfigured(): boolean {
  const config = getLLMConfig();
  // Always configured when using the built-in proxy
  if (isUsingProxy()) return true;
  return Boolean(config.apiKey && config.baseUrl && config.model);
}

/** True when the user hasn't set a custom provider (using platform AI) */
export function isUsingProxy(): boolean {
  const config = getLLMConfig();
  return config.baseUrl === PROXY_BASE_URL || config.apiKey === 'platform';
}
