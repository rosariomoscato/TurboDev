# Terminal UI

Using TurboDev in the terminal.

## Starting a Session

```bash
cd /path/to/your/project
turbodev
```

TurboDev opens an interactive terminal session with:

- **Banner** — ASCII art logo, AGENTS.md status, and current agent (shown for 5 seconds)
- **Chat area** — Conversation history
- **Input bar** — Shows current agent name, type your messages here
- **Status bar** — Model, agent, token usage, cost, thinking indicator

## The Status Bar

The status bar at the bottom shows:

| Element | Description |
|---------|-------------|
| Model ID | Current LLM model |
| Agent name | Current agent with its color |
| Token usage | `X.XXK/YK` — tokens used / context window size |
| Cost | Cumulative session cost (e.g. `$0.0023`) |
| Spinner | Braille animation while the AI is thinking |

### Token Usage Indicator

Token usage is color-coded:

| Color | Meaning |
|-------|---------|
| Green | Below 50% of context window |
| Yellow | 50%–75% of context window |
| Red | Above 75% — auto-compaction triggers at 85% |

### Cost Tracking

The cost is calculated in real-time based on the model's per-token pricing from OpenRouter. It accumulates across all messages in the session and is persisted when the session is saved.

## Agent Colors

Each agent has a distinct color in the status bar:

| Agent | Color |
|-------|-------|
| editor | Cyan |
| plan | Yellow |

Custom agents can define their own color.

## Thinking Indicator

When the AI is processing, a braille spinner animates in the status bar:

```
⠋ AI thinking...
```

## Permission Prompts

When an agent needs approval (e.g., plan agent editing a file), you'll see:

```
? Allow edit_file?
  Command: editing AGENTS.md
  [y/n]
```

Type `y` to allow, `n` to deny.

## Question Prompts

Agents can ask you questions:

```
? Which test framework do you prefer?
  1. vitest
  2. jest
```

Type your answer and press Enter.

## Session Persistence

When you launch TurboDev and a previous session exists, you'll be prompted:

```
Resume previous session?
  My feature (4 min fa, 12 messages)
  [y/n]
```

Press `y` to restore the previous session, or `n` to start fresh. Sessions are automatically saved after every message exchange to `.turbodev/sessions/`.

## Interrupting Requests

While the AI is processing (spinner visible), you can press **Escape** to cancel the request immediately. The input bar is hidden during processing to prevent overlapping messages.

## Flow

1. Type your message and press Enter
2. AI processes and responds (with streaming)
3. If tools are needed, they execute automatically or ask permission
4. Response appears in the chat area
5. Repeat

## Next Steps

- [Commands](/en/usage/commands)
- [Keyboard Shortcuts](/en/usage/shortcuts)
