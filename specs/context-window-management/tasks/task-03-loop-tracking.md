# Task 03: Token tracking in the agent loop

## Status

pending

## Wave

2

## Description

Wire token counting into the agent loop so that after each LLM call, the estimated token count of the conversation is available. The loop must return token usage information so the UI can display it and trigger compaction when needed.

## Dependencies

**Depends on:** task-01-token-utilities.md
**Blocks:** task-05-compaction-logic.md

**Context from dependencies:** task-01 creates `src/llm/tokens.ts` with `countMessageTokens(messages: ChatMessage[]): number` that sums estimated tokens across all messages. It also updates `src/llm/models.ts` with `getContextLength(modelId: string): number` that returns the cached context length for a model.

## Files to Modify

- `src/agent/loop.ts` — Add token count tracking to the agent loop result

## Technical Details

### Implementation Steps

1. Import `countMessageTokens` from `'../llm/tokens.js'` in `loop.ts`

2. Add `tokenCount` and `contextLength` fields to `AgentResult`:

```typescript
export interface AgentResult {
  messages: ChatMessage[];
  assistantResponse: string;
  toolCalls: number;
  tokenCount: number;
  contextLength: number;
  error?: {
    type: 'timeout' | 'api_error' | 'unknown';
    message: string;
  };
}
```

3. Import `getContextLength` from `'../llm/models.js'`

4. In `runAgent`, compute token count and context length:

```typescript
// After the while loop, before returning:
const tokenCount = countMessageTokens(messages);
const contextLength = getContextLength(agent.model || '');
```

5. Return them in the result object:

```typescript
return {
  messages,
  assistantResponse: fullAssistantResponse,
  toolCalls: totalToolCalls,
  tokenCount,
  contextLength,
};
```

6. Also add them to the error return paths (set to 0 for errors).

7. In `src/ui/App.tsx`, update the places where `AgentResult` is used to handle the new fields — but only minimally to avoid build errors. The actual UI integration is in task-04 and task-05.

### Important notes

- `countMessageTokens` is called on the full `messages` array AFTER the conversation is complete (post-while-loop)
- For the `contextLength`, if `agent.model` is undefined (uses global model), we need the global model. Import `loadConfig` from `'../config/store.js'` and use `agent.model || loadConfig().model`
- The error return paths should set `tokenCount: 0, contextLength: 0` to keep the interface consistent

## Acceptance Criteria

- [ ] `AgentResult` includes `tokenCount` and `contextLength` fields
- [ ] `runAgent` returns estimated token count of the final message array
- [ ] `runAgent` returns context length for the model being used
- [ ] Error paths include `tokenCount: 0, contextLength: 0`
- [ ] `npm run build` passes
- [ ] `npm test` passes
