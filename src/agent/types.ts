export type PermissionAction = 'allow' | 'ask' | 'deny';

export interface BashPermissionRules {
  [globPattern: string]: PermissionAction;
}

export interface AgentPermission {
  edit?: PermissionAction;
  bash?: PermissionAction | BashPermissionRules;
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
}
