# Task 01: Git Tool

## Status

complete

## Wave

1

## Description

Create the `git` tool at `src/tools/git.ts` that wraps all common local Git operations using the `simple-git` library. This tool provides a structured, typed API for the AI agent to interact with Git repositories. Currently, the agent can only use the generic `bash` tool for Git operations, which is unstructured. This tool gives the agent a clean interface with proper error handling and typed results for every Git operation.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-04-agent-registration.md, task-06-statusbar-git.md, task-07-slash-commands.md

**Context from dependencies:** None — this is a standalone new file.

## Files to Create

- `src/tools/git.ts` — Git tool implementation with typed operations and results

## Files to Modify

None.

## Technical Details

### Prerequisite

Run `npm install simple-git` before creating this file. The `simple-git` library provides a Promise-based API for Git operations.

### Implementation Steps

1. Install simple-git: `npm install simple-git`
2. Create `src/tools/git.ts` with the exports described below
3. Define `GitOperation` union type for all supported operations
4. Define `GitArgs` interface with operation + optional parameters
5. Define `GitResult` interface with success, data, error fields
6. Implement `gitTool(args: GitArgs): Promise<GitResult>` function
7. Export the `getGitStatus` helper function for use by the StatusBar (Task 06)

### Code Snippets

#### Type Definitions

```typescript
import { simpleGit, SimpleGit } from 'simple-git';

export type GitOperation =
  | 'status'
  | 'log'
  | 'diff'
  | 'add'
  | 'commit'
  | 'branch_list'
  | 'branch_create'
  | 'branch_delete'
  | 'checkout'
  | 'push'
  | 'pull'
  | 'fetch'
  | 'stash_push'
  | 'stash_pop'
  | 'stash_list'
  | 'reset_soft'
  | 'reset_mixed'
  | 'reset_hard'
  | 'revert'
  | 'merge'
  | 'rebase'
  | 'remote'
  | 'show'
  | 'tag_list'
  | 'tag_create'
  | 'tag_delete';

export interface GitArgs {
  operation: GitOperation;
  path?: string;         // working directory, defaults to process.cwd()
  files?: string[];      // for add, checkout (specific files)
  message?: string;      // for commit, tag_create
  branch?: string;       // for branch_create, branch_delete, checkout, merge, rebase
  remote?: string;       // for push, pull, fetch (default: 'origin')
  target?: string;       // for revert (commit hash), reset (HEAD~N or hash), show (commit)
  count?: number;        // for log (default: 10)
  stashIndex?: number;   // for stash_pop (specific stash index)
  tagName?: string;      // for tag_create, tag_delete
}
```

#### Result Interface

```typescript
export interface GitResult {
  success: boolean;
  operation: GitOperation;
  data?: any;
  error?: string;
}
```

#### getGitStatus Helper

Export a helper function for the StatusBar to call without going through the full tool system:

```typescript
export interface GitStatusInfo {
  branch: string | null;
  dirty: number;       // number of modified/untracked files
  staged: number;      // number of staged files
  ahead: number;       // commits ahead of remote
  behind: number;      // commits behind remote
  isRepo: boolean;
}

export async function getGitStatus(cwd?: string): Promise<GitStatusInfo> {
  // Use simple-git to get status summary
  // Return branch name, dirty count, staged count, ahead/behind
  // On error (not a git repo), return isRepo: false with null branch
}
```

#### Tool Function Structure

```typescript
export async function gitTool(args: GitArgs): Promise<GitResult> {
  const cwd = args.path || process.cwd();
  const git: SimpleGit = simpleGit(cwd);

  try {
    switch (args.operation) {
      case 'status': {
        const status = await git.status();
        // Return structured status info: branch, staged, modified, untracked, ahead, behind
      }
      case 'log': {
        const count = args.count || 10;
        const log = await git.log(['--oneline', `-${count}`]);
        // Return array of { hash, message, date, author }
      }
      case 'diff': {
        const diff = await git.diff(args.files);
        // Return diff string (truncated to 10000 chars)
      }
      case 'add': {
        const files = args.files || ['.'];
        await git.add(files);
        // Return success with list of staged files
      }
      case 'commit': {
        if (!args.message) return { success: false, operation: args.operation, error: 'Commit message required' };
        const result = await git.commit(args.message);
        // Return commit hash and summary
      }
      case 'push': {
        const remote = args.remote || 'origin';
        const result = await git.push(remote, args.branch);
        // Return push result
      }
      case 'pull': {
        const remote = args.remote || 'origin';
        const result = await git.pull(remote, args.branch);
        // Return pull result
      }
      // ... implement all other operations
      default:
        return { success: false, operation: args.operation, error: `Unknown operation: ${args.operation}` };
    }
  } catch (error) {
    return {
      success: false,
      operation: args.operation,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
```

#### Important Implementation Notes

- Use `simple-git` with `simpleGit(baseDir)` to ensure operations run in the correct working directory
- For `diff`, truncate output to 10000 characters (same limit as `bash.ts`)
- For `log`, return commit data as array of objects with hash (short), message, date, author_name
- For `status`, return structured data: branch, current (staged files), modified, not_added (untracked), ahead, behind
- For `reset_hard`, include a safety check: do NOT allow resetting to a hash that doesn't exist
- The `stash_pop` without `stashIndex` should pop the latest stash (default behavior)
- All operations should catch errors and return `GitResult` with `success: false` and error message

### Existing Code Reference

This tool follows the same pattern as `src/tools/bash.ts`:
- Export an `Args` interface
- Export a `Result` interface  
- Export an async function that takes args and returns a typed result
- Handle errors internally and return error in the result object

## Acceptance Criteria

- [ ] `src/tools/git.ts` exports `gitTool`, `GitArgs`, `GitResult`, `GitOperation`, `getGitStatus`, `GitStatusInfo`
- [ ] All 25 operations are implemented and return typed `GitResult` objects
- [ ] `getGitStatus` returns `GitStatusInfo` with branch, dirty count, staged count, ahead/behind, isRepo
- [ ] Errors are caught and returned in the result (never thrown)
- [ ] Diff output is truncated at 10000 characters
- [ ] `simple-git` is added to `package.json` dependencies

## Notes

- The `getGitStatus` function is exported separately because the StatusBar (Task 06) needs to poll git status periodically without going through the full tool execution pipeline
- Do NOT register this tool in `TOOL_REGISTRY` — that happens in Task 04
- Do NOT add this to `ToolName` type — that happens in Task 04
