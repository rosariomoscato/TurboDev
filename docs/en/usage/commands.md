# Commands

TurboDev slash commands.

All commands start with `/`. Type `/` in the input bar to open the command palette — navigate with `↑`/`↓` and select with `Enter`.

## General Commands

| Command | Description |
|---------|-------------|
| `/agent` | Open agent selector |
| `/clear` | Clear chat history |
| `/compact` | Compact the conversation to free context window |
| `/exit` | Exit TurboDev |
| `/help` | Show available commands |
| `/init` | Create or update `AGENTS.md` |
| `/model` | Open model selector |
| `/new` | Start a new session |
| `/sessions` | List and switch between sessions |
| `/setup` | Re-run setup wizard |
| `/skills` | List discovered agent skills |
| `/mcp` | List MCP servers and tools |
| `/mcp reload` | Re-read `.turbodev/mcp.json` and reconnect |

## Git Commands

| Command | Description |
|---------|-------------|
| `/branch` | List local branches |
| `/branch <name>` | Switch to branch |
| `/commit <msg>` | Stage all files and commit with message |
| `/git add` | Stage files (default: all) |
| `/git diff` | Show unstaged changes |
| `/git log` | Show commit log (default 10 entries) |
| `/git remote` | List remotes |
| `/git stash` | Stash changes |
| `/git status` | Show working tree status |
| `/pull` | Pull from remote |
| `/push` | Push current branch to remote |
| `/rollback` | Show recent commits for rollback |

## GitHub Commands

| Command | Description |
|---------|-------------|
| `/gh auth` | Launch GitHub authentication wizard |
| `/pr <title>` | Create a pull request with title |
| `/pr list` | List open pull requests |

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

### /skills

Lists all discovered agent skills with their status, source, and description.

```
/skills
```

Shows each skill's name, whether it's enabled or disabled, where it was found (builtin, global, or project), and its description. Skills are loaded from three sources in priority order: project (`.agents/skills/`) > global (`~/.config/turbodev/skills/`) > builtin.

### /mcp

Lists all configured MCP (Model Context Protocol) servers with their connection status, tool count, and any errors.

```
/mcp
```

Output format:

```
MCP Servers (1 connected, 5 tools total):
  ✓ filesystem            5 tools    connected
  ✗ db                    error       ECONNREFUSED

Use /mcp reload to re-read .turbodev/mcp.json and reconnect.
```

Status icons: `✓` connected, `✗` error, `○` other. The status bar shows `MCP:N` (magenta) when N servers are connected.

### /mcp reload

Re-reads `.turbodev/mcp.json`, disconnects removed/changed servers, and connects new ones. Unchanged servers stay connected (no churn).

```
/mcp reload
```

Use this after editing the config file. See [MCP configuration](/en/configuration/mcp) for the full reference.

### /exit

Exits TurboDev.

```
/exit
```
