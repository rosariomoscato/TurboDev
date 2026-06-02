import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { AgentConfig } from './types.js';

export function parseAgentMarkdownContent(
  content: string,
  fileName: string
): AgentConfig {
  const parsed = matter(content);

  const data = parsed.data as Record<string, unknown>;

  const topP = (data.top_p ?? data.topP) as number | undefined;
  const steps = (data.steps ?? data.maxSteps) as number | undefined;
  const taskPermission = (data.task_permission ?? data.taskPermission) as string | undefined;

  const body = parsed.content.trim();

  return {
    name: (data.name as string) ?? fileName,
    description: (data.description as string) ?? '',
    mode: (data.mode as AgentConfig['mode']) ?? 'all',
    model: data.model as string | undefined,
    prompt: body.length > 0 ? body : undefined,
    temperature: data.temperature as number | undefined,
    topP,
    steps,
    tools: data.tools as Partial<Record<string, boolean>> | undefined,
    permission: data.permission as AgentConfig['permission'] | undefined,
    taskPermission: taskPermission as AgentConfig['taskPermission'] | undefined,
    color: data.color as string | undefined,
    hidden: data.hidden as boolean | undefined,
    disable: data.disable as boolean | undefined,
  };
}

export function parseAgentMarkdown(filePath: string): AgentConfig | null {
  try {
    const resolved = path.resolve(filePath);
    const raw = fs.readFileSync(resolved, 'utf-8');
    const baseName = path.basename(resolved, '.md');
    return parseAgentMarkdownContent(raw, baseName);
  } catch {
    return null;
  }
}
