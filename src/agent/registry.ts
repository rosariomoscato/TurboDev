import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { AgentConfig } from './types.js';
import { parseAgentMarkdown } from './parser-md.js';
import { BUILTIN_AGENTS } from './builtins.js';

function loadAgentsFromDir(dirPath: string): AgentConfig[] {
  const resolved = path.resolve(dirPath);
  if (!fs.existsSync(resolved)) return [];
  let entries: string[];
  try {
    entries = fs.readdirSync(resolved);
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.endsWith('.md'))
    .map((e) => parseAgentMarkdown(path.join(resolved, e)))
    .filter((a): a is AgentConfig => a !== null);
}

function mergeAgentConfigs(base: AgentConfig, override: AgentConfig): AgentConfig {
  const merged = { ...base };
  for (const key of Object.keys(override) as (keyof AgentConfig)[]) {
    const value = override[key];
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  merged.name = base.name;
  return merged;
}

export function loadAllAgents(cwd: string): AgentConfig[] {
  const agentMap = new Map<string, AgentConfig>();

  for (const agent of BUILTIN_AGENTS) {
    agentMap.set(agent.name, agent);
  }

  const globalDir = path.join(os.homedir(), '.config', 'turbodev', 'agents');
  const globalAgents = loadAgentsFromDir(globalDir);
  for (const agent of globalAgents) {
    const existing = agentMap.get(agent.name);
    if (existing) {
      agentMap.set(agent.name, mergeAgentConfigs(existing, agent));
    } else {
      agentMap.set(agent.name, agent);
    }
  }

  const projectDir = path.join(cwd, '.turbodev', 'agents');
  const projectAgents = loadAgentsFromDir(projectDir);
  for (const agent of projectAgents) {
    const existing = agentMap.get(agent.name);
    if (existing) {
      agentMap.set(agent.name, mergeAgentConfigs(existing, agent));
    } else {
      agentMap.set(agent.name, agent);
    }
  }

  return Array.from(agentMap.values()).filter((a) => !a.disable);
}

export function getPrimaryAgents(cwd: string): AgentConfig[] {
  return loadAllAgents(cwd).filter((a) => a.mode !== 'subagent');
}

export function getSubagents(cwd: string): AgentConfig[] {
  return loadAllAgents(cwd).filter(
    (a) => (a.mode === 'subagent' || a.mode === 'all') && !a.hidden
  );
}

export function getAgent(cwd: string, name: string): AgentConfig | undefined {
  return loadAllAgents(cwd).find((a) => a.name === name);
}
