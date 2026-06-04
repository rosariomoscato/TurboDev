# Task 02: GitHub Tool

## Status

complete

## Wave

1

## Description

Create the `github` tool at `src/tools/github.ts` that wraps GitHub CLI operations using the `gh` command. This tool enables the AI agent to create PRs, list issues, merge PRs, and perform other GitHub operations from within TurboDev. The tool executes `gh` commands via `child_process.spawn` (same pattern as the existing `bash.ts` tool) and returns structured, typed results.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-04-agent-registration.md, task-07-slash-commands.md

**Context from dependencies:** None — this is a standalone new file.

## Files to Create

- `src/tools/github.ts` — GitHub tool implementation wrapping `gh` CLI

## Files to Modify

None.

## Technical Details

### Implementation Steps

1. Create `src/tools/github.ts` with the exports described below
2. Define `GithubOperation` union type for all supported operations
3. Define `GithubArgs` interface with operation + optional parameters
4. Define `GithubResult` interface with success, data, error fields
5. Implement `githubTool(args: GithubArgs): Promise<GithubResult>` function
6. Export the `checkGhAuth` helper for the auth wizard (Task 03)

### Code Snippets

#### Type Definitions

```typescript
export type GithubOperation =
  | 'auth_status'
  | 'pr_create'
  | 'pr_list'
  | 'pr_view'
  | 'pr_merge'
  | 'pr_checkout'
  | 'pr_review'
  | 'pr_close'
  | 'issue_create'
  | 'issue_list'
  | 'issue_view'
  | 'issue_close'
  | 'repo_view'
  | 'release_create'
  | 'release_list';

export interface GithubArgs {
  operation: GithubOperation;
  title?: string;       // for pr_create, issue_create, release_create
  body?: string;        // for pr_create, issue_create
  base?: string;        // for pr_create (target branch, default: repo default)
  head?: string;        // for pr_create (source branch)
  draft?: boolean;      // for pr_create
  state?: 'open' | 'closed' | 'all';  // for pr_list, issue_list (default: 'open')
  number?: number;      // for pr_view, pr_merge, pr_checkout, pr_review, issue_view, issue_close
  reviewAction?: 'approve' | 'request_changes' | 'comment';  // for pr_review
  reviewBody?: string;  // for pr_review comment
  tagName?: string;     // for release_create
  targetCommitish?: string;  // for release_create target branch
  limit?: number;       // for pr_list, issue_list, release_list (default: 20)
}
```

#### Result Interface

```typescript
export interface GithubResult {
  success: boolean;
  operation: GithubOperation;
  data?: any;
  error?: string;
}
```

#### checkGhAuth Helper

Export a helper for the auth wizard (Task 03) to check if `gh` is installed and authenticated:

```typescript
export interface GhAuthStatus {
  ghInstalled: boolean;
  authenticated: boolean;
  username?: string;
  error?: string;
}

export async function checkGhAuth(): Promise<GhAuthStatus> {
  // Run `gh auth status` via spawn
  // Return installed + authenticated + username
  // On error (gh not found), return ghInstalled: false
}
```

#### Core Implementation Pattern

Use `child_process.spawn` to execute `gh` commands (same pattern as `src/tools/bash.ts`):

```typescript
import { spawn } from 'child_process';

function runGhCommand(args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    const proc = spawn('gh', args, {
      cwd: cwd || process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });

    proc.on('error', (err) => {
      resolve({ stdout: '', stderr: err.message, exitCode: 1 });
    });
  });
}
```

#### Operation Implementations

Map each operation to `gh` CLI commands:

| Operation | gh command |
|-----------|-----------|
| `auth_status` | `['auth', 'status']` |
| `pr_create` | `['pr', 'create', '--title', title, '--body', body, ...]` |
| `pr_list` | `['pr', 'list', '--state', state, '--limit', limit, '--json', 'number,title,author,headRefName,updatedAt']` |
| `pr_view` | `['pr', 'view', number, '--json', 'number,title,body,state,url,additions,deletions,changedFiles']` |
| `pr_merge` | `['pr', 'merge', number, '--squash']` |
| `pr_checkout` | `['pr', 'checkout', number]` |
| `pr_review` | `['pr', 'review', number, '--approve'/'--request-changes'/'--comment', '--body', body]` |
| `pr_close` | `['pr', 'close', number]` |
| `issue_create` | `['issue', 'create', '--title', title, '--body', body]` |
| `issue_list` | `['issue', 'list', '--state', state, '--limit', limit, '--json', 'number,title,author,updatedAt']` |
| `issue_view` | `['issue', 'view', number, '--json', 'number,title,body,state,url']` |
| `issue_close` | `['issue', 'close', number]` |
| `repo_view` | `['repo', 'view', '--json', 'name,owner,description,defaultBranchRef,url']` |
| `release_create` | `['release', 'create', tagName, '--title', title, '--notes', body]` |
| `release_list` | `['release', 'list', '--limit', limit]` |

For `pr_create` and `issue_create`, use `--body-file -` to pass body via stdin to avoid shell escaping issues. Alternatively, use `--body` with proper escaping. If the body is long, write it to a temp file and use `--body-file`.

#### JSON Parsing

Most `gh` commands with `--json` return valid JSON. Parse it and return as `data`:

```typescript
case 'pr_list': {
  const limit = args.limit || 20;
  const state = args.state || 'open';
  const { stdout, exitCode } = await runGhCommand([
    'pr', 'list', '--state', state, '--limit', String(limit),
    '--json', 'number,title,author,headRefName,updatedAt'
  ]);
  if (exitCode !== 0) return { success: false, operation: args.operation, error: stderr || 'Failed to list PRs' };
  const prs = JSON.parse(stdout);
  return { success: true, operation: args.operation, data: prs };
}
```

For `auth_status`, parse the stderr output (gh writes auth info to stderr) to extract the username.

### Existing Code Reference

This tool follows the same pattern as `src/tools/bash.ts`:
- Use `child_process.spawn` for command execution
- Truncate output at 10000 characters
- Catch errors and return them in the result object
- ESM imports with `.js` extensions

## Acceptance Criteria

- [ ] `src/tools/github.ts` exports `githubTool`, `GithubArgs`, `GithubResult`, `GithubOperation`, `checkGhAuth`, `GhAuthStatus`
- [ ] All 15 operations are implemented and return typed `GithubResult` objects
- [ ] `checkGhAuth` detects if `gh` is installed and if the user is authenticated
- [ ] `pr_list`, `issue_list`, `repo_view` use `--json` flag and return parsed JSON data
- [ ] Errors (gh not installed, not authenticated, command failure) are caught and returned in the result
- [ ] Output is truncated at 10000 characters

## Notes

- Do NOT register this tool in `TOOL_REGISTRY` — that happens in Task 04
- Do NOT add this to `ToolName` type — that happens in Task 04
- The `checkGhAuth` helper is used by the GithubAuthWizard (Task 03) to determine if auth setup is needed
- If `gh` is not installed, all operations should return `{ success: false, error: 'gh CLI is not installed. Install it from https://cli.github.com' }`
