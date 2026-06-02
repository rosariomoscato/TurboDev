import { readFileTool, ReadFileArgs } from '../tools/read-file';
import { listFilesTool, ListFilesArgs } from '../tools/list-files';
import { editFileTool, EditFileArgs } from '../tools/edit-file';
import { mkdirTool, MkdirArgs } from '../tools/mkdir';
import { grepTool, GrepArgs } from '../tools/grep';
import { bashTool, BashArgs } from '../tools/bash';
import { questionTool, QuestionArgs } from '../tools/question';

export type ToolName = 'read_file' | 'list_files' | 'edit_file' | 'mkdir' | 'grep' | 'bash' | 'question';

export type ToolArgs =
  | ReadFileArgs
  | ListFilesArgs
  | EditFileArgs
  | MkdirArgs
  | GrepArgs
  | BashArgs
  | QuestionArgs;

export interface ToolDefinition {
  name: ToolName;
  description: string;
  fn: (args: any) => Promise<any>;
}

export interface ToolCall {
  name: ToolName;
  args: ToolArgs;
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
  }
};

export async function executeToolCall(call: ToolCall): Promise<ToolResult> {
  const tool = TOOL_REGISTRY[call.name];
  if (!tool) {
    return {
      success: false,
      result: null,
      error: `Unknown tool: ${call.name}`
    };
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