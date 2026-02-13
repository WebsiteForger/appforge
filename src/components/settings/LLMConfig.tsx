import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getLLMConfig, saveLLMConfig, hasDefaultKey, type LLMConfig } from '@/lib/llm/config';
import { PROVIDER_PRESETS } from '@/lib/llm/providers';
import { Key, Server, Cpu, Eye, EyeOff, Check } from 'lucide-react';

export default function LLMConfigPanel() {
  const [config, setConfig] = useState<LLMConfig>(getLLMConfig());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedProvider = PROVIDER_PRESETS.find((p) => p.baseUrl === config.baseUrl);

  function handleProviderChange(baseUrl: string) {
    const provider = PROVIDER_PRESETS.find((p) => p.baseUrl === baseUrl);
    if (provider) {
      const firstModel = provider.models[0];
      setConfig({
        ...config,
        baseUrl,
        model: firstModel?.id ?? '',
        supportsToolUse: provider.supportsToolUse,
        supportsVision: firstModel?.vision ?? false,
      });
    } else {
      setConfig({ ...config, baseUrl });
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
          {/* Provider */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Provider</label>
            <Select
              value={config.baseUrl}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              {PROVIDER_PRESETS.map((provider) => (
                <option key={provider.baseUrl} value={provider.baseUrl}>
                  {provider.name} — {provider.description}
                </option>
              ))}
              <option value="custom">Custom endpoint</option>
            </Select>
          </div>

          {/* Custom base URL */}
          {!selectedProvider && (
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

          {/* API Key */}
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
              {hasDefaultKey() && !config.apiKey
                ? 'Using the built-in API key. Add your own to override it.'
                : 'Stored in your browser only. Never sent to our servers.'}
            </p>
          </div>

          {/* Model */}
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

          {/* Max Tokens */}
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

          {/* Save */}
          <Button onClick={handleSave} className="gap-1.5">
            {saved ? <Check className="w-4 h-4" /> : null}
            {saved ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
