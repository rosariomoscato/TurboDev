# Commands

TurboDev slash commands.

All commands start with `/`. Type `/` in the input bar to open the command palette — navigate with `↑`/`↓` and select with `Enter`.

## General Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/init` | Create or update `AGENTS.md` |
| `/model` | Open model selector |
| `/agent` | Open agent selector |
| `/setup` | Re-run setup wizard |
| `/clear` | Clear chat history |
| `/compact` | Compact the conversation to free context window |
| `/new` | Start a new session |
| `/sessions` | List and switch between sessions |
| `/exit` | Exit TurboDev |

## Git Commands

| Command | Description |
|---------|-------------|
| `/git status` | Show working tree status |
| `/git log` | Show commit log (default 10 entries) |
| `/git diff` | Show unstaged changes |
| `/git add` | Stage files (default: all) |
| `/git stash` | Stash changes |
| `/git remote` | List remotes |
| `/commit <msg>` | Stage all files and commit with message |
| `/push` | Push current branch to remote |
| `/pull` | Pull from remote |
| `/branch` | List local branches |
| `/branch <name>` | Switch to branch |
| `/rollback` | Show recent commits for rollback |

## GitHub Commands

| Command | Description |
|---------|-------------|
| `/pr list` | List open pull requests |
| `/pr <title>` | Create a pull request with title |
| `/gh auth` | Launch GitHub authentication wizard |

## Command Details

### /init

Creates or updates `AGENTS.md` in your project.

```
/init
```

If `AGENTS.md` already exists, you can choose to:

1. **Overwrite** — Start fresh
2. **Append** — Add new sections to existing file

The wizard detects your project type and generates relevant sections.

### /model

Opens an interactive model selector.

```
/model
```

Navigate with `↑`/`↓` or `j`/`k`, select with a number (1–9), cancel with `Esc` or `q`. If there are more than 9 models, pages are available.

### /agent

Opens the agent selector.

```
/agent
```

Type the agent's number to select it, press `Esc` to cancel. Shows all available primary agents with their descriptions.

### /setup

Re-runs the initial setup wizard to change your API key or model.

```
/setup
```

### /clear

Clears the entire chat history and conversation context.

```
/clear
```

### /compact

Compacts the conversation by summarizing it via AI. This frees up space in the context window, allowing longer sessions without losing the conversation's key points.

```
/compact
```

Auto-compaction triggers at **85%** of the context window. You'll be notified at **75%**. Use `/compact` manually at any time.

### /new

Starts a new empty session. The current session is saved automatically and can be resumed later with `/sessions`.

```
/new
```

### /sessions

Lists all saved sessions sorted by most recent. Select a session by number to restore it.

```
/sessions
```

Shows each session with its title, relative time, and message count. Press `Esc` to cancel.

### /commit

Stages all changes and commits with the provided message.

```
/commit fix: resolve login issue
```

Equivalent to `git add -A && git commit -m "fix: resolve login issue"`.

### /gh auth

Launches the GitHub authentication wizard. Supports browser-based login or personal access token. Requires the [GitHub CLI (`gh`)](https://cli.github.com/) to be installed.

```
/gh auth
```

### /exit

Exits TurboDev.

```
/exit
```
