import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadAllAgents, getPrimaryAgents, getSubagents, getAgent } from '../registry.js';

const TMP = path.join(os.tmpdir(), `turbodev-test-${Date.now()}`);
const PROJECT_AGENTS = path.join(TMP, '.turbodev', 'agents');
const GLOBAL_AGENTS = path.join(os.homedir(), '.config', 'turbodev', 'agents');

function mkdirp(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeAgent(dir: string, name: string, content: string) {
  mkdirp(dir);
  fs.writeFileSync(path.join(dir, `${name}.md`), content);
}

function cleanup(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('registry', () => {
  beforeEach(() => {
    mkdirp(PROJECT_AGENTS);
  });

  afterEach(() => {
    cleanup(TMP);
  });

  describe('loadAllAgents — built-in agents', () => {
    it('always includes editor and plan', () => {
      const agents = loadAllAgents(TMP);
      const names = agents.map((a) => a.name);
      expect(names).toContain('editor');
      expect(names).toContain('plan');
    });

    it('editor has all tools enabled and allow permissions', () => {
      const agents = loadAllAgents(TMP);
      const editor = agents.find((a) => a.name === 'editor')!;
      expect(editor.permission?.edit).toBe('allow');
      expect(editor.permission?.bash).toBe('allow');
      expect(editor.tools?.edit_file).toBe(true);
      expect(editor.tools?.bash).toBe(true);
      expect(editor.color).toBe('cyan');
    });

    it('plan has ask permissions and task disabled', () => {
      const agents = loadAllAgents(TMP);
      const plan = agents.find((a) => a.name === 'plan')!;
      expect(plan.permission?.edit).toBe('ask');
      expect(plan.permission?.bash).toBe('ask');
      expect(plan.tools?.task).toBe(false);
      expect(plan.color).toBe('yellow');
    });
  });

  describe('loadAllAgents — project agents', () => {
    it('loads a project-level custom agent', () => {
      writeAgent(PROJECT_AGENTS, 'reviewer', `---
description: Code reviewer
mode: primary
tools:
  edit_file: false
  bash: false
permission:
  edit: deny
  bash: deny
color: green
---
Read and review code.`);

      const agents = loadAllAgents(TMP);
      const reviewer = agents.find((a) => a.name === 'reviewer');
      expect(reviewer).toBeDefined();
      expect(reviewer!.description).toBe('Code reviewer');
      expect(reviewer!.mode).toBe('primary');
      expect(reviewer!.tools?.edit_file).toBe(false);
      expect(reviewer!.permission?.edit).toBe('deny');
      expect(reviewer!.color).toBe('green');
    });

    it('overrides built-in agent with same name (shallow merge)', () => {
      writeAgent(PROJECT_AGENTS, 'editor', `---
description: My custom editor
temperature: 0.2
---
Be very concise.`);

      const agents = loadAllAgents(TMP);
      const editor = agents.find((a) => a.name === 'editor')!;
      expect(editor.description).toBe('My custom editor');
      expect(editor.temperature).toBe(0.2);
      expect(editor.prompt).toBe('Be very concise.');
      expect(editor.name).toBe('editor');
    });

    it('preserves built-in tools when overriding only description', () => {
      writeAgent(PROJECT_AGENTS, 'editor', `---
description: Custom description only
---
Custom prompt.`);

      const agents = loadAllAgents(TMP);
      const editor = agents.find((a) => a.name === 'editor')!;
      expect(editor.description).toBe('Custom description only');
      expect(editor.tools?.edit_file).toBe(true);
      expect(editor.tools?.bash).toBe(true);
      expect(editor.permission?.edit).toBe('allow');
      expect(editor.permission?.bash).toBe('allow');
      expect(editor.color).toBe('cyan');
    });

    it('filters out disabled agents', () => {
      writeAgent(PROJECT_AGENTS, 'disabled-agent', `---
description: Disabled
disable: true
---
Body`);

      const agents = loadAllAgents(TMP);
      expect(agents.find((a) => a.name === 'disabled-agent')).toBeUndefined();
    });

    it('does not crash when .turbodev/agents does not exist', () => {
      cleanup(TMP);
      const agents = loadAllAgents(TMP);
      expect(agents.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('loadAllAgents — global agents', () => {
    afterEach(() => {
      cleanup(path.join(os.homedir(), '.config', 'turbodev'));
    });

    it('loads global agents from ~/.config/turbodev/agents/', () => {
      writeAgent(GLOBAL_AGENTS, 'helper', `---
description: Helper generico
mode: primary
color: magenta
---
Help with general questions.`);

      const agents = loadAllAgents(TMP);
      const helper = agents.find((a) => a.name === 'helper');
      expect(helper).toBeDefined();
      expect(helper!.description).toBe('Helper generico');
      expect(helper!.color).toBe('magenta');
    });

    it('global agents can override built-in agents', () => {
      writeAgent(GLOBAL_AGENTS, 'editor', `---
description: Global editor override
temperature: 0.5
---
Global prompt.`);

      const agents = loadAllAgents(TMP);
      const editor = agents.find((a) => a.name === 'editor')!;
      expect(editor.description).toBe('Global editor override');
      expect(editor.temperature).toBe(0.5);
    });

    it('project agents override global agents with same name', () => {
      writeAgent(GLOBAL_AGENTS, 'editor', `---
description: Global override
temperature: 0.5
---
Global prompt.`);

      writeAgent(PROJECT_AGENTS, 'editor', `---
description: Project override
temperature: 0.2
---
Project prompt.`);

      const agents = loadAllAgents(TMP);
      const editor = agents.find((a) => a.name === 'editor')!;
      expect(editor.description).toBe('Project override');
      expect(editor.temperature).toBe(0.2);
      expect(editor.prompt).toBe('Project prompt.');
    });
  });

  describe('getPrimaryAgents', () => {
    it('returns only primary agents (not subagent)', () => {
      writeAgent(PROJECT_AGENTS, 'worker', `---
description: Sub-agent
mode: subagent
---
Body`);

      const primaries = getPrimaryAgents(TMP);
      expect(primaries.every((a) => a.mode !== 'subagent')).toBe(true);
      expect(primaries.find((a) => a.name === 'worker')).toBeUndefined();
    });
  });

  describe('getSubagents', () => {
    it('returns subagent and all-mode agents (not hidden)', () => {
      writeAgent(PROJECT_AGENTS, 'worker', `---
description: Sub-agent
mode: subagent
---
Body`);

      writeAgent(PROJECT_AGENTS, 'hidden-worker', `---
description: Hidden sub
mode: subagent
hidden: true
---
Body`);

      const subs = getSubagents(TMP);
      expect(subs.find((a) => a.name === 'worker')).toBeDefined();
      expect(subs.find((a) => a.name === 'hidden-worker')).toBeUndefined();
    });
  });

  describe('getAgent', () => {
    it('finds agent by name', () => {
      const editor = getAgent(TMP, 'editor');
      expect(editor).toBeDefined();
      expect(editor!.name).toBe('editor');
    });

    it('returns undefined for unknown agent', () => {
      const unknown = getAgent(TMP, 'nonexistent');
      expect(unknown).toBeUndefined();
    });
  });

  describe('merge preserves base name', () => {
    it('always keeps original built-in name even when override has different name', () => {
      writeAgent(PROJECT_AGENTS, 'editor', `---
description: Overridden
---
New prompt.`);

      const agents = loadAllAgents(TMP);
      const editor = agents.find((a) => a.name === 'editor')!;
      expect(editor.name).toBe('editor');
    });
  });
});
