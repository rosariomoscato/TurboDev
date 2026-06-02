# Requirements: TurboDev CLI

## Summary

TurboDev is a terminal-based coding agent CLI tool, installable globally via npm, that lets users interact with an AI coding assistant directly from the command line. Inspired by the "Emperor Has No Clothes" article philosophy, the core architecture is deliberately simple: an agent loop where the LLM decides which tools to call, the local code executes them, and results flow back to the LLM.

The tool uses OpenRouter as its AI inference provider, giving users access to hundreds of models. On first run, a setup wizard guides the user through entering their OpenRouter API key and selecting a preferred model. After setup, the user can chat with the AI agent which can read files, list directories, and edit/create files in the current working directory.

The TUI is built with ink (React for the terminal), providing a rich interactive experience with streaming AI responses, color-coded chat messages, and a clean input bar.

## Goals

- Build a globally installable npm CLI tool (`npm install -g turbodev` then run `turbodev`)
- Implement a minimal but powerful coding agent with 3 core tools: read_file, list_files, edit_file
- Use OpenRouter for AI inference with streaming responses
- Provide a polished terminal UI with ink + React
- Support first-run setup wizard for API key and model selection
- Persist configuration in `~/.turbodevrc`
- Keep the core architecture simple and faithful to the article's philosophy (~200 lines core logic)

## Non-Goals

- Multi-provider support (only OpenRouter for now)
- Bash/shell command execution tool
- Grep/code search tool
- Web search or URL fetching tool
- Git integration
- Multi-turn conversation persistence across sessions
- Project-level configuration (only global config)
- MCP (Model Context Protocol) support
- Plugin system
- Unit tests (not requested by user)

## Acceptance Criteria

- [ ] `npm install -g` works and registers the `turbodev` binary
- [ ] Running `turbodev` with no config launches the setup wizard
- [ ] Setup wizard accepts API key, fetches models from OpenRouter, lets user select one, saves to `~/.turbodevrc`
- [ ] On subsequent runs, the chat UI loads directly with the configured model
- [ ] User can type messages and receive streaming AI responses
- [ ] AI can call read_file, list_files, and edit_file tools autonomously
- [ ] Tool calls are displayed in the chat with visual indicators
- [ ] Multi-step tool chains work (e.g., read file then edit it)
- [ ] `/help`, `/model`, `/clear`, `/exit` commands work
- [ ] The tool works on Linux and macOS

## Assumptions

- The user has Node.js >= 18 installed
- The user has an OpenRouter account and can generate an API key
- OpenRouter's OpenAI-compatible API (`https://openrouter.ai/api/v1`) remains stable and available
- The `openai` npm package works with OpenRouter's endpoint without modification
- The working directory where `turbodev` is run is the project the user wants to work on

## Technical Constraints

- Language: TypeScript throughout
- Runtime: Node.js >= 18 (ESM modules)
- TUI Framework: ink v4 + React 18
- Build tool: tsup (ESM output)
- LLM Client: `openai` npm SDK pointed at OpenRouter
- Streaming: required for AI responses
- Config format: JSON stored at `~/.turbodevrc`
- Package must have a `bin` entry for global CLI installation
- No external database or server required
- Tool calls parsed from LLM text output using `tool: NAME({JSON})` convention (article approach, not native function calling)