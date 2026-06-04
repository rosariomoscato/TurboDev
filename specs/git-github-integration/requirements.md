# Requirements: Git/GitHub Integration

## Summary

TurboDev is a terminal-based AI coding agent built with React/Ink. Currently users can only interact with Git through the generic `bash` tool, which is unstructured and error-prone. This feature adds dedicated Git and GitHub tools, slash commands, and UI indicators so users can manage their entire Git/GitHub workflow without leaving TurboDev.

The solution provides two new tools (`git` and `github`) registered in the existing tool registry, a set of slash commands for direct user access (`/commit`, `/push`, `/branch`, `/pr`, etc.), a GitHub authentication wizard, and a git status indicator in the StatusBar showing the current branch and dirty state.

## Goals

- Provide structured, typed Git operations via a `git` tool using the `simple-git` library
- Provide GitHub operations via a `github` tool wrapping the `gh` CLI
- Add slash commands for direct user access to common Git/GitHub operations
- Show git branch and dirty state in the StatusBar
- Provide an integrated GitHub authentication wizard
- Integrate with the existing permission system (allow/ask/deny) for destructive operations

## Non-Goals

- Replacing the `bash` tool — it remains available for advanced use cases
- Building a full git client UI (diff viewer, interactive staging, etc.)
- Supporting GitLab, Bitbucket, or other Git hosting platforms
- Implementing custom GitHub API HTTP calls — we use `gh` CLI exclusively
- Managing SSH keys or GPG signing configuration

## Acceptance Criteria

- [ ] The AI agent can call `git` tool operations (status, log, diff, add, commit, push, pull, branch, checkout, stash, reset, revert, merge, rebase, fetch, remote, show, tag) and receive structured typed results
- [ ] The AI agent can call `github` tool operations (auth_status, pr_create, pr_list, pr_view, pr_merge, pr_checkout, pr_review, issue_create, issue_list, repo_view, release_create) via `gh` CLI
- [ ] Users can type slash commands (`/commit`, `/push`, `/pull`, `/branch`, `/pr`, `/rollback`, `/git status`, `/git log`, `/git diff`, `/gh auth`) to execute Git/GitHub operations directly
- [ ] The StatusBar displays the current git branch name and a dirty state indicator with the number of modified files
- [ ] Destructive operations (commit, push, reset --hard, pr_merge) require user approval via the permission system for the `plan` agent
- [ ] A GitHub authentication wizard guides users through `gh auth login` when GitHub features are first used
- [ ] `npm run build` succeeds with no type errors

## Assumptions

- The user has `git` installed and available in PATH
- The user's project is a git repository (or will be initialized via `/git` commands)
- The `gh` CLI is available for GitHub operations (or the user will install it when prompted by the auth wizard)
- The `simple-git` npm package is compatible with the project's Node.js >= 18 requirement
- The existing tool system architecture (TOOL_REGISTRY, parser, permissions) is stable and can be extended

## Technical Constraints

- **Framework**: React 18 + Ink 4 for terminal UI (existing)
- **Build**: tsup for bundling (existing)
- **Module system**: ESM (`"type": "module"` in package.json)
- **Git library**: `simple-git` for all local Git operations
- **GitHub integration**: `gh` CLI wrapped via child_process.spawn (same pattern as `src/tools/bash.ts`)
- **Tool registration**: Must follow the existing pattern in `src/agent/tools.ts` (ToolDefinition interface, TOOL_REGISTRY)
- **Permissions**: Must follow the existing pattern in `src/agent/permissions.ts` and `src/agent/types.ts`
- **UI components**: Must use React/Ink (Box, Text, useInput, useApp, etc.) consistent with existing components
- **File extensions**: All imports must use `.js` extension for ESM compatibility (existing convention)
