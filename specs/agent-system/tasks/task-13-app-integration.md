# Task 13: App Integration — Agent Switching, @Mention, Permission UI

## Status

pending

## Wave

6

## Description

This is the final integration task that wires everything together in `App.tsx`. It adds: (1) agent state management and Tab-switching between primary agents, (2) `/agent` command to select agents from a list, (3) `@mention` parsing to invoke agents directly from chat input, (4) permission approval UI (inline `[y/n]` prompts when an agent's tool requires approval), (5) passing the current agent to StatusBar, InputBar, and `runAgent`. This task modifies no other files — it's the orchestration layer.

## Dependencies

**Depends on:** task-04-agent-registry.md (getPrimaryAgents, getSubagents, getAgent), task-09-task-tool.md (createTaskTool, registerTaskTool), task-10-agent-loop-update.md (runAgent accepts AgentConfig), task-11-ui-types-statusbar.md (updated types + StatusBar), task-12-chatview-inputbar.md (updated InputBar)
**Blocks:** None (final task)

**Context from dependencies:** task-04 provides `getPrimaryAgents(cwd)` returning `AgentConfig[]` and `getAgent(cwd, name)`. task-09 provides `createTaskTool(cwd, agent, runAgentFn)` which returns a tool function, and `registerTaskTool(fn)` which wires it into TOOL_REGISTRY. task-10 provides the updated `runAgent(message, history, context, agent, onStream, callbacks)` signature. task-11 updates `StatusBar` props to accept `agent`. task-12 updates `InputBar` props to accept `agentName` and adds `/agent` command.

## Files to Modify

- `src/ui/App.tsx` — Add agent state, Tab switching, @mention, permission UI, /agent command

## Technical Details

### New State

```ts
const [agents, setAgents] = useState<AgentConfig[]>(() => getPrimaryAgents(process.cwd()));
const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
const [currentAgent, setCurrentAgent] = useState<AgentConfig>(() => agents[0]);

const [pendingPermission, setPendingPermission] = useState<{
  tool: string;
  detail?: string;
  resolve: (allowed: boolean) => void;
} | null>(null);
```

### Tab Switching

Add to `useInput` handler (only when NOT in model selector and NOT in pending question):
```ts
if (key.tab && !showModelSelector && !pendingQuestion && !pendingPermission) {
  const primaryAgents = getPrimaryAgents(process.cwd());
  const nextIndex = (currentAgentIndex + 1) % primaryAgents.length;
  setCurrentAgentIndex(nextIndex);
  setCurrentAgent(primaryAgents[nextIndex]);
  registerTaskTool(createTaskTool(process.cwd(), primaryAgents[nextIndex], runAgent));
  return;
}
```

### Permission Approval Callback

```ts
const handlePermissionAsk = async (tool: string, detail?: string): Promise<boolean> => {
  const displayText = detail ? `${tool}: ${detail}` : tool;
  
  setMessages(prev => [...prev, {
    role: 'permission_ask' as const,
    content: displayText
  }]);

  return new Promise((resolve) => {
    setPendingPermission({ tool, detail, resolve });
  });
};

const handlePermissionAnswer = (answer: string) => {
  if (pendingPermission) {
    const approved = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
    setMessages(prev => [...prev, {
      role: 'user' as const,
      content: approved ? 'Allowed' : 'Denied'
    }]);
    pendingPermission.resolve(approved);
    setPendingPermission(null);
  }
};
```

### @mention Parsing

In `handleUserInput`, before the existing command/message processing:

```ts
const mentionMatch = input.match(/^@([\w-]+)(?:\s+(.*))?$/);
if (mentionMatch) {
  const agentName = mentionMatch[1];
  const message = mentionMatch[2] || '';
  const mentionedAgent = getAgent(process.cwd(), agentName);
  
  if (mentionedAgent) {
    setMessages(prev => [...prev, {
      role: 'user' as const,
      content: `@${agentName}: ${message}`
    }]);
    
    setStatus(`@${agentName} thinking...`);
    
    // Use the mentioned agent for this invocation
    const result = await runAgent(
      message || 'Hello',
      [],
      agentsContext,
      mentionedAgent,
      (chunk) => { /* same streaming logic */ },
      { onQuestion: handleQuestion, onPermissionAsk: handlePermissionAsk }
    );
    
    // Add response with agentName tag
    if (result.assistantResponse) {
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: result.assistantResponse,
        agentName: mentionedAgent.name
      }]);
    }
    
    setStatus('');
    return;
  }
}
```

### /agent Command

Add to the command handling section (after `/model` and before `/setup`):

```ts
if (command === 'agent') {
  const primaryAgents = getPrimaryAgents(process.cwd());
  setMessages(prev => [...prev, {
    role: 'assistant' as const,
    content: 'Available agents:\n' + primaryAgents.map((a, i) => 
      `${i + 1}. ${a.name} — ${a.description}${a.name === currentAgent.name ? ' (current)' : ''}`
    ).join('\n') + '\n\nType the agent number or name to switch.'
  }]);
  return;
}

// Check if input is a number matching an agent
const agentNum = parseInt(command, 10);
if (!isNaN(agentNum)) {
  const primaryAgents = getPrimaryAgents(process.cwd());
  if (agentNum > 0 && agentNum <= primaryAgents.length) {
    const selected = primaryAgents[agentNum - 1];
    setCurrentAgent(selected);
    setCurrentAgentIndex(agentNum - 1);
    registerTaskTool(createTaskTool(process.cwd(), selected, runAgent));
    setMessages(prev => [...prev, {
      role: 'assistant' as const,
      content: `Switched to agent: ${selected.name}`
    }]);
    return;
  }
}
```

### Updated runAgent Call

The existing `runAgent` call changes from:
```ts
const result = await runAgent(input, conversationHistory, agentsContext, (chunk) => {...}, { onQuestion: handleQuestion });
```

To:
```ts
const result = await runAgent(
  input, conversationHistory, agentsContext, currentAgent,
  (chunk) => {
    if (chunk.type === 'content') {
      finalContent += chunk.text;
    } else if (chunk.type === 'tool_call') {
      finalContent = '';
    }
  },
  { onQuestion: handleQuestion, onPermissionAsk: handlePermissionAsk }
);
```

### Updated JSX

Replace InputBar usage to include agent name:
```tsx
<InputBar onSubmit={handleUserInput} agentName={currentAgent.name} />
```

Replace StatusBar to include agent:
```tsx
<StatusBar model={config.model} status={status} agent={currentAgent} />
```

Add permission prompt UI (similar to question prompt):
```tsx
{pendingPermission ? (
  <Box flexDirection="column">
    <Text color="red" bold>? Allow {pendingPermission.tool}?</Text>
    {pendingPermission.detail && (
      <Text color="gray">  Command: {pendingPermission.detail}</Text>
    )}
    <Text color="gray">  [y/n]</Text>
    <InputBar onSubmit={handlePermissionAnswer} />
  </Box>
) : ...}
```

### Initialization

On mount, register the task tool for the default agent:
```ts
useEffect(() => {
  registerTaskTool(createTaskTool(process.cwd(), currentAgent, runAgent));
}, []);
```

## Acceptance Criteria

- [ ] Pressing Tab cycles through primary agents and updates StatusBar
- [ ] `/agent` command lists available agents with descriptions
- [ ] Typing a number after `/agent` switches to that agent
- [ ] `@agentname message` invokes the specified agent directly
- [ ] `@mention` with a non-existent agent shows an error message
- [ ] StatusBar displays the current agent name with configured color
- [ ] InputBar shows the current agent name (e.g., `You (editor):`)
- [ ] Permission approval prompts appear inline when plan agent tries to edit or run bash
- [ ] Typing `y` or `yes` approves the permission, anything else denies
- [ ] Denied permissions show "Denied" in chat and the tool returns an error to the agent
- [ ] The `task` tool is registered and functional for agents that have `task: true`
- [ ] Agent switching re-registers the task tool with the new agent context
- [ ] Build succeeds with `npm run build`

## Notes

- The `/agent` command is intentionally simple — it shows a numbered list and the user types the number. This avoids the complexity of the interactive model selector for now.
- The `@mention` regex `^@([\w-]+)` matches agent names with letters, numbers, underscores, and hyphens. This covers typical agent names like `code-reviewer`, `explore`, `security-auditor`.
- The permission prompt uses the same pattern as the existing question prompt — a pending state with a promise that resolves when the user types an answer.
- The `useEffect` for initial task tool registration should run once on mount. Since it depends on `currentAgent`, be careful not to create infinite re-renders. Use `[]` as the dependency array and capture `currentAgent` via ref if needed.
- Agent loading is synchronous (uses `fs.readFileSync` internally) so it's safe to call in `useState` initializers.
