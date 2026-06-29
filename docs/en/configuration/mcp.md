# MCP (Model Context Protocol)

TurboDev supports connecting external tool servers via the [Model Context Protocol](https://modelcontextprotocol.io) (MCP) — an open standard adopted by Claude Code, VS Code Copilot, Cursor, ChatGPT, and others. A single MCP server works across all of them, including TurboDev.

**V1 scope**: stdio transport only, tools primitive only, project-level config only.

## Quick Start

Create `.turbodev/mcp.json` in your project root (Claude Desktop-compatible format):

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
    }
  }
}
```

Launch TurboDev. The server is spawned as a child process via stdio, the MCP `initialize` handshake is performed, and each tool the server exposes is registered with a prefixed name (`mcp__<server>__<tool>`) so the LLM can invoke it like a native tool.

Type `/mcp` to verify the connection:

```
MCP Servers (1 connected, 5 tools total):
  ✓ filesystem            5 tools    connected

Use /mcp reload to re-read .turbodev/mcp.json and reconnect.
```

## Configuration Reference

The config file lives at `<project>/.turbodev/mcp.json` and follows the Claude Desktop `mcpServers` schema byte-for-byte — you can copy configs across tools.

| Field | Type | Required | Description |
|---|---|---|---|
| `command` | `string` | yes | Executable to spawn (resolved via `PATH`, never through a shell). |
| `args` | `string[]` | no | Arguments passed to the command. |
| `env` | `Record<string, string>` | no | Environment variables for the child process. Supports `$VAR`, `${VAR}`, and leading `~` expansion. |

Example with all fields:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "$GITHUB_TOKEN",
        "LOG_DIR": "~/logs/mcp"
      }
    }
  }
}
```

Unknown fields on a server entry are silently dropped (forward-compatible). Invalid entries are skipped with a logged warning; valid entries in the same file still load.

## Commands

| Command | Description |
|---|---|
| `/mcp` | List all servers with status (`connected`/`error`/`disabled`), tool counts, and error messages. |
| `/mcp reload` | Re-read `.turbodev/mcp.json`, disconnect removed/changed servers, connect new ones. Unchanged servers are left alone (no churn). |

The status bar shows `MCP:N` (magenta) when N servers are connected.

## Permissions

MCP tools default to **`ask`** — the user must approve the first invocation from each server. Override per-server in an agent Markdown file:

```yaml
---
name: my-agent
permission:
  mcp: { filesystem: allow, github: ask }
---
```

Or globally for all MCP servers:

```yaml
permission:
  mcp: allow   # allow every MCP tool without prompting
```

Resolution order: per-server map entry → global string → default `ask`. Disabling a specific tool via `tools: { "mcp__filesystem__read_file": false }` still works and takes precedence (returns `deny`).

## Security

- **No shell**: `command`/`args` are passed to `child_process.spawn` directly, never through a shell — no shell injection is possible.
- **Env expansion is local**: `$VAR` and `~` are expanded by TurboDev before spawning; the server receives the resolved values.
- **Secrets are never logged**: if a config entry is invalid, only the server *name* is logged, never the command, args, or env values.
- **Default `ask`**: external tools cannot execute without explicit user opt-in.

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `✗ server    error  ENOENT` | The `command` was not found in `PATH`. Verify the executable is installed (e.g. `npx -y @modelcontextprotocol/server-filesystem --help` works outside TurboDev). |
| `✗ server    error  MCP connect timeout (10s)` | Server spawned but never answered the `initialize` handshake. Check the server's stderr output in the console. |
| Server disappears from `/mcp` after reload | The entry was removed from `.turbodev/mcp.json` or failed validation — check the logged warning. |
| Permission denied on every call | The agent's `permission.mcp` is set to `deny`, or the server name in `permission.mcp` doesn't match the key in `mcpServers`. |
| Tool call returns `Cancelled by user` | You pressed Escape while the call was in flight. Re-issue the request to retry. |

## Limitations (V1)

- **stdio transport only** — no remote HTTP servers (Phase 2)
- **Tools primitive only** — no resources, prompts, sampling, or elicitation (Phase 2/3)
- **Project-level config only** — no global `~/.config/turbodev/mcp.json` (Phase 2)
- **No `notifications/tools/list_changed`** — use `/mcp reload` to pick up server-side tool changes
- **No OAuth** — env-var-based auth only

## Discovering Servers

Browse the official reference servers at [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) and the community catalog at [modelcontextprotocol.io](https://modelcontextprotocol.io). Any stdio-based server that follows the MCP spec will work with TurboDev.
