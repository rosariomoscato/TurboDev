# Sessions

Manage conversation sessions.

TurboDev automatically saves every conversation to disk. You can resume a previous session or start a new one at any time.

## Startup

When you launch TurboDev and a previous session exists, you'll be prompted:

```
Resume previous session?
  Session title (4 min ago, 12 messages)
  [y/n]
```

- Press **y** to resume the previous session with all messages and context intact
- Press **n** to start a fresh empty session

## Auto-Save

Sessions are automatically saved after every message exchange to:

```
.turbodev/sessions/session-{id}.json
```

Each session stores:

- Messages (user and assistant)
- Token count and context length
- Cumulative session cost
- Active agent name

## Managing Sessions

### /new

Starts a new empty session. The current session is automatically saved first.

```
/new
```

### /sessions

Lists all saved sessions, sorted by most recent:

```
/sessions
```

Example output:

```
Sessions:
1. Add OAuth feature (2 min ago)
2. Fix CSS bug (1 hour ago)
3. Refactor API (yesterday)
1-3 select · Esc cancel
```

Type the session number to restore it. The current session is saved before switching.

## Back to Usage

- [Terminal UI](/en/usage/)
- [Commands](/en/usage/commands)
