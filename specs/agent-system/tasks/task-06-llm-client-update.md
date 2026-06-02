# Task 06: LLM Client Update

## Status

pending

## Wave

2

## Description

This task modifies the LLM client to accept `temperature` and `topP` as parameters instead of hardcoding them. Currently, `chatCompletion` in `src/llm/client.ts` hardcodes `temperature: 0.7` on line 58. This needs to become configurable so that each agent can specify its own temperature and topP values. This is a small but critical change that unblocks the agent loop parameterization.

## Dependencies

**Depends on:** None
**Blocks:** task-10-agent-loop-update.md (passes temperature/topP from agent config to chatCompletion)

**Context from dependencies:** No dependency on other tasks. This is a standalone modification to an existing file.

## Files to Modify

- `src/llm/client.ts` — Add optional temperature/topP parameters to `chatCompletion`

## Technical Details

### Current State

The current `chatCompletion` signature (line 36-40):
```ts
export async function* chatCompletion(
  messages: ChatMessage[],
  model?: string,
  timeoutMs?: number
): AsyncGenerator<StreamChunk>
```

The hardcoded temperature on line 58:
```ts
temperature: 0.7
```

### Implementation Steps

1. Add an `options` parameter to `chatCompletion`:
```ts
export async function* chatCompletion(
  messages: ChatMessage[],
  model?: string,
  timeoutMs?: number,
  options?: { temperature?: number; topP?: number }
): AsyncGenerator<StreamChunk>
```

2. Replace the hardcoded `temperature: 0.7` with:
```ts
temperature: options?.temperature ?? 0.7,
...(options?.topP !== undefined && { top_p: options.topP }),
```

3. That's it. No other changes needed.

### Code Change Detail

In the `client.chat.completions.create` call (around line 52-58), change from:
```ts
{
  model: modelToUse,
  messages: messages,
  stream: true,
  temperature: 0.7
}
```

To:
```ts
{
  model: modelToUse,
  messages: messages,
  stream: true,
  temperature: options?.temperature ?? 0.7,
  ...(options?.topP !== undefined && { top_p: options.topP }),
}
```

## Acceptance Criteria

- [ ] `chatCompletion` accepts an optional 4th parameter `options?: { temperature?: number; topP?: number }`
- [ ] When `options.temperature` is provided, it overrides the default `0.7`
- [ ] When `options.topP` is provided, `top_p` is included in the API request
- [ ] When no options are provided, behavior is identical to before (temperature: 0.7, no top_p)
- [ ] All existing callers of `chatCompletion` continue to work without changes (new param is optional)
- [ ] File compiles with `npx tsc --noEmit`

## Notes

- This is a backward-compatible change. The new parameter is optional and defaults match current behavior.
- The OpenRouter API uses `top_p` (snake_case) while our config uses `topP` (camelCase). The spread handles this mapping.
- Only `topP` is conditionally included (when explicitly set) because some models don't support it and sending `top_p: 1.0` (the default) might behave differently from omitting it entirely.
