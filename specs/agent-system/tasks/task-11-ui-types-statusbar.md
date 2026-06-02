# Task 11: UI Types and StatusBar Update

## Status

pending

## Wave

5

## Description

This task updates the UI type definitions and the StatusBar component to support the agent system. The `MessageDisplay` type gains an optional `agentName` field (for distinguishing subagent responses in chat), and a new `permission_ask` role (for inline approval prompts). The StatusBar shows the current agent name with its configured color alongside the existing model and status information.

## Dependencies

**Depends on:** task-01-agent-types.md (AgentConfig type)
**Blocks:** task-12-chatview-inputbar.md (uses updated types), task-13-app-integration.md (passes agent to StatusBar)

**Context from dependencies:** task-01 creates `AgentConfig` with `name` and `color` fields. This task uses those fields to display agent info in the StatusBar and tag messages with their source agent.

## Files to Modify

- `src/ui/types.ts` — Add `permission_ask` role and `agentName` field to MessageDisplay
- `src/ui/StatusBar.tsx` — Show current agent name with color

## Technical Details

### types.ts Changes

Current:
```ts
export interface MessageDisplay {
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'question';
  content: string;
}
```

Updated:
```ts
export interface MessageDisplay {
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'question' | 'permission_ask';
  content: string;
  agentName?: string;
}
```

### StatusBar.tsx Changes

Current props:
```ts
interface Props {
  model?: string;
  status?: string;
}
```

Updated props:
```ts
interface Props {
  model?: string;
  status?: string;
  agent?: AgentConfig;
}
```

The StatusBar renders: `TurboDev | <agent.name> | <model> | <status>`

The agent name uses its configured color. Map agent color values to Ink color names:

```ts
function mapAgentColor(color?: string): string {
  const colorMap: Record<string, string> = {
    cyan: 'cyan',
    yellow: 'yellow',
    green: 'green',
    red: 'red',
    magenta: 'magenta',
    blue: 'blue',
    gray: 'gray',
  };
  if (!color) return 'cyan';
  if (colorMap[color]) return colorMap[color];
  if (color.startsWith('#')) return 'cyan';
  return 'cyan';
}
```

In the render, add the agent name between "TurboDev" and the model:
```tsx
<Box borderStyle="single" paddingX={1} width={width}>
  <Text color="gray">TurboDev</Text>
  <Text color="gray"> | </Text>
  <Text color={mapAgentColor(agent?.color)}>{agent?.name || 'editor'}</Text>
  <Text color="gray"> | </Text>
  <Text color="cyan">{modelText}</Text>
  {/* existing status rendering */}
</Box>
```

## Acceptance Criteria

- [ ] `MessageDisplay.role` includes `'permission_ask'`
- [ ] `MessageDisplay` has optional `agentName?: string` field
- [ ] StatusBar accepts optional `agent?: AgentConfig` prop
- [ ] StatusBar displays agent name between "TurboDev" label and model name
- [ ] Agent name is rendered with its configured color
- [ ] StatusBar looks correct when `agent` is undefined (falls back to "editor")
- [ ] Both files compile with `npx tsc --noEmit`

## Notes

- The `mapAgentColor` function handles hex colors by falling back to cyan, since Ink's `<Text color>` only supports named colors. Full hex support would require converting hex to the nearest named color — not worth the complexity.
- The `agentName` field on `MessageDisplay` is optional to maintain backward compatibility with existing messages that don't have it.
