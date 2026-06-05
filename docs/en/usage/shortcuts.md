# Keyboard Shortcuts

Navigate TurboDev efficiently.

## General

| Key | Action |
|-----|--------|
| `Enter` | Send message / Confirm |
| `Tab` | Switch between primary agents |
| `Escape` | Cancel current action / **Interrupt AI request** |

## Model Selector

| Key | Action |
|-----|--------|
| `↑` / `k` | Previous page |
| `↓` / `j` | Next page |
| `1`–`9` | Select model |
| `Esc` / `q` / `c` | Cancel |

## Agent Selector

| Key | Action |
|-----|--------|
| `1`–`9` | Select agent |
| `Esc` | Cancel |

## Session Selector

| Key | Action |
|-----|--------|
| `1`–`9` | Select session to restore |
| `Esc` | Cancel |

## Startup Session Prompt

| Key | Action |
|-----|--------|
| `y` | Resume previous session |
| `n` | Start a new empty session |

## Command Menu

| Key | Action |
|-----|--------|
| `/` | Open command menu |
| `↑` / `↓` | Navigate commands |
| `Enter` | Select command |

## @ Mention & File Referencing

### Agent mention

Type `@` followed by an agent name to invoke it directly:

```
@plan analyze the authentication flow
```

This sends your message to the specified agent regardless of which agent is currently active.

### File & folder referencing

Type `@` to open the reference selector, which lists all agents, files, and folders in your project:

```
@src/tools/read-file.ts explain what this does
```

**How it works:**

1. Type `@` in the input bar — the reference selector appears
2. Type to filter (e.g. `@src` shows only paths under `src/`)
3. Navigate with `↑`/`↓` and press `Enter` to select
4. Continue typing your instruction after the reference
5. Press `Enter` to send — the file content or folder listing is included as context for the AI

| Key | Action |
|-----|--------|
| `@` | Open reference selector |
| Type after `@` | Filter files, folders, and agents |
| `↑` / `↓` | Navigate the list |
| `Enter` | Select reference |
| `Esc` | Close selector |

**References:**
- **File** (`@src/App.tsx`) — the full file content is included in the message
- **Folder** (`@docs/`) — the file listing of the folder is included
- **Agent** (`@plan`) — routes the message to that agent
