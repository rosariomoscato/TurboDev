# Task 01: Token estimation and context length utilities

## Status

pending

## Wave

1

## Description

Create the foundational token utilities module and extend the models module to cache context lengths. The token estimation function will be used throughout the app to track conversation size. The context length cache will avoid re-fetching model metadata from OpenRouter on every call.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-03-loop-tracking.md, task-04-status-bar.md, task-05-compaction-logic.md

**Context from dependencies:** None — this is a foundation task.

## Files to Create

- `src/llm/tokens.ts` — Token estimation function and context length utilities

## Files to Modify

- `src/llm/models.ts` — Add context length caching and a `getContextLength()` function

## Technical Details

### Implementation Steps

1. Create `src/llm/tokens.ts` with:
   - `estimateTokens(text: string): number` — returns `Math.ceil(text.length / 4)`
   - `countMessageTokens(messages: ChatMessage[]): number` — sums `estimateTokens` for all message content plus role overhead (~4 tokens per message for role tags)

2. Update `src/llm/models.ts` to add:
   - A module-level `Map<string, number>` cache for context lengths
   - `cacheContextLengths(models: ModelInfo[]): void` — stores context lengths from fetched models
   - `getContextLength(modelId: string): Promise<number>` — returns cached value or fetches from OpenRouter API
   - Update `fetchAvailableModels()` to call `cacheContextLengths()` after fetching

### Code Snippets

```typescript
// src/llm/tokens.ts
import type { ChatMessage } from './client.js';

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function countMessageTokens(messages: ChatMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    total += estimateTokens(msg.content);
    total += 4; // role overhead
  }
  return total;
}
```

```typescript
// src/llm/models.ts — additions
const contextLengthCache = new Map<string, number>();

export function cacheContextLengths(models: ModelInfo[]): void {
  for (const model of models) {
    if (model.contextLength) {
      contextLengthCache.set(model.id, model.contextLength);
    }
  }
}

export function getContextLength(modelId: string): number {
  return contextLengthCache.get(modelId) ?? 128000;
}
```

### ChatMessage import

Import `ChatMessage` from `'./client.js'` in `tokens.ts`.

## Acceptance Criteria

- [ ] `estimateTokens('hello world')` returns a number > 0
- [ ] `countMessageTokens` sums tokens across all messages
- [ ] `cacheContextLengths` stores context lengths in the cache map
- [ ] `getContextLength` returns cached value or 128000 as default
- [ ] `fetchAvailableModels` calls `cacheContextLengths` after fetching
- [ ] `npm run build` passes
- [ ] `npm test` passes
