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
| Agent name | Current agent with its color |
| Model | Current LLM model (short name) |
| Token usage | Mini progress bar `████░░░░░░` + `X.XXK/YK` + percentage |
| Cost | Cumulative session cost (e.g. `$0.0023`) |
| Economy badge | `ECO` (yellow) or `ULTRA` (red) when economy mode is active |
| Spinner | Braille animation with elapsed time (e.g. `⠋ AI thinking... 8s`) |

### Token Usage Indicator

Token usage includes a visual progress bar and is color-coded:

```
████░░░░░░ 1.24K/128K 12%
```

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

When the AI is processing, a braille spinner animates in the status bar and the response appears in real-time in the chat area — you'll see the text being typed word by word as it's generated:

```
⠋ AI thinking...
```

If the AI calls a tool (e.g., `read_file`), the streaming text briefly clears and resumes once the tool result is processed. This gives you immediate feedback that the agent is actively working.

## Permission Prompts

When an agent needs approval (e.g., plan agent editing a file), the prompt appears even while the AI is thinking. You can respond immediately:

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
