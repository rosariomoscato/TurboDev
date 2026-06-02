# Task 02: App integration and commands

## Status

pending

## Wave

2

## Description

Wire session persistence into App.tsx: auto-load on startup, auto-save after every message, add `/new` and `/sessions` commands. Update InputBar with new commands.

## Dependencies

**Depends on:** task-01-session-store.md
**Blocks:** None

**Context from dependencies:** task-01 creates `src/session/types.ts` with `Session` type and `src/session/store.ts` with `saveSession`, `loadSession`, `listSessions`, `getLatestSession`, `generateSessionId`, `generateTitle`, `deleteSession`.

## Files to Modify

- `src/ui/App.tsx` — Session state, auto-load, auto-save, /new, /sessions
- `src/ui/InputBar.tsx` — Add /new and /sessions to commands list

## Technical Details

### App.tsx changes

1. Import session store functions and type
2. Add `sessionId` and `sessionTitle` state
3. On mount: call `getLatestSession(cwd)` — if found, restore messages, conversationHistory, tokenCount, contextLength, agentName
4. After each `runAgentWithAgent` call: call `saveSession()` with updated session data
5. Add `/new` command: save current session, reset all state, generate new session ID
6. Add `/sessions` command: show session list, let user pick by number, load selected session

### Auto-save function

```typescript
function autoSave() {
  if (!sessionId) return;
  saveSession(process.cwd(), {
    id: sessionId,
    title: sessionTitle,
    createdAt: sessionCreatedAt,
    updatedAt: new Date().toISOString(),
    messages: messages.map(m => ({ role: m.role, content: m.content, agentName: m.agentName })),
    agentName: currentAgent.name,
    tokenCount,
    contextLength,
  });
}
```

Call `autoSave()` after every message exchange (both normal and @mention flows).

### Session restore

On startup, if a session is found:
- Set `messages` state from session.messages
- Set `conversationHistory` from session messages (role must be 'user' or 'assistant')
- Set `tokenCount` and `contextLength` from session
- Find and set the agent by name

### /sessions command

Show list like:
```
Sessions:
1. Aggiungere OAuth (2 min fa)
2. Bug fix CSS (1 ora fa)
3. Refactor API (ieri)
```

User types number to load that session. Add a helper for relative time (e.g. "2 min fa", "1 ora fa", "ieri").

### /new command

Save current session (if any), then reset:
- Generate new session ID
- Clear messages, conversationHistory
- Reset tokenCount/contextLength
- Show "New session started"

### InputBar.tsx

Add to COMMANDS array (alphabetically):
```
{ label: '/new', value: '/new', description: 'Start new session' },
{ label: '/sessions', value: '/sessions', description: 'List and switch sessions' },
```

## Acceptance Criteria

- [ ] On startup, last session is auto-loaded with all messages
- [ ] After every message, session is auto-saved to disk
- [ ] `/new` creates a fresh session, old one preserved
- [ ] `/sessions` lists all sessions with title and relative time
- [ ] Selecting a session loads it fully
- [ ] Compaction saves compacted version
- [ ] `npm run build` passes
- [ ] `npm test` passes
