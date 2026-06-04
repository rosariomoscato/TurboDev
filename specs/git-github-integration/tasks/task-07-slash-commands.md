# Task 07: Slash Commands & App Integration

## Status

complete

## Wave

3

## Description

Wire everything together in `App.tsx` — add slash commands for Git/GitHub operations, integrate the GithubAuthWizard component, and add handlers for `/commit`, `/push`, `/pull`, `/branch`, `/pr`, `/rollback`, `/git`, and `/gh` commands. This is the final integration task that connects the git tool, github tool, auth wizard, and config changes into the user-facing application.

## Dependencies

**Depends on:** task-03-ui-components.md, task-04-agent-registration.md, task-05-config-extension.md, task-06-statusbar-git.md

**Context from dependencies:** task-03 creates `src/ui/GithubAuthWizard.tsx` (React component with `onComplete` callback) and `src/ui/GitStatus.tsx` (useGitStatus hook). task-04 registers `git` and `github` in TOOL_REGISTRY so the AI agent can use them. task-05 adds `getGithubAuthState` and `saveGithubAuthState` to the config store. task-06 adds git status to the StatusBar.

## Files to Create

None.

## Files to Modify

- `src/ui/App.tsx` — Add slash commands, GithubAuthWizard integration, git command handlers

## Technical Details

### Current Slash Commands

The existing commands in `App.tsx` (around line 507-633):
- `/help`, `/init`, `/model`, `/agent`, `/setup`, `/clear`, `/compact`, `/new`, `/sessions`, `/exit`

### New Slash Commands to Add

Add these command handlers in the `if (input.startsWith('/'))` block:

| Command | Handler Logic |
|---------|--------------|
| `/git status` | Call `gitTool({ operation: 'status' })`, display result |
| `/git log [n]` | Call `gitTool({ operation: 'log', count: n })`, display formatted log |
| `/git diff` | Call `gitTool({ operation: 'diff' })`, display diff |
| `/commit [msg]` | If msg provided: `gitTool({ operation: 'add', files: ['.'] })` then `gitTool({ operation: 'commit', message: msg })`. If no msg: show "Usage: /commit <message>" |
| `/push` | Call `gitTool({ operation: 'push' })`, display result |
| `/pull` | Call `gitTool({ operation: 'pull' })`, display result |
| `/branch` | Call `gitTool({ operation: 'branch_list' })`, display branches with current highlighted |
| `/branch <name>` | Call `gitTool({ operation: 'checkout', branch: name })` |
| `/pr [title]` | If title: call `githubTool({ operation: 'pr_create', title, head: currentBranch })`. If no title: call `githubTool({ operation: 'pr_list' })` and display |
| `/pr list` | Call `githubTool({ operation: 'pr_list' })`, display PR list |
| `/rollback` | Call `gitTool({ operation: 'log', count: 10 })`, display recent commits with numbers. Then prompt user to select a commit to revert |
| `/gh auth` | Show GithubAuthWizard component |
| `/git` | Display help: "Usage: /git <status\|log\|diff\|...>" |

### Implementation Steps

#### Step 1: Add Imports

At the top of `App.tsx`, add:

```typescript
import { gitTool } from '../tools/git.js';
import { githubTool, checkGhAuth } from '../tools/github.js';
import GithubAuthWizard from './GithubAuthWizard.js';
import { getGithubAuthState, saveGithubAuthState } from '../config/store.js';
```

#### Step 2: Add State for GithubAuthWizard

In the component state declarations, add:

```typescript
const [showGithubAuth, setShowGithubAuth] = useState(false);
```

#### Step 3: Add Slash Command Handlers

In the `if (input.startsWith('/'))` block (around line 507), add the new commands BEFORE the `if (command.trim())` fallback for unknown commands. Each handler should:
1. Call the appropriate tool function
2. Format the result
3. Add assistant messages with the output
4. Return early to prevent further processing

Example handler for `/commit`:

```typescript
if (command === 'commit' || command.startsWith('commit ')) {
  const msg = command.slice(7).trim();
  if (!msg) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Usage: /commit <message>'
    }]);
    return;
  }
  setStatus('Committing...');
  const addResult = await gitTool({ operation: 'add', files: ['.'] });
  if (!addResult.success) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `git add failed: ${addResult.error}`
    }]);
    setStatus('');
    return;
  }
  const commitResult = await gitTool({ operation: 'commit', message: msg });
  if (commitResult.success) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Committed: ${JSON.stringify(commitResult.data)}`
    }]);
  } else {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Commit failed: ${commitResult.error}`
    }]);
  }
  setStatus('');
  return;
}
```

Example handler for `/push`:

```typescript
if (command === 'push') {
  setStatus('Pushing...');
  const result = await gitTool({ operation: 'push' });
  if (result.success) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Pushed successfully: ${JSON.stringify(result.data)}`
    }]);
  } else {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Push failed: ${result.error}`
    }]);
  }
  setStatus('');
  return;
}
```

Example handler for `/rollback`:

```typescript
if (command === 'rollback') {
  setStatus('Loading commits...');
  const logResult = await gitTool({ operation: 'log', count: 10 });
  if (!logResult.success) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Failed to get log: ${logResult.error}`
    }]);
    setStatus('');
    return;
  }
  const commits = logResult.data;
  const formatted = commits.map((c: any, i: number) =>
    `${i + 1}. ${c.hash.slice(0, 7)} ${c.message} (${c.date})`
  ).join('\n');
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: `Recent commits:\n${formatted}\n\nTo revert a commit, type: /git revert <hash>`
  }]);
  setStatus('');
  return;
}
```

Example handler for `/gh auth`:

```typescript
if (command === 'gh auth') {
  setShowGithubAuth(true);
  return;
}
```

#### Step 4: Handle `/git` Prefix Commands

For `/git status`, `/git log`, `/git diff` etc., parse the sub-command:

```typescript
if (command === 'git' || command.startsWith('git ')) {
  const sub = command.slice(4).trim();
  if (!sub || sub === 'help') {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Git commands: /git status, /git log [n], /git diff, /git add [files], /git stash, /git remote'
    }]);
    return;
  }

  setStatus(`Running git ${sub}...`);
  let result;
  if (sub === 'status') result = await gitTool({ operation: 'status' });
  else if (sub.startsWith('log')) {
    const count = parseInt(sub.slice(4).trim()) || 10;
    result = await gitTool({ operation: 'log', count });
  }
  else if (sub === 'diff') result = await gitTool({ operation: 'diff' });
  else if (sub.startsWith('add')) {
    const files = sub.slice(4).trim();
    result = await gitTool({ operation: 'add', files: files ? files.split(' ') : ['.'] });
  }
  else if (sub === 'stash') result = await gitTool({ operation: 'stash_push' });
  else if (sub === 'remote') result = await gitTool({ operation: 'remote' });
  else {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Unknown git sub-command: ${sub}. Type /git for help.`
    }]);
    setStatus('');
    return;
  }

  if (result.success) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: formatGitOutput(sub, result.data)
    }]);
  } else {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Error: ${result.error}`
    }]);
  }
  setStatus('');
  return;
}
```

Add a `formatGitOutput` helper function that formats the data for display:

```typescript
function formatGitOutput(operation: string, data: any): string {
  if (operation === 'status') {
    const lines: string[] = [`Branch: ${data.branch}`];
    if (data.staged.length > 0) lines.push(`Staged: ${data.staged.join(', ')}`);
    if (data.modified.length > 0) lines.push(`Modified: ${data.modified.join(', ')}`);
    if (data.untracked.length > 0) lines.push(`Untracked: ${data.untracked.join(', ')}`);
    if (data.ahead > 0) lines.push(`Ahead: ${data.ahead} commits`);
    if (data.behind > 0) lines.push(`Behind: ${data.behind} commits`);
    if (data.staged.length === 0 && data.modified.length === 0 && data.untracked.length === 0) {
      lines.push('Working tree clean');
    }
    return lines.join('\n');
  }
  if (operation.startsWith('log')) {
    return data.map((c: any) => `${c.hash.slice(0, 7)} ${c.message} (${c.date}) - ${c.author_name}`).join('\n');
  }
  return JSON.stringify(data, null, 2);
}
```

#### Step 5: Handle `/pr` Commands

```typescript
if (command === 'pr' || command === 'pr list') {
  setStatus('Fetching PRs...');
  const result = await githubTool({ operation: 'pr_list' });
  if (result.success) {
    const prs = result.data.map((pr: any) =>
      `#${pr.number} ${pr.title} (${pr.headRefName}) by ${pr.author?.login || 'unknown'}`
    ).join('\n');
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: prs || 'No open PRs found.'
    }]);
  } else {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Error: ${result.error}`
    }]);
  }
  setStatus('');
  return;
}

if (command.startsWith('pr ')) {
  const title = command.slice(3).trim();
  if (!title || title === 'list') return; // handled above
  setStatus('Creating PR...');
  const statusResult = await gitTool({ operation: 'status' });
  const branch = statusResult.success ? statusResult.data.branch : undefined;
  const result = await githubTool({ operation: 'pr_create', title, head: branch });
  if (result.success) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `PR created: ${JSON.stringify(result.data)}`
    }]);
    // Save auth state since gh is working
    saveGithubAuthState({ authenticated: true, lastChecked: new Date().toISOString() });
  } else {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Error: ${result.error}`
    }]);
  }
  setStatus('');
  return;
}
```

#### Step 6: Handle `/branch` Commands

```typescript
if (command === 'branch') {
  setStatus('Listing branches...');
  const result = await gitTool({ operation: 'branch_list' });
  if (result.success) {
    const branches = result.data.map((b: any) =>
      b.current ? `* ${b.name}` : `  ${b.name}`
    ).join('\n');
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: branches
    }]);
  } else {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Error: ${result.error}`
    }]);
  }
  setStatus('');
  return;
}

if (command.startsWith('branch ')) {
  const name = command.slice(7).trim();
  setStatus(`Switching to ${name}...`);
  const result = await gitTool({ operation: 'checkout', branch: name });
  if (result.success) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Switched to branch ${name}`
    }]);
  } else {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Error: ${result.error}`
    }]);
  }
  setStatus('');
  return;
}
```

#### Step 7: Update `/help` Command

Update the help text (around line 513) to include the new commands:

```typescript
if (command === 'help') {
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: 'Commands: /help, /init, /model, /agent, /setup, /clear, /compact, /new, /sessions, /git [status|log|diff|stash|remote], /commit <msg>, /push, /pull, /branch [name], /pr [title|list], /rollback, /gh auth, /exit\nTab: switch agent'
  }]);
  return;
}
```

#### Step 8: Render GithubAuthWizard

In the JSX return, add the GithubAuthWizard rendering (similar to how `showInitWizard` renders `InitWizard`):

```tsx
{showGithubAuth && (
  <GithubAuthWizard
    onComplete={(authenticated) => {
      saveGithubAuthState({
        authenticated,
        lastChecked: new Date().toISOString(),
      });
      setShowGithubAuth(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: authenticated ? 'GitHub authentication successful!' : 'GitHub authentication skipped.'
      }]);
    }}
  />
)}
```

Place this BEFORE the main `return` statement's JSX, similar to how `showInitWizard` is handled:

```tsx
if (showGithubAuth) {
  return (
    <GithubAuthWizard
      onComplete={(authenticated) => {
        saveGithubAuthState({
          authenticated,
          lastChecked: new Date().toISOString(),
        });
        setShowGithubAuth(false);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: authenticated ? 'GitHub authentication successful!' : 'GitHub authentication skipped.'
        }]);
      }}
    />
  );
}
```

## Acceptance Criteria

- [ ] `/git status` shows current branch, staged, modified, untracked files
- [ ] `/git log [n]` shows recent commits with hash, message, date, author
- [ ] `/git diff` shows current diff
- [ ] `/commit <msg>` stages all changes and commits with the given message
- [ ] `/push` pushes current branch to remote
- [ ] `/pull` pulls from remote
- [ ] `/branch` lists branches with current highlighted
- [ ] `/branch <name>` switches to the specified branch
- [ ] `/pr list` shows open PRs
- [ ] `/pr <title>` creates a PR for the current branch
- [ ] `/rollback` shows recent commits for the user to revert
- [ ] `/gh auth` launches the GithubAuthWizard
- [ ] `/help` includes the new commands
- [ ] GithubAuthWizard renders and calls onComplete correctly
- [ ] GitHub auth state is persisted to config
- [ ] TypeScript compiles without errors

## Notes

- All slash command handlers should use `await` and set/clear `status` to show feedback during async operations
- Error messages from git/github tools should be displayed as assistant messages
- The `formatGitOutput` helper should format data in a human-readable way (not raw JSON)
- For `/commit` without a message, show usage help rather than prompting — the AI agent handles the interactive case
