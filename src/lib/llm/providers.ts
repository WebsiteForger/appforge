export interface ProviderPreset {
  name: string;
  baseUrl: string;
  models: { id: string; label: string; vision: boolean }[];
  supportsToolUse: boolean;
  supportsCORS: boolean;
  description: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    models: [
      { id: 'Qwen/Qwen3-Coder', label: 'Qwen3 Coder', vision: false },
      { id: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek R1', vision: false },
      { id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct', label: 'Llama 4 Scout 17B', vision: true },
      { id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', label: 'Llama 4 Maverick', vision: true },
    ],
    supportsToolUse: true,
    supportsCORS: true,
    description: 'Fast, affordable. Great for coding.',
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'openrouter/aurora-alpha', label: 'Aurora Alpha', vision: true },
      { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', vision: true },
      { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', vision: true },
      { id: 'openai/gpt-4o', label: 'GPT-4o', vision: true },
      { id: 'qwen/qwen3-coder', label: 'Qwen3 Coder', vision: false },
    ],
    supportsToolUse: true,
    supportsCORS: true,
    description: 'Access all models through one API.',
  },
  {
    name: 'Fireworks AI',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    models: [
      { id: 'accounts/fireworks/models/qwen3-coder', label: 'Qwen3 Coder', vision: false },
      { id: 'accounts/fireworks/models/deepseek-r1', label: 'DeepSeek R1', vision: false },
    ],
    supportsToolUse: true,
    supportsCORS: true,
    description: 'Fastest inference. Great for iteration.',
  },
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o', vision: true },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', vision: true },
      { id: 'o3-mini', label: 'o3-mini', vision: false },
    ],
    supportsToolUse: true,
    supportsCORS: false,
    description: 'Requires proxy (no CORS). High quality.',
  },
  {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', vision: true },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', vision: true },
    ],
    supportsToolUse: true,
    supportsCORS: false,
    description: 'Requires proxy (no CORS). Best for coding.',
  },
  {
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    models: [
      { id: 'qwen3:latest', label: 'Qwen3', vision: false },
      { id: 'deepseek-r1:latest', label: 'DeepSeek R1', vision: false },
      { id: 'llama3.2:latest', label: 'Llama 3.2', vision: false },
    ],
    supportsToolUse: false,
    supportsCORS: true,
    description: 'Free, runs on your machine.',
  },
];
