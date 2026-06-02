# Task 05: Permission System

## Status

pending

## Wave

2

## Description

This task implements the permission resolution engine. When an agent attempts to use a tool, the permission system determines whether the action should be allowed, denied, or require user approval. The system supports three actions (`allow`, `ask`, `deny`) for `edit` and `bash` tools. For `bash`, it supports glob pattern matching on the command string (e.g., `"git *": "ask"`, `"*": "deny"`) where the **last matching rule wins**. This module is a pure function module with no side effects — it takes an agent config and a tool call, and returns a permission decision.

## Dependencies

**Depends on:** task-01-agent-types.md (AgentConfig, AgentPermission, PermissionAction types)
**Blocks:** task-08-tools-update.md (calls resolveToolPermission before executing tools), task-10-agent-loop-update.md (passes permission callbacks)

**Context from dependencies:** task-01 creates `src/agent/types.ts` exporting `AgentConfig`, `AgentPermission`, `BashPermissionRules`, and `PermissionAction`. This task imports those types and implements the resolution logic.

## Files to Create

- `src/agent/permissions.ts` — Permission resolution functions

## Technical Details

### Implementation Steps

1. Create `src/agent/permissions.ts`
2. Import types from `./types.js`
3. Implement `matchBashGlob(pattern: string, command: string): boolean` — simple glob matcher for `*` wildcard
4. Implement `resolveBashPermission(rules: BashPermissionRules, command: string): PermissionAction` — iterate rules in order, last match wins
5. Implement `resolveToolPermission(toolName: string, agent: AgentConfig, bashCommand?: string): PermissionAction` — the main entry point

### Code Snippets

```ts
import type { AgentConfig, AgentPermission, BashPermissionRules, PermissionAction } from './types.js';

const SENSITIVE_TOOLS = new Set(['edit_file', 'mkdir', 'bash']);

export function matchBashGlob(pattern: string, command: string): boolean {
  if (pattern === '*') return true;
  
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  
  try {
    return new RegExp(`^${regexStr}$`).test(command);
  } catch {
    return false;
  }
}

export function resolveBashPermission(
  rules: BashPermissionRules,
  command: string
): PermissionAction {
  let result: PermissionAction = 'ask';
  
  for (const [pattern, action] of Object.entries(rules)) {
    if (matchBashGlob(pattern, command)) {
      result = action;
    }
  }
  
  return result;
}

export function resolveToolPermission(
  toolName: string,
  agent: AgentConfig,
  bashCommand?: string
): PermissionAction {
  if (agent.tools && agent.tools[toolName] === false) {
    return 'deny';
  }

  const perm = agent.permission;
  if (!perm) return 'allow';

  if (toolName === 'edit_file' || toolName === 'mkdir') {
    if (perm.edit) return perm.edit;
  }

  if (toolName === 'bash') {
    if (!perm.bash) return 'allow';
    if (typeof perm.bash === 'string') return perm.bash;
    if (typeof perm.bash === 'object' && bashCommand) {
      return resolveBashPermission(perm.bash, bashCommand);
    }
    if (typeof perm.bash === 'object') return 'ask';
  }

  return 'allow';
}
```

### Glob Matching Design

The glob matching is intentionally simple. It only needs to handle patterns like:
- `"*"` → matches everything
- `"git *"` → matches any command starting with `git `
- `"git status *"` → matches `git status` and `git status --short`
- `"grep *"` → matches any command starting with `grep `

The implementation converts `*` to `.*` in a regex, escaping all other special characters. No need for `minimatch` or similar — the patterns are simple enough.

### Last-Match-Wins Rule

When multiple patterns match a bash command, the **last** matching rule in the object determines the result. This is critical for the common pattern:

```yaml
permission:
  bash:
    "*": "ask"
    "git status *": "allow"
```

Here `"git status"` matches both `*` and `git status *`, but since `git status *` comes after `*` in the object, it wins and the result is `allow`.

Note: JavaScript object property order is guaranteed for string keys in insertion order (ES2015+), so iterating with `Object.entries()` preserves the order from the YAML file.

## Acceptance Criteria

- [ ] `matchBashGlob('*')` matches any command string
- [ ] `matchBashGlob('git *')` matches `'git status'` and `'git log --oneline'`
- [ ] `matchBashGlob('git *')` does not match `'npm test'`
- [ ] `resolveBashPermission` returns the action from the last matching pattern
- [ ] `resolveToolPermission` returns `'deny'` when `agent.tools[toolName] === false`
- [ ] `resolveToolPermission` returns `'allow'` when no permission config exists
- [ ] `resolveToolPermission` handles `edit_file` via `permission.edit`
- [ ] `resolveToolPermission` handles `bash` with simple string permission
- [ ] `resolveToolPermission` handles `bash` with glob rules + command
- [ ] File compiles with `npx tsc --noEmit`

## Notes

- This module is pure functions only — no I/O, no side effects, no callbacks.
- The permission system is consulted before tool execution in the agent loop. The `ask` result triggers a UI callback that prompts the user.
- The `mkdir` tool is grouped with `edit_file` under the `edit` permission since it's a write operation on the filesystem.
