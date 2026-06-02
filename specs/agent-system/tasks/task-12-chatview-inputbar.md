# Task 12: ChatView and InputBar Update

## Status

pending

## Wave

5

## Description

This task updates the ChatView and InputBar components for agent awareness. ChatView gains the ability to show agent name prefixes on messages (e.g., `[review]` for subagent responses) and a distinct visual style for `permission_ask` messages. InputBar adds the `/agent` command to its command list and shows the current agent name in the input prompt.

## Dependencies

**Depends on:** task-11-ui-types-statusbar.md (updated MessageDisplay type with `permission_ask` and `agentName`)
**Blocks:** task-13-app-integration.md (uses updated components)

**Context from dependencies:** task-11 updates `MessageDisplay` to include `permission_ask` role and `agentName` field. This task updates the rendering components to use those new fields.

## Files to Modify

- `src/ui/ChatView.tsx` — Render agent name prefix and permission_ask style
- `src/ui/InputBar.tsx` — Add `/agent` command and show agent name in prompt

## Technical Details

### ChatView.tsx Changes

1. Update `getColor` to handle `permission_ask`:
```ts
const getColor = (role: string) => {
  switch (role) {
    case 'user': return 'cyan';
    case 'question': return 'magenta';
    case 'tool_call': return 'yellow';
    case 'tool_result': return 'green';
    case 'permission_ask': return 'red';
    default: return 'gray';
  }
};
```

2. When rendering assistant messages, if `msg.agentName` exists, show a prefix:
```tsx
if (msg.role === 'assistant') {
  return (
    <Box key={i} flexDirection="column">
      {msg.agentName && (
        <Text color="magenta" bold>[{msg.agentName}]</Text>
      )}
      <Text>{renderMarkdown(msg.content)}</Text>
    </Box>
  );
}
```

3. When rendering `permission_ask` messages, show a distinct format:
```tsx
if (msg.role === 'permission_ask') {
  return (
    <Box key={i}>
      <Text color="red" bold>? Allow {msg.content}?</Text>
    </Box>
  );
}
```

### InputBar.tsx Changes

1. Add `/agent` to `COMMANDS`:
```ts
const COMMANDS = [
  { label: '/help', value: '/help', description: 'Show available commands' },
  { label: '/init', value: '/init', description: 'Initialize AGENTS.md' },
  { label: '/model', value: '/model', description: 'Select your model' },
  { label: '/agent', value: '/agent', description: 'Switch agent' },
  { label: '/setup', value: '/setup', description: 'Re-run setup wizard' },
  { label: '/clear', value: '/clear', description: 'Clear chat history' },
  { label: '/exit', value: '/exit', description: 'Exit TurboDev' },
];
```

2. Add optional `agentName` prop and show it in the prompt:
```ts
interface Props {
  onSubmit: (input: string) => void;
  agentName?: string;
}
```

Update the prompt label:
```tsx
<Text color="cyan" bold>You{agentName ? ` (${agentName})` : ''}:</Text>
```

## Acceptance Criteria

- [ ] ChatView renders `[agentName]` prefix on assistant messages that have `agentName` set
- [ ] ChatView renders `permission_ask` messages with red color and distinct format
- [ ] InputBar includes `/agent` in the command list
- [ ] InputBar shows agent name in the prompt when `agentName` prop is provided (e.g., `You (editor):`)
- [ ] InputBar works correctly when `agentName` is undefined (backward compatible)
- [ ] Both files compile with `npx tsc --noEmit`

## Notes

- The `agentName` prop on InputBar is optional for backward compatibility — the component works without it.
- The agent name prefix in ChatView is deliberately simple: just `[name]` in magenta bold. No need for complex formatting.
- The `permission_ask` rendering is a question-style prompt that will be paired with a user input field in App.tsx (handled in task-13).
