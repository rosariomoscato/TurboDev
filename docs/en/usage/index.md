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
- **Status bar** — Current model, agent name and color, thinking indicator

## The Status Bar

The status bar at the bottom shows:

| Element | Description |
|---------|-------------|
| Model ID | Current LLM model |
| Agent name | Current agent with its color |
| Spinner | Braille animation while the AI is thinking |

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

## Flow

1. Type your message and press Enter
2. AI processes and responds (with streaming)
3. If tools are needed, they execute automatically or ask permission
4. Response appears in the chat area
5. Repeat

## Next Steps

- [Commands](/en/usage/commands)
- [Keyboard Shortcuts](/en/usage/shortcuts)
