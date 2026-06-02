# Task 04: Agent Registry

## Status

pending

## Wave

2

## Description

This task builds the agent registry — the central module that discovers, loads, and merges all agent definitions from three sources: built-in agents (hardcoded), global user agents (`~/.config/turbodev/agents/*.md`), and project-level agents (`<cwd>/.turbodev/agents/*.md`). The registry is the single entry point for all agent lookups in the application. It provides functions to get all agents, filter by mode (primary/subagent), and look up by name. When a user-defined agent file has the same name as a built-in, the user definition merges on top (overriding only specified fields).

## Dependencies

**Depends on:** task-01-agent-types.md (AgentConfig type), task-02-markdown-parser.md (parseAgentMarkdown), task-03-builtin-agents.md (BUILTIN_AGENTS)
**Blocks:** task-07-system-prompt-update.md, task-09-task-tool.md, task-10-agent-loop-update.md, task-13-app-integration.md

**Context from dependencies:** task-01 creates the `AgentConfig` type. task-02 creates `parseAgentMarkdown(filePath)` which returns `AgentConfig | null`. task-03 creates `BUILTIN_AGENTS` — an array of two built-in `AgentConfig` objects (`editor` and `plan`). This task combines all three sources into a unified registry.

## Files to Create

- `src/agent/registry.ts` — Agent discovery, loading, and lookup functions

## Technical Details

### Implementation Steps

1. Create `src/agent/registry.ts`
2. Import `AgentConfig` from `./types.js`, `parseAgentMarkdown` from `./parser-md.js`, `BUILTIN_AGENTS` from `./builtins.js`
3. Implement `loadAgentsFromDir(dirPath: string): AgentConfig[]` — reads all `.md` files from a directory
4. Implement `mergeAgentConfigs(base: AgentConfig, override: Partial<AgentConfig>): AgentConfig` — shallow merge with undefined filtering
5. Implement `loadAllAgents(cwd: string): AgentConfig[]` — the main entry point
6. Implement helper functions: `getPrimaryAgents`, `getSubagents`, `getAgent`

### Code Snippets

```ts
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { AgentConfig } from './types.js';
import { parseAgentMarkdown } from './parser-md.js';
import { BUILTIN_AGENTS } from './builtins.js';

function loadAgentsFromDir(dirPath: string): AgentConfig[] {
  if (!fs.existsSync(dirPath)) return [];
  
  try {
    const entries = fs.readdirSync(dirPath);
    return entries
      .filter(f => f.endsWith('.md'))
      .map(f => parseAgentMarkdown(path.join(dirPath, f)))
      .filter((a): a is AgentConfig => a !== null && !a.disable);
  } catch {
    return [];
  }
}

function mergeAgentConfigs(base: AgentConfig, override: AgentConfig): AgentConfig {
  const merged = { ...base };
  for (const key of Object.keys(override) as (keyof AgentConfig)[]) {
    const val = override[key];
    if (val !== undefined) {
      (merged as any)[key] = val;
    }
  }
  merged.name = base.name;
  return merged;
}

export function loadAllAgents(cwd: string): AgentConfig[] {
  const agentsByName = new Map<string, AgentConfig>();

  for (const agent of BUILTIN_AGENTS) {
    agentsByName.set(agent.name, agent);
  }

  const globalDir = path.join(os.homedir(), '.config', 'turbodev', 'agents');
  for (const agent of loadAgentsFromDir(globalDir)) {
    const existing = agentsByName.get(agent.name);
    agentsByName.set(agent.name, existing ? mergeAgentConfigs(existing, agent) : agent);
  }

  const projectDir = path.join(cwd, '.turbodev', 'agents');
  for (const agent of loadAgentsFromDir(projectDir)) {
    const existing = agentsByName.get(agent.name);
    agentsByName.set(agent.name, existing ? mergeAgentConfigs(existing, agent) : agent);
  }

  return Array.from(agentsByName.values()).filter(a => !a.disable);
}

export function getPrimaryAgents(cwd: string): AgentConfig[] {
  return loadAllAgents(cwd).filter(a => a.mode !== 'subagent');
}

export function getSubagents(cwd: string): AgentConfig[] {
  return loadAllAgents(cwd).filter(a => a.mode === 'subagent' || a.mode === 'all').filter(a => !a.hidden);
}

export function getAgent(cwd: string, name: string): AgentConfig | undefined {
  return loadAllAgents(cwd).find(a => a.name === name);
}
```

### Merge Behavior

When a user-defined agent has the same name as a built-in:
- All fields present in the user file override the built-in
- Fields not specified in the user file fall back to the built-in value
- `name` is always preserved from the base (never overridden)

For example, a `.turbodev/agents/plan.md` with only:
```yaml
---
description: Custom plan agent
temperature: 0.2
---
```
Would keep all built-in plan settings but override `description` and add `temperature: 0.2`.

### Directory Structure

```
~/.config/turbodev/agents/     ← global agents (apply to all projects)
  review.md
  security.md

<project>/.turbodev/agents/    ← project agents (project-specific)
  editor.md                     ← overrides built-in editor
  custom-helper.md              ← new project-specific agent
```

## Acceptance Criteria

- [ ] `loadAllAgents(cwd)` returns built-in agents when no user agents exist
- [ ] Project-level agents override global agents with the same name
- [ ] Global agents override built-in agents with the same name
- [ ] `getPrimaryAgents` filters to agents where `mode !== 'subagent'`
- [ ] `getSubagents` filters to agents where `mode === 'subagent' || mode === 'all'` and `!hidden`
- [ ] `getAgent` returns `undefined` for non-existent agent names
- [ ] Agents with `disable: true` are excluded from all results
- [ ] Non-existent directories are handled gracefully (empty array)
- [ ] File compiles with `npx tsc --noEmit`

## Notes

- `loadAllAgents` is called at startup and on agent reload. It uses synchronous file I/O (same pattern as the rest of the codebase for config loading).
- The merge is intentionally shallow — only top-level fields are merged. Nested objects like `permission` or `tools` are replaced wholesale if specified, not deep-merged. This matches OpenCode's behavior.
