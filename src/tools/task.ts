import type { AgentConfig, TaskPermission, PermissionAction } from '../agent/types.js';

export interface TaskArgs {
  agent: string;
  prompt: string;
  description: string;
}

export interface TaskResult {
  result: string;
  agent: string;
}

export function matchSimpleGlob(pattern: string, name: string): boolean {
  if (pattern === '*') return true;
  try {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const regex = new RegExp(`^${escaped}$`);
    return regex.test(name);
  } catch {
    return false;
  }
}

export function resolveTaskPermission(
  name: string,
  taskPerm: TaskPermission
): PermissionAction | null {
  let result: PermissionAction | null = null;
  for (const [pattern, action] of Object.entries(taskPerm)) {
    if (matchSimpleGlob(pattern, name)) {
      result = action;
    }
  }
  return result;
}

export function createTaskTool(
  cwd: string,
  parentAgent: AgentConfig,
  runAgentFn: Function
): (args: TaskArgs) => Promise<TaskResult> {
  return async (args: TaskArgs): Promise<TaskResult> => {
    const { getAgent } = await import('../agent/registry.js');
    const subagent = getAgent(cwd, args.agent);

    if (!subagent) {
      return {
        result: `Subagent "${args.agent}" not found`,
        agent: args.agent,
      };
    }

    if (parentAgent.taskPermission) {
      const permission = resolveTaskPermission(subagent.name, parentAgent.taskPermission);
      if (permission === 'deny') {
        return {
          result: `Task "${subagent.name}" is denied by permission policy`,
          agent: subagent.name,
        };
      }
    }

    const modelOverride = subagent.model || parentAgent.model;
    const result = await runAgentFn(args.prompt, [], null, {
      ...subagent,
      model: modelOverride,
    });

    return {
      result: result.assistantResponse || 'Subagent completed with no response',
      agent: subagent.name,
    };
  };
}
