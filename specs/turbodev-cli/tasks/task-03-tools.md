# Task 03: Tools + Tool Registry + Parser + System Prompt

## Status

complete

## Wave

1

## Description

Implement the three core tools (read_file, list_files, edit_file), a tool registry for lookups, a parser to extract tool invocations from LLM text output, and a system prompt generator. These are the building blocks that the agent loop and LLM will interact with. Following the article's philosophy, the LLM calls tools by responding with text like `tool: read_file({"filename": "test.ts"})`.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-05-agent-loop (uses tools, parser, and system prompt), task-07-chat-ui (may reference tool registry for display)

**Context from dependencies:** No prior tasks exist. This task creates the complete tool infrastructure.

## Files to Create

- `src/tools/read-file.ts` — read_file tool implementation
- `src/tools/list-files.ts` — list_files tool implementation
- `src/tools/edit-file.ts` — edit_file tool implementation
- `src/agent/tools.ts` — Tool registry and tool call result type
- `src/agent/parser.ts` — Parser for extracting tool invocations from LLM text
- `src/agent/system-prompt.ts` — System prompt generator with tool descriptions

## Files to Modify

- None

## Technical Details

### Implementation Steps

#### 1. Tool Definitions (src/tools/*.ts)

Each tool function:
- Accepts typed arguments
- Returns a structured result object with success/failure info
- Uses `path.resolve()` to resolve relative paths against `process.cwd()`
- Has detailed JSDoc comment (LLM reads this to understand the tool)

**src/tools/read-file.ts:**
```typescript
import fs from 'fs/promises';
import path from 'path';

export interface ReadFileArgs {
  filename: string;
}

export interface ReadFileResult {
  file_path: string;
  content: string;
}

export async function readFileTool(args: ReadFileArgs): Promise<ReadFileResult> {
  const resolvedPath = path.resolve(process.cwd(), args.filename);
  const content = await fs.readFile(resolvedPath, 'utf-8');
  return {
    file_path: resolvedPath,
    content
  };
}
```

**src/tools/list-files.ts:**
```typescript
import fs from 'fs/promises';
import path from 'path';

export interface ListFilesArgs {
  path?: string;
}

export interface FileInfo {
  filename: string;
  type: 'file' | 'dir';
}

export interface ListFilesResult {
  path: string;
  files: FileInfo[];
}

export async function listFilesTool(args: ListFilesArgs = {}): Promise<ListFilesResult> {
  const targetPath = args.path ? path.resolve(process.cwd(), args.path) : process.cwd();
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  
  const files: FileInfo[] = entries.map(entry => ({
    filename: entry.name,
    type: entry.isDirectory() ? 'dir' : 'file'
  }));
  
  return {
    path: targetPath,
    files
  };
}
```

**src/tools/edit-file.ts:**
```typescript
import fs from 'fs/promises';
import path from 'path';

export interface EditFileArgs {
  path: string;
  old_str: string;
  new_str: string;
}

export interface EditFileResult {
  path: string;
  action: 'created' | 'edited' | 'not_found';
}

export async function editFileTool(args: EditFileArgs): Promise<EditFileResult> {
  const resolvedPath = path.resolve(process.cwd(), args.path);
  
  if (args.old_str === '') {
    await fs.writeFile(resolvedPath, args.new_str, 'utf-8');
    return { path: resolvedPath, action: 'created' };
  }
  
  const content = await fs.readFile(resolvedPath, 'utf-8');
  const index = content.indexOf(args.old_str);
  
  if (index === -1) {
    return { path: resolvedPath, action: 'not_found' };
  }
  
  const edited = content.replace(args.old_str, args.new_str);
  await fs.writeFile(resolvedPath, edited, 'utf-8');
  
  return { path: resolvedPath, action: 'edited' };
}
```

#### 2. Tool Registry (src/agent/tools.ts)

```typescript
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
```

#### 3. Parser (src/agent/parser.ts)

```typescript
export interface ToolInvocation {
  name: string;
  args: Record<string, any>;
}

export function extractToolInvocations(text: string): ToolInvocation[] {
  const invocations: ToolInvocation[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('tool:')) {
      continue;
    }
    
    try {
      const after = trimmed.slice(5).trim();
      const parenIndex = after.indexOf('(');
      if (parenIndex === -1) continue;
      
      const name = after.slice(0, parenIndex).trim();
      const rest = after.slice(parenIndex + 1);
      
      if (!rest.endsWith(')')) continue;
      
      const jsonStr = rest.slice(0, -1).trim();
      const args = JSON.parse(jsonStr);
      
      invocations.push({ name, args });
    } catch (error) {
      continue;
    }
  }
  
  return invocations;
}

export function formatToolResult(result: any): string {
  return `tool_result(${JSON.stringify(result)})`;
}
```

#### 4. System Prompt Generator (src/agent/system-prompt.ts)

```typescript
import { TOOL_REGISTRY } from './tools';

export function generateSystemPrompt(): string {
  const toolsStr = Object.values(TOOL_REGISTRY)
    .map(tool => `TOOL\n===\nName: ${tool.name}\nDescription: ${tool.description}\n=================\n`)
    .join('\n');
  
  return `
You are TurboDev, an AI coding assistant. You help users with coding tasks by reading, listing, and editing files in their project.

You have access to the following tools:

${toolsStr}

IMPORTANT RULES:
1. When you want to use a tool, respond with exactly one line in the format: tool: TOOL_NAME({JSON_ARGS}) and nothing else
2. Use compact single-line JSON with double quotes
3. After receiving a tool_result(...) message, continue the task
4. If no tool is needed, respond normally to the user
5. Only use one tool per line
6. You can chain multiple tool calls (e.g., read a file, then edit it)

Example tool call:
tool: read_file({"filename": "src/index.ts"})

Current working directory: ${process.cwd()}
  `.trim();
}
```

### Environment Variables

- None

### API Endpoints

- None

## Acceptance Criteria

- [ ] All three tools (read_file, list_files, edit_file) correctly resolve paths relative to cwd
- [ ] read_file returns file content as string
- [ ] list_files correctly distinguishes files vs directories
- [ ] edit_file creates new file when old_str is empty
- [ ] edit_file performs find & replace when old_str is provided
- [ ] edit_file returns 'not_found' when old_str doesn't match
- [ ] TOOL_REGISTRY is a complete mapping of name to definition
- [ ] extractToolInvocations correctly parses `tool: name({"arg": "value"})` format
- [ ] Parser ignores malformed lines (continues with next line)
- [ ] Parser handles JSON parsing errors gracefully (skips bad lines)
- [ ] generateSystemPrompt includes all tools with descriptions
- [ ] System prompt includes working directory path
- [ ] executeToolCall returns success=true and result on success
- [ ] executeToolCall returns success=false and error on failure

## Notes

- The parser is intentionally simple — line-by-line search for `tool:` prefix
- Multiple tool calls in one response are parsed and returned as an array
- Tool descriptions in the registry serve as documentation for the LLM
- The system prompt format follows the article's approach: text-based tool calls, not native function calling
- All async file operations use fs/promises for clean async/await syntax