import { describe, it, expect } from 'vitest';
import {
  matchBashGlob,
  resolveBashPermission,
  resolveToolPermission,
  parseMCPToolName,
} from '../permissions.js';
import type { AgentConfig } from '../types.js';

describe('matchBashGlob', () => {
  it('matches wildcard * against any command', () => {
    expect(matchBashGlob('*', 'anything')).toBe(true);
    expect(matchBashGlob('*', 'rm -rf /')).toBe(true);
  });

  it('matches git* pattern', () => {
    expect(matchBashGlob('git *', 'git status')).toBe(true);
    expect(matchBashGlob('git *', 'git commit -m "test"')).toBe(true);
    expect(matchBashGlob('git *', 'git')).toBe(false);
    expect(matchBashGlob('git *', 'npm test')).toBe(false);
  });

  it('matches rm* pattern', () => {
    expect(matchBashGlob('rm *', 'rm -rf /tmp/test')).toBe(true);
    expect(matchBashGlob('rm *', 'rm file.txt')).toBe(true);
    expect(matchBashGlob('rm *', 'git status')).toBe(false);
  });

  it('matches exact command (no glob)', () => {
    expect(matchBashGlob('ls', 'ls')).toBe(true);
    expect(matchBashGlob('ls', 'ls -la')).toBe(false);
  });

  it('matches patterns with dots', () => {
    expect(matchBashGlob('npm test', 'npm test')).toBe(true);
    expect(matchBashGlob('npm *', 'npm run build')).toBe(true);
  });

  it('handles multiple wildcards', () => {
    expect(matchBashGlob('git push * *', 'git push origin master')).toBe(true);
    expect(matchBashGlob('git push * *', 'git push origin')).toBe(false);
  });

  it('escapes regex special characters', () => {
    expect(matchBashGlob('node -e "console.log(1)"', 'node -e "console.log(1)"')).toBe(true);
  });
});

describe('resolveBashPermission', () => {
  it('returns last matching pattern (last-match-wins)', () => {
    const rules = {
      '*': 'ask',
      'git *': 'allow',
      'rm *': 'deny',
    };
    expect(resolveBashPermission(rules, 'git status')).toBe('allow');
    expect(resolveBashPermission(rules, 'rm -rf /tmp')).toBe('deny');
    expect(resolveBashPermission(rules, 'npm test')).toBe('ask');
  });

  it('defaults to ask when no rules match', () => {
    const rules: Record<string, 'allow' | 'ask' | 'deny'> = {};
    expect(resolveBashPermission(rules, 'anything')).toBe('ask');
  });

  it('single wildcard matches everything', () => {
    const rules = { '*': 'allow' };
    expect(resolveBashPermission(rules, 'any command')).toBe('allow');
  });

  it('processes rules in insertion order', () => {
    const rules = {
      'git *': 'allow',
      'git push *': 'deny',
    };
    expect(resolveBashPermission(rules, 'git push origin')).toBe('deny');
    expect(resolveBashPermission(rules, 'git status')).toBe('allow');
  });
});

describe('resolveToolPermission', () => {
  const editorAgent: AgentConfig = {
    name: 'editor',
    description: '',
    mode: 'primary',
    permission: {
      edit: 'allow',
      bash: 'allow',
    },
  };

  const planAgent: AgentConfig = {
    name: 'plan',
    description: '',
    mode: 'primary',
    permission: {
      edit: 'ask',
      bash: 'ask',
    },
  };

  const reviewerAgent: AgentConfig = {
    name: 'reviewer',
    description: '',
    mode: 'primary',
    tools: {
      edit_file: false,
      mkdir: false,
      bash: false,
    },
    permission: {
      edit: 'deny',
      bash: 'deny',
    },
  };

  it('returns "deny" when tool is explicitly disabled', () => {
    expect(resolveToolPermission('edit_file', reviewerAgent)).toBe('deny');
    expect(resolveToolPermission('mkdir', reviewerAgent)).toBe('deny');
    expect(resolveToolPermission('bash', reviewerAgent, 'ls')).toBe('deny');
  });

  it('returns "allow" for edit tools when permission.edit is "allow"', () => {
    expect(resolveToolPermission('edit_file', editorAgent)).toBe('allow');
    expect(resolveToolPermission('mkdir', editorAgent)).toBe('allow');
  });

  it('returns "ask" for edit tools when permission.edit is "ask"', () => {
    expect(resolveToolPermission('edit_file', planAgent)).toBe('ask');
    expect(resolveToolPermission('mkdir', planAgent)).toBe('ask');
  });

  it('returns "deny" for edit tools when permission.edit is "deny"', () => {
    expect(resolveToolPermission('edit_file', reviewerAgent)).toBe('deny');
  });

  it('returns "allow" for bash when permission.bash is "allow"', () => {
    expect(resolveToolPermission('bash', editorAgent, 'ls')).toBe('allow');
  });

  it('returns "ask" for bash when permission.bash is "ask"', () => {
    expect(resolveToolPermission('bash', planAgent, 'ls')).toBe('ask');
  });

  it('resolves bash with glob rules', () => {
    const globAgent: AgentConfig = {
      name: 'globby',
      description: '',
      mode: 'primary',
      permission: {
        bash: {
          '*': 'ask',
          'git *': 'allow',
          'rm *': 'deny',
        },
      },
    };
    expect(resolveToolPermission('bash', globAgent, 'git status')).toBe('allow');
    expect(resolveToolPermission('bash', globAgent, 'rm -rf /tmp')).toBe('deny');
    expect(resolveToolPermission('bash', globAgent, 'npm test')).toBe('ask');
  });

  it('returns "allow" for non-edit/non-bash tools', () => {
    expect(resolveToolPermission('read_file', editorAgent)).toBe('allow');
    expect(resolveToolPermission('grep', editorAgent)).toBe('allow');
    expect(resolveToolPermission('list_files', planAgent)).toBe('allow');
  });

  it('returns "allow" when no permission object exists', () => {
    const noPerm: AgentConfig = {
      name: 'noperm',
      description: '',
      mode: 'primary',
    };
    expect(resolveToolPermission('edit_file', noPerm)).toBe('allow');
    expect(resolveToolPermission('bash', noPerm, 'ls')).toBe('allow');
    expect(resolveToolPermission('read_file', noPerm)).toBe('allow');
  });

  it('tools.disabled takes priority over permission (deny shortcut)', () => {
    const agent: AgentConfig = {
      name: 'test',
      description: '',
      mode: 'primary',
      tools: { edit_file: false },
      permission: { edit: 'allow' },
    };
    expect(resolveToolPermission('edit_file', agent)).toBe('deny');
  });
});

describe('resolveToolPermission — MCP', () => {
  const baseAgent: AgentConfig = {
    name: 'test',
    description: '',
    mode: 'primary',
  };

  it('returns ask for mcp__ tools when no permission config exists', () => {
    expect(resolveToolPermission('mcp__fs__read', baseAgent)).toBe('ask');
  });

  it('returns the per-server entry when present', () => {
    const agent: AgentConfig = {
      ...baseAgent,
      permission: { mcp: { fs: 'allow' } },
    };
    expect(resolveToolPermission('mcp__fs__read', agent)).toBe('allow');
    expect(resolveToolPermission('mcp__other__write', agent)).toBe('ask');
  });

  it('falls back to global string action', () => {
    const agent: AgentConfig = {
      ...baseAgent,
      permission: { mcp: 'deny' },
    };
    expect(resolveToolPermission('mcp__fs__read', agent)).toBe('deny');
  });

  it('per-server entry applies only to that server; others default to ask', () => {
    const agent: AgentConfig = {
      ...baseAgent,
      permission: { mcp: { fs: 'allow' } },
    };
    expect(resolveToolPermission('mcp__fs__anything', agent)).toBe('allow');
    expect(resolveToolPermission('mcp__github__read', agent)).toBe('ask');
  });

  it('respects explicit tool disable via agent.tools', () => {
    const agent: AgentConfig = {
      ...baseAgent,
      tools: { 'mcp__fs__read': false },
    };
    expect(resolveToolPermission('mcp__fs__read', agent)).toBe('deny');
  });

  it('non-MCP unknown tool defaults to allow (unchanged behaviour)', () => {
    expect(resolveToolPermission('something_else', baseAgent)).toBe('allow');
  });
});

describe('parseMCPToolName', () => {
  it('returns the server name for valid MCP tool names', () => {
    expect(parseMCPToolName('mcp__filesystem__read_file')).toBe('filesystem');
    expect(parseMCPToolName('mcp__github__create_pr')).toBe('github');
  });

  it('returns null for non-MCP tool names', () => {
    expect(parseMCPToolName('bash')).toBeNull();
    expect(parseMCPToolName('read_file')).toBeNull();
    expect(parseMCPToolName('edit_file')).toBeNull();
  });

  it('returns null for malformed MCP names', () => {
    expect(parseMCPToolName('mcp_foo_bar')).toBeNull();
    expect(parseMCPToolName('mcp__only_one_part')).toBeNull();
    expect(parseMCPToolName('foo__bar__baz')).toBeNull();
  });
});
