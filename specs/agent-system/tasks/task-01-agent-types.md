# Task 01: Agent Types

## Status

pending

## Wave

1

## Description

This task creates the core type definitions that underpin the entire agent system. Every other task in this spec depends on these types. The file defines the `AgentConfig` interface (the central type for all agent configuration), the `AgentPermission` structure for tool-level access control, the `TaskPermission` type for controlling which subagents an agent can invoke, and related utility types. These types mirror the OpenCode agent configuration options: mode, model, prompt, temperature, topP, steps, tools, permissions, task permissions, color, hidden, disable.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-02-markdown-parser.md, task-03-builtin-agents.md, task-04-agent-registry.md, task-05-permission-system.md, task-07-system-prompt-update.md, task-08-tools-update.md, task-09-task-tool.md, task-10-agent-loop-update.md, task-11-ui-types-statusbar.md, task-13-app-integration.md

**Context from dependencies:** This is a foundational task with no dependencies. It produces the type definitions that all other tasks import.

## Files to Create

- `src/agent/types.ts` — Core type definitions for the entire agent system

## Technical Details

### Implementation Steps

1. Create `src/agent/types.ts`
2. Import the existing `ToolName` type from `src/agent/tools.ts` (currently `'read_file' | 'list_files' | 'edit_file' | 'mkdir' | 'grep' | 'bash' | 'question'`) and extend it with `'task'`
3. Define the types listed in the Code Snippets section below
4. All imports in this project use `.js` extensions for ESM resolution

### Code Snippets

```ts
export type PermissionAction = 'allow' | 'ask' | 'deny';

export interface BashPermissionRules {
  [globPattern: string]: PermissionAction;
}

export interface AgentPermission {
  edit?: PermissionAction;
  bash?: PermissionAction | BashPermissionRules;
}

export interface TaskPermission {
  [globPattern: string]: PermissionAction;
}

export interface AgentConfig {
  name: string;
  description: string;
  mode: 'primary' | 'subagent' | 'all';
  model?: string;
  prompt?: string;
  temperature?: number;
  topP?: number;
  steps?: number;
  tools?: Partial<Record<string, boolean>>;
  permission?: AgentPermission;
  taskPermission?: TaskPermission;
  color?: string;
  hidden?: boolean;
  disable?: boolean;
}
```

### Key Design Decisions

- `tools` uses `Partial<Record<string, boolean>>` instead of `Partial<Record<ToolName, boolean>>` because custom MCP tools (future) may have arbitrary names. The type is intentionally loose here.
- `permission.bash` can be either a simple `PermissionAction` string (applies to all bash commands) or a `BashPermissionRules` map for per-command control via glob patterns.
- `taskPermission` uses glob patterns (e.g., `"*": "deny"`, `"review-*": "allow"`) where the last matching rule wins.
- `mode` can be `'primary'`, `'subagent'`, or `'all'` (all means it can be used as either). Default should be `'all'` when not specified in Markdown.
- `prompt` is the custom system prompt body — extracted from the Markdown content below the frontmatter.

## Acceptance Criteria

- [ ] `src/agent/types.ts` exports `PermissionAction`, `BashPermissionRules`, `AgentPermission`, `TaskPermission`, and `AgentConfig`
- [ ] `AgentConfig` has all fields: name, description, mode, model, prompt, temperature, topP, steps, tools, permission, taskPermission, color, hidden, disable
- [ ] `AgentPermission.bash` supports both a simple string and a glob-rules map
- [ ] File compiles with `npx tsc --noEmit`
- [ ] Uses `.js` extensions for any local imports

## Notes

Do NOT re-export `ToolName` from this file. The canonical `ToolName` type remains in `src/agent/tools.ts` — this task merely documents that it will be extended with `'task'` in task-08. Other tasks will import from `types.ts` for agent-specific types only.
