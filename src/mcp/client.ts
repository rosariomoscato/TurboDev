// ---------------------------------------------------------------------------
// MCP Module — Client Wrapper
// ---------------------------------------------------------------------------
// Wraps the official MCP SDK client to provide a simplified, error-resilient
// API for connecting to servers, listing tools, and calling tools.  Handles
// stdio transport lifecycle, handshake timeouts, and graceful degradation.
// ---------------------------------------------------------------------------

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  CallToolResultSchema,
  ListToolsResultSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import type {
  MCPServerConfig,
  MCPTool,
  MCPToolCallResult,
} from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default timeout for the initialize handshake (in milliseconds). */
const HANDSHAKE_TIMEOUT_MS = 10_000;

/** Client name sent to the MCP server during initialization. */
const CLIENT_NAME = 'turbodev';

/** Client version sent to the MCP server during initialization. */
const CLIENT_VERSION = '0.0.7';

// ---------------------------------------------------------------------------
// MCPClient Class
// ---------------------------------------------------------------------------

/**
 * Wrapper around the official MCP SDK client for a single server connection.
 *
 * Responsibilities:
 *   - Spawn the child process via `StdioClientTransport`
 *   - Perform the MCP `initialize` handshake with timeout
 *   - Expose `listTools` and `callTool` methods
 *   - Handle connection failures, server crashes, and errors gracefully
 *   - Close the transport and child process on shutdown
 *
 * All methods return structured results with `success` flags — the caller
 * (registry) should interpret failures and update the server state accordingly.
 */
export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private readonly serverName: string;
  private readonly config: MCPServerConfig;
  private isConnected = false;

  /**
   * Create a new MCP client wrapper.
   *
   * @param serverName - Server name (key from `mcpServers` config).
   * @param config     - Server configuration (command, args, env).
   */
  constructor(serverName: string, config: MCPServerConfig) {
    this.serverName = serverName;
    this.config = config;
  }

  /**
   * Connect to the MCP server via stdio and perform the initialize handshake.
   *
   * The handshake is timed out after `HANDSHAKE_TIMEOUT_MS` to prevent hanging
   * on misbehaving servers. On spawn failure or timeout the child process is
   * cleaned up and the error is **thrown** — the registry catches it and
   * records the server as `'error'`.
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      // Create the stdio transport, which spawns the child process.
      // SECURITY: StdioClientTransport uses child_process.spawn directly,
      // never `shell: true`, so user-supplied command/args cannot inject.
      this.transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args,
        env: { ...process.env, ...this.config.env },
        stderr: 'inherit', // Surface server stderr in the host console
      });

      // Create the MCP client
      this.client = new Client(
        {
          name: CLIENT_NAME,
          version: CLIENT_VERSION,
        },
        {
          capabilities: {}, // No special capabilities in V1
        }
      );

      // Surface async server-side errors to the host console.
      this.client.onerror = (error) => {
        console.error(`[MCP:${this.serverName}] Client error:`, error);
      };

      // Race the connect against a timeout so spawn failures don't hang forever.
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('MCP connect timeout (10s)')), HANDSHAKE_TIMEOUT_MS);
      });

      await Promise.race([
        this.client.connect(this.transport),
        timeout,
      ]);

      this.isConnected = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // Clean up the transport if it was created
      if (this.transport) {
        try {
          await this.transport.close();
        } catch {
          // Ignore close errors during cleanup
        }
        this.transport = null;
      }

      this.client = null;
      this.isConnected = false;

      // Re-throw so the registry can mark the server as 'error'.
      throw new Error(`Failed to connect to MCP server "${this.serverName}": ${message}`);
    }
  }

  /**
   * List the tools available on the connected MCP server.
   *
   * Returns an array of `MCPTool` objects (empty if not connected or on
   * error). Each tool is enriched with the prefixed `fullName`
   * (`mcp__<server>__<tool>`).
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/list',
          params: {},
        },
        ListToolsResultSchema
      );

      return (response.tools ?? []).map((tool) => ({
        serverName: this.serverName,
        toolName: tool.name,
        fullName: `mcp__${this.serverName}__${tool.name}`,
        description: tool.description ?? '',
        inputSchema: (tool.inputSchema as Record<string, any>) ?? { type: 'object', properties: {} },
      }));
    } catch {
      // Silent failure — empty tool list. The server is still considered
      // 'connected' because the handshake succeeded.
      return [];
    }
  }

  /**
   * Call a tool on the connected MCP server.
   *
   * The `signal` parameter is used to support ESC cancellation — if the signal
   * is aborted, the request is cancelled and an error is returned.
   *
   * Returns a `MCPToolCallResult` with the tool's output on success, or an
   * error message on failure. Server-side errors (isError in MCP spec) are
   * marked with `isError: true` in the result.
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<MCPToolCallResult> {
    if (!this.client || !this.isConnected) {
      return {
        success: false,
        content: [],
        error: `Cannot call tool: not connected to "${this.serverName}"`,
      };
    }

    try {
      // Prepare request options with abort signal
      const requestOptions: {
        signal?: AbortSignal;
      } = {};

      if (signal) {
        requestOptions.signal = signal;
      }

      const response = await this.client.request(
        {
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args,
          },
        },
        CallToolResultSchema,
        requestOptions
      );

      // Check if the server reported an error (isError flag in MCP spec)
      const isError = response.content.some(
        (item) => 'isError' in item && item.isError === true
      );

      return {
        success: !isError,
        content: response.content,
        isError,
      };
    } catch (error) {
      // Handle abort signal
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          content: [],
          error: `Tool call cancelled: ${toolName}`,
        };
      }

      // Handle MCP errors (e.g., tool not found)
      if (error instanceof McpError) {
        const message =
          error.code === ErrorCode.InvalidParams
            ? `Invalid arguments for tool "${toolName}"`
            : error.message;

        return {
          success: false,
          content: [],
          error: `MCP error calling "${toolName}": ${message}`,
        };
      }

      // Handle other errors
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        content: [],
        error: `Error calling tool "${toolName}": ${message}`,
      };
    }
  }

  /**
   * Close the transport and child process.
   *
   * This method is called during graceful shutdown (SIGINT, exit) to prevent
   * zombie processes. Errors are silently ignored.
   */
  async close(): Promise<void> {
    if (!this.transport) {
      return;
    }

    try {
      await this.transport.close();
    } catch (error) {
      // Ignore close errors
    } finally {
      this.transport = null;
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if the client is currently connected.
   */
  connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get the server name (for logging and debugging).
   */
  getName(): string {
    return this.serverName;
  }
}