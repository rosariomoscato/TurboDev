# Requirements: Agent System

## Summary

TurboDev currently operates as a single monolithic agent with no concept of different agent types, permissions, or roles. Every user message goes through the same agent loop with the same system prompt, the same model, all tools enabled, and no permission checks.

This feature introduces a full **agent system** inspired by OpenCode's agent architecture. Agents are specialized AI assistants that can be configured with custom prompts, models, tool access, and permissions. The system supports two types of agents: **primary agents** (interact directly with the user) and **subagents** (invoked by primary agents for specialized tasks).

Agents are defined exclusively via **Markdown files** with YAML frontmatter, following the same conventions as OpenCode. The system ships with two built-in primary agents: **editor** (full-access, the default) and **plan** (read-only analysis with approval gates). Users can create custom agents by dropping `.md` files into `.turbodev/agents/` (project-level) or `~/.config/turbodev/agents/` (global).

The expected outcome is a multi-agent architecture where users can switch between specialized agents via Tab, invoke subagents via `@mention` in chat, and where each agent operates within its defined permission boundaries — asking for approval before executing sensitive operations when configured to do so.

## Goals

- Define a typed `AgentConfig` system that captures all agent configuration options (mode, model, prompt, temperature, tools, permissions, max steps, color, etc.)
- Parse agent definitions from Markdown files with YAML frontmatter using the `gray-matter` library
- Ship two built-in primary agents: **editor** (full access) and **plan** (analysis with approval gates)
- Build an agent registry that discovers and merges built-in, global, and project-level agents
- Implement a permission system with `allow`/`ask`/`deny` actions for `edit` and `bash` tools, including glob pattern matching for bash commands
- Modify the agent loop to accept an `AgentConfig` and enforce tool filtering, permission checks, max steps, model/temperature overrides, and custom system prompts
- Add a `task` tool that lets primary agents invoke subagents with isolated context
- Support `@mention` in chat to invoke agents directly (e.g., `@plan analyze this code`)
- Update the UI to show the current agent in the status bar, switch agents with Tab, add `/agent` command, and handle permission approval prompts inline

## Non-Goals

- JSON-based agent configuration (only Markdown is supported)
- Hidden system agents like compaction, title, or summary generators
- Session management or child session navigation
- Agent creation wizard CLI command (`opencode agent create` equivalent)
- Custom tool plugins via agent configuration
- LSP server or MCP server integration

## Acceptance Criteria

- [ ] Two built-in primary agents (editor, plan) are available and functional
- [ ] Custom agents can be defined via `.md` files in `.turbodev/agents/` or `~/.config/turbodev/agents/`
- [ ] User can switch between primary agents with Tab key
- [ ] StatusBar displays the current agent name with its configured color
- [ ] Plan agent asks for approval before executing edit_file or bash operations
- [ ] Editor agent executes all operations without asking
- [ ] Custom agent files with the same name as a built-in agent merge/override built-in settings
- [ ] `@mention` in chat invokes the specified agent directly
- [ ] `task` tool allows primary agents to invoke subagents programmatically
- [ ] Agent max steps limit stops the loop and returns a summary when reached
- [ ] Agent model override and temperature override work correctly
- [ ] `/agent` command shows list of available primary agents for selection
- [ ] `gray-matter` is used for Markdown frontmatter parsing
- [ ] Build succeeds with `npm run build`

## Assumptions

- The existing tool system (`TOOL_REGISTRY` in `src/agent/tools.ts`) remains the source of truth for tool implementations
- The existing agent loop structure (streaming, tool call parsing, tool result formatting) is preserved and extended, not replaced
- The OpenRouter API client (`src/llm/client.ts`) continues to be the only LLM provider
- All agents share the same conversation history format (`ChatMessage[]`)
- Subagents execute synchronously within the parent agent's loop (no parallel subagent execution)
- The Ink TUI framework supports the proposed UI changes without architectural changes

## Technical Constraints

- **Language**: TypeScript with ESM modules (`"type": "module"` in package.json)
- **Build**: tsup bundler — all imports must use `.js` extensions for ESM resolution
- **UI Framework**: React + Ink (terminal UI) — no browser DOM, no CSS
- **LLM Provider**: OpenRouter via the `openai` npm package
- **Frontmatter Parser**: `gray-matter` (must be added as a dependency)
- **Agent Config**: Markdown only (no JSON config for agents)
- **Directory Conventions**:
  - Project agents: `<cwd>/.turbodev/agents/*.md`
  - Global agents: `~/.config/turbodev/agents/*.md`
- **No new runtime dependencies** beyond `gray-matter`
