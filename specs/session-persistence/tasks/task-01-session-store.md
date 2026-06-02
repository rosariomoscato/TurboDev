# Task 01: Session types and file store

## Status

pending

## Wave

1

## Description

Create the Session type definition and a file-based store for CRUD operations on sessions. Sessions are stored as individual JSON files in `.turbodev/sessions/` within the project's working directory.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-02-app-integration.md

## Files to Create

- `src/session/types.ts` — Session type definition
- `src/session/store.ts` — File-based session store (save, load, list, delete)
- `src/session/__tests__/store.test.ts` — Unit tests

## Technical Details

### Session type

```typescript
export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: { role: string; content: string; agentName?: string }[];
  agentName: string;
  tokenCount: number;
  contextLength: number;
}
```

### Store functions

```typescript
export function getSessionsDir(cwd: string): string
// Returns `.turbodev/sessions/` path, creates if not exists

export function saveSession(cwd: string, session: Session): void
// Writes to `.turbodev/sessions/session-{id}.json`

export function loadSession(cwd: string, id: string): Session | null
// Reads and parses session file, returns null if not found

export function listSessions(cwd: string): Session[]
// Lists all sessions sorted by updatedAt descending (most recent first)

export function getLatestSession(cwd: string): Session | null
// Returns the most recently updated session

export function deleteSession(cwd: string, id: string): void
// Deletes a session file

export function generateSessionId(): string
// Returns a random 8-char hex string

export function generateTitle(firstMessage: string): string
// Returns first 50 chars of first message, trimmed
```

### Important

- Use `node:fs` and `node:path` — no dependencies
- All imports use `.js` extensions
- `mkdirSync` with `recursive: true` for directory creation
- Do NOT add comments to code

## Acceptance Criteria

- [ ] `Session` type defined with all fields
- [ ] `saveSession` writes JSON to disk
- [ ] `loadSession` reads and parses JSON
- [ ] `listSessions` returns sorted by updatedAt desc
- [ ] `getLatestSession` returns most recent
- [ ] `deleteSession` removes file
- [ ] `generateSessionId` returns random hex
- [ ] Unit tests cover all functions
- [ ] `npm run build` passes
- [ ] `npm test` passes
