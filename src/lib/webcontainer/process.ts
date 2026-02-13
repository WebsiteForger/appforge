import { getWebContainer } from './instance';

export interface ProcessResult {
  exitCode: number;
  output: string;
}

type OutputCallback = (data: string) => void;

/**
 * Spawn a command in the WebContainer and capture output
 */
export async function spawnCommand(
  command: string,
  onOutput?: OutputCallback,
  signal?: AbortSignal,
): Promise<ProcessResult> {
  const wc = await getWebContainer();
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  const process = await wc.spawn(cmd, args);

  let output = '';

  const outputStream = new WritableStream({
    write(data) {
      output += data;
      onOutput?.(data);
    },
  });

  process.output.pipeTo(outputStream).catch(() => {
    // Stream may be cancelled on abort
  });

  // Handle abort
  if (signal) {
    signal.addEventListener('abort', () => {
      process.kill();
    }, { once: true });
  }

  const exitCode = await process.exit;

  return { exitCode, output };
}

/**
 * Start a long-running process (like dev server)
 */
export async function startProcess(
  command: string,
  onOutput?: OutputCallback,
): Promise<{ kill: () => void }> {
  const wc = await getWebContainer();
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  const process = await wc.spawn(cmd, args);

  const outputStream = new WritableStream({
    write(data) {
      onOutput?.(data);
    },
  });

  process.output.pipeTo(outputStream).catch(() => {});

  return {
    kill: () => process.kill(),
  };
}

/**
 * Listen for server-ready events from WebContainer
 */
export async function onServerReady(
  callback: (port: number, url: string) => void,
): Promise<void> {
  const wc = await getWebContainer();
  wc.on('server-ready', callback);
}
