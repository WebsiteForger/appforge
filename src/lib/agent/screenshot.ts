/**
 * Capture a screenshot of the preview iframe via the postMessage bridge.
 * Returns a text description of the visible DOM (since the iframe is cross-origin).
 */
export async function capturePreviewScreenshot(
  _fullPage: boolean = false,
): Promise<string | null> {
  const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement | null;
  if (!iframe?.contentWindow) {
    return '[Screenshot unavailable — preview iframe not found or not loaded yet]';
  }

  try {
    const result = await postMessageRequest<{ description: string }>(
      iframe.contentWindow,
      { type: 'appforge-screenshot' },
      3000,
    );
    return result?.description ?? '[Screenshot unavailable — no response from app]';
  } catch {
    return '[Screenshot unavailable — bridge timeout. The app may still be loading.]';
  }
}

/**
 * Send a postMessage to a target window and wait for a typed response.
 */
function postMessageRequest<T>(
  target: Window,
  message: Record<string, unknown>,
  timeoutMs: number,
): Promise<T | null> {
  return new Promise((resolve) => {
    const responseType = `${String(message.type)}-result`;
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(null);
    }, timeoutMs);

    function handler(event: MessageEvent) {
      if (event.data?.type === responseType) {
        clearTimeout(timer);
        window.removeEventListener('message', handler);
        resolve(event.data as T);
      }
    }

    window.addEventListener('message', handler);
    target.postMessage(message, '*');
  });
}
