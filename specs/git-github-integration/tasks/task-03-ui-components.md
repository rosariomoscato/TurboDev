# Task 03: UI Components

## Status

complete

## Wave

1

## Description

Create two React/Ink UI components: `GithubAuthWizard` for guiding users through GitHub authentication, and `GitStatus` as a helper module that provides git status polling logic for the StatusBar. These are standalone files with no modifications to existing code — they will be wired in by later tasks (Task 06 for GitStatus, Task 07 for GithubAuthWizard).

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-06-statusbar-git.md, task-07-slash-commands.md

**Context from dependencies:** None — these are standalone new files. They import from `src/tools/github.ts` (Task 02) for `checkGhAuth`, and from `src/tools/git.ts` (Task 01) for `getGitStatus`. Since all are in Wave 1, they will exist by the time these components are wired in.

## Files to Create

- `src/ui/GithubAuthWizard.tsx` — React/Ink component for GitHub authentication setup
- `src/ui/GitStatus.tsx` — Helper module for polling git status (used by StatusBar)

## Files to Modify

None.

## Technical Details

### GithubAuthWizard Component

A React/Ink component that guides the user through GitHub authentication:

```typescript
import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';

interface Props {
  onComplete: (authenticated: boolean) => void;
}
```

#### Flow

1. **Check `gh` installed**: Call `checkGhAuth()` from `src/tools/github.ts`
   - If not installed → Show message: "gh CLI is not installed. Install it from https://cli.github.com and restart TurboDev." + "Press any key to continue."
   - If installed + authenticated → Show "Already authenticated as {username}" + call `onComplete(true)` after a key press
   - If installed + not authenticated → Go to step 2

2. **Authenticate**: Show options:
   ```
   GitHub Authentication
   
   Options:
   1. Login with web browser (gh auth login -w)
   2. Login with token (gh auth login --with-token)
   3. Cancel
   
   Type 1-3:
   ```

3. **Execute auth**: Based on selection:
   - Option 1: Run `gh auth login -p https -w -h github.com` via `spawn` and stream output. Show "Follow the instructions in your browser..." When process exits, check auth status again.
   - Option 2: Show "Paste your GitHub Personal Access Token:" input field. Then run `echo {token} | gh auth login --with-token` via spawn.
   - Option 3: Call `onComplete(false)`

4. **Verify**: After auth attempt, call `checkGhAuth()` again. If authenticated, show success. If not, show error and option to retry.

#### Key Implementation Details

- Use `useState` for wizard step: `'checking' | 'choose_method' | 'browser_login' | 'token_login' | 'done' | 'error'`
- Use `useInput` from Ink for key handling (same pattern as `App.tsx`)
- For the token input, use `TextInput` from `ink-text-input` (already a dependency)
- For spawning `gh auth login`, use `child_process.spawn` directly (not the bash tool)
- The `onComplete` callback is used by App.tsx (Task 07) to return to the chat view

### GitStatus Module

A helper module that exports a React hook and utility for polling git status:

```typescript
import { useState, useEffect } from 'react';
import { getGitStatus, GitStatusInfo } from '../tools/git.js';

export type { GitStatusInfo };

export function useGitStatus(cwd: string): GitStatusInfo {
  // Poll git status every 5 seconds
  // Return GitStatusInfo with branch, dirty, staged, ahead, behind, isRepo
}
```

#### useGitStatus Hook

```typescript
export function useGitStatus(cwd: string): GitStatusInfo {
  const [status, setStatus] = useState<GitStatusInfo>({
    branch: null,
    dirty: 0,
    staged: 0,
    ahead: 0,
    behind: 0,
    isRepo: false,
  });

  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      const info = await getGitStatus(cwd);
      if (mounted) setStatus(info);
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [cwd]);

  return status;
}
```

### Existing Code Patterns

Look at `src/ui/SetupWizard.tsx` and `src/ui/InitWizard.tsx` for wizard component patterns. Look at `src/ui/StatusBar.tsx` for hook patterns (the StatusBar uses `useState` and `useEffect` for the spinner animation).

## Acceptance Criteria

- [ ] `src/ui/GithubAuthWizard.tsx` renders a multi-step auth wizard
- [ ] The wizard checks `gh` installation and auth status via `checkGhAuth` from `src/tools/github.js`
- [ ] The wizard supports browser login and token login methods
- [ ] The wizard calls `onComplete(true)` on success and `onComplete(false)` on cancel
- [ ] `src/ui/GitStatus.tsx` exports `useGitStatus` hook and `GitStatusInfo` type
- [ ] The hook polls git status every 5 seconds via `getGitStatus` from `src/tools/git.js`
- [ ] Both files use ESM imports with `.js` extensions

## Notes

- These components will be integrated by Task 06 (GitStatus → StatusBar) and Task 07 (GithubAuthWizard → App.tsx)
- The GithubAuthWizard should handle the case where `gh` is not installed gracefully
- Do NOT import or modify any existing files — only create new ones
