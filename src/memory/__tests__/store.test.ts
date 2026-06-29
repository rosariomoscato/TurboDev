import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  loadMemory,
  loadMemoryEntries,
  appendMemory,
  clearMemory,
  getMemoryPath,
} from '../store.js';
import type { MemoryCategory } from '../types.js';

describe('memory store', () => {
  let testDir: string;
  let memPath: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'turbodev-mem-'));
    memPath = getMemoryPath(testDir);
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('loadMemory', () => {
    it('returns empty string when file is missing', () => {
      expect(loadMemory(testDir)).toBe('');
    });

    it('returns raw content when file exists', () => {
      fs.mkdirSync(path.dirname(memPath), { recursive: true });
      fs.writeFileSync(memPath, '# Project Memory\n\n## facts\n- hello\n');
      expect(loadMemory(testDir)).toContain('hello');
    });
  });

  describe('loadMemoryEntries', () => {
    it('returns empty array for missing file', () => {
      expect(loadMemoryEntries(testDir)).toEqual([]);
    });

    it('parses multiple categories and bullets', () => {
      fs.mkdirSync(path.dirname(memPath), { recursive: true });
      fs.writeFileSync(memPath, [
        '# Project Memory',
        '',
        '## preferences',
        '- prefers TS',
        '- likes functional style',
        '',
        '## facts',
        '- Node 22 installed',
        '',
      ].join('\n'));
      const entries = loadMemoryEntries(testDir);
      expect(entries).toHaveLength(3);
      expect(entries[0]).toEqual({ category: 'preferences', content: 'prefers TS' });
      expect(entries[1]).toEqual({ category: 'preferences', content: 'likes functional style' });
      expect(entries[2]).toEqual({ category: 'facts', content: 'Node 22 installed' });
    });

    it('ignores unknown categories', () => {
      fs.mkdirSync(path.dirname(memPath), { recursive: true });
      fs.writeFileSync(memPath, '## unknown\n- ignored\n\n## facts\n- kept\n');
      const entries = loadMemoryEntries(testDir);
      expect(entries).toEqual([{ category: 'facts', content: 'kept' }]);
    });

    it('ignores lines outside sections', () => {
      fs.mkdirSync(path.dirname(memPath), { recursive: true });
      fs.writeFileSync(memPath, 'random line\n\n## facts\n- real entry\n');
      const entries = loadMemoryEntries(testDir);
      expect(entries).toEqual([{ category: 'facts', content: 'real entry' }]);
    });
  });

  describe('appendMemory', () => {
    it('creates file from scratch with template header', () => {
      const result = appendMemory(testDir, 'first fact');
      expect(result.success).toBe(true);
      const raw = fs.readFileSync(memPath, 'utf-8');
      expect(raw).toContain('# Project Memory');
      expect(raw).toContain('## facts');
      expect(raw).toContain('- first fact');
    });

    it('appends to existing section', () => {
      appendMemory(testDir, 'fact one');
      appendMemory(testDir, 'fact two');
      const entries = loadMemoryEntries(testDir);
      expect(entries).toHaveLength(2);
      expect(entries[1].content).toBe('fact two');
    });

    it('creates new section in category order', () => {
      appendMemory(testDir, 'a fact', 'facts');
      appendMemory(testDir, 'a decision', 'decisions');
      const raw = fs.readFileSync(memPath, 'utf-8');
      const decisionsIdx = raw.indexOf('## decisions');
      const factsIdx = raw.indexOf('## facts');
      expect(decisionsIdx).toBeGreaterThan(-1);
      expect(factsIdx).toBeGreaterThan(-1);
      expect(decisionsIdx).toBeLessThan(factsIdx);
    });

    it('defaults to facts category', () => {
      appendMemory(testDir, 'default test');
      const entries = loadMemoryEntries(testDir);
      expect(entries[0].category).toBe('facts');
    });

    it('rejects empty content', () => {
      const result = appendMemory(testDir, '   ');
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('creates .turbodev dir if missing', () => {
      expect(fs.existsSync(path.dirname(memPath))).toBe(false);
      appendMemory(testDir, 'creates dir');
      expect(fs.existsSync(memPath)).toBe(true);
    });
  });

  describe('clearMemory', () => {
    it('wipes everything and writes template', () => {
      appendMemory(testDir, 'fact', 'facts');
      appendMemory(testDir, 'pref', 'preferences');
      const result = clearMemory(testDir);
      expect(result.success).toBe(true);
      const raw = fs.readFileSync(memPath, 'utf-8');
      expect(raw).toBe('# Project Memory\n');
    });

    it('removes only the specified category', () => {
      appendMemory(testDir, 'fact', 'facts');
      appendMemory(testDir, 'pref', 'preferences');
      const result = clearMemory(testDir, 'facts' as MemoryCategory);
      expect(result.success).toBe(true);
      const entries = loadMemoryEntries(testDir);
      expect(entries).toHaveLength(1);
      expect(entries[0].category).toBe('preferences');
    });

    it('returns success on missing file when clearing specific category', () => {
      const result = clearMemory(testDir, 'facts' as MemoryCategory);
      expect(result.success).toBe(true);
    });

    it('returns success when clearing all on missing file', () => {
      const result = clearMemory(testDir);
      expect(result.success).toBe(true);
      expect(fs.existsSync(memPath)).toBe(true);
    });
  });
});
