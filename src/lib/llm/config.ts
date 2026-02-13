export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  supportsToolUse: boolean;
  supportsVision: boolean;
}

const STORAGE_KEY = 'appforge-llm-config';

// Platform default: OpenRouter with Aurora Alpha
// Falls back to VITE_DEFAULT_LLM_KEY so the platform owner can provide a key
const DEFAULT_CONFIG: LLMConfig = {
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_DEFAULT_LLM_KEY ?? '',
  model: 'openrouter/aurora-alpha',
  maxTokens: 16384,
  supportsToolUse: true,
  supportsVision: true,
};

export function getLLMConfig(): LLMConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
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
  return Boolean(config.apiKey && config.baseUrl && config.model);
}

export function hasDefaultKey(): boolean {
  return Boolean(import.meta.env.VITE_DEFAULT_LLM_KEY);
}
