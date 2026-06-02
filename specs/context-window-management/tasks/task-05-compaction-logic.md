# Task 05: Compaction logic and automatic compaction

## Status

pending

## Wave

3

## Description

Implement the compaction flow in App.tsx with two thresholds: at 75% notify the user that compaction will happen soon, at 85% automatically compact the conversation. Compaction is mandatory — the user is only informed, never asked for permission. The compaction summarizes the conversation using the compaction agent and replaces the history.

## Dependencies

**Depends on:** task-01-token-utilities.md, task-02-compaction-agent.md, task-03-loop-tracking.md
**Blocks:** None

**Context from dependencies:**
- task-01 creates `src/llm/tokens.ts` with `countMessageTokens()` and `src/llm/models.ts` with `getContextLength()`
- task-02 adds `compactionAgent` to `src/agent/builtins.ts` — a hidden agent with a summarization prompt and all tools disabled
- task-03 adds `tokenCount` and `contextLength` fields to the `AgentResult` interface from `src/agent/loop.ts`

## Files to Create

- `src/agent/compaction.ts` — Compaction execution logic

## Files to Modify

- `src/ui/App.tsx` — Add compaction notification and automatic execution flow

## Technical Details

### Implementation Steps

1. **Create `src/agent/compaction.ts`**:

```typescript
import { chatCompletion, ChatMessage } from '../llm/client.js';
import { compactionAgent } from './builtins.js';

export async function compactConversation(
  messages: ChatMessage[],
  model?: string,
): Promise<{ summary: string; newMessages: ChatMessage[] }> {
  const conversationText = messages
    .filter(m => m.role !== 'system')
    .map(m => `[${m.role}]: ${m.content}`)
    .join('\n\n---\n\n');

  const compactionMessages: ChatMessage[] = [
    { role: 'system', content: compactionAgent.prompt! },
    { role: 'user', content: `Summarize this conversation:\n\n${conversationText}` },
  ];

  let summary = '';
  for await (const chunk of chatCompletion(compactionMessages, model)) {
    if (chunk.content) {
      summary += chunk.content;
    }
  }

  const systemMessage = messages.find(m => m.role === 'system');
  const newMessages: ChatMessage[] = [];
  if (systemMessage) {
    newMessages.push(systemMessage);
  }
  newMessages.push({
    role: 'user',
    content: `[Previous conversation summary]\n${summary}`,
  });

  return { summary, newMessages };
}
```

2. **Update `src/ui/App.tsx`** — Add a `compactionNotified` ref to track whether the 75% notification was already shown:

```typescript
const compactionNotified = useRef(false);
```

3. **Update `src/ui/App.tsx`** — Add compaction check in `handleUserInput`:

Before calling `runAgentWithAgent`, check thresholds:

```typescript
const handleUserInput = async (input: string) => {
  // ... existing checks for pendingPermission, pendingQuestion, etc.

  // Compaction: 75% notify, 85% auto-compact
  if (contextLength > 0 && tokenCount > 0) {
    const usageRatio = tokenCount / contextLength;

    if (usageRatio >= 0.85) {
      const percent = Math.round(usageRatio * 100);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Context window ${percent}% full (${formatTokens(tokenCount)}/${formatTokens(contextLength)}). Compacting conversation...`
      }]);

      try {
        const { newMessages } = await compactConversation(
          conversationHistory,
          currentAgent.model || config.model
        );
        setConversationHistory(newMessages);
        setTokenCount(0);
        compactionNotified.current = false;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Conversation compacted. Continuing.'
        }]);
      } catch {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Compaction failed. Continuing with full context.'
        }]);
      }
    } else if (usageRatio >= 0.75 && !compactionNotified.current) {
      compactionNotified.current = true;
      const percent = Math.round(usageRatio * 100);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Context window ${percent}% full (${formatTokens(tokenCount)}/${formatTokens(contextLength)}). Auto-compaction will trigger at 85%.`
      }]);
    }
  }

  // ... rest of handleUserInput (send to LLM)
};
```

4. **Add `formatTokens` helper** in App.tsx:

```typescript
function formatTokens(count: number): string {
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
}
```

5. **Import `compactConversation`** from `'../agent/compaction.js'` in App.tsx.

### Compaction flow

```
User sends message
  → Check: tokenCount / contextLength
    → >= 85%:
      1. Show "Context window 87% full. Compacting..."
      2. Compact: summarize conversation via compaction agent
      3. Replace conversationHistory with [system, summary]
      4. Reset tokenCount, reset notification flag
      5. Show "Compacted. Continuing."
      6. Proceed with user's original message
    → >= 75% (and not yet notified):
      1. Show "Context window 76% full. Auto-compaction at 85%."
      2. Set notified flag
      3. Proceed normally
    → < 75%:
      → Proceed normally
  → Send to LLM
  → Receive response
  → Update tokenCount from result
  → Status bar shows updated "XK/YK"
```

### Important notes

- The 75% notification fires only ONCE — the `compactionNotified` ref prevents repeated messages
- The notification flag is reset after compaction so it can fire again in future
- Compaction is automatic at 85% — no user confirmation required
- After compaction, the user's original message is still processed
- The `formatTokens` helper is the same one used in StatusBar

## Acceptance Criteria

- [ ] At 75% context usage, a one-time notification is shown: "Auto-compaction will trigger at 85%"
- [ ] At 85% context usage, compaction happens automatically without asking
- [ ] Compaction summarizes the conversation using the compaction agent
- [ ] After compaction, conversationHistory is replaced with system prompt + summary
- [ ] tokenCount is reset to 0 after compaction
- [ ] Notification flag is reset after compaction so it can fire again
- [ ] If compaction fails, an error message is shown and conversation continues
- [ ] The user's original message is still processed after compaction
- [ ] `npm run build` passes
- [ ] `npm test` passes
