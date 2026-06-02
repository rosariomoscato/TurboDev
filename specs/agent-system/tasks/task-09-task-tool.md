# Task 09: Task Tool — Subagent Invocation

## Status

pending

## Wave

3

## Description

This task implements the `task` tool — the mechanism by which a primary agent can invoke a subagent for specialized work. When a primary agent calls `tool: task({"agent": "explore", "prompt": "find the routing logic", "description": "search routing"})`, the task tool looks up the named subagent, verifies permissions, runs the subagent's agent loop with isolated context, and returns the result. This is the foundation for the subagent architecture.

## Dependencies

**Depends on:** task-01-agent-types.md (AgentConfig type), task-04-agent-registry.md (getAgent for subagent lookup), task-05-permission-system.md (for taskPermission glob matching)
**Blocks:** task-10-agent-loop-update.md (registers the task tool function), task-13-app-integration.md (wires task tool into the loop)

**Context from dependencies:** task-01 creates `AgentConfig`. task-04 creates `getAgent(cwd, name)` which returns `AgentConfig | undefined`. task-05 creates `resolveToolPermission` which is used for bash permission checking within the subagent's loop. The task tool needs the `cwd` to be injected at runtime since it's not available from the tool args.

## Files to Create

- `src/tools/task.ts` — Subagent invocation tool implementation

## Files to Modify

- `src/agent/tools.ts` — Wire the real task tool function into `TOOL_REGISTRY`

## Technical Details

### Implementation Steps

1. Create `src/tools/task.ts` with the task tool function
2. The function needs access to `cwd` — implement it as a factory: `createTaskTool(cwd: string, parentAgent: AgentConfig)` returns the tool function
3. Implement permission checking for task invocation via `agent.taskPermission`
4. Import `runAgent` from the loop for subagent execution (note: this creates a circular dependency — see Notes)
5. Update `TOOL_REGISTRY.task.fn` in `tools.ts` to use the factory-created function

### Code Snippets

```ts
import type { AgentConfig, TaskPermission, PermissionAction } from '../agent/types.js';

export interface TaskArgs {
  agent: string;
  prompt: string;
  description: string;
}

export interface TaskResult {
  result: string;
  agent: string;
}

function resolveTaskPermission(
  pattern: string,
  taskPerm: TaskPermission
): PermissionAction | null {
  let result: PermissionAction | null = null;
  for (const [glob, action] of Object.entries(taskPerm)) {
    if (matchSimpleGlob(glob, pattern)) {
      result = action;
    }
  }
  return result;
}

function matchSimpleGlob(pattern: string, name: string): boolean {
  if (pattern === '*') return true;
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  try {
    return new RegExp(`^${regexStr}$`).test(name);
  } catch {
    return false;
  }
}

export function createTaskTool(
  cwd: string,
  parentAgent: AgentConfig,
  runAgentFn: Function
) {
  return async function taskTool(args: TaskArgs): Promise<TaskResult> {
    const { getAgent } = await import('../agent/registry.js');
    const subagent = getAgent(cwd, args.agent);

    if (!subagent) {
      return {
        result: `Subagent "${args.agent}" not found`,
        agent: args.agent
      };
    }

    if (parentAgent.taskPermission) {
      const perm = resolveTaskPermission(args.agent, parentAgent.taskPermission);
      if (perm === 'deny') {
        return {
          result: `Permission denied: agent "${parentAgent.name}" cannot invoke subagent "${args.agent}"`,
          agent: args.agent
        };
      }
    }

    const modelOverride = subagent.model || parentAgent.model;

    const result = await runAgentFn(
      args.prompt,
      [],
      null,
      { ...subagent, model: modelOverride }
    );

    return {
      result: result.assistantResponse || 'Subagent completed with no response',
      agent: subagent.name
    };
  };
}
```

### Wiring in tools.ts

In `src/agent/tools.ts`, the `task` entry in `TOOL_REGISTRY` needs to be updated at runtime. Since `TOOL_REGISTRY` is a `const`, make the `fn` property mutable by changing the approach:

Replace the placeholder `fn` with one that can be set later:
```ts
task: {
  name: 'task',
  description: `...`,
  fn: async () => ({ result: 'Task tool not configured', agent: 'unknown' })
}
```

Add an export to update it:
```ts
export function registerTaskTool(fn: (args: any) => Promise<any>): void {
  (TOOL_REGISTRY.task as any).fn = fn;
}
```

The App component calls `registerTaskTool(createTaskTool(cwd, currentAgent, runAgent))` when setting up or switching agents.

### Circular Dependency Note

There IS a circular dependency: `task.ts` → `loop.ts` (via `runAgent`) → `tools.ts` → `task.ts`. This is resolved by:
1. Using a factory pattern (`createTaskTool`) that receives `runAgentFn` as a parameter
2. The function is passed at runtime, not imported statically
3. Dynamic `import()` for `registry.js` inside the function body

## Acceptance Criteria

- [ ] `src/tools/task.ts` exports `createTaskTool`, `TaskArgs`, and `TaskResult`
- [ ] `createTaskTool` returns an async function matching the `ToolDefinition.fn` signature
- [ ] Task tool returns an error result when the named subagent doesn't exist
- [ ] Task tool checks `parentAgent.taskPermission` and denies when the glob rule resolves to `deny`
- [ ] Task tool invokes the subagent with the provided prompt and empty conversation history
- [ ] The subagent inherits the parent's model if it doesn't have its own
- [ ] `src/agent/tools.ts` exports `registerTaskTool` function
- [ ] Both files compile with `npx tsc --noEmit`

## Notes

- The task tool does NOT pass conversation history to the subagent — subagents start with a clean context. Only the `prompt` argument is passed as the user message.
- The task tool does NOT stream subagent responses back to the user. The subagent runs to completion and returns its final response as a tool result.
- The `runAgent` function is injected as a parameter to avoid circular imports. This is a deliberate design choice.
- The glob matching for task permissions uses the same simple matcher as the bash permission system (both match `*` as wildcard).
