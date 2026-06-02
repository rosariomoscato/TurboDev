# Task 02: Compaction agent definition

## Status

pending

## Wave

1

## Description

Add a hidden built-in compaction agent to TurboDev's agent definitions. This agent will be used by the compaction logic (task-05) to summarize conversations when the context window approaches its limit. The agent must be hidden from the UI and cannot be selected by the user.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-05-compaction-logic.md

**Context from dependencies:** None — this is a definition task.

## Files to Modify

- `src/agent/builtins.ts` — Add `compactionAgent` and include it in `BUILTIN_AGENTS`

## Technical Details

### Implementation Steps

1. In `src/agent/builtins.ts`, add a new `compactionAgent` export:

```typescript
export const compactionAgent: AgentConfig = {
  name: 'compaction',
  description: 'Compacts long conversations into concise summaries',
  mode: 'primary',
  hidden: true,
  prompt: `You are a conversation compaction agent. Your job is to summarize the conversation so far into a concise but comprehensive summary.

Rules:
- Preserve ALL key decisions made during the conversation
- Preserve ALL file paths, code changes, and tool results mentioned
- Preserve the user's intent and any preferences expressed
- Keep the summary under 2000 tokens
- Use bullet points for clarity
- Include any pending tasks or unresolved issues
- Do NOT add information that was not in the original conversation`,
  tools: {
    read_file: false,
    list_files: false,
    edit_file: false,
    mkdir: false,
    grep: false,
    bash: false,
    question: false,
    task: false,
  },
  permission: {
    edit: 'deny',
    bash: 'deny',
  },
};
```

2. Add `compactionAgent` to the `BUILTIN_AGENTS` array:
```typescript
export const BUILTIN_AGENTS: AgentConfig[] = [editorAgent, planAgent, compactionAgent];
```

### Important notes

- The compaction agent has ALL tools disabled — it only generates text (a summary)
- It is `hidden: true` so it won't appear in `/agent` or Tab cycling
- The `mode` is `primary` but since it's hidden, the user never interacts with it directly
- The `getPrimaryAgents` function in `registry.ts` already filters by `mode !== 'subagent'` but doesn't filter `hidden` — however, the UI in App.tsx only shows agents from the selector, and the compaction agent is never added to primaryAgents displayed there because `getPrimaryAgents` is not used for display; the `allAgents` state is used. Actually, the compaction agent WILL appear if we don't filter. Let me check...

Actually, looking at `registry.ts`:
- `getPrimaryAgents` returns agents where `mode !== 'subagent'` — this includes hidden ones
- `getSubagents` already filters `!a.hidden`

So we need to also filter hidden agents from primary display. But this is in task-04 or task-05 scope. For this task, just define the agent.

## Acceptance Criteria

- [ ] `compactionAgent` is defined with `hidden: true` and all tools disabled
- [ ] `BUILTIN_AGENTS` includes `compactionAgent`
- [ ] `npm run build` passes
- [ ] `npm test` passes
