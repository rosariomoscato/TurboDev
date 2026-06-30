# Economy Mode

TurboDev's **Economy Mode** reduces token consumption by instructing the AI to produce concise output. When active, the system prompt includes a directive that makes the LLM drop filler words, use sentence fragments, and keep code exact — same technical accuracy, ~50-70% fewer output tokens, direct cost savings.

Inspired by [Caveman](https://github.com/JuliusBrussee/caveman), implemented natively — no external skill or dependency.

## How It Works

1. You activate a level with `/economy eco` or `/economy ultra`
2. TurboDev adds a conciseness directive to the system prompt
3. The LLM produces shorter responses — fragments instead of paragraphs
4. Code, commands, file paths, and error messages stay **byte-exact**
5. The level is persisted in `~/.turbodevrc` and survives restarts

The economy directive costs ~60 tokens (negligible compared to the output savings).

## Levels

| Level | Description | Estimated Output Savings | Badge |
|---|---|---|---|
| `off` (default) | Normal output — full sentences, explanations | 0% | — |
| `eco` | Direct and concise. No filler, no pleasantries. | ~50% | `ECO` (yellow) |
| `ultra` | Telegraphic fragments. No explanations unless asked. | ~70% | `ULTRA` (red) |

## Commands

| Command | Description |
|---|---|
| `/economy` | Show current level and usage |
| `/economy eco` | Activate eco level (alias: `/economy on`) |
| `/economy ultra` | Activate ultra level |
| `/economy off` | Deactivate economy mode |

## Before / After

### Normal (69 tokens)

> "The reason your React component is re-rendering is likely because you're creating a new object reference on each render cycle. I'd recommend using useMemo to memoize the object."

### Eco (~35 tokens)

> "Component re-renders because inline object prop creates new ref each cycle. Wrap in `useMemo`."

### Ultra (~19 tokens)

> "Inline object prop = new ref each render = re-render. Use `useMemo`."

Same fix. Same accuracy. Fewer tokens.

## What Stays Exact

Economy mode compresses **prose style**, not **technical content**:

- ✅ Code blocks — byte-exact
- ✅ Commands and CLI flags — exact
- ✅ File paths — exact
- ✅ Error messages — exact
- ✅ User's language — preserved (Italian input → concise Italian output)
- ❌ Filler words ("let me...", "sure!", "I'll now...") — dropped
- ❌ Restating the question — dropped
- ❌ Transitions and pleasantries — dropped

## Persistence

The level is saved in `~/.turbodevrc`:

```json
{
  "economy": {
    "level": "eco"
  }
}
```

On startup, TurboDev loads the saved level and activates economy mode automatically. Toggle it anytime with `/economy`.

## StatusBar

When economy mode is active, the StatusBar shows a colored badge:

- `ECO` (yellow) — eco level active
- `ULTRA` (red) — ultra level active

The badge sits next to the cost indicator so you can see both savings and spending at a glance.

## When to Use

- **`eco`** — daily work. Direct responses, still readable. Best balance of clarity and savings.
- **`ultra`** — power sessions. Maximum density, minimal prose. You know what you're doing and just want the answer.
- **`off`** — learning/exploring. When you want full explanations and context.

## Inspiration

Economy Mode is inspired by [Caveman](https://github.com/JuliusBrussee/caveman) by Julius Brussee — a Claude Code skill that proved a simple prompt instruction can cut 65% of output tokens without losing technical accuracy. TurboDev implements its own native conciseness prompt; it does not bundle or install the Caveman skill.
