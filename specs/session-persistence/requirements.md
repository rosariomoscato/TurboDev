# Requirements: Session Persistence

## Summary

TurboDev currently loses all conversation state when closed. This feature adds session persistence — conversations are saved to disk as JSON files and automatically restored on next launch.

## Goals

- Save conversation history to disk after every message exchange
- Auto-load the most recent session on startup
- Support multiple sessions per project with listing and switching
- Compacted sessions are persisted in their compacted form

## Acceptance Criteria

- [ ] Sessions are saved as JSON files in `.turbodev/sessions/`
- [ ] On startup, the last active session is automatically loaded
- [ ] `/new` creates a new empty session
- [ ] `/sessions` lists all sessions with title and relative time
- [ ] Selecting a session from `/sessions` loads it
- [ ] Compaction saves the compacted version to disk

## Technical Constraints

- TypeScript with ESM modules, all imports use `.js` extensions
- No new dependencies
- Must pass `npm run build` and `npm test`
