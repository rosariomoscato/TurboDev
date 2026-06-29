// ---------------------------------------------------------------------------
// MCP Module — Core Types & Interfaces
// ---------------------------------------------------------------------------
// Follows the MCP specification: https://modelcontextprotocol.io
// Self-contained: no imports from other modules.
// ---------------------------------------------------------------------------

/**
 * Server entry from `.turbodev/mcp.json` (Claude Desktop-compatible schema).
 *
 * Example:
 * ```json
 * { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"] }
 * ```
 */
export interface MCPServerConfig {
  /** Executable to spawn (resolved via PATH, never through a shell). */
  command: string;
  /** Arguments passed to the command. */
  args?: string[];
  /** Environment variables for the child process. `$VAR` and `~` are expanded by the loader. */
  env?: Record<string, string>;
}

/**
 * Top-level shape of `.turbodev/mcp.json`.
 */
export interface MCPServersConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

/**
 * Runtime status of a server connection. Used by the UI (`/mcp`) and the registry.
 */
export type MCPServerStatus =
  | 'connecting'    // spawn in progress, handshake not yet confirmed
  | 'connected'     // initialize succeeded, tools available
  | 'error'         // spawn failed, handshake failed, or server crashed
  | 'disabled';     // ignored by config (e.g. malformed entry)

/**
 * Runtime state of one MCP server connection.
 */
export interface MCPServerState {
  /** Server name (key from `mcpServers` in the config). */
  name: string;
  /** Original config entry. */
  config: MCPServerConfig;
  /** Current lifecycle status. */
  status: MCPServerStatus;
  /** Tools discovered via `tools/list` (empty until connected). */
  tools: MCPTool[];
  /** Human-readable error message when `status === 'error'`. */
  error?: string;
}

/**
 * One tool exposed by an MCP server.
 *
 * Built by the registry from the MCP `tools/list` response. The `fullName`
 * (`mcp__<serverName>__<toolName>`) is the key used to register the tool
 * in `TOOL_REGISTRY` and to call it from the LLM.
 */
export interface MCPTool {
  /** Owning server name (key from `mcpServers`). */
  serverName: string;
  /** Tool name as returned by the server's `tools/list`. */
  toolName: string;
  /** Prefixed unique name: `mcp__<serverName>__<toolName>`. */
  fullName: string;
  /** Human-readable description from the server. */
  description: string;
  /** JSON Schema describing the tool's arguments (from the server's `tools/list`). */
  inputSchema: Record<string, any>;
}

/**
 * Flattened result of invoking an MCP tool. The MCP protocol returns a
 * `content[]` array of typed blocks; the bridge converts this into a plain
 * string before passing it to `formatToolResult`.
 */
export interface MCPToolCallResult {
  success: boolean;
  /** The MCP `content[]` array, with each block's text concatenated on success. */
  content: { type: string; text?: string }[];
  /** True when the server reports the call itself failed (isError in MCP spec). */
  isError?: boolean;
  /** Error message (network, crash, timeout, etc.). */
  error?: string;
}