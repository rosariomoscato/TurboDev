# Models

Choose and configure LLM models.

TurboDev uses [OpenRouter](https://openrouter.ai) to access a wide range of LLM models from providers like Anthropic, OpenAI, Google, Meta, and more.

## Changing Model

### During a Session

Use the `/model` command to open the interactive model selector:

```
/model
```

Navigate with `↑`/`↓` or `j`/`k`, select with a number, cancel with `Esc` or `q`.

### Per-Agent Model

Each agent can use a different model. Set it in the agent's Markdown configuration:

```markdown
---
description: Fast planning agent
model: anthropic/claude-haiku-4-20250514
mode: primary
---
```

## Popular Models

| Model | Provider | Best For |
|-------|----------|----------|
| `anthropic/claude-sonnet-4-20250514` | Anthropic | General coding, complex tasks |
| `anthropic/claude-haiku-4-20250514` | Anthropic | Fast analysis, planning |
| `openai/gpt-4o` | OpenAI | General purpose |
| `google/gemini-2.5-pro` | Google | Long context tasks |
| `deepseek/deepseek-chat` | DeepSeek | Budget-friendly coding |

## Model Parameters

You can fine-tune model behavior per-agent:

### Temperature

Controls randomness. Lower = more focused, higher = more creative.

```markdown
---
description: Precise analyzer
temperature: 0.1
---
```

| Range | Behavior |
|-------|----------|
| 0.0–0.2 | Very focused, deterministic |
| 0.3–0.5 | Balanced |
| 0.6–1.0 | Creative, varied |

### Top P

Alternative to temperature for controlling response diversity.

```markdown
---
description: Diverse brainstorming
top_p: 0.9
---
```

## Back to Configuration

- [Configuration](/en/configuration/)
- [AGENTS.md](/en/configuration/agents-md)
