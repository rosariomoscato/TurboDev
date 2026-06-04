# Task 06: StatusBar Git Status

## Status

pending

## Wave

2

## Description

Add a Git status indicator to the TurboDev StatusBar showing the current branch name and dirty state (number of modified/untracked files). This gives users immediate visual feedback about their Git state without having to run any commands. The StatusBar is at the bottom of the terminal and shows model, agent, token count, and cost — this task adds Git branch and dirty count to that bar.

## Dependencies

**Depends on:** task-01-git-tool.md, task-03-ui-components.md
**Blocks:** task-07-slash-commands.md

**Context from dependencies:** task-01 creates `src/tools/git.ts` which exports `getGitStatus` and `GitStatusInfo` — a lightweight function that returns branch, dirty count, staged count, ahead/behind, and isRepo flag. task-03 creates `src/ui/GitStatus.tsx` which exports the `useGitStatus` React hook that polls `getGitStatus` every 5 seconds.

## Files to Create

None.

## Files to Modify

- `src/ui/StatusBar.tsx` — Import `useGitStatus` hook, display branch name and dirty indicator

## Technical Details

### Current StatusBar Layout

The StatusBar currently displays:
```
──────────────────────────────────────────────────
 TurboDev | editor | gpt-4 | ████░░░░░░ 2.1K/128K 2% | $0.012
```

### Target Layout

After this task:
```
──────────────────────────────────────────────────
 TurboDev | editor | gpt-4 | main ●3 | ████░░░░░░ 2.1K/128K 2% | $0.012
```

Where `main` is the branch name and `●3` indicates 3 dirty (modified/untracked) files. If the directory is not a git repo, the git section is hidden entirely. If the working tree is clean, show `main ✓` (or just `main` with no indicator).

### Implementation Steps

1. Import `useGitStatus` from `src/ui/GitStatus.tsx`
2. Call `useGitStatus(process.cwd())` inside the StatusBar component
3. Conditionally render the git section only when `status.isRepo` is true
4. Display branch name in cyan color
5. Display dirty indicator in yellow if `dirty > 0`, or green checkmark if clean

### Code Changes in `src/ui/StatusBar.tsx`

**Add import:**

```typescript
import { useGitStatus } from './GitStatus.js';
```

**Inside the StatusBar component**, add the hook call at the beginning:

```typescript
const gitStatus = useGitStatus(process.cwd());
```

**In the content JSX**, add the git section between model and token count:

```tsx
{gitStatus.isRepo && gitStatus.branch ? (
  <>
    <Text color="gray"> | </Text>
    <Text color="cyan">{gitStatus.branch}</Text>
    {gitStatus.dirty > 0 ? (
      <Text color="yellow"> ●{gitStatus.dirty}</Text>
    ) : (
      <Text color="green"> ✓</Text>
    )}
    {gitStatus.ahead > 0 ? (
      <Text color="cyan"> ↑{gitStatus.ahead}</Text>
    ) : null}
    {gitStatus.behind > 0 ? (
      <Text color="yellow"> ↓{gitStatus.behind}</Text>
    ) : null}
  </>
) : null}
```

The placement should be after the model name and before the token count. The full order becomes:
1. `TurboDev`
2. `| agent name`
3. `| model name`
4. `| branch ●dirty ↑ahead ↓behind` (NEW — conditional)
5. `| token bar`
6. `| percentage`
7. `| cost`
8. `| thinking status`

### Existing Code Reference

The StatusBar is at `src/ui/StatusBar.tsx:79-139`. It's a `memo` component that receives props. The `gitStatus` is derived from the hook (not passed as a prop) because the StatusBar shouldn't burden App.tsx with git polling logic — the hook handles it internally.

Note: Since the StatusBar is a `memo` component, adding a hook call inside it may cause re-renders when git status changes. This is acceptable because the hook only triggers every 5 seconds and the StatusBar is lightweight.

## Acceptance Criteria

- [ ] StatusBar displays current git branch name in cyan when inside a git repo
- [ ] StatusBar displays `●N` (yellow) when N files are dirty/modified
- [ ] StatusBar displays `✓` (green) when working tree is clean
- [ ] StatusBar displays `↑N` (cyan) when N commits ahead of remote
- [ ] StatusBar displays `↓N` (yellow) when N commits behind remote
- [ ] Git section is hidden when not in a git repository
- [ ] StatusBar updates every 5 seconds via the `useGitStatus` hook
- [ ] TypeScript compiles without errors

## Notes

- The `process.cwd()` is used as the working directory for git status. This is correct because TurboDev is always running in the project directory.
- The StatusBar is a `React.memo` component. Adding the hook inside it is fine because the hook's `setInterval` cleanup prevents memory leaks.
