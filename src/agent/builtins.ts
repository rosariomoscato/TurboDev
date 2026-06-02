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

export const compactionAgent: AgentConfig = {
  name: 'compaction',
  description: 'Compacts long conversations into concise summaries',
  mode: 'primary',
  hidden: true,
  prompt: `You are a conversation compaction agent. Your job is to summarize the conversation so far into a concise but comprehensive summary.

Rules:
- Preserve ALL key decisions made during the conversation
- Preserve ALL file paths, code changes, and tool results mentioned
- Preserve the user's intent and any preferences expressed
- Keep the summary under 2000 tokens
- Use bullet points for clarity
- Include any pending tasks or unresolved issues
- Do NOT add information that was not in the original conversation`,
  tools: {
    read_file: false,
    list_files: false,
    edit_file: false,
    mkdir: false,
    grep: false,
    bash: false,
    question: false,
    task: false,
  },
  permission: {
    edit: 'deny',
    bash: 'deny',
  },
};

export const BUILTIN_AGENTS: AgentConfig[] = [editorAgent, planAgent, compactionAgent];
