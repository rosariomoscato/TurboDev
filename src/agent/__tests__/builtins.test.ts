import { describe, it, expect } from 'vitest';
import { editorAgent, planAgent, BUILTIN_AGENTS } from '../builtins.js';

describe('builtins', () => {
  describe('editorAgent', () => {
    it('has name "editor"', () => {
      expect(editorAgent.name).toBe('editor');
    });

    it('is primary mode', () => {
      expect(editorAgent.mode).toBe('primary');
    });

    it('has all tools enabled', () => {
      const tools = editorAgent.tools!;
      expect(tools.read_file).toBe(true);
      expect(tools.list_files).toBe(true);
      expect(tools.edit_file).toBe(true);
      expect(tools.mkdir).toBe(true);
      expect(tools.grep).toBe(true);
      expect(tools.bash).toBe(true);
      expect(tools.question).toBe(true);
      expect(tools.task).toBe(true);
    });

    it('has allow permissions for edit and bash', () => {
      expect(editorAgent.permission?.edit).toBe('allow');
      expect(editorAgent.permission?.bash).toBe('allow');
    });

    it('has cyan color', () => {
      expect(editorAgent.color).toBe('cyan');
    });

    it('has a description', () => {
      expect(editorAgent.description.length).toBeGreaterThan(0);
    });
  });

  describe('planAgent', () => {
    it('has name "plan"', () => {
      expect(planAgent.name).toBe('plan');
    });

    it('is primary mode', () => {
      expect(planAgent.mode).toBe('primary');
    });

    it('has task tool disabled', () => {
      expect(planAgent.tools?.task).toBe(false);
    });

    it('has ask permissions for edit and bash', () => {
      expect(planAgent.permission?.edit).toBe('ask');
      expect(planAgent.permission?.bash).toBe('ask');
    });

    it('has yellow color', () => {
      expect(planAgent.color).toBe('yellow');
    });

    it('has a prompt', () => {
      expect(planAgent.prompt).toBeDefined();
      expect(planAgent.prompt!.length).toBeGreaterThan(0);
    });

    it('prompt mentions not to retry on deny', () => {
      expect(planAgent.prompt).toContain('Do NOT retry');
    });
  });

  describe('BUILTIN_AGENTS', () => {
    it('contains exactly 2 agents', () => {
      expect(BUILTIN_AGENTS).toHaveLength(2);
    });

    it('first is editor, second is plan', () => {
      expect(BUILTIN_AGENTS[0].name).toBe('editor');
      expect(BUILTIN_AGENTS[1].name).toBe('plan');
    });
  });
});
