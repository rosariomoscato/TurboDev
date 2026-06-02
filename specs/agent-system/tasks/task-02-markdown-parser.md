# Task 02: Markdown Agent Parser

## Status

pending

## Wave

1

## Description

This task builds the parser that reads agent definition files from disk. Agent definitions are Markdown files with YAML frontmatter (between `---` delimiters) and a body that becomes the agent's custom system prompt. The parser uses `gray-matter` to split frontmatter from body, validates required fields, and returns a typed `AgentConfig`. This is the bridge between human-written Markdown files and the runtime agent system.

## Dependencies

**Depends on:** task-01-agent-types.md (provides `AgentConfig` and related types)
**Blocks:** task-04-agent-registry.md (uses this parser to load agent files)

**Context from dependencies:** task-01 creates `src/agent/types.ts` which exports `AgentConfig`, `AgentPermission`, `BashPermissionRules`, `TaskPermission`, and `PermissionAction`. This task imports those types to produce validated `AgentConfig` objects.

## Files to Create

- `src/agent/parser-md.ts` — Parses agent Markdown files into `AgentConfig` objects

## Technical Details

### Prerequisites

Run `npm install gray-matter` before implementing. This is the only new dependency.

### Implementation Steps

1. Install gray-matter: `npm install gray-matter`
2. Create `src/agent/parser-md.ts`
3. Import `matter` from `gray-matter` and `AgentConfig` from `./types.js`
4. Implement `parseAgentMarkdown(filePath: string): AgentConfig`
5. Implement `parseAgentMarkdownContent(content: string, fileName: string): AgentConfig` (for testability)

### Code Snippets

```ts
import matter from 'gray-matter';
import type { AgentConfig } from './types.js';

export function parseAgentMarkdown(filePath: string): AgentConfig | null {
  try {
    const fs = await import('fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath, '.md');
    return parseAgentMarkdownContent(content, name);
  } catch {
    return null;
  }
}

export function parseAgentMarkdownContent(
  content: string,
  fileName: string
): AgentConfig {
  const { data, content: body } = matter(content);

  return {
    name: data.name || fileName,
    description: data.description || '',
    mode: data.mode || 'all',
    model: data.model,
    prompt: body.trim() || undefined,
    temperature: data.temperature,
    topP: data.topP ?? data.top_p,
    steps: data.steps ?? data.maxSteps,
    tools: data.tools,
    permission: data.permission,
    taskPermission: data.taskPermission ?? data.task_permission,
    color: data.color,
    hidden: data.hidden,
    disable: data.disable,
  };
}
```

### Frontmatter Mapping

The parser maps YAML frontmatter keys to `AgentConfig` fields. It supports both camelCase and snake_case for certain keys for convenience:

| YAML key | AgentConfig field | Notes |
|---|---|---|
| `description` | `description` | Required. If empty string, still valid (but registry should warn) |
| `mode` | `mode` | `'primary'`, `'subagent'`, or `'all'`. Default: `'all'` |
| `model` | `model` | Optional model ID override (e.g., `"anthropic/claude-sonnet-4"`) |
| `temperature` | `temperature` | Optional number |
| `top_p` or `topP` | `topP` | Both accepted |
| `steps` or `maxSteps` | `steps` | Both accepted (`maxSteps` is legacy) |
| `tools` | `tools` | Map of tool name to boolean |
| `permission` | `permission` | See AgentPermission type |
| `task_permission` or `taskPermission` | `taskPermission` | Both accepted |
| `color` | `color` | Hex color or theme color name |
| `hidden` | `hidden` | Boolean, only for subagents |
| `disable` | `disable` | Boolean |

### Example Markdown Input

```markdown
---
description: Reviews code for quality and best practices
mode: subagent
model: anthropic/claude-sonnet-4
temperature: 0.1
tools:
  write: false
  edit: false
  bash: false
permission:
  edit: deny
  bash:
    "*": ask
    "git diff": allow
    "git log*": allow
---
You are a code reviewer. Focus on:
- Code quality and best practices
- Potential bugs and edge cases
```

The body after the second `---` becomes `agent.prompt`.

## Acceptance Criteria

- [ ] `gray-matter` is added to `package.json` dependencies
- [ ] `parseAgentMarkdownContent` correctly parses frontmatter and body from a Markdown string
- [ ] The agent name defaults to the filename without `.md` extension
- [ ] `mode` defaults to `'all'` when not specified in frontmatter
- [ ] Both snake_case and camelCase keys are supported for `top_p`/`topP`, `steps`/`maxSteps`, `task_permission`/`taskPermission`
- [ ] The body below frontmatter becomes `prompt` (trimmed, undefined if empty)
- [ ] `parseAgentMarkdown` returns `null` for files that cannot be read
- [ ] File compiles with `npx tsc --noEmit`

## Notes

- Use synchronous `fs.readFileSync` for `parseAgentMarkdown` since file loading happens at startup and is fast.
- Do NOT validate that `description` is non-empty here. The registry handles that.
- The `tools` field from YAML comes as a plain object — `gray-matter` handles that natively.
- The `permission.bash` field can be either a string or a nested object — `gray-matter` parses both correctly.
