# Task 08: Tools Update — Permission-Aware Execution

## Status

pending

## Wave

3

## Description

This task modifies the tool execution system to be permission-aware. Currently, `executeToolCall` in `src/agent/tools.ts` blindly executes any tool call. After this change, it accepts an `AgentConfig` and a permission callback, checks permissions before execution, and denies or defers tool calls based on the agent's permission configuration. This task also extends the `ToolName` type with `'task'` and registers the task tool in `TOOL_REGISTRY` (the actual task tool implementation is in task-09, but the registry entry and type are updated here).

## Dependencies

**Depends on:** task-01-agent-types.md (AgentConfig type), task-05-permission-system.md (resolveToolPermission)
**Blocks:** task-10-agent-loop-update.md (uses the updated executeToolCall with permissions)

**Context from dependencies:** task-01 creates `AgentConfig`. task-05 creates `resolveToolPermission(toolName, agent, bashCommand)` which returns `'allow' | 'ask' | 'deny'`. This task integrates that permission check into the tool execution flow.

## Files to Modify

- `src/agent/tools.ts` — Add permission checking, extend ToolName with 'task', add permission callbacks

## Technical Details

### Current State

Current `executeToolCall` (lines 112-135):
```ts
export async function executeToolCall(call: ToolCall): Promise<ToolResult> {
  const tool = TOOL_REGISTRY[call.name];
  if (!tool) {
    return { success: false, result: null, error: `Unknown tool: ${call.name}` };
  }
  try {
    const result = await tool.fn(call.args);
    return { success: true, result };
  } catch (error) {
    return { success: false, result: null, error: error instanceof Error ? error.message : String(error) };
  }
}
```

### Implementation Steps

1. Import `resolveToolPermission` from `./permissions.js` and `AgentConfig` from `./types.js`
2. Extend `ToolName` to include `'task'`
3. Add a `ToolCallContext` interface:
```ts
export interface ToolCallContext {
  agent: AgentConfig;
  onPermissionAsk?: (tool: string, detail?: string) => Promise<boolean>;
}
```
4. Update `executeToolCall` to accept an optional `context: ToolCallContext` parameter
5. Before executing, check permissions using `resolveToolPermission`
6. For `deny` → return error result
7. For `ask` → call `onPermissionAsk` callback and wait for user response
8. For `allow` → execute normally
9. Add a placeholder entry for `task` in `TOOL_REGISTRY` (the actual implementation comes from task-09, but the type and registry slot need to exist)

### Code Snippets

```ts
import { resolveToolPermission } from './permissions.js';
import type { AgentConfig } from './types.js';

export type ToolName = 'read_file' | 'list_files' | 'edit_file' | 'mkdir' | 'grep' | 'bash' | 'question' | 'task';

export interface ToolCallContext {
  agent: AgentConfig;
  onPermissionAsk?: (tool: string, detail?: string) => Promise<boolean>;
}

export async function executeToolCall(
  call: ToolCall,
  context?: ToolCallContext
): Promise<ToolResult> {
  const tool = TOOL_REGISTRY[call.name];
  if (!tool) {
    return { success: false, result: null, error: `Unknown tool: ${call.name}` };
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
          error: `Tool "${call.name}" requires approval but no approval handler is available`
        };
      }
      const detail = call.name === 'bash' ? bashCommand : undefined;
      const approved = await context.onPermissionAsk(call.name, detail);
      if (!approved) {
        return {
          success: false,
          result: null,
          error: `User denied permission for tool "${call.name}"`
        };
      }
    }
  }

  try {
    const result = await tool.fn(call.args);
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
```

### Placeholder for Task Tool

Add a placeholder in `TOOL_REGISTRY` that will be replaced by the real implementation in task-09:

```ts
task: {
  name: 'task',
  description: `
    Invoke a subagent for a specialized task.
    Args: { agent: string, prompt: string, description: string }
      - agent: Name of the subagent to invoke
      - prompt: The task description for the subagent
      - description: Brief 3-5 word description of the task
    Returns: { result: string, agent: string }
  `.trim(),
  fn: async () => ({ result: 'Task tool not yet initialized', agent: 'unknown' })
}
```

## Acceptance Criteria

- [ ] `ToolName` type includes `'task'`
- [ ] `TOOL_REGISTRY` has a `task` entry (placeholder is fine)
- [ ] `executeToolCall` accepts optional `context: ToolCallContext` as second parameter
- [ ] When context is provided and permission is `deny`, tool execution is blocked
- [ ] When context is provided and permission is `ask`, `onPermissionAsk` is called
- [ ] When `onPermissionAsk` returns `false`, tool execution is blocked
- [ ] When no context is provided, behavior is identical to before (backward compatible)
- [ ] Bash commands are passed to `resolveToolPermission` for glob matching
- [ ] File compiles with `npx tsc --noEmit`

## Notes

- This is backward compatible — the new parameter is optional. Existing callers without context continue to work.
- The `ToolCallContext` interface is exported so the agent loop can create it.
- The `task` tool placeholder will be wired up with the real implementation in task-09. The placeholder's `fn` should never actually be called because task-09 replaces it.
