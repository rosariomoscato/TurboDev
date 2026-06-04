# TurboDev

**Terminal-based AI coding agent** — your coding partner in the terminal.

<p align="center">
  <img src="assets/TurboDev.png" alt="TurboDev Screenshot" width="700" />
</p>

## What is it

TurboDev is an AI coding agent that runs entirely in the terminal. It lets you chat with LLM models (via OpenRouter), execute tools, manage files and code — all without leaving the CLI.

**Documentation**: [https://rosmoscato.xyz/turbodev/](https://rosmoscato.xyz/turbodev/)

## Features

- **AI Chat in the terminal** — converse with LLM models in real time with streaming
- **Model selection** — choose from dozens of popular models (DeepSeek, GPT-4, Claude, Gemini, Llama, GLM...)
- **Multi-agent system** — switch between specialized agents (editor, plan) with a single keypress, or create custom agents via Markdown
- **Permission system** — fine-grained control over what agents can do (allow, ask, deny) with bash glob patterns
- **10 built-in tools** — the AI can read, search, and edit files, run shell commands, ask questions, invoke subagents, and perform Git/GitHub operations
- **Git integration** — 26 Git operations via simple-git, accessible through slash commands and AI tools
- **GitHub integration** — 15 GitHub operations via `gh` CLI, including PR management and authentication wizard
- **Command palette** — type `/` to browse all commands alphabetically with arrow key navigation
- **Session persistence** — conversations are saved automatically and can be resumed across restarts
- **Context window management** — real-time token tracking (`0.56K/128K`), auto-compaction at 85%, manual `/compact`
- **Real-time cost tracking** — see how much you're spending per session based on OpenRouter pricing
- **Request interruption** — press Escape to cancel a running AI request at any time
- **AGENTS.md support** — project context and instructions loaded automatically from the open standard
- **/init wizard** — generate an AGENTS.md file interactively with auto-detection of project type
- **Markdown rendering** — formatted responses with headings, lists, code blocks, and bold text in the terminal
- **Guided setup** — interactive configuration of API key and model on first launch
- **Git status in status bar** — current branch, dirty count, and ahead/behind indicators

## Installation

```bash
# Install globally via npm
npm install -g @rosariomoscato/turbodev

# Or run directly without installing
npx @rosariomoscato/turbodev
```

### From Source

```bash
git clone https://github.com/rosariomoscato/TurboDev.git
cd TurboDev
npm install
npm run build
npm link
```

## Usage

```bash
# Launch TurboDev in the current directory
turbodev

# Launch in a specific directory
turbodev --cwd /path/to/project

# Guided setup
turbodev --setup
```

### Chat commands

Type `/` to open the command palette, or type commands directly:

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/init` | Generate AGENTS.md with interactive wizard |
| `/model` | Select AI model |
| `/agent` | Switch agent |
| `/setup` | Re-run setup wizard |
| `/clear` | Clear chat history |
| `/compact` | Compact conversation to free context window |
| `/new` | Start a new session |
| `/sessions` | List and switch between sessions |
| `/exit` | Exit TurboDev |

### Git commands

| Command | Description |
|---------|-------------|
| `/git status` | Show working tree status |
| `/git log` | Show commit log |
| `/git diff` | Show unstaged changes |
| `/git add` | Stage files (default: all) |
| `/git stash` | Stash changes |
| `/git remote` | List remotes |
| `/commit <msg>` | Stage all and commit |
| `/push` | Push to remote |
| `/pull` | Pull from remote |
| `/branch` | List branches |
| `/branch <name>` | Switch branch |
| `/rollback` | Show recent commits to revert |

### GitHub commands

| Command | Description |
|---------|-------------|
| `/pr list` | List pull requests |
| `/pr <title>` | Create a pull request |
| `/gh auth` | GitHub authentication wizard |

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `/` | Open command palette |
| `Tab` | Switch between agents |
| `Escape` | Cancel action / Interrupt AI request |
| `@agentname` | Invoke an agent directly |

### Available tools

| Tool | Description |
|------|-------------|
| `read_file` | Read the contents of a file |
| `list_files` | List files in a directory |
| `edit_file` | Create or edit a file |
| `mkdir` | Create directories |
| `grep` | Search file contents with regex (uses ripgrep if available) |
| `bash` | Execute shell commands with timeout |
| `question` | Ask the user for clarification |
| `task` | Invoke a subagent for specialized tasks |
| `git` | Execute Git operations (status, log, diff, add, commit, push, pull, branch, stash, remote, and more) |
| `github` | Execute GitHub operations (create PR, list PRs, create issue, list issues, create release, and more) |

## Configuration

TurboDev requires an **OpenRouter API key** to work. The setup wizard will guide you through configuration on first launch, or you can launch it with `/setup`.

Configuration is saved in `~/.config/turbodev/config.json`.

### GitHub Authentication

To use GitHub features, authenticate with:

```
/gh auth
```

This opens an interactive wizard that supports browser-based login or personal access token. Requires the [GitHub CLI (`gh`)](https://cli.github.com/) to be installed.

## AGENTS.md

TurboDev supports the open [AGENTS.md](https://agents.md/) standard — a markdown file that provides context and instructions to the AI agent. If present in the working directory, it is automatically loaded at startup and passed as project context.

The `/init` command generates the file through an interactive wizard that:
- Auto-detects the project type (Node.js, Python, Rust, Go)
- Lets you select which sections to include (Setup Commands, Code Style, Testing, Design, etc.)
- If the file already exists, asks whether to overwrite or append new sections

## Roadmap

Starting June 2026, we ship a new feature every week:

| Week | Feature | Description |
|------|---------|-------------|
| Jun 11 | **Skills** | Installable skill packs that extend agent capabilities |
| Jun 18 | **MCP** | Model Context Protocol support for external tool integration |
| Jun 25 | **Persistent Memory** | Cross-session memory so the AI remembers your project context |
| Jul 2 | **Economy Mode** | Budget-aware mode that optimizes token usage and model selection |
| Jul 9 | **Ollama Connection** | Run local models via Ollama alongside OpenRouter |

## Tech Stack

- **TypeScript** — primary language
- **React + Ink** — declarative terminal UI
- **OpenRouter** — multi-model LLM provider
- **simple-git** — Git operations
- **gh CLI** — GitHub integration
- **tsup** — build system

## Author

**Rosario Moscato**

## License

This work is licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/).

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — you must give appropriate credit to the author
- **NonCommercial** — you may not use the material for commercial purposes
- **ShareAlike** — if you remix or transform, you must distribute under the same license

![CC BY-NC-SA 4.0](https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-nc-sa.svg)
