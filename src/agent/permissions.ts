import type { AgentConfig, BashPermissionRules, PermissionAction } from './types.js';

export function matchBashGlob(pattern: string, command: string): boolean {
  if (pattern === '*') return true;
  try {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regexStr = escaped.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(command);
  } catch {
    return false;
  }
}

export function resolveBashPermission(
  rules: BashPermissionRules,
  command: string,
): PermissionAction {
  let result: PermissionAction = 'ask';
  for (const [pattern, action] of Object.entries(rules)) {
    if (matchBashGlob(pattern, command)) {
      result = action;
    }
  }
  return result;
}

export function resolveToolPermission(
  toolName: string,
  agent: AgentConfig,
  bashCommand?: string,
): PermissionAction {
  if (agent.tools?.[toolName] === false) return 'deny';

  // MCP tools default to 'ask' even when the agent has no permission config
  // (security: external tools require explicit opt-in).
  const mcpServer = parseMCPToolName(toolName);

  if (!agent.permission) {
    return mcpServer ? 'ask' : 'allow';
  }

  if (toolName === 'edit_file' || toolName === 'mkdir') {
    return agent.permission.edit ?? 'allow';
  }

  if (toolName === 'bash') {
    const bash = agent.permission.bash;
    if (!bash) return 'allow';
    if (typeof bash === 'string') return bash;
    if (typeof bash === 'object' && bashCommand !== undefined) {
      return resolveBashPermission(bash, bashCommand);
    }
    return 'ask';
  }

  if (toolName === 'git') {
    return agent.permission.git ?? 'allow';
  }
  if (toolName === 'github') {
    return agent.permission.github ?? 'allow';
  }

  // MCP tools: per-server entry first, then global action, then 'ask'.
  if (mcpServer) {
    return resolveMcpPermission(agent.permission.mcp, mcpServer);
  }

  return 'allow';
}

/**
 * Extract the server name from an MCP tool name.
 *
 * Returns `null` if the name is not in the `mcp__<server>__<tool>` format.
 * Server names cannot contain underscores (they're the separator), so the
 * `[^_]+` match group captures the whole server segment cleanly.
 *
 * Example: `'mcp__filesystem__read_file'` → `'filesystem'`
 */
export function parseMCPToolName(toolName: string): string | null {
  const match = /^mcp__([^_]+)__[a-zA-Z0-9_]+$/.exec(toolName);
  return match ? match[1] : null;
}

/**
 * Resolve an MCP tool's permission against the agent's `mcp` config.
 *
 * Order:
 *   1. Per-server map entry: `mcp[serverName]`
 *   2. Global action: `mcp` as a single string
 *   3. Default: `'ask'` (secure default — user must approve external tools)
 */
function resolveMcpPermission(
  mcp: PermissionAction | Record<string, PermissionAction> | undefined,
  serverName: string,
): PermissionAction {
  if (!mcp) return 'ask';
  if (typeof mcp === 'string') return mcp;
  return mcp[serverName] ?? 'ask';
}
