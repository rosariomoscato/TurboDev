import { simpleGit, type SimpleGit, ResetMode } from 'simple-git';

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

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
  path?: string;
  files?: string[];
  message?: string;
  branch?: string;
  remote?: string;
  target?: string;
  count?: number;
  stashIndex?: number;
  tagName?: string;
}

export interface GitResult {
  success: boolean;
  operation: GitOperation;
  data?: any;
  error?: string;
}

// ---------------------------------------------------------------------------
// GitStatusInfo — lightweight helper for the StatusBar
// ---------------------------------------------------------------------------

export interface GitStatusInfo {
  branch: string | null;
  dirty: number;
  staged: number;
  ahead: number;
  behind: number;
  isRepo: boolean;
}

/**
 * Returns a lightweight summary of the current repo state for use in the
 * StatusBar UI. If the working directory is not a git repo the function
 * returns `isRepo: false` instead of throwing.
 */
export async function getGitStatus(cwd?: string): Promise<GitStatusInfo> {
  const base = cwd || process.cwd();
  const git: SimpleGit = simpleGit(base);

  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return { branch: null, dirty: 0, staged: 0, ahead: 0, behind: 0, isRepo: false };
    }

    const status = await git.status();

    // `modified` contains files changed in the working tree but not staged.
    // `created` and `deleted` are also working-tree changes reported by
    // simple-git.  We count all non-staged, non-untracked files as "dirty".
    const dirty =
      status.modified.length +
      status.created.length +
      status.deleted.length +
      status.renamed.length;

    return {
      branch: status.current,
      dirty,
      staged: status.staged.length,
      ahead: status.ahead,
      behind: status.behind,
      isRepo: true,
    };
  } catch {
    return { branch: null, dirty: 0, staged: 0, ahead: 0, behind: 0, isRepo: false };
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum character length for `diff` output before truncation. */
const MAX_DIFF_LENGTH = 10000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Truncate a string to `maxLength`, appending a notice when truncated.
 * Mirrors the same pattern used in `bash.ts`.
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '\n... [truncated]';
}

// ---------------------------------------------------------------------------
// gitTool — main tool function
// ---------------------------------------------------------------------------

/**
 * Executes a structured Git operation using the `simple-git` library.
 *
 * Every operation returns a `GitResult` so callers never need to handle
 * exceptions — errors are captured and reported through `success: false`.
 */
export async function gitTool(args: GitArgs): Promise<GitResult> {
  const cwd = args.path || process.cwd();
  const git: SimpleGit = simpleGit(cwd);

  try {
    switch (args.operation) {
      // -----------------------------------------------------------------
      // Working tree status
      // -----------------------------------------------------------------
      case 'status': {
        const status = await git.status();
        return {
          success: true,
          operation: args.operation,
          data: {
            branch: status.current,
            tracking: status.tracking,
            staged: status.staged,
            modified: status.modified,
            not_added: status.not_added,
            created: status.created,
            deleted: status.deleted,
            conflicted: status.conflicted,
            renamed: status.renamed,
            ahead: status.ahead,
            behind: status.behind,
          },
        };
      }

      // -----------------------------------------------------------------
      // Commit log
      // -----------------------------------------------------------------
      case 'log': {
        const maxCount = args.count ?? 20;
        const logResult = await git.log({ maxCount });
        // Return a plain array of lightweight commit objects
        const commits = logResult.all.map((entry) => ({
          hash: entry.hash.slice(0, 7),
          message: entry.message,
          date: entry.date,
          author_name: entry.author_name,
        }));
        return {
          success: true,
          operation: args.operation,
          data: commits,
        };
      }

      // -----------------------------------------------------------------
      // Diff
      // -----------------------------------------------------------------
      case 'diff': {
        // When specific files are requested, diff only those; otherwise diff
        // the entire working tree.
        const diffArgs: string[] = [];
        if (args.files && args.files.length > 0) {
          diffArgs.push('--', ...args.files);
        }
        const raw = await git.diff(diffArgs);
        return {
          success: true,
          operation: args.operation,
          data: truncate(raw, MAX_DIFF_LENGTH),
        };
      }

      // -----------------------------------------------------------------
      // Stage files
      // -----------------------------------------------------------------
      case 'add': {
        if (!args.files || args.files.length === 0) {
          return {
            success: false,
            operation: args.operation,
            error: 'No files specified for "add". Provide one or more file paths.',
          };
        }
        await git.add(args.files);
        return { success: true, operation: args.operation, data: { files: args.files } };
      }

      // -----------------------------------------------------------------
      // Commit
      // -----------------------------------------------------------------
      case 'commit': {
        if (!args.message) {
          return {
            success: false,
            operation: args.operation,
            error: 'Commit message is required.',
          };
        }
        const result = await git.commit(args.message, args.files);
        return {
          success: true,
          operation: args.operation,
          data: {
            branch: result.branch,
            commit: result.commit,
            summary: result.summary,
          },
        };
      }

      // -----------------------------------------------------------------
      // Branch list
      // -----------------------------------------------------------------
      case 'branch_list': {
        const branches = await git.branch();
        return {
          success: true,
          operation: args.operation,
          data: {
            current: branches.current,
            branches: Object.values(branches.branches).map((b) => ({
              name: b.name,
              current: b.current,
              commit: b.commit,
              label: b.label,
            })),
          },
        };
      }

      // -----------------------------------------------------------------
      // Branch create
      // -----------------------------------------------------------------
      case 'branch_create': {
        if (!args.branch) {
          return {
            success: false,
            operation: args.operation,
            error: 'Branch name is required.',
          };
        }
        await git.checkoutLocalBranch(args.branch);
        return {
          success: true,
          operation: args.operation,
          data: { branch: args.branch },
        };
      }

      // -----------------------------------------------------------------
      // Branch delete
      // -----------------------------------------------------------------
      case 'branch_delete': {
        if (!args.branch) {
          return {
            success: false,
            operation: args.operation,
            error: 'Branch name is required.',
          };
        }
        const result = await git.deleteLocalBranch(args.branch);
        return {
          success: true,
          operation: args.operation,
          data: { branch: result.branch, hash: result.hash, success: result.success },
        };
      }

      // -----------------------------------------------------------------
      // Checkout
      // -----------------------------------------------------------------
      case 'checkout': {
        if (!args.branch && !args.target) {
          return {
            success: false,
            operation: args.operation,
            error: 'Branch or target is required for checkout.',
          };
        }
        const ref = args.branch || args.target!;
        await git.checkout(ref);
        return {
          success: true,
          operation: args.operation,
          data: { ref },
        };
      }

      // -----------------------------------------------------------------
      // Push
      // -----------------------------------------------------------------
      case 'push': {
        const remote = args.remote || 'origin';
        const branch = args.branch;
        const result = await git.push(remote, branch);
        return {
          success: true,
          operation: args.operation,
          data: {
            pushed: result.pushed.map((p) => ({
              local: p.local,
              remote: p.remote,
              branch: p.branch,
            })),
          },
        };
      }

      // -----------------------------------------------------------------
      // Pull
      // -----------------------------------------------------------------
      case 'pull': {
        const remote = args.remote || 'origin';
        const branch = args.branch;
        const result = await git.pull(remote, branch);
        return {
          success: true,
          operation: args.operation,
          data: {
            files: result.files,
            summary: result.summary,
            created: result.created,
            deleted: result.deleted,
          },
        };
      }

      // -----------------------------------------------------------------
      // Fetch
      // -----------------------------------------------------------------
      case 'fetch': {
        const remote = args.remote || 'origin';
        const result = args.branch
          ? await git.fetch(remote, args.branch)
          : await git.fetch(remote);
        return {
          success: true,
          operation: args.operation,
          data: {
            remote: result.remote,
            branches: result.branches,
            tags: result.tags,
          },
        };
      }

      // -----------------------------------------------------------------
      // Stash push
      // -----------------------------------------------------------------
      case 'stash_push': {
        const stashArgs: string[] = ['push'];
        if (args.message) {
          stashArgs.push('-m', args.message);
        }
        if (args.files && args.files.length > 0) {
          stashArgs.push('--', ...args.files);
        }
        await git.stash(stashArgs);
        return { success: true, operation: args.operation };
      }

      // -----------------------------------------------------------------
      // Stash pop
      // -----------------------------------------------------------------
      case 'stash_pop': {
        // `git stash pop` with an optional stash index (e.g. "stash@{2}")
        const popArgs: string[] = ['pop'];
        if (args.stashIndex !== undefined) {
          popArgs.push(`stash@{${args.stashIndex}}`);
        }
        await git.stash(popArgs);
        return { success: true, operation: args.operation };
      }

      // -----------------------------------------------------------------
      // Stash list
      // -----------------------------------------------------------------
      case 'stash_list': {
        const stashLog = await git.stashList();
        const stashes = stashLog.all.map((entry) => ({
          hash: entry.hash.slice(0, 7),
          message: entry.message,
          date: entry.date,
        }));
        return {
          success: true,
          operation: args.operation,
          data: stashes,
        };
      }

      // -----------------------------------------------------------------
      // Reset (soft — keeps staged changes)
      // -----------------------------------------------------------------
      case 'reset_soft': {
        const target = args.target || 'HEAD';
        await git.reset(ResetMode.SOFT, [target]);
        return {
          success: true,
          operation: args.operation,
          data: { target },
        };
      }

      // -----------------------------------------------------------------
      // Reset (mixed — unstages changes, keeps working tree)
      // -----------------------------------------------------------------
      case 'reset_mixed': {
        const target = args.target || 'HEAD';
        await git.reset(ResetMode.MIXED, [target]);
        return {
          success: true,
          operation: args.operation,
          data: { target },
        };
      }

      // -----------------------------------------------------------------
      // Reset (hard — discards all changes)
      // -----------------------------------------------------------------
      case 'reset_hard': {
        if (!args.target) {
          return {
            success: false,
            operation: args.operation,
            error: 'Target commit is required for hard reset.',
          };
        }
        // Safety check: verify the target commit exists before resetting.
        try {
          await git.revparse(['--verify', args.target]);
        } catch {
          return {
            success: false,
            operation: args.operation,
            error: `Target "${args.target}" does not exist. Aborting hard reset.`,
          };
        }
        await git.reset(ResetMode.HARD, [args.target]);
        return {
          success: true,
          operation: args.operation,
          data: { target: args.target },
        };
      }

      // -----------------------------------------------------------------
      // Revert
      // -----------------------------------------------------------------
      case 'revert': {
        if (!args.target) {
          return {
            success: false,
            operation: args.operation,
            error: 'Target commit hash is required for revert.',
          };
        }
        await git.revert(args.target);
        return {
          success: true,
          operation: args.operation,
          data: { target: args.target },
        };
      }

      // -----------------------------------------------------------------
      // Merge
      // -----------------------------------------------------------------
      case 'merge': {
        if (!args.branch && !args.target) {
          return {
            success: false,
            operation: args.operation,
            error: 'Branch or target to merge is required.',
          };
        }
        const mergeRef = args.branch || args.target!;
        const result = await git.merge([mergeRef]);
        return {
          success: true,
          operation: args.operation,
          data: {
            conflicts: result.conflicts,
            merges: result.merges,
            result: result.result,
            failed: result.failed,
            summary: result.summary,
          },
        };
      }

      // -----------------------------------------------------------------
      // Rebase
      // -----------------------------------------------------------------
      case 'rebase': {
        if (!args.branch && !args.target) {
          return {
            success: false,
            operation: args.operation,
            error: 'Branch or target for rebase is required.',
          };
        }
        const rebaseRef = args.branch || args.target!;
        const result = await git.rebase([rebaseRef]);
        return {
          success: true,
          operation: args.operation,
          data: result,
        };
      }

      // -----------------------------------------------------------------
      // Remote
      // -----------------------------------------------------------------
      case 'remote': {
        const remotes = await git.getRemotes(true);
        return {
          success: true,
          operation: args.operation,
          data: remotes.map((r: any) => ({
            name: r.name,
            refs: r.refs,
          })),
        };
      }

      // -----------------------------------------------------------------
      // Show
      // -----------------------------------------------------------------
      case 'show': {
        const showTarget = args.target || 'HEAD';
        const output = await git.show(showTarget);
        return {
          success: true,
          operation: args.operation,
          data: truncate(output, MAX_DIFF_LENGTH),
        };
      }

      // -----------------------------------------------------------------
      // Tag list
      // -----------------------------------------------------------------
      case 'tag_list': {
        const tags = await git.tags();
        return {
          success: true,
          operation: args.operation,
          data: {
            all: tags.all,
            latest: tags.latest,
          },
        };
      }

      // -----------------------------------------------------------------
      // Tag create
      // -----------------------------------------------------------------
      case 'tag_create': {
        if (!args.tagName) {
          return {
            success: false,
            operation: args.operation,
            error: 'Tag name is required.',
          };
        }
        const result = await git.addTag(args.tagName);
        return {
          success: true,
          operation: args.operation,
          data: { name: result.name },
        };
      }

      // -----------------------------------------------------------------
      // Tag delete
      // -----------------------------------------------------------------
      case 'tag_delete': {
        if (!args.tagName) {
          return {
            success: false,
            operation: args.operation,
            error: 'Tag name is required.',
          };
        }
        await git.raw(['tag', '-d', args.tagName]);
        return {
          success: true,
          operation: args.operation,
          data: { tag: args.tagName },
        };
      }

      default: {
        // Exhaustiveness check — if a new operation is added to the union
        // but not handled here, TypeScript's `never` analysis will flag it.
        const _exhaustive: never = args.operation;
        return {
          success: false,
          operation: args.operation,
          error: `Unknown operation: ${args.operation}`,
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      operation: args.operation,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
