import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getLLMConfig, saveLLMConfig, isUsingProxy, type LLMConfig } from '@/lib/llm/config';
import { PROVIDER_PRESETS } from '@/lib/llm/providers';
import { Key, Cpu, Eye, EyeOff, Check, Sparkles, RotateCcw } from 'lucide-react';

const PROXY_VALUE = '__platform__';

export default function LLMConfigPanel() {
  const [config, setConfig] = useState<LLMConfig>(getLLMConfig());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const usingProxy = isUsingProxy();
  const selectedProvider = PROVIDER_PRESETS.find((p) => p.baseUrl === config.baseUrl);

  function handleProviderChange(value: string) {
    if (value === PROXY_VALUE) {
      // Reset to built-in AI
      setConfig({
        baseUrl: '/.netlify/functions/llm-proxy',
        apiKey: 'platform',
        model: 'openrouter/aurora-alpha',
        maxTokens: 128000,
        maxOutputTokens: 32768,
        supportsToolUse: true,
        supportsVision: true,
      });
      return;
    }

    const provider = PROVIDER_PRESETS.find((p) => p.baseUrl === value);
    if (provider) {
      const firstModel = provider.models[0];
      setConfig({
        ...config,
        baseUrl: value,
        apiKey: '',
        model: firstModel?.id ?? '',
        supportsToolUse: provider.supportsToolUse,
        supportsVision: firstModel?.vision ?? false,
      });
    } else {
      setConfig({ ...config, baseUrl: value, apiKey: '' });
    }
  }

  function handleModelChange(modelId: string) {
    const model = selectedProvider?.models.find((m) => m.id === modelId);
    setConfig({
      ...config,
      model: modelId,
      supportsVision: model?.vision ?? false,
    });
  }

  function handleSave() {
    saveLLMConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          LLM Provider
        </h3>

        <div className="space-y-4">
          {/* Provider selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Provider</label>
            <Select
              value={usingProxy ? PROXY_VALUE : config.baseUrl}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              <option value={PROXY_VALUE}>Built-in AI (no key needed)</option>
              {PROVIDER_PRESETS.map((provider) => (
                <option key={provider.baseUrl} value={provider.baseUrl}>
                  {provider.name} — {provider.description}
                </option>
              ))}
              <option value="custom">Custom endpoint</option>
            </Select>
          </div>

          {/* Built-in AI info */}
          {usingProxy && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs text-zinc-400 leading-relaxed">
                <span className="text-blue-300 font-medium">Built-in AI is active.</span> You can
                start building immediately — no API key required. Switch to your own provider above
                if you prefer a different model.
              </div>
            </div>
          )}

          {/* Custom base URL */}
          {!usingProxy && !selectedProvider && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Base URL (OpenAI-compatible)
              </label>
              <Input
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
              />
            </div>
          )}

          {/* API Key — only shown for custom providers */}
          {!usingProxy && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Key className="w-3 h-3" />
                API Key
              </label>
              <div className="flex gap-2">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-..."
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Stored in your browser only. Never sent to our servers.
              </p>
            </div>
          )}

          {/* Model — only shown for custom providers */}
          {!usingProxy && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Model</label>
              {selectedProvider ? (
                <Select
                  value={config.model}
                  onChange={(e) => handleModelChange(e.target.value)}
                >
                  {selectedProvider.models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label} {model.vision ? '(Vision)' : ''}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  placeholder="model-name"
                />
              )}
            </div>
          )}

          {/* Max Tokens — only shown for custom providers */}
          {!usingProxy && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Max Tokens
              </label>
              <Input
                type="number"
                value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 4096 })}
                min={1024}
                max={128000}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gap-1.5">
              {saved ? <Check className="w-4 h-4" /> : null}
              {saved ? 'Saved!' : 'Save Settings'}
            </Button>
            {!usingProxy && (
              <Button
                variant="ghost"
                onClick={() => handleProviderChange(PROXY_VALUE)}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Built-in AI
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
