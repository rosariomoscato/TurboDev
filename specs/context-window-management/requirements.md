# Requirements: Context Window Management

## Summary

TurboDev currently has no awareness of context window limits. Long conversations eventually hit the model's maximum context length, causing API errors or truncated responses. This feature adds full context window management: retrieve the context length from OpenRouter's model metadata, track token usage throughout the conversation, display a visual indicator in the status bar, warn the user before hitting the limit, and compact the conversation when needed — similar to OpenCode's compaction agent.

## Goals

- Retrieve and cache `context_length` for the selected model from OpenRouter API
- Track token usage in real time during conversation
- Display token usage in the status bar with color-coded indicator (green/yellow/red)
- Notify the user when token usage exceeds 75% of context window (informational only)
- Automatically compact the conversation when token usage exceeds 85% of context window
- Compaction is mandatory — the user cannot opt out, only gets notified beforehand

## Non-Goals

- Exact token counting (we use ~4 chars/token estimation; exact counting requires a tokenizer library)
- Automatic compaction without user consent
- Persisting conversation summaries across sessions
- Per-message token cost display (dollars/cents)

## Acceptance Criteria

- [ ] Context length is fetched from OpenRouter and cached per model
- [ ] Token usage is estimated and tracked after each LLM call
- [ ] Status bar shows "XK/YK" token indicator with color coding
- [ ] When usage exceeds 75%, user is notified "Context window filling up — compaction will happen soon"
- [ ] When usage exceeds 85%, compaction happens automatically (no user confirmation needed)
- [ ] Compaction summarizes the conversation and replaces history
- [ ] After compaction, conversation continues normally with reduced token count
- [ ] Compaction agent is hidden from the agent selector UI

## Assumptions

- OpenRouter's `/api/v1/models` endpoint returns `context_length` for each model (verified: it does)
- Token estimation via ~4 chars/token is sufficient for threshold detection
- OpenAI SDK streaming does NOT return `usage` data reliably — we fall back to estimation
- The compaction prompt should preserve key decisions, code changes, and file references

## Technical Constraints

- TypeScript with ESM modules, all imports use `.js` extensions
- UI uses React + Ink (terminal)
- No new dependencies required
- Build via tsup
- Must pass `npm run build` and `npm test` after each task
