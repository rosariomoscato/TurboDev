import { describe, it, expect } from 'vitest';
import { parseAgentMarkdownContent } from '../parser-md.js';

describe('parseAgentMarkdownContent', () => {
  it('parses basic frontmatter with description', () => {
    const md = `---
description: Test agent
mode: primary
---
You are a test agent.`;

    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.name).toBe('test');
    expect(result.description).toBe('Test agent');
    expect(result.mode).toBe('primary');
    expect(result.prompt).toBe('You are a test agent.');
  });

  it('uses fileName as name when name not specified', () => {
    const md = `---
description: No name
---
Body`;
    const result = parseAgentMarkdownContent(md, 'my-agent');
    expect(result.name).toBe('my-agent');
  });

  it('uses name from frontmatter when specified', () => {
    const md = `---
name: custom-name
description: Test
---
Body`;
    const result = parseAgentMarkdownContent(md, 'file-name');
    expect(result.name).toBe('custom-name');
  });

  it('defaults mode to "all" when not specified', () => {
    const md = `---
description: Test
---
Body`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.mode).toBe('all');
  });

  it('parses tools map', () => {
    const md = `---
description: Test
tools:
  edit_file: false
  bash: false
  read_file: true
---
Body`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.tools).toEqual({
      edit_file: false,
      bash: false,
      read_file: true,
    });
  });

  it('parses permission with string actions', () => {
    const md = `---
description: Test
permission:
  edit: deny
  bash: ask
---
Body`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.permission).toEqual({
      edit: 'deny',
      bash: 'ask',
    });
  });

  it('parses permission with bash glob rules', () => {
    const md = `---
description: Test
permission:
  edit: allow
  bash:
    "git *": allow
    "rm *": deny
    "*": ask
---
Body`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.permission?.edit).toBe('allow');
    expect(result.permission?.bash).toEqual({
      'git *': 'allow',
      'rm *': 'deny',
      '*': 'ask',
    });
  });

  it('parses numeric fields (temperature, top_p, steps)', () => {
    const md = `---
description: Test
temperature: 0.3
top_p: 0.9
steps: 50
---
Body`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.temperature).toBe(0.3);
    expect(result.topP).toBe(0.9);
    expect(result.steps).toBe(50);
  });

  it('supports topP as camelCase alias', () => {
    const md = `---
description: Test
topP: 0.85
---
Body`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.topP).toBe(0.85);
  });

  it('supports maxSteps as alias for steps', () => {
    const md = `---
description: Test
maxSteps: 25
---
Body`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.steps).toBe(25);
  });

  it('parses color, hidden, disable fields', () => {
    const md = `---
description: Test
color: green
hidden: true
disable: true
---
Body`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.color).toBe('green');
    expect(result.hidden).toBe(true);
    expect(result.disable).toBe(true);
  });

  it('parses taskPermission', () => {
    const md = `---
description: Test
task_permission:
  "editor": allow
  "plan": deny
---
Body`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.taskPermission).toEqual({
      editor: 'allow',
      plan: 'deny',
    });
  });

  it('returns undefined prompt when body is empty', () => {
    const md = `---
description: Test
---`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.prompt).toBeUndefined();
  });

  it('returns undefined prompt when body is whitespace only', () => {
    const md = `---
description: Test
---
   `;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.prompt).toBeUndefined();
  });

  it('parses model field', () => {
    const md = `---
description: Test
model: openai/gpt-4o
---
Body`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.model).toBe('openai/gpt-4o');
  });

  it('handles subagent mode', () => {
    const md = `---
description: Test
mode: subagent
---
Body`;
    const result = parseAgentMarkdownContent(md, 'test');
    expect(result.mode).toBe('subagent');
  });

  it('parses reviewer agent from NuoviTest.md test 10', () => {
    const md = `---
description: Code reviewer che analizza codice senza modificarlo
mode: primary
tools:
  edit_file: false
  mkdir: false
  bash: false
permission:
  edit: deny
  bash: deny
color: green
---
You are a code reviewer agent. Your job is to:
- Read and analyze code
- Identify potential bugs, security issues, and style problems
- Suggest improvements without making changes
Never attempt to modify any files.`;

    const result = parseAgentMarkdownContent(md, 'reviewer');
    expect(result.name).toBe('reviewer');
    expect(result.description).toBe('Code reviewer che analizza codice senza modificarlo');
    expect(result.mode).toBe('primary');
    expect(result.tools).toEqual({
      edit_file: false,
      mkdir: false,
      bash: false,
    });
    expect(result.permission).toEqual({
      edit: 'deny',
      bash: 'deny',
    });
    expect(result.color).toBe('green');
    expect(result.prompt).toContain('Read and analyze code');
  });
});
