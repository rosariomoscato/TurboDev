import { readFileTool, ReadFileArgs } from '../tools/read-file';
import { listFilesTool, ListFilesArgs } from '../tools/list-files';
import { editFileTool, EditFileArgs } from '../tools/edit-file';

export type ToolName = 'read_file' | 'list_files' | 'edit_file';

export type ToolArgs =
  | ReadFileArgs
  | ListFilesArgs
  | EditFileArgs;

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