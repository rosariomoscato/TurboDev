import { readFileTool, ReadFileArgs } from '../tools/read-file';
import { listFilesTool, ListFilesArgs } from '../tools/list-files';
import { editFileTool, EditFileArgs } from '../tools/edit-file';
import { mkdirTool, MkdirArgs } from '../tools/mkdir';
import { grepTool, GrepArgs } from '../tools/grep';
import { bashTool, BashArgs } from '../tools/bash';
import { questionTool, QuestionArgs } from '../tools/question';
import { gitTool, GitArgs } from '../tools/git.js';
import { githubTool, GithubArgs } from '../tools/github.js';
import type { AgentConfig } from './types.js';
import { resolveToolPermission } from './permissions.js';

export type ToolName = 'read_file' | 'list_files' | 'edit_file' | 'mkdir' | 'grep' | 'bash' | 'question' | 'git' | 'github' | 'task';

export type ToolArgs =
  | ReadFileArgs
  | ListFilesArgs
  | EditFileArgs
  | MkdirArgs
  | GrepArgs
  | BashArgs
  | QuestionArgs
  | GitArgs
  | GithubArgs;

export interface ToolDefinition {
  name: ToolName;
  description: string;
  fn: (args: any) => Promise<any>;
}

export interface ToolCall {
  name: ToolName;
  args: ToolArgs;
}

export interface ToolCallContext {
  agent: AgentConfig;
  onPermissionAsk?: (tool: string, detail?: string) => Promise<boolean>;
}

export interface ToolResult {
  success: boolean;
  result: any;
  error?: string;
}

export const TOOL_REGISTRY: Record<ToolName, ToolDefinition> = {
  read_file: {
    name: 'read_file',
    description: `
    Read the full content of a file.
    Args: { filename: string } - The name of the file to read
    Returns: { file_path: string, content: string }
    `.trim(),
    fn: readFileTool
  },
  list_files: {
    name: 'list_files',
    description: `
    List files in a directory.
    Args: { path?: string } - Optional path, defaults to current directory
    Returns: { path: string, files: [{ filename: string, type: 'file'|'dir' }] }
    `.trim(),
    fn: listFilesTool
  },
  edit_file: {
    name: 'edit_file',
    description: `
    Create or edit a file. If old_str is empty, creates the file with new_str.
    Otherwise, finds the first occurrence of old_str and replaces it with new_str.
    Args: { path: string, old_str: string, new_str: string }
    Returns: { path: string, action: 'created'|'edited'|'not_found' }
    `.trim(),
    fn: editFileTool
  },
  mkdir: {
    name: 'mkdir',
    description: `
    Create a new directory. Creates parent directories if they don't exist.
    Args: { path: string } - The directory path to create (relative or absolute)
    Returns: { path: string, action: 'created'|'exists'|'error' }
    `.trim(),
    fn: mkdirTool
  },
  grep: {
    name: 'grep',
    description: `
    Search file contents using regular expressions.
    Args: { pattern: string, include?: string, path?: string }
      - pattern: Regex pattern to search for
      - include: File glob filter (e.g. "*.ts", "*.{ts,tsx}"). Optional.
      - path: Directory to search in. Defaults to current directory. Optional.
    Returns: { matches: [{ file: string, line: number, content: string }], total: number, truncated: boolean }
    `.trim(),
    fn: grepTool
  },
  bash: {
    name: 'bash',
    description: `
    Execute a shell command and return its output.
    Args: { command: string, timeout?: number, workdir?: string }
      - command: The shell command to execute
      - timeout: Timeout in milliseconds (default: 30000). Optional.
      - workdir: Working directory for the command. Defaults to current directory. Optional.
    Returns: { stdout: string, stderr: string, exitCode: number|null, timedOut: boolean, command: string }
    `.trim(),
    fn: bashTool
  },
  question: {
    name: 'question',
    description: `
    Ask the user a question and wait for their response. Use this to clarify ambiguous instructions or get decisions.
    Args: { question: string, options?: string[] }
      - question: The question text to present to the user
      - options: Optional list of suggested answers the user can choose from
    Returns: { question: string, answer: string }
    `.trim(),
    fn: questionTool
  },
  git: {
    name: 'git',
    description: `Execute Git operations for version control.
Args: { operation: string, path?: string, files?: string[], message?: string, branch?: string, remote?: string, target?: string, count?: number, stashIndex?: number, tagName?: string }
  - operation: One of: status, log, diff, add, commit, branch_list, branch_create, branch_delete, checkout, push, pull, fetch, stash_push, stash_pop, stash_list, reset_soft, reset_mixed, reset_hard, revert, merge, rebase, remote, show, tag_list, tag_create, tag_delete
  - path: Working directory. Defaults to current directory. Optional.
  - files: File paths for add/checkout. Optional.
  - message: Commit message. Required for commit.
  - branch: Branch name. Optional.
  - remote: Remote name. Default: 'origin'. Optional.
  - target: Commit hash or HEAD~N for reset/revert/show. Optional.
  - count: Number of log entries. Default: 10. Optional.
  - stashIndex: Stash index for stash_pop. Optional.
  - tagName: Tag name. Optional.
Returns: { success: boolean, operation: string, data?: any, error?: string }`,
    fn: gitTool
  },
  github: {
    name: 'github',
    description: `Execute GitHub operations via the gh CLI.
Args: { operation: string, title?: string, body?: string, base?: string, head?: string, draft?: boolean, state?: string, number?: number, reviewAction?: string, reviewBody?: string, tagName?: string, targetCommitish?: string, limit?: number }
  - operation: One of: auth_status, pr_create, pr_list, pr_view, pr_merge, pr_checkout, pr_review, pr_close, issue_create, issue_list, issue_view, issue_close, repo_view, release_create, release_list
  - title: Title for PR/issue/release. Required for create operations.
  - body: Body/description text. Optional.
  - base: Target branch for PR. Optional.
  - head: Source branch for PR. Optional.
  - draft: Create as draft PR. Optional.
  - state: Filter by state (open/closed/all). Default: 'open'. Optional.
  - number: PR/issue number. Required for view/merge/checkout/review/close.
  - reviewAction: Review action (approve/request_changes/comment). Required for pr_review.
  - reviewBody: Review comment body. Optional.
  - tagName: Tag name for release. Required for release_create.
  - targetCommitish: Target commitish for release. Optional.
  - limit: Max items to return. Default: 20. Optional.
Returns: { success: boolean, operation: string, data?: any, error?: string }`,
    fn: githubTool
  },
  task: {
    name: 'task',
    description: 'Invoke a subagent for a specialized task.\nArgs: { agent: string, prompt: string, description: string }\nReturns: { result: string, agent: string }',
    fn: async () => ({ result: 'Task tool not configured', agent: 'unknown' })
  }
};

export function registerTaskTool(fn: (args: any) => Promise<any>): void {
  TOOL_REGISTRY.task.fn = fn;
}

export async function executeToolCall(call: ToolCall, context?: ToolCallContext): Promise<ToolResult> {
  const tool = TOOL_REGISTRY[call.name];
  if (!tool) {
    return {
      success: false,
      result: null,
      error: `Unknown tool: ${call.name}`
    };
  }

  if (context) {
    const bashCommand = call.name === 'bash' ? (call.args as any).command : undefined;
    const permission = resolveToolPermission(call.name, context.agent, bashCommand);

    if (permission === 'deny') {
      return {
        success: false,
        result: null,
        error: `Tool "${call.name}" is denied for agent "${context.agent.name}"`
      };
    }

    if (permission === 'ask') {
      if (!context.onPermissionAsk) {
        return {
          success: false,
          result: null,
          error: `Tool "${call.name}" requires permission but no onPermissionAsk handler is provided`
        };
      }

      const allowed = await context.onPermissionAsk(call.name, bashCommand);
      if (!allowed) {
        return {
          success: false,
          result: null,
          error: `Tool "${call.name}" permission denied by user for agent "${context.agent.name}"`
        };
      }
    }
  }

  try {
    const result = await tool.fn(call.args);
    return {
      success: true,
      result
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}