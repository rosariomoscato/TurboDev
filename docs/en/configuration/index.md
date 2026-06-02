# Configuration

Configure TurboDev for your workflow.

## Setup Wizard

On first launch, TurboDev runs an interactive setup wizard:

1. **API Key** — Enter your OpenRouter API key
2. **Model** — Select your default LLM model

Re-run the wizard anytime with `/setup`.

## Changing Your Model

Use the `/model` command to browse and switch models during a session:

```
/model
```

This opens an interactive selector with popular models. Navigate with arrow keys, select with a number.

## Configuration Storage

TurboDev stores configuration in:

```
~/.config/turbodev/config.json
```

This file contains:

```json
{
  "apiKey": "sk-or-...",
  "model": "anthropic/claude-sonnet-4-20250514"
}
```

::: warning
Never commit your API key to version control.
:::

## Next Steps

- [Models](/en/configuration/models) — Browse available models
- [AGENTS.md](/en/configuration/agents-md) — Project context file
