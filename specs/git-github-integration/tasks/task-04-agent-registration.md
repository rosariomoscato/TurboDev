# Task 04: Agent Tool Registration

## Status

complete

## Wave

2

## Description

Register the `git` and `github` tools in TurboDev's agent system. This task modifies the core agent files to add the two new tools to the `ToolName` type, register them in `TOOL_REGISTRY`, update the built-in agents with appropriate permissions, extend the permission resolution logic, and add tool descriptions to the system prompt. After this task, the AI agent can call `tool: git({...})` and `tool: github({...})` during conversations.

## Dependencies

**Depends on:** task-01-git-tool.md, task-02-github-tool.md
**Blocks:** task-07-slash-commands.md

**Context from dependencies:** task-01 creates `src/tools/git.ts` exporting `gitTool`, `GitArgs`, `GitResult`, `GitOperation`. task-02 creates `src/tools/github.ts` exporting `githubTool`, `GithubArgs`, `GithubResult`, `GithubOperation`. These exports are what we import and register in the tool system.

## Files to Create

None.

## Files to Modify

- `src/agent/types.ts` — Add `'git' | 'github'` to `ToolName` union (via tools.ts), add `git?` and `github?` permission fields to `AgentPermission`
- `src/agent/tools.ts` — Import git and github tools, add to `ToolName`, `ToolArgs`, `TOOL_REGISTRY`
- `src/agent/builtins.ts` — Add git/github permission defaults for editor and plan agents
- `src/agent/permissions.ts` — Handle git and github tool permissions
- `src/agent/system-prompt.ts` — Add safety rules for git operations to the system prompt

## Technical Details

### Step 1: Update `src/agent/types.ts`

Add `git` and `github` permission fields to `AgentPermission`:

```typescript
export interface AgentPermission {
  edit?: PermissionAction;
  bash?: PermissionAction | BashPermissionRules;
  git?: PermissionAction;
  github?: PermissionAction;
}
```

This allows agent configs to specify permissions for git and github operations independently.

### Step 2: Update `src/agent/tools.ts`

**Imports** — Add at the top of the file:

```typescript
import { gitTool, GitArgs } from '../tools/git.js';
import { githubTool, GithubArgs } from '../tools/github.js';
```

**ToolName type** — Add the new tool names:

```typescript
export type ToolName = 'read_file' | 'list_files' | 'edit_file' | 'mkdir' | 'grep' | 'bash' | 'question' | 'task' | 'git' | 'github';
```

**ToolArgs union** — Add the new arg types:

```typescript
export type ToolArgs =
  | ReadFileArgs
  | ListFilesArgs
  | EditFileArgs
  | MkdirArgs
  | GrepArgs
  | BashArgs
  | QuestionArgs
  | GitArgs
  | GithubArgs;
```

**TOOL_REGISTRY** — Add entries for both tools:

```typescript
git: {
  name: 'git',
  description: `
    Execute Git operations for version control.
    Args: { operation: string, path?: string, files?: string[], message?: string, branch?: string, remote?: string, target?: string, count?: number, stashIndex?: number, tagName?: string }
      - operation: One of: status, log, diff, add, commit, branch_list, branch_create, branch_delete, checkout, push, pull, fetch, stash_push, stash_pop, stash_list, reset_soft, reset_mixed, reset_hard, revert, merge, rebase, remote, show, tag_list, tag_create, tag_delete
      - path: Working directory. Defaults to current directory. Optional.
      - files: File paths for add/checkout operations. Optional.
      - message: Commit message or tag message. Required for commit.
      - branch: Branch name for branch/checkout/merge/rebase operations. Optional.
      - remote: Remote name for push/pull/fetch. Default: 'origin'. Optional.
      - target: Commit hash or HEAD~N for reset/revert/show. Optional.
      - count: Number of log entries. Default: 10. Optional.
      - tagName: Tag name for tag operations. Optional.
    Returns: { success: boolean, operation: string, data?: any, error?: string }
    `.trim(),
  fn: gitTool
},
github: {
  name: 'github',
  description: `
    Execute GitHub operations via the gh CLI.
    Args: { operation: string, title?: string, body?: string, base?: string, head?: string, draft?: boolean, state?: string, number?: number, reviewAction?: string, reviewBody?: string, tagName?: string, targetCommitish?: string, limit?: number }
      - operation: One of: auth_status, pr_create, pr_list, pr_view, pr_merge, pr_checkout, pr_review, pr_close, issue_create, issue_list, issue_view, issue_close, repo_view, release_create, release_list
      - title: Title for PR/issue/release. Required for create operations.
      - body: Body/description text. Optional.
      - base: Target branch for PR. Optional.
      - head: Source branch for PR. Optional.
      - draft: Create as draft PR. Optional.
      - state: Filter by state (open/closed/all). Default: 'open'. Optional.
      - number: PR/issue number. Required for view/merge/checkout/review/close operations.
      - reviewAction: Review action (approve/request_changes/comment). Required for pr_review.
      - reviewBody: Review comment body. Optional.
      - tagName: Tag name for release. Required for release_create.
      - limit: Max items to return. Default: 20. Optional.
    Returns: { success: boolean, operation: string, data?: any, error?: string }
    `.trim(),
  fn: githubTool
},
```

### Step 3: Update `src/agent/builtins.ts`

Add git/github permissions to built-in agents:

**editor agent** — Add to existing config:
```typescript
permission: {
  edit: 'allow',
  bash: 'allow',
  git: 'allow',
  github: 'allow',
},
```

**plan agent** — Add to existing config:
```typescript
permission: {
  edit: 'ask',
  bash: 'ask',
  git: 'ask',
  github: 'ask',
},
```

**compaction agent** — No changes needed (it has all tools disabled already).

Also add `git: true, github: true` to the editor agent's `tools` and `git: true, github: true` to the plan agent's `tools`.

### Step 4: Update `src/agent/permissions.ts`

Add handling for git and github tools in `resolveToolPermission`:

```typescript
export function resolveToolPermission(
  toolName: string,
  agent: AgentConfig,
  bashCommand?: string,
): PermissionAction {
  if (agent.tools?.[toolName] === false) return 'deny';
  if (!agent.permission) return 'allow';

  if (toolName === 'edit_file' || toolName === 'mkdir') {
    return agent.permission.edit ?? 'allow';
  }

  if (toolName === 'bash') {
    const bash = agent.permission.bash;
    if (!bash) return 'allow';
    if (typeof bash === 'string') return bash;
    if (typeof bash === 'object' && bashCommand !== undefined) {
      return resolveBashPermission(bash, bashCommand);
    }
    return 'ask';
  }

  if (toolName === 'git') {
    return agent.permission.git ?? 'allow';
  }

  if (toolName === 'github') {
    return agent.permission.github ?? 'allow';
  }

  return 'allow';
}
```

### Step 5: Update `src/agent/system-prompt.ts`

Add Git safety rules to the system prompt. In the `generateSystemPrompt` function, after the "IMPORTANT RULES" section, add:

```typescript
prompt += `

GIT SAFETY RULES:
1. NEVER force push to main or master branch
2. NEVER push without the user's explicit request
3. NEVER commit secrets, API keys, or credentials
4. Always run git status and git diff before committing to show the user what will be committed
5. Suggest meaningful commit messages based on the actual changes
6. When creating PRs, suggest a descriptive title and body based on the commits`;
```

## Acceptance Criteria

- [ ] `ToolName` type includes `'git'` and `'github'`
- [ ] `TOOL_REGISTRY` has entries for both tools with correct descriptions
- [ ] Editor agent has `git: 'allow'` and `github: 'allow'` permissions
- [ ] Plan agent has `git: 'ask'` and `github: 'ask'` permissions
- [ ] `resolveToolPermission` handles `git` and `github` tool names
- [ ] System prompt includes Git safety rules
- [ ] TypeScript compiles without errors

## Notes

- This task modifies 5 files but they are tightly coupled — the type change in tools.ts must be consistent with types.ts, and the permission changes in builtins.ts must align with the permission resolution in permissions.ts
- All imports must use `.js` extension for ESM compatibility
