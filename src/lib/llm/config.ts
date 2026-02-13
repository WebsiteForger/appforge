export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  supportsToolUse: boolean;
  supportsVision: boolean;
}

const STORAGE_KEY = 'appforge-llm-config';

const DEFAULT_CONFIG: LLMConfig = {
  baseUrl: 'https://api.together.xyz/v1',
  apiKey: '',
  model: 'Qwen/Qwen3-Coder',
  maxTokens: 16384,
  supportsToolUse: true,
  supportsVision: false,
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
