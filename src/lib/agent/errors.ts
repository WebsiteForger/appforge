/**
 * Error capture system.
 * Collects errors from 3 sources: terminal stderr, browser console, Vite HMR.
 */

const terminalErrors: string[] = [];
const consoleErrors: string[] = [];
const hmrErrors: string[] = [];

const MAX_ERRORS = 50;

// ── Terminal errors (stderr from WebContainer processes) ──

export function onTerminalStderr(data: string) {
  // Filter out common noise
  if (isNoise(data)) return;
  terminalErrors.push(data.trim());
  if (terminalErrors.length > MAX_ERRORS) terminalErrors.shift();
}

function isNoise(data: string): boolean {
  const lower = data.toLowerCase();
  return (
    lower.includes('deprecationwarning') ||
    lower.includes('experimentalwarning') ||
    lower.includes('punycode') ||
    (lower.includes('warning') && !lower.includes('error')) ||
    data.trim().length === 0
  );
}

// ── Browser console errors (from preview iframe) ──

export function setupConsoleCapture(iframe: HTMLIFrameElement) {
  try {
    const iframeWindow = iframe.contentWindow as (Window & { console: Console }) | null;
    if (!iframeWindow) return;

    const originalError = iframeWindow.console.error.bind(iframeWindow.console);
    iframeWindow.console.error = (...args: unknown[]) => {
      const msg = args.map(String).join(' ');
      consoleErrors.push(msg);
      if (consoleErrors.length > MAX_ERRORS) consoleErrors.shift();
      originalError(...args);
    };

    // Capture unhandled errors
    iframeWindow.addEventListener('error', (event) => {
      consoleErrors.push(`Uncaught: ${event.message} at ${event.filename}:${event.lineno}`);
      if (consoleErrors.length > MAX_ERRORS) consoleErrors.shift();
    });

    // Capture unhandled promise rejections
    iframeWindow.addEventListener('unhandledrejection', (event) => {
      consoleErrors.push(`Unhandled Promise: ${event.reason}`);
      if (consoleErrors.length > MAX_ERRORS) consoleErrors.shift();
    });
  } catch {
    // Cross-origin iframe, can't capture
  }
}

// ── Vite HMR errors ──

export function setupHMRCapture(iframe: HTMLIFrameElement) {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Watch for Vite's error overlay div
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            // Vite injects vite-error-overlay custom element
            if (
              node.tagName === 'VITE-ERROR-OVERLAY' ||
              node.id === 'vite-error-overlay'
            ) {
              const text = node.textContent?.trim();
              if (text) {
                hmrErrors.push(text.slice(0, 500));
                if (hmrErrors.length > MAX_ERRORS) hmrErrors.shift();
              }
            }
          }
        }
      }
    });

    observer.observe(iframeDoc.body || iframeDoc.documentElement, {
      childList: true,
      subtree: true,
    });
  } catch {
    // Cross-origin iframe
  }
}

// ── Public API ──

export function getTerminalErrors(): string[] {
  return [...terminalErrors];
}

export function getConsoleErrors(): string[] {
  return [...consoleErrors];
}

export function getHMRErrors(): string[] {
  return [...hmrErrors];
}

export function getAllErrors(): {
  terminal: string[];
  console: string[];
  hmr: string[];
  hasErrors: boolean;
} {
  return {
    terminal: getTerminalErrors(),
    console: getConsoleErrors(),
    hmr: getHMRErrors(),
    hasErrors:
      terminalErrors.length > 0 ||
      consoleErrors.length > 0 ||
      hmrErrors.length > 0,
  };
}

export function clearErrors() {
  terminalErrors.length = 0;
  consoleErrors.length = 0;
  hmrErrors.length = 0;
}

export function formatErrorReport(): string {
  const errors = getAllErrors();

  if (!errors.hasErrors) {
    return 'No errors detected. App is running clean.';
  }

  let report = '';
  if (errors.terminal.length) {
    report += `TERMINAL ERRORS:\n${errors.terminal.join('\n')}\n\n`;
  }
  if (errors.console.length) {
    report += `BROWSER CONSOLE ERRORS:\n${errors.console.join('\n')}\n\n`;
  }
  if (errors.hmr.length) {
    report += `HMR ERRORS:\n${errors.hmr.join('\n')}\n\n`;
  }
  return report;
}
