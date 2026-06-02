# Introduction

Get started with TurboDev.

**TurboDev** is a terminal-based AI coding agent. Chat with LLM models (via OpenRouter), execute tools, manage files and code — all without leaving the CLI.

## Features

- **Terminal AI Chat** — Real-time streaming conversations with LLM models
- **Multi-Agent System** — Switch between specialized agents (editor, plan) with a single keypress
- **Custom Agents** — Define your own agents via Markdown files
- **Permission System** — Fine-grained control over what agents can do
- **Tool Integration** — Read, edit, create files, run bash commands, search code
- **Context-Aware** — Automatic project analysis via `AGENTS.md`

## Prerequisites

- **Node.js** 18 or later
- An **OpenRouter** API key ([get one here](https://openrouter.ai))

## Quick Start

::: tip
Run `npx @rosariomoscato/turbodev` in any project directory to get started immediately.

```bash
# Install globally
npm install -g @rosariomoscato/turbodev

# Navigate to your project
cd /path/to/your/project

# Launch TurboDev
turbodev
```

On first launch, the setup wizard will ask for your OpenRouter API key and preferred model.

## Next Steps

- [Configure your setup](/en/configuration/)
- [Learn the commands](/en/usage/commands)
- [Explore the agent system](/en/agents/)
- [Customize permissions](/en/agents/permissions)
