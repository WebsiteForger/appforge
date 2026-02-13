/**
 * Error capture system.
 * Collects errors from 3 sources: terminal stderr, browser console (via postMessage bridge), Vite HMR.
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
  // Never filter out actual compile/syntax/HMR errors
  if (
    lower.includes('[plugin:') ||
    lower.includes('syntaxerror') ||
    lower.includes('unexpected token') ||
    lower.includes('could not fast refresh') ||
    lower.includes('failed to reload') ||
    lower.includes('export is incompatible') ||
    lower.includes('does not provide an export') ||
    lower.includes('is not exported from') ||
    lower.includes('pre-transform error') ||
    lower.includes('transform failed')
  ) {
    return false;
  }
  return (
    lower.includes('deprecationwarning') ||
    lower.includes('experimentalwarning') ||
    lower.includes('punycode') ||
    (lower.includes('warning') && !lower.includes('error')) ||
    data.trim().length === 0
  );
}

// ── Browser console errors (from preview iframe via postMessage bridge) ──

let bridgeListenerAttached = false;

/**
 * Listen for error messages from the iframe bridge script.
 * Call this once — it registers a global message listener.
 */
export function setupBridgeErrorListener() {
  if (bridgeListenerAttached) return;
  bridgeListenerAttached = true;

  window.addEventListener('message', (event: MessageEvent) => {
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'appforge-error') {
      const msg = String(event.data.message || '');
      if (!msg) return;
      consoleErrors.push(msg);
      if (consoleErrors.length > MAX_ERRORS) consoleErrors.shift();
    }

    if (event.data.type === 'appforge-hmr-error') {
      const msg = String(event.data.message || '');
      if (!msg) return;
      hmrErrors.push(msg);
      if (hmrErrors.length > MAX_ERRORS) hmrErrors.shift();
    }
  });
}

/**
 * @deprecated — kept for backwards compat. Now a no-op since the bridge handles it.
 */
export function setupConsoleCapture(_iframe: HTMLIFrameElement) {
  // No-op: cross-origin iframe console capture now handled via postMessage bridge
  setupBridgeErrorListener();
}

/**
 * @deprecated — kept for backwards compat. Now a no-op since the bridge handles it.
 */
export function setupHMRCapture(_iframe: HTMLIFrameElement) {
  // No-op: HMR error capture now handled via postMessage bridge
  setupBridgeErrorListener();
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
    report += `TERMINAL/COMPILE ERRORS:\n${errors.terminal.join('\n')}\n\n`;
  }
  if (errors.console.length) {
    report += `BROWSER CONSOLE ERRORS:\n${errors.console.join('\n')}\n\n`;
  }
  if (errors.hmr.length) {
    report += `VITE HMR/OVERLAY ERRORS:\n${errors.hmr.join('\n')}\n\n`;
  }
  report += 'ACTION: Read the file mentioned in the error, find the exact line, fix the root cause, and write the corrected file. Then check_errors() again.';
  return report;
}
