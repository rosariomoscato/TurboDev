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
  if (!agent.permission) return 'allow';

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

  return 'allow';
}
