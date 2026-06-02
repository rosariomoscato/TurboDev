# Task 03: Built-in Agents

## Status

pending

## Wave

1

## Description

This task defines the two built-in primary agents that ship with TurboDev: **editor** (the default, full-access agent) and **plan** (a restricted agent for analysis and planning). These are hardcoded `AgentConfig` objects — not loaded from Markdown files — and serve as the base configuration that can be overridden by user-provided Markdown files with matching names.

## Dependencies

**Depends on:** task-01-agent-types.md (provides `AgentConfig` type)
**Blocks:** task-04-agent-registry.md (loads built-in agents as the base layer)

**Context from dependencies:** task-01 creates `src/agent/types.ts` exporting `AgentConfig`. This task creates concrete `AgentConfig` instances for the two built-in agents.

## Files to Create

- `src/agent/builtins.ts` — Defines the `editor` and `plan` built-in agent configurations

## Technical Details

### Implementation Steps

1. Create `src/agent/builtins.ts`
2. Import `AgentConfig` from `./types.js`
3. Define the `editor` agent config
4. Define the `plan` agent config
5. Export both as a `BUILTIN_AGENTS` array and individually

### Code Snippets

```ts
import type { AgentConfig } from './types.js';

export const editorAgent: AgentConfig = {
  name: 'editor',
  description: 'Full-access coding agent. Default agent with all tools enabled for development work.',
  mode: 'primary',
  tools: {
    read_file: true,
    list_files: true,
    edit_file: true,
    mkdir: true,
    grep: true,
    bash: true,
    question: true,
    task: true,
  },
  permission: {
    edit: 'allow',
    bash: 'allow',
  },
  color: 'cyan',
};

export const planAgent: AgentConfig = {
  name: 'plan',
  description: 'Planning and analysis agent. Limited permissions — asks for approval before editing files or running commands.',
  mode: 'primary',
  tools: {
    read_file: true,
    list_files: true,
    edit_file: true,
    mkdir: true,
    grep: true,
    bash: true,
    question: true,
    task: false,
  },
  permission: {
    edit: 'ask',
    bash: 'ask',
  },
  color: 'yellow',
  prompt: `You are TurboDev in plan mode. Your role is to analyze code, suggest changes, and create plans WITHOUT making modifications unless explicitly approved.

When you need to edit files or run bash commands, you will ask the user for permission first. Use this mode when you want to:
- Analyze code and understand the codebase
- Suggest modifications without applying them
- Create implementation plans
- Review code for potential issues

Always explain your reasoning clearly before requesting any changes.`,
};

export const BUILTIN_AGENTS: AgentConfig[] = [editorAgent, planAgent];
```

### Key Design Decisions

- **editor** has `task: true` so it can invoke subagents. **plan** has `task: false` because it's a restricted agent.
- **plan** has `permission: { edit: 'ask', bash: 'ask' }` — this means the user gets prompted before any file edit or bash command executes.
- **plan** has a custom `prompt` that instructs the LLM about its restricted role. **editor** does not have a custom prompt — the default system prompt from `system-prompt.ts` is used.
- Colors: `'cyan'` for editor (matches the existing TurboDev UI accent), `'yellow'` for plan (signals caution/restricted).

## Acceptance Criteria

- [ ] `src/agent/builtins.ts` exports `editorAgent`, `planAgent`, and `BUILTIN_AGENTS`
- [ ] `editorAgent.mode` is `'primary'`
- [ ] `planAgent.mode` is `'primary'`
- [ ] `editorAgent.permission.edit` is `'allow'`
- [ ] `planAgent.permission.edit` is `'ask'`
- [ ] `planAgent.permission.bash` is `'ask'`
- [ ] `planAgent` has a custom `prompt` string
- [ ] `BUILTIN_AGENTS` contains exactly 2 agents
- [ ] File compiles with `npx tsc --noEmit`

## Notes

The built-in agents are intentionally simple. They provide sensible defaults. Users can override any field by placing an `editor.md` or `plan.md` file in `.turbodev/agents/` — the registry handles the merge.
