import { TOOL_REGISTRY } from './tools.js';
import { AgentConfig } from './types.js';
import type { Skill } from '../skills/types.js';

export function generateSystemPrompt(projectContext?: string, agent?: AgentConfig, skills?: Skill[]): string {
  const toolsToInclude = Object.values(TOOL_REGISTRY).filter(tool => {
    if (!agent?.tools) return true;
    if (agent.tools[tool.name] === false) return false;
    return true;
  });

  const toolsStr = toolsToInclude
    .map(tool => `TOOL\n===\nName: ${tool.name}\nDescription: ${tool.description}\n=================\n`)
    .join('\n');

  const identitySuffix = agent ? ` You are currently acting as the "${agent.name}" agent.` : '';

  // Build the optional skills section — only included when enabled skills exist.
  let skillsSection = '';
  if (skills && skills.length > 0) {
    const enabledSkills = skills.filter(s => s.enabled);
    if (enabledSkills.length > 0) {
      const skillsList = enabledSkills
        .map(s => `  - ${s.name}: ${s.metadata.description}`)
        .join('\n');
      skillsSection = `\nAVAILABLE SKILLS\n================\nThe following skills are available. Each skill contains specialized instructions for specific tasks.\n\n${skillsList}\n\nTo activate a skill and get its full instructions, call:\ntool: load_skill({"name": "skill-name"})\n\nYou can also load a specific resource file from a skill:\ntool: load_skill({"name": "skill-name", "resource": "references/guide.md"})\n\nOnly activate skills when they are relevant to the user's current task.\n`;
    }
  }

  let prompt = `${agent?.prompt ? agent.prompt + '\n\n' : ''}You are TurboDev, an AI coding assistant.${identitySuffix} You help users with coding tasks by reading, listing, and editing files in their project.

You have access to the following tools:

${toolsStr}
${skillsSection}
IMPORTANT RULES:
1. When you want to use a tool, respond with exactly one line in the format: tool: TOOL_NAME({JSON_ARGS}) and nothing else
2. Use compact single-line JSON with double quotes
3. After receiving a tool_result(...) message, continue the task
4. If no tool is needed, respond normally to the user
5. Only use one tool per line
6. You can chain multiple tool calls (e.g., read a file, then edit it)

GIT SAFETY RULES:
1. NEVER force push to main or master branch
2. NEVER push without the user's explicit request
3. NEVER commit secrets, API keys, or credentials
4. Always run git status and git diff before committing to show the user what will be committed
5. Suggest meaningful commit messages based on the actual changes
6. When creating PRs, suggest a descriptive title and body based on the commits

Example tool call:
tool: read_file({"filename": "src/index.ts"})

Current working directory: ${process.cwd()}

IMPORTANT: Always respond in the same language the user writes in.`;

  if (agent?.permission?.edit === 'ask') {
    prompt += '\n\nNOTE: File edits and bash commands require user approval. Call the tools normally — the system asks the user automatically. If a tool is denied, acknowledge briefly and do NOT retry or ask the user yourself.';
  }

  if (projectContext) {
    prompt += `

## Project Context (from AGENTS.md)

${projectContext}

Follow the instructions from AGENTS.md when working on this project.`;
  }

  return prompt;
}
