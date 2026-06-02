import { describe, it, expect } from 'vitest';
import { extractToolInvocations, formatToolResult } from '../parser.js';

describe('extractToolInvocations', () => {
  it('extracts single-line tool call', () => {
    const text = 'tool: read_file({"path": "package.json"})';
    const result = extractToolInvocations(text);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('read_file');
    expect(result[0].args).toEqual({ path: 'package.json' });
  });

  it('extracts multi-line tool call (JSON on multiple lines)', () => {
    const text = `tool: edit_file({
  "path": "AGENTS.md",
  "old_str": "## Design",
  "new_str": "## Design\\n\\n## PUZZA"
})`;
    const result = extractToolInvocations(text);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('edit_file');
    expect(result[0].args.path).toBe('AGENTS.md');
    expect(result[0].args.old_str).toBe('## Design');
    expect(result[0].args.new_str).toBe('## Design\n\n## PUZZA');
  });

  it('extracts multiple tool calls from same text', () => {
    const text = `Let me read the file first.
tool: read_file({"path": "a.ts"})
Now I'll edit it.
tool: edit_file({"path": "a.ts", "old_str": "foo", "new_str": "bar"})`;
    const result = extractToolInvocations(text);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('read_file');
    expect(result[1].name).toBe('edit_file');
  });

  it('extracts bash tool call', () => {
    const text = 'tool: bash({"command": "npm test"})';
    const result = extractToolInvocations(text);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('bash');
    expect(result[0].args.command).toBe('npm test');
  });

  it('returns empty array when no tool calls', () => {
    const text = 'Just a regular message with no tools.';
    expect(extractToolInvocations(text)).toHaveLength(0);
  });

  it('returns empty array for malformed tool call', () => {
    const text = 'tool: broken(not json)';
    expect(extractToolInvocations(text)).toHaveLength(0);
  });

  it('handles tool call with empty JSON object', () => {
    const text = 'tool: list_files({})';
    const result = extractToolInvocations(text);
    expect(result).toHaveLength(1);
    expect(result[0].args).toEqual({});
  });

  it('handles multi-line JSON with nested braces', () => {
    const text = `tool: edit_file({
  "path": "src/test.ts",
  "old_str": "const obj = {a: 1}",
  "new_str": "const obj = {a: 1, b: 2}"
})`;
    const result = extractToolInvocations(text);
    expect(result).toHaveLength(1);
    expect(result[0].args.old_str).toBe('const obj = {a: 1}');
  });

  it('handles tool call with question args', () => {
    const text = 'tool: question({"question": "Which option?", "options": ["a", "b"]})';
    const result = extractToolInvocations(text);
    expect(result).toHaveLength(1);
    expect(result[0].args.options).toEqual(['a', 'b']);
  });

  it('handles mixed content with multi-line tool call', () => {
    const text = `I'll add the section now.
tool: edit_file({
  "path": "AGENTS.md",
  "old_str": "## Design",
  "new_str": "## Design\\n\\n## PUZZA"
})
Done!`;
    const result = extractToolInvocations(text);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('edit_file');
    expect(result[0].args.path).toBe('AGENTS.md');
  });

  it('skips lines that start with tool: but are not valid tool calls', () => {
    const text = 'tool: this is not a tool call';
    expect(extractToolInvocations(text)).toHaveLength(0);
  });

  it('handles multi-line tool call followed by another single-line', () => {
    const text = `tool: edit_file({
  "path": "a.txt",
  "old_str": "x",
  "new_str": "y"
})
tool: read_file({"path": "a.txt"})`;
    const result = extractToolInvocations(text);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('edit_file');
    expect(result[1].name).toBe('read_file');
  });

  it('handles real-world edit_file from plan agent (user reported bug)', () => {
    const text = `tool: edit_file({
  "path": "AGENTS.md",
  "old_str": "## Design\\n\\n<!-- Describe your design system, UI patterns, color palette, typography, and component conventions here -->",
  "new_str": "## Design\\n\\n<!-- Describe your design system, UI patterns, color palette, typography, and component conventions here -->\\n\\n## PUZZA\\n\\n<!-- Aggiungi qui la descrizione della sezione PUZZA -->"
})`;
    const result = extractToolInvocations(text);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('edit_file');
    expect(result[0].args.path).toBe('AGENTS.md');
    expect(result[0].args.new_str).toContain('PUZZA');
  });
});

describe('formatToolResult', () => {
  it('formats tool result as JSON', () => {
    const result = formatToolResult({ success: true, data: 'hello' });
    expect(result).toBe('tool_result({"success":true,"data":"hello"})');
  });
});
