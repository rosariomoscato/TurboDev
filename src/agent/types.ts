export type PermissionAction = 'allow' | 'ask' | 'deny';

export interface BashPermissionRules {
  [globPattern: string]: PermissionAction;
}

export interface AgentPermission {
  edit?: PermissionAction;
  bash?: PermissionAction | BashPermissionRules;
  git?: PermissionAction;
  github?: PermissionAction;
  /**
   * MCP tools. Accepts either a single action applied to all MCP servers,
   * or a per-server map keyed by server name (matching the `mcpServers` keys).
   * Default (when absent): `'ask'`.
   *
   * Examples:
   *   mcp: 'allow'                              // allow every MCP tool
   *   mcp: { filesystem: 'allow', github: 'ask' }
   */
  mcp?: PermissionAction | Record<string, PermissionAction>;
}

export interface TaskPermission {
  [globPattern: string]: PermissionAction;
}

export interface AgentConfig {
  name: string;
  description: string;
  mode: 'primary' | 'subagent' | 'all';
  model?: string;
  prompt?: string;
  temperature?: number;
  topP?: number;
  steps?: number;
  tools?: Partial<Record<string, boolean>>;
  permission?: AgentPermission;
  taskPermission?: TaskPermission;
  color?: string;
  hidden?: boolean;
  disable?: boolean;
  skills?: string[];
}
