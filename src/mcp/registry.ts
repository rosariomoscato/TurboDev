// ---------------------------------------------------------------------------
// MCP Module — Registry
// ---------------------------------------------------------------------------
// Orchestrates multiple MCPClient instances. Created by
// `createMCPRegistry(cwd)` which reads `.turbodev/mcp.json` via the loader.
// Tracks per-server runtime state, exposes aggregated tool lists, and
// dispatches tool calls to the right server's client.
//
// Pure TypeScript — no Ink/React dependency. Unit-testable without a TTY.
// ---------------------------------------------------------------------------

import { MCPClient } from './client.js';
import { loadMcpConfig } from './loader.js';
import type {
  MCPServerConfig,
  MCPServerState,
  MCPTool,
  MCPToolCallResult,
} from './types.js';

/**
 * Orchestrates multiple MCPClient instances.
 *
 * Typical lifecycle (driven by App.tsx):
 *   const reg = createMCPRegistry(process.cwd());
 *   await reg.connectAll();                                  // at app startup
 *   const tools = reg.getTools();                            // for the bridge
 *   const result = await reg.callTool(fullName, args, sig);  // from agent loop
 *   await reg.shutdownAll();                                 // on app exit
 *
 * Design: two parallel maps (`states` and `clients`) keep the data model
 * clean — a server may exist in `states` as `'error'` without a live client
 * in `clients`.
 */
export class MCPRegistry {
  /** Server name → MCPServerState (status, config, tools). */
  private states = new Map<string, MCPServerState>();
  /** Server name → MCPClient (set only when a client is spawned). */
  private clients = new Map<string, MCPClient>();

  /**
   * @param servers - Map of server name → config (typically from the loader).
   */
  constructor(servers: Record<string, MCPServerConfig>) {
    for (const [name, config] of Object.entries(servers)) {
      this.states.set(name, {
        name,
        config,
        status: 'disconnected',
        tools: [],
      });
    }
  }

  /**
   * Connect to every declared server in parallel.
   *
   * Each failure is recorded on the server's state as `status: 'error'` with
   * the error message — one bad server never aborts the others. Safe to
   * await with zero servers (resolves immediately).
   */
  async connectAll(): Promise<void> {
    const names = Array.from(this.states.keys());
    await Promise.all(names.map((name) => this.connectOne(name)));
  }

  /** Connect (or reconnect) a single server by name. No-op if unknown. */
  async connectOne(name: string): Promise<void> {
    const state = this.states.get(name);
    if (!state) return;

    state.status = 'connecting';
    state.error = undefined;

    const client = new MCPClient(name, state.config);
    this.clients.set(name, client);

    try {
      await client.connect();
      const tools = await client.listTools();
      state.tools = tools;
      state.status = 'connected';
    } catch (err) {
      state.status = 'error';
      state.error = err instanceof Error ? err.message : String(err);
      state.tools = [];
      // Client is unusable — close and drop it.
      await client.close().catch(() => {});
      this.clients.delete(name);
    }
  }

  /**
   * Re-read the config from disk and reconcile connections:
   *  - servers no longer in config → disconnect and remove from state
   *  - servers whose config changed → disconnect and reconnect with new config
   *  - new servers → add to state
   *  - unchanged connected servers → left untouched (no churn)
   *
   * After reconciliation, any server in `disconnected` state is connected.
   */
  async reload(cwd: string): Promise<void> {
    const fresh = loadMcpConfig(cwd);
    const freshNames = new Set(Object.keys(fresh));

    // Drop removed or changed servers.
    for (const [name, state] of this.states) {
      const removed = !freshNames.has(name);
      const next = fresh[name];
      const changed = !!next && !sameConfig(next, state.config);
      if (removed || changed) {
        await this.disconnectOne(name);
      }
      if (changed && next) {
        this.states.set(name, {
          name,
          config: next,
          status: 'disconnected',
          tools: [],
        });
      }
    }

    // Remove state for servers no longer in config.
    for (const name of Array.from(this.states.keys())) {
      if (!freshNames.has(name)) {
        this.states.delete(name);
      }
    }

    // Add brand-new servers.
    for (const [name, config] of Object.entries(fresh)) {
      if (!this.states.has(name)) {
        this.states.set(name, {
          name,
          config,
          status: 'disconnected',
          tools: [],
        });
      }
    }

    // Connect anything currently disconnected.
    await this.connectAll();
  }

  /** All tools across all connected servers. Returns [] when nothing is connected. */
  getTools(): MCPTool[] {
    const out: MCPTool[] = [];
    for (const state of this.states.values()) {
      if (state.status === 'connected') out.push(...state.tools);
    }
    return out;
  }

  /** All server states for UI rendering (`/mcp` command, status bar). */
  getServers(): MCPServerState[] {
    return Array.from(this.states.values());
  }

  /** Number of connected servers (for the status bar). */
  getConnectedCount(): number {
    let n = 0;
    for (const s of this.states.values()) {
      if (s.status === 'connected') n++;
    }
    return n;
  }

  /**
   * Invoke a tool by its full name (`mcp__<server>__<tool>`).
   *
   * Returns `{ success: false, error }` if the name is malformed or the
   * owning server is not connected. Never throws.
   */
  async callTool(
    fullName: string,
    args: Record<string, any>,
    signal?: AbortSignal,
  ): Promise<MCPToolCallResult> {
    const parsed = parseFullName(fullName);
    if (!parsed) {
      return {
        success: false,
        content: [],
        error: `Invalid MCP tool name: ${fullName}`,
      };
    }

    const client = this.clients.get(parsed.serverName);
    if (!client) {
      return {
        success: false,
        content: [],
        error: `MCP server not connected: ${parsed.serverName}`,
      };
    }
    return client.callTool(parsed.toolName, args, signal);
  }

  /** Disconnect one server (used by `reload`). No-op if unknown. */
  private async disconnectOne(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.close().catch(() => {});
      this.clients.delete(name);
    }
    const state = this.states.get(name);
    if (state) {
      state.status = 'disconnected';
      state.tools = [];
    }
  }

  /** Disconnect all servers and clear runtime state (used on app exit). */
  async shutdownAll(): Promise<void> {
    await Promise.all(
      Array.from(this.clients.values()).map((c) => c.close().catch(() => {})),
    );
    this.clients.clear();
    for (const state of this.states.values()) {
      state.status = 'disconnected';
      state.tools = [];
    }
  }
}

/**
 * Factory: read config from `<cwd>/.turbodev/mcp.json` and return a registry.
 *
 * Does NOT connect — the caller decides when to invoke `connectAll()`.
 */
export function createMCPRegistry(cwd: string): MCPRegistry {
  return new MCPRegistry(loadMcpConfig(cwd));
}

// --- helpers ---------------------------------------------------------------

/**
 * Split a full prefixed tool name into its server and tool parts.
 *
 * Returns `null` if the name is not in the `mcp__<server>__<tool>` format.
 * Server names cannot contain underscores (Claude Desktop convention); tool
 * names may contain anything.
 *
 * Example: `'mcp__filesystem__read_file'` → `{ serverName: 'filesystem', toolName: 'read_file' }`
 */
export function parseFullName(
  fullName: string,
): { serverName: string; toolName: string } | null {
  const match = /^mcp__([^_]+)__(.+)$/.exec(fullName);
  if (!match) return null;
  return { serverName: match[1], toolName: match[2] };
}

/** Structural equality for two server configs (deep via JSON). */
function sameConfig(a: MCPServerConfig, b: MCPServerConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
