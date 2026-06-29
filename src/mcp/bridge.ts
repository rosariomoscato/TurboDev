// ---------------------------------------------------------------------------
// MCP Module — Bridge to TOOL_REGISTRY
// ---------------------------------------------------------------------------
// Connects the MCP registry to the existing agent tool system. Each MCP tool
// is registered in `TOOL_REGISTRY` with a prefixed name (`mcp__<server>__<tool>`)
// so the LLM can invoke it exactly like a native tool. Results from the MCP
// `content[]` array are flattened into a string for `formatToolResult`.
//
// Module-level state tracks which tool names we registered so reload() can
// sync the diff (add new tools, remove gone tools, update changed tools).
// ---------------------------------------------------------------------------

import { TOOL_REGISTRY, unregisterTool } from '../agent/tools.js';
import type { MCPRegistry } from './registry.js';
import type { MCPTool, MCPToolCallResult } from './types.js';

/**
 * Names of tools currently registered by this bridge. Used to compute the
 * diff on `reload()` — anything here that's no longer live gets unregistered.
 */
const registeredNames = new Set<string>();

/**
 * Register all tools currently exposed by the registry into `TOOL_REGISTRY`.
 *
 * Idempotent: first call registers everything; subsequent calls (after
 * `registry.reload()`) sync the diff:
 *   - tools whose server is gone → unregistered
 *   - tools from still-connected servers → left in place (descriptions updated)
 *   - brand-new tools → registered
 *
 * @param registry - the live `MCPRegistry` (after `connectAll()` or `reload()`)
 */
export function registerMCPTools(registry: MCPRegistry): void {
  const liveTools = registry.getTools();
  const liveNames = new Set(liveTools.map((t) => t.fullName));

  // Remove tools whose server is gone or renamed (reload case).
  for (const name of Array.from(registeredNames)) {
    if (!liveNames.has(name)) {
      unregisterTool(name);
      registeredNames.delete(name);
    }
  }

  // Add or refresh tools. Reassigning the entry is cheap and keeps the
  // description in sync if the server shipped an updated schema.
  for (const tool of liveTools) {
    TOOL_REGISTRY[tool.fullName] = {
      name: tool.fullName,
      description: formatToolDescription(tool),
      fn: async (args: Record<string, any>, ctx?: { signal?: AbortSignal }) => {
        const result: MCPToolCallResult = await registry.callTool(
          tool.fullName,
          args,
          ctx?.signal,
        );
        return flattenResult(result);
      },
    };
    registeredNames.add(tool.fullName);
  }
}

/**
 * Remove every MCP tool from the registry. Called on app shutdown so the
 * registry doesn't carry stale entries into the next session (and to make
 * tests deterministic).
 */
export function unregisterAllMCPTools(): void {
  for (const name of registeredNames) {
    unregisterTool(name);
  }
  registeredNames.clear();
}

/**
 * Flatten an `MCPToolCallResult` into the plain `{ success, result?, error? }`
 * shape that the existing `formatToolResult` (in `src/agent/parser.ts`) can
 * JSON-stringify and feed back to the LLM.
 *
 * - On failure: returns `{ success: false, error }`.
 * - On MCP `isError`: returns `{ success: false, error: <concatenated text> }`.
 * - On success: returns `{ success: true, result: <concatenated text> }`.
 *
 * Non-text content blocks (images, resources) contribute an empty string —
 * richer formats are deferred to V2 with the Resources primitive.
 */
function flattenResult(result: MCPToolCallResult): {
  success: boolean;
  result?: string;
  error?: string;
} {
  if (!result.success) {
    return { success: false, error: result.error ?? 'MCP tool call failed' };
  }
  if (result.isError) {
    const text = result.content.map((c) => c.text ?? '').join('\n').trim();
    return { success: false, error: text || 'MCP tool reported an error' };
  }
  const text = result.content.map((c) => c.text ?? '').join('\n').trim();
  return { success: true, result: text };
}

/**
 * Build the description string the LLM sees in the system prompt.
 *
 * Includes the original server-side description and a compact JSON hint of
 * the input schema so the LLM knows how to call the tool. The skill system
 * already proved this pattern works with native tools.
 */
function formatToolDescription(tool: MCPTool): string {
  const schemaHint = JSON.stringify(tool.inputSchema);
  return `MCP tool from server "${tool.serverName}".
${tool.description}
Args schema: ${schemaHint}`.trim();
}
