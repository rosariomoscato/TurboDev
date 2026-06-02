# Troubleshooting

Common issues and solutions.

## Setup Issues

### "API key is required"

Make sure you have a valid OpenRouter API key. Run `/setup` to re-enter it.

Get a key at [openrouter.ai](https://openrouter.ai).

### "Model not found"

The model ID must match OpenRouter's format: `provider/model-name`. Use `/model` to browse available models.

## Agent Issues

### Agent not appearing in /agent list

- Check the file is in `.turbodev/agents/` (project) or `~/.config/turbodev/agents/` (global)
- Ensure the filename ends with `.md`
- Check that `disable: true` is not set
- Restart TurboDev after adding new agent files

### Custom agent not overriding built-in

The merge is **shallow** — only fields you specify are overridden. Make sure the filename matches the built-in name exactly (e.g., `editor.md` to override the editor agent).

### Permission prompt not appearing

- Verify the agent has `permission: edit: ask` (not `allow`)
- Check the tool is not disabled via `tools: edit_file: false` (disabled tools return an error immediately, no prompt)

## Tool Issues

### edit_file "not found" error

The `old_str` must match **exactly** — including whitespace and indentation. Copy the exact text from the file.

### bash command timeout

Increase the timeout in the command:

```
bash({ "command": "npm test", "timeout": 60000 })
```

## AGENTS.md Issues

### AGENTS.md not detected at startup

- The file must be in the **current working directory** where you launched TurboDev
- The filename must be exactly `AGENTS.md` (uppercase)
- If you create it during a session with `/init`, it's loaded immediately

### /init not detecting my project type

Project detection looks for:
- **Node.js**: `package.json`
- **Python**: `pyproject.toml` or `requirements.txt`
- **Rust**: `Cargo.toml`
- **Go**: `go.mod`

## General Issues

### AI freezes or takes too long

Press **Escape** to cancel the current request. The input bar will return and you can retry or rephrase your message.

If the issue persists:
- The model might be generating a very long response — try a faster model
- The context window might be full — use `/compact` to summarize the conversation
- Check your network connection to OpenRouter

### Request cancelled message

If you see `Request cancelled. You can try sending your message again.` — you (or a timeout) interrupted the request. Simply resend your message.

### TurboDev is slow

- Try a faster model (e.g., `anthropic/claude-haiku-4-20250514`)
- Use the plan agent for quick analysis without modifications
- Reduce `steps` in agent config to limit iterations

### Blanking or flickering screen

Make sure you're using a modern terminal emulator. Recommended:
- [WezTerm](https://wezterm.org)
- [Alacritty](https://alacritty.org)
- [Kitty](https://sw.kovidgoyal.net/kitty/)
- [iTerm2](https://iterm2.com) (macOS)
