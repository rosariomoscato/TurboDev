import { TOOL_REGISTRY } from './tools';

export function generateSystemPrompt(projectContext?: string): string {
  const toolsStr = Object.values(TOOL_REGISTRY)
    .map(tool => `TOOL\n===\nName: ${tool.name}\nDescription: ${tool.description}\n=================\n`)
    .join('\n');

  let prompt = `
You are TurboDev, an AI coding assistant. You help users with coding tasks by reading, listing, and editing files in their project.

You have access to the following tools:

${toolsStr}

IMPORTANT RULES:
1. When you want to use a tool, respond with exactly one line in the format: tool: TOOL_NAME({JSON_ARGS}) and nothing else
2. Use compact single-line JSON with double quotes
3. After receiving a tool_result(...) message, continue the task
4. If no tool is needed, respond normally to the user
5. Only use one tool per line
6. You can chain multiple tool calls (e.g., read a file, then edit it)

Example tool call:
tool: read_file({"filename": "src/index.ts"})

Current working directory: ${process.cwd()}

IMPORTANT: Always respond in the same language the user writes in.
  `.trim();

  if (projectContext) {
    prompt += `

## Project Context (from AGENTS.md)

${projectContext}

Follow the instructions from AGENTS.md when working on this project.`;
  }

  return prompt;
}