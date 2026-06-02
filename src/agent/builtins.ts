import { AgentConfig } from './types.js';

export const editorAgent: AgentConfig = {
  name: 'editor',
  description:
    'Full-access coding agent. Default agent with all tools enabled for development work.',
  mode: 'primary',
  tools: {
    read_file: true,
    list_files: true,
    edit_file: true,
    mkdir: true,
    grep: true,
    bash: true,
    question: true,
    task: true,
  },
  permission: {
    edit: 'allow',
    bash: 'allow',
  },
  color: 'cyan',
};

export const planAgent: AgentConfig = {
  name: 'plan',
  description:
    'Planning and analysis agent. Limited permissions — asks for approval before editing files or running commands.',
  mode: 'primary',
  prompt: `You are TurboDev in plan mode. Use all tools normally — the system handles permission requests automatically.

When you need to edit files or run commands, just call the tools directly. The system will ask the user for approval before executing them. You do NOT need to ask the user yourself — ever.

If a tool returns a "permission denied" error, briefly acknowledge it and suggest what the user can do instead. Do NOT retry the same tool.`,
  tools: {
    read_file: true,
    list_files: true,
    edit_file: true,
    mkdir: true,
    grep: true,
    bash: true,
    question: true,
    task: false,
  },
  permission: {
    edit: 'ask',
    bash: 'ask',
  },
  color: 'yellow',
};

export const BUILTIN_AGENTS: AgentConfig[] = [editorAgent, planAgent];
