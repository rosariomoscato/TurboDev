# Task 07: System Prompt Update

## Status

pending

## Wave

3

## Description

This task modifies the system prompt generator to be agent-aware. Currently, `generateSystemPrompt` includes ALL tools from `TOOL_REGISTRY` regardless of context. After this change, it accepts an optional `AgentConfig` and filters the tool list to only include tools enabled for that agent. It also appends any agent-specific custom prompt and permission-aware instructions (e.g., "You are in plan mode, edits require user approval").

## Dependencies

**Depends on:** task-01-agent-types.md (AgentConfig type), task-04-agent-registry.md (to understand what an agent looks like at runtime)
**Blocks:** task-10-agent-loop-update.md (uses updated generateSystemPrompt)

**Context from dependencies:** task-01 creates the `AgentConfig` type. task-04 creates the registry that loads agents. This task uses `AgentConfig` to filter tools and customize the prompt. The agent's `tools` field is `Partial<Record<string, boolean>>` where `true` enables a tool and `false` or `undefined` means "use default" (for built-in tools) or "disabled" (if explicitly `false`).

## Files to Modify

- `src/agent/system-prompt.ts` — Make generateSystemPrompt agent-aware

## Technical Details

### Current State

`src/agent/system-prompt.ts` currently:
1. Iterates all `TOOL_REGISTRY` entries (7 tools)
2. Generates a fixed system prompt with tool descriptions
3. Optionally appends AGENTS.md project context

### Implementation Steps

1. Import `AgentConfig` from `./types.js`
2. Update `generateSystemPrompt` signature to accept optional `AgentConfig`:
```ts
export function generateSystemPrompt(projectContext?: string, agent?: AgentConfig): string
```
3. Filter `TOOL_REGISTRY` entries based on `agent.tools`:
   - If `agent` is provided and `agent.tools[name] === false`, exclude that tool
   - If `agent` is not provided or `agent.tools[name]` is undefined/true, include the tool
   - Special: never include the `task` tool in the prompt unless there are available subagents (this is a future concern — for now, include it if `tools.task !== false`)
4. If `agent.prompt` exists, prepend it to the system prompt
5. If agent has restrictive permissions, append a note about the approval flow

### Code Snippets

```ts
import { TOOL_REGISTRY } from './tools';
import type { AgentConfig } from './types.js';

export function generateSystemPrompt(projectContext?: string, agent?: AgentConfig): string {
  const toolsToInclude = Object.values(TOOL_REGISTRY).filter(tool => {
    if (!agent?.tools) return true;
    if (agent.tools[tool.name] === false) return false;
    return true;
  });

  const toolsStr = toolsToInclude
    .map(tool => `TOOL\n===\nName: ${tool.name}\nDescription: ${tool.description}\n=================\n`)
    .join('\n');

  let prompt = '';

  if (agent?.prompt) {
    prompt += agent.prompt + '\n\n';
  }

  prompt += `You are TurboDev, an AI coding assistant.${agent ? ` You are currently acting as the "${agent.name}" agent.` : ''}

You have access to the following tools:

${toolsStr}

IMPORTANT RULES:
1. When you want to use a tool, respond with exactly one line in the format: tool: TOOL_NAME({JSON_ARGS}) and nothing else
2. Use compact single-line JSON with double quotes
3. After receiving a tool_result(...) message, continue the task
4. If no tool is needed, respond normally to the user
5. Only use one tool per line
6. You can chain multiple tool calls (e.g., read a file, then edit it)`;

  if (agent?.permission?.edit === 'ask') {
    prompt += '\n\nNOTE: You are in a restricted mode. File edits and bash commands require user approval before execution. Plan your changes carefully.';
  }

  prompt += `\n\nCurrent working directory: ${process.cwd()}\n\nIMPORTANT: Always respond in the same language the user writes in.`;

  if (projectContext) {
    prompt += `\n\n## Project Context (from AGENTS.md)\n\n${projectContext}\n\nFollow the instructions from AGENTS.md when working on this project.`;
  }

  return prompt.trim();
}
```

## Acceptance Criteria

- [ ] `generateSystemPrompt(undefined, undefined)` produces the same output as the current version (backward compatible)
- [ ] When `agent.tools.bash === false`, the bash tool is excluded from the prompt
- [ ] When `agent.prompt` is set, it appears at the top of the system prompt
- [ ] When `agent.permission.edit === 'ask'`, a restriction note is appended
- [ ] The agent name is mentioned in the identity line when an agent is provided
- [ ] Project context (AGENTS.md) is still appended when provided
- [ ] File compiles with `npx tsc --noEmit`

## Notes

- Keep the existing function signature compatible — the second parameter is optional. This ensures no breakage for any callers that haven't been updated yet.
- Do not import from `registry.ts` here to avoid circular dependencies. The filtering is self-contained.
