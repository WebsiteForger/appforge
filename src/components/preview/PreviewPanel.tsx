import { useState, useEffect, useRef } from 'react';
import { Globe, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { onServerReady } from '@/lib/webcontainer/process';
import { setServerUrl } from '@/lib/agent/tools';
import { setupBridgeErrorListener } from '@/lib/agent/errors';

export default function PreviewPanel() {
  const [url, setUrl] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    onServerReady((port, serverUrl) => {
      setUrl(serverUrl);
      setServerUrl(serverUrl);
    });
  }, []);

  // Set up bridge error listener once
  useEffect(() => {
    setupBridgeErrorListener();
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview header */}
      <div className="h-8 flex items-center justify-between px-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-muted-foreground">Preview</span>
        </div>
        <div className="flex items-center gap-1">
          {url && (
            <>
              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-32">
                {url}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => setReloadKey((k) => k + 1)}
                title="Reload"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => window.open(url, '_blank')}
                title="Open in new tab"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* iframe */}
      <div className="flex-1 bg-white">
        {url ? (
          <iframe
            ref={iframeRef}
            id="preview-iframe"
            key={reloadKey}
            src={url}
            className="w-full h-full border-0"
            title="App preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2 bg-zinc-950">
            <Globe className="w-8 h-8 opacity-30" />
            <p className="text-xs">Waiting for dev server...</p>
            <p className="text-[10px] text-muted-foreground/60">
              The preview will appear once the app is running
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
