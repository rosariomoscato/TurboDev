# Task 04: Status bar token usage indicator

## Status

pending

## Wave

2

## Description

Add a visual token usage indicator to the status bar showing "XK/YK" with color coding based on usage percentage. Also filter hidden agents (like compaction) from the agent display. The status bar receives token data from App.tsx as new props.

## Dependencies

**Depends on:** task-01-token-utilities.md
**Blocks:** None

**Context from dependencies:** task-01 creates `src/llm/tokens.ts` with token estimation utilities. The format function for displaying token counts can use a simple `Math.round(count / 1000)` to show "K" values.

## Files to Modify

- `src/ui/StatusBar.tsx` — Add token usage display with color coding
- `src/ui/App.tsx` — Add `tokenCount` and `contextLength` state, pass to StatusBar, filter hidden agents

## Technical Details

### Implementation Steps

1. **StatusBar.tsx** — Add new props:

```typescript
interface Props {
  model?: string;
  status?: string;
  agent?: AgentConfig;
  tokenCount?: number;
  contextLength?: number;
}
```

2. **StatusBar.tsx** — Add a `formatTokens` helper:

```typescript
function formatTokens(count: number): string {
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
}
```

3. **StatusBar.tsx** — Add token indicator rendering (after model text):

```typescript
const usagePercent = contextLength ? (tokenCount || 0) / contextLength : 0;
let tokenColor = 'green';
if (usagePercent > 0.75) tokenColor = 'red';
else if (usagePercent > 0.5) tokenColor = 'yellow';

// In the JSX, after the model text:
{tokenCount !== undefined && contextLength ? (
  <>
    <Text color="gray"> | </Text>
    <Text color={tokenColor}>{formatTokens(tokenCount)}/{formatTokens(contextLength)}</Text>
  </>
) : null}
```

4. **App.tsx** — Add state for token tracking:

```typescript
const [tokenCount, setTokenCount] = useState(0);
const [contextLength, setContextLength] = useState(0);
```

5. **App.tsx** — Update `runAgentWithAgent` to extract token data from result:

After getting the result from `runAgent`, update state:
```typescript
setTokenCount(result.tokenCount);
setContextLength(result.contextLength);
```

6. **App.tsx** — Pass new props to StatusBar:

```tsx
<StatusBar model={config.model} status={status} agent={currentAgent} tokenCount={tokenCount} contextLength={contextLength} />
```

7. **App.tsx** — Filter hidden agents from `primaryAgents` used in display. In the `allAgents` state initialization or the `primaryAgents` derivation, filter out `hidden: true`:

```typescript
const [primaryAgents] = useState<AgentConfig[]>(
  () => allAgents.filter(a => a.mode !== 'subagent' && !a.hidden)
);
```

### Color coding thresholds

| Usage | Color | Meaning |
|-------|-------|---------|
| 0-50% | green | Plenty of room |
| 50-75% | yellow | Getting full |
| >75% | red | Compaction imminent |

### Status bar layout after changes

```
TurboDev | editor | anthropic/claude-sonnet-4 | 45K/200K
```

## Acceptance Criteria

- [ ] StatusBar shows "XK/YK" token indicator when token data is available
- [ ] Indicator color is green when <50%, yellow when 50-80%, red when >80%
- [ ] Indicator is hidden when no token data is available (0/0)
- [ ] Hidden agents (compaction) do not appear in agent selector or Tab cycling
- [ ] `npm run build` passes
- [ ] `npm test` passes
