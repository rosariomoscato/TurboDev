import { spawn } from 'child_process';
import path from 'path';

export interface BashArgs {
  command: string;
  timeout?: number;
  workdir?: string;
}

export interface BashResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  command: string;
}

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_OUTPUT_LENGTH = 10000;

/**
 * Truncate a string to maxLength, appending a truncation notice if exceeded.
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '\n... [truncated]';
}

/**
 * Execute a shell command and return stdout, stderr, exit code, and timeout status.
 * Uses `spawn('sh', ['-c', command])` for broad compatibility with shell features
 * such as pipes, redirects, and command chaining.
 * @param args - { command: string, timeout?: number, workdir?: string }
 * @returns { stdout: string, stderr: string, exitCode: number|null, timedOut: boolean, command: string }
 */
export async function bashTool(args: BashArgs): Promise<BashResult> {
  const timeout = args.timeout ?? DEFAULT_TIMEOUT_MS;
  const cwd = args.workdir
    ? path.resolve(process.cwd(), args.workdir)
    : process.cwd();

  return new Promise((resolve) => {
    const proc = spawn('sh', ['-c', args.command], {
      cwd,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, timeout);

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        stdout: truncate(stdout, MAX_OUTPUT_LENGTH),
        stderr: truncate(stderr, MAX_OUTPUT_LENGTH),
        exitCode: code,
        timedOut,
        command: args.command,
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        timedOut: false,
        command: args.command,
      });
    });
  });
}
