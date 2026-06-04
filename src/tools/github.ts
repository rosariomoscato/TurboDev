import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GithubOperation =
  | 'auth_status'
  | 'pr_create'
  | 'pr_list'
  | 'pr_view'
  | 'pr_merge'
  | 'pr_checkout'
  | 'pr_review'
  | 'pr_close'
  | 'issue_create'
  | 'issue_list'
  | 'issue_view'
  | 'issue_close'
  | 'repo_view'
  | 'release_create'
  | 'release_list';

export interface GithubArgs {
  operation: GithubOperation;
  title?: string;
  body?: string;
  base?: string;
  head?: string;
  draft?: boolean;
  state?: 'open' | 'closed' | 'all';
  number?: number;
  reviewAction?: 'approve' | 'request_changes' | 'comment';
  reviewBody?: string;
  tagName?: string;
  targetCommitish?: string;
  limit?: number;
}

export interface GithubResult {
  success: boolean;
  operation: GithubOperation;
  data?: any;
  error?: string;
}

export interface GhAuthStatus {
  ghInstalled: boolean;
  authenticated: boolean;
  username?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_OUTPUT_LENGTH = 10000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Truncate a string to maxLength, appending a truncation notice if exceeded.
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '\n... [truncated]';
}

/**
 * Execute a `gh` CLI command via child_process.spawn and capture
 * stdout, stderr, and the exit code.
 */
function runGhCommand(
  args: string[],
  cwd?: string,
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    const proc = spawn('gh', args, {
      cwd: cwd || process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout: truncate(stdout, MAX_OUTPUT_LENGTH), stderr: truncate(stderr, MAX_OUTPUT_LENGTH), exitCode: code });
    });

    // Handle the case where `gh` is not installed — spawn emits an error
    proc.on('error', (err) => {
      resolve({ stdout: '', stderr: err.message, exitCode: 1 });
    });
  });
}

/**
 * Safely parse a JSON string, returning undefined on failure.
 */
function safeJsonParse(raw: string): any | undefined {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/**
 * Write content to a temporary file and return its absolute path.
 * The caller is responsible for cleaning up the file after use.
 */
function writeTempFile(content: string): string {
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `turbodev-gh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`);
  fs.writeFileSync(tmpFile, content, 'utf-8');
  return tmpFile;
}

/**
 * Remove a file if it exists. Silently ignores errors (e.g. file already gone).
 */
function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Intentionally ignored — temp file cleanup is best-effort
  }
}

// ---------------------------------------------------------------------------
// checkGhAuth — verify that gh CLI is installed and authenticated
// ---------------------------------------------------------------------------

/**
 * Check whether the GitHub CLI (`gh`) is installed and the user is
 * authenticated. Returns structured auth status information.
 *
 * `gh auth status` writes human-readable info to stderr, so we parse
 * stderr to extract the logged-in username.
 */
export async function checkGhAuth(): Promise<GhAuthStatus> {
  const result = await runGhCommand(['auth', 'status']);

  // If spawn itself failed (gh not found), stderr contains the Node error
  if (result.exitCode === 1 && /not found|ENOENT/i.test(result.stderr)) {
    return {
      ghInstalled: false,
      authenticated: false,
      error: 'gh CLI is not installed or not found in PATH',
    };
  }

  // gh auth status exits 0 when logged in, non-zero otherwise
  if (result.exitCode !== 0) {
    return {
      ghInstalled: true,
      authenticated: false,
      error: result.stderr.trim() || 'Not authenticated',
    };
  }

  // Parse username from stderr — typical format:
  //   "Logged in to github.com as <username> ..."
  const usernameMatch = result.stderr.match(/as\s+(\S+)/);
  const username = usernameMatch ? usernameMatch[1] : undefined;

  return {
    ghInstalled: true,
    authenticated: true,
    username,
  };
}

// ---------------------------------------------------------------------------
// Operation → gh command builders
// ---------------------------------------------------------------------------

/**
 * Build the `gh` CLI argument list for a given operation and user-provided
 * arguments. Each builder returns the full args array ready for `spawn('gh', args)`.
 */
function buildCommand(
  operation: GithubOperation,
  args: GithubArgs,
): { ghArgs: string[]; tempFile?: string } {
  let tempFile: string | undefined;
  const state = args.state ?? 'open';
  const limit = String(args.limit ?? 20);

  switch (operation) {
    // -- Authentication -------------------------------------------------------
    case 'auth_status':
      return { ghArgs: ['auth', 'status'] };

    // -- Pull Requests --------------------------------------------------------
    case 'pr_create': {
      const ghArgs = ['pr', 'create', '--title', args.title ?? ''];

      // Use a temp file for the body to avoid shell escaping issues
      if (args.body) {
        tempFile = writeTempFile(args.body);
        ghArgs.push('--body-file', tempFile);
      }

      if (args.base) ghArgs.push('--base', args.base);
      if (args.head) ghArgs.push('--head', args.head);
      if (args.draft) ghArgs.push('--draft');

      return { ghArgs, tempFile };
    }

    case 'pr_list':
      return {
        ghArgs: [
          'pr', 'list',
          '--state', state,
          '--limit', limit,
          '--json', 'number,title,author,headRefName,updatedAt',
        ],
      };

    case 'pr_view':
      return {
        ghArgs: [
          'pr', 'view', String(args.number),
          '--json', 'number,title,body,state,url,additions,deletions,changedFiles',
        ],
      };

    case 'pr_merge':
      return { ghArgs: ['pr', 'merge', String(args.number), '--squash'] };

    case 'pr_checkout':
      return { ghArgs: ['pr', 'checkout', String(args.number)] };

    case 'pr_review': {
      const ghArgs = ['pr', 'review', String(args.number)];
      switch (args.reviewAction) {
        case 'approve':
          ghArgs.push('--approve');
          break;
        case 'request_changes':
          ghArgs.push('--request-changes');
          break;
        case 'comment':
        default:
          ghArgs.push('--comment');
          break;
      }
      if (args.reviewBody) ghArgs.push('--body', args.reviewBody);
      return { ghArgs };
    }

    case 'pr_close':
      return { ghArgs: ['pr', 'close', String(args.number)] };

    // -- Issues ---------------------------------------------------------------
    case 'issue_create': {
      const ghArgs = ['issue', 'create', '--title', args.title ?? ''];

      // Use a temp file for the body to avoid shell escaping issues
      if (args.body) {
        tempFile = writeTempFile(args.body);
        ghArgs.push('--body-file', tempFile);
      }

      return { ghArgs, tempFile };
    }

    case 'issue_list':
      return {
        ghArgs: [
          'issue', 'list',
          '--state', state,
          '--limit', limit,
          '--json', 'number,title,author,updatedAt',
        ],
      };

    case 'issue_view':
      return {
        ghArgs: [
          'issue', 'view', String(args.number),
          '--json', 'number,title,body,state,url',
        ],
      };

    case 'issue_close':
      return { ghArgs: ['issue', 'close', String(args.number)] };

    // -- Repository -----------------------------------------------------------
    case 'repo_view':
      return {
        ghArgs: [
          'repo', 'view',
          '--json', 'name,owner,description,defaultBranchRef,url',
        ],
      };

    // -- Releases -------------------------------------------------------------
    case 'release_create': {
      const ghArgs = ['release', 'create', args.tagName ?? ''];
      if (args.title) ghArgs.push('--title', args.title);
      if (args.body) ghArgs.push('--notes', args.body);
      if (args.targetCommitish) ghArgs.push('--target', args.targetCommitish);
      return { ghArgs };
    }

    case 'release_list':
      return {
        ghArgs: ['release', 'list', '--limit', limit],
      };
  }
}

// ---------------------------------------------------------------------------
// Main tool entry point
// ---------------------------------------------------------------------------

/**
 * Execute a GitHub CLI operation and return a structured result.
 *
 * The function builds the appropriate `gh` command, executes it via
 * `child_process.spawn`, parses the output, and returns typed data.
 * Temp files used for body content are cleaned up automatically.
 */
export async function githubTool(args: GithubArgs): Promise<GithubResult> {
  const { operation } = args;

  // Build the gh command arguments (and possibly a temp file for body content)
  let built: { ghArgs: string[]; tempFile?: string };
  try {
    built = buildCommand(operation, args);
  } catch (err: any) {
    return {
      success: false,
      operation,
      error: `Failed to build command: ${err.message}`,
    };
  }

  const { ghArgs, tempFile } = built;

  // Execute the gh command
  const result = await runGhCommand(ghArgs);

  // Clean up temp file if one was created
  if (tempFile) {
    cleanupTempFile(tempFile);
  }

  // Detect "gh not installed" — spawn error with ENOENT
  if (result.exitCode === 1 && /not found|ENOENT/i.test(result.stderr)) {
    return {
      success: false,
      operation,
      error: 'gh CLI is not installed or not found in PATH. Install it from https://cli.github.com',
    };
  }

  // Non-zero exit code → command failed
  if (result.exitCode !== 0) {
    return {
      success: false,
      operation,
      error: result.stderr.trim() || `gh exited with code ${result.exitCode}`,
    };
  }

  // Operations that use --json: parse the structured output
  const jsonOperations: GithubOperation[] = [
    'pr_list',
    'pr_view',
    'issue_list',
    'issue_view',
    'repo_view',
  ];

  if (jsonOperations.includes(operation)) {
    const data = safeJsonParse(result.stdout);
    return {
      success: true,
      operation,
      data: data ?? result.stdout,
    };
  }

  // auth_status: parse stderr for auth information
  if (operation === 'auth_status') {
    const usernameMatch = result.stderr.match(/as\s+(\S+)/);
    return {
      success: true,
      operation,
      data: {
        authenticated: true,
        username: usernameMatch ? usernameMatch[1] : undefined,
        message: result.stderr.trim(),
      },
    };
  }

  // All other operations: return raw stdout as data
  return {
    success: true,
    operation,
    data: result.stdout.trim() || undefined,
  };
}
