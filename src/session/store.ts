import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Session } from './types.js';

export function getSessionsDir(cwd: string): string {
  const dir = path.join(cwd, '.turbodev', 'sessions');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function generateSessionId(): string {
  return crypto.randomBytes(4).toString('hex');
}

export function generateTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().replace(/\n/g, ' ');
  return trimmed.length > 50 ? trimmed.slice(0, 47) + '...' : trimmed;
}

export function saveSession(cwd: string, session: Session): void {
  const dir = getSessionsDir(cwd);
  const filePath = path.join(dir, `session-${session.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
}

export function loadSession(cwd: string, id: string): Session | null {
  const dir = getSessionsDir(cwd);
  const filePath = path.join(dir, `session-${id}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function listSessions(cwd: string): Session[] {
  const dir = getSessionsDir(cwd);
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return entries
    .filter(e => e.startsWith('session-') && e.endsWith('.json'))
    .map(e => {
      try {
        const raw = fs.readFileSync(path.join(dir, e), 'utf-8');
        return JSON.parse(raw) as Session;
      } catch {
        return null;
      }
    })
    .filter((s): s is Session => s !== null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getLatestSession(cwd: string): Session | null {
  const sessions = listSessions(cwd);
  return sessions.length > 0 ? sessions[0] : null;
}

export function deleteSession(cwd: string, id: string): void {
  const dir = getSessionsDir(cwd);
  const filePath = path.join(dir, `session-${id}.json`);
  try {
    fs.unlinkSync(filePath);
  } catch {}
}
