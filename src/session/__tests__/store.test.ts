import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  getSessionsDir,
  generateSessionId,
  generateTitle,
  saveSession,
  loadSession,
  listSessions,
  getLatestSession,
  deleteSession,
} from '../store.js';
import type { Session } from '../types.js';

const tmpBase = path.join(os.tmpdir(), 'turbodev-session-test');
const testDir = path.join(tmpBase, `test-${Date.now()}`);

afterAll(() => {
  fs.rmSync(tmpBase, { recursive: true, force: true });
});

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: generateSessionId(),
    title: 'Test session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    agentName: 'default',
    tokenCount: 0,
    contextLength: 128000,
    ...overrides,
  };
}

describe('generateSessionId', () => {
  it('returns an 8-character hex string', () => {
    const id = generateSessionId();
    expect(id).toHaveLength(8);
    expect(id).toMatch(/^[0-9a-f]{8}$/);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateSessionId()));
    expect(ids.size).toBe(50);
  });
});

describe('generateTitle', () => {
  it('returns short messages unchanged', () => {
    expect(generateTitle('hello world')).toBe('hello world');
  });

  it('truncates at 50 characters', () => {
    const msg = 'a'.repeat(60);
    const title = generateTitle(msg);
    expect(title).toHaveLength(50);
    expect(title).toBe('a'.repeat(47) + '...');
  });

  it('returns exactly 50-char message without truncation', () => {
    const msg = 'a'.repeat(50);
    expect(generateTitle(msg)).toBe(msg);
  });

  it('replaces newlines with spaces', () => {
    expect(generateTitle('hello\nworld')).toBe('hello world');
  });

  it('trims leading/trailing whitespace', () => {
    expect(generateTitle('  hello  ')).toBe('hello');
  });
});

describe('saveSession + loadSession', () => {
  it('roundtrips a session to disk and back', () => {
    const session = makeSession({ title: 'roundtrip test' });
    saveSession(testDir, session);
    const loaded = loadSession(testDir, session.id);
    expect(loaded).toEqual(session);
  });

  it('persists messages correctly', () => {
    const session = makeSession({
      messages: [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi there', agentName: 'coder' },
      ],
    });
    saveSession(testDir, session);
    const loaded = loadSession(testDir, session.id);
    expect(loaded!.messages).toHaveLength(2);
    expect(loaded!.messages[1].agentName).toBe('coder');
  });
});

describe('loadSession', () => {
  it('returns null for nonexistent session', () => {
    const result = loadSession(testDir, 'nonexistent');
    expect(result).toBeNull();
  });
});

describe('listSessions', () => {
  it('returns empty array when no sessions exist', () => {
    const emptyDir = path.join(testDir, 'empty-list-test');
    expect(listSessions(emptyDir)).toEqual([]);
  });

  it('returns sessions sorted by updatedAt descending', () => {
    const dir = path.join(testDir, 'sorted-test');
    const older = makeSession({
      id: 'older0001',
      updatedAt: new Date('2025-01-01').toISOString(),
    });
    const newer = makeSession({
      id: 'newer0001',
      updatedAt: new Date('2025-06-01').toISOString(),
    });
    const middle = makeSession({
      id: 'middle001',
      updatedAt: new Date('2025-03-01').toISOString(),
    });

    saveSession(dir, older);
    saveSession(dir, newer);
    saveSession(dir, middle);

    const sessions = listSessions(dir);
    expect(sessions.map(s => s.id)).toEqual(['newer0001', 'middle001', 'older0001']);
  });
});

describe('getLatestSession', () => {
  it('returns null when no sessions exist', () => {
    const dir = path.join(testDir, 'no-latest-test');
    expect(getLatestSession(dir)).toBeNull();
  });

  it('returns the most recent session', () => {
    const dir = path.join(testDir, 'latest-test');
    const old = makeSession({
      id: 'oldlatest',
      updatedAt: new Date('2025-01-01').toISOString(),
    });
    const latest = makeSession({
      id: 'newlatest',
      updatedAt: new Date('2025-12-01').toISOString(),
    });
    saveSession(dir, old);
    saveSession(dir, latest);

    const result = getLatestSession(dir);
    expect(result!.id).toBe('newlatest');
  });
});

describe('deleteSession', () => {
  it('removes the session file', () => {
    const dir = path.join(testDir, 'delete-test');
    const session = makeSession({ id: 'todelete' });
    saveSession(dir, session);
    expect(loadSession(dir, 'todelete')).not.toBeNull();

    deleteSession(dir, 'todelete');
    expect(loadSession(dir, 'todelete')).toBeNull();
  });

  it('does not throw for nonexistent session', () => {
    const dir = path.join(testDir, 'delete-noexist');
    expect(() => deleteSession(dir, 'ghost')).not.toThrow();
  });
});
