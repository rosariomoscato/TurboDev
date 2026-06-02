# Task 07: Chat UI + CLI Entry Point

## Status

complete

## Wave

4

## Description

Implement the main chat UI with ink components (App, ChatView, InputBar, StatusBar) and the CLI entry point that wires everything together. The App component checks configuration and shows either the SetupWizard (if no config) or the ChatView (if configured). The ChatView displays the conversation with streaming AI responses and tool calls. The InputBar handles user input with commands. The StatusBar shows model info and status. The CLI entry point in `src/index.tsx` renders the App and handles command-line flags.

## Dependencies

**Depends on:** task-02-config-store (loadConfig), task-05-agent-loop (runAgent), task-06-setup-wizard (SetupWizard component)
**Blocks:** None (this is the final task)

**Context from dependencies:** Task-02 provides config checking. Task-05 provides `runAgent()` function with streaming callback. Task-06 provides SetupWizard component. The App orchestrates these: check config → if missing, show SetupWizard → if present, run ChatView with agent loop integration.

## Files to Create

- `src/ui/ChatView.tsx` — Chat message display component
- `src/ui/InputBar.tsx` — User input component with command handling
- `src/ui/StatusBar.tsx` — Status bar with model info
- `src/ui/App.tsx` — Root app component (wires SetupWizard and ChatView)

## Files to Modify

- `src/index.tsx` — Replace skeleton with full CLI entry point

## Technical Details

### Implementation Steps

#### 1. ChatView Component (src/ui/ChatView.tsx)

1. Import ink components: Box, Text, ScrollBox (or Box with manual scrolling)
2. Accept props: messages array, streaming text
3. Render messages with color coding:
   - User messages: blue/cyan
   - Assistant messages: white/gray
   - Tool calls: yellow/orange
   - Tool results: green
4. Show streaming text as it arrives
5. Auto-scroll to bottom when new content arrives

```typescript
import React, { useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { ChatMessage } from '../llm/client.js';
import { AgentStreamChunk } from '../agent/loop.js';

interface MessageDisplay {
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result';
  content: string;
}

interface Props {
  messages: MessageDisplay[];
  streamingContent?: string;
}

export default function ChatView({ messages, streamingContent }: Props) {
  const scrollRef = useRef(null);

  const getColor = (role: string) => {
    switch (role) {
      case 'user': return 'cyan';
      case 'assistant': return 'white';
      case 'tool_call': return 'yellow';
      case 'tool_result': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Box flexDirection="column" width={100} height={20}>
      {messages.map((msg, i) => (
        <Box key={i} width={100}>
          <Text color={getColor(msg.role)}>{msg.content}</Text>
        </Box>
      ))}
      {streamingContent && (
        <Box width={100}>
          <Text color="white">{streamingContent}</Text>
        </Box>
      )}
    </Box>
  );
}
```

#### 2. InputBar Component (src/ui/InputBar.tsx)

1. Import TextInput from ink-text-input
2. State: inputValue
3. Props: onSubmit callback
4. Handle commands: `/help`, `/model`, `/clear`, `/exit`
5. For non-commands, pass to onSubmit

```typescript
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
  onSubmit: (input: string) => void;
}

export default function InputBar({ onSubmit }: Props) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value);
    setValue('');
  };

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan" bold>You:</Text>
        <Text color="gray"> </Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          placeholder="Type a message..."
        />
      </Box>
    </Box>
  );
}
```

#### 3. StatusBar Component (src/ui/StatusBar.tsx)

1. Import Box, Text from ink
2. Props: model, status message
3. Display model name and status at bottom of screen

```typescript
import { Box, Text } from 'ink';

interface Props {
  model?: string;
  status?: string;
}

export default function StatusBar({ model, status }: Props) {
  return (
    <Box borderStyle="single" paddingX={1} width={100}>
      <Text color="gray">TurboDev</Text>
      <Text color="gray"> | </Text>
      <Text color="cyan">{model || 'No model'}</Text>
      {status && (
        <>
          <Text color="gray"> | </Text>
          <Text color="yellow">{status}</Text>
        </>
      )}
    </Box>
  );
}
```

#### 4. App Component (src/ui/App.tsx)

1. Import all components and utilities
2. State: messages array, conversationHistory, config, setupNeeded
3. On mount: check config, if missing set setupNeeded=true
4. Show SetupWizard if setupNeeded, else ChatView + InputBar + StatusBar
5. Handle user input: pass to runAgent, update messages with streaming
6. Handle commands: /help (show help), /model (show current), /clear (clear chat), /exit (exit)

```typescript
import React, { useState, useEffect } from 'react';
import { Box, render, useApp } from 'ink';
import { loadConfig } from '../config/store.js';
import { runAgent } from '../agent/loop.js';
import { ChatMessage } from '../llm/client.js';
import SetupWizard from './SetupWizard.js';
import ChatView from './ChatView.js';
import InputBar from './InputBar.js';
import StatusBar from './StatusBar.js';

interface MessageDisplay {
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result';
  content: string;
}

export default function App() {
  const { exit } = useApp();
  const [config, setConfig] = useState(loadConfig());
  const [setupNeeded, setSetupNeeded] = useState(!config.apiKey || !config.model);
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [status, setStatus] = useState('');

  const handleUserInput = async (input: string) => {
    if (input.startsWith('/')) {
      const command = input.slice(1);
      
      if (command === 'help') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Commands: /help, /model, /clear, /exit'
        }]);
        return;
      }
      
      if (command === 'model') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Current model: ${config.model}`
        }]);
        return;
      }
      
      if (command === 'clear') {
        setMessages([]);
        setConversationHistory([]);
        return;
      }
      
      if (command === 'exit') {
        exit();
        return;
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Unknown command: ${command}`
      }]);
      return;
    }
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setStatus('AI thinking...');
    
    const result = await runAgent(
      input,
      conversationHistory,
      (chunk) => {
        if (chunk.type === 'content') {
          setStreamingContent(prev => prev + chunk.text);
        } else if (chunk.type === 'tool_call') {
          setMessages(prev => [...prev, { role: 'tool_call', content: chunk.text }]);
        } else if (chunk.type === 'tool_result') {
          setMessages(prev => [...prev, { role: 'tool_result', content: chunk.text }]);
        }
      }
    );
    
    if (streamingContent) {
      setMessages(prev => [...prev, { role: 'assistant', content: streamingContent }]);
      setStreamingContent('');
    }
    
    setConversationHistory(result.messages);
    setStatus('');
  };

  if (setupNeeded) {
    return (
      <SetupWizard
        onComplete={() => {
          setConfig(loadConfig());
          setSetupNeeded(false);
        }}
      />
    );
  }

  return (
    <Box flexDirection="column" height={30} width={100}>
      <Box flexGrow={1}>
        <ChatView messages={messages} streamingContent={streamingContent} />
      </Box>
      <Box width={100}>
        <InputBar onSubmit={handleUserInput} />
      </Box>
      <Box width={100}>
        <StatusBar model={config.model} status={status} />
      </Box>
    </Box>
  );
}
```

#### 5. CLI Entry Point (src/index.tsx)

1. Import ink's render function and App component
2. Parse command-line flags: `--setup` (force setup wizard)
3. If --setup flag, render SetupWizard directly
4. Otherwise, render App

```typescript
#!/usr/bin/env node

import { render } from 'ink';
import App from './ui/App.js';

const args = process.argv.slice(2);

if (args.includes('--setup')) {
  import('./ui/SetupWizard.js').then(({ default: SetupWizard }) => {
    render(<SetupWizard onComplete={() => process.exit(0)} />);
  });
} else {
  render(<App />);
}
```

### Code Snippets

All code snippets are provided above in Implementation Steps.

### Environment Variables

- None

### API Endpoints

- None (uses chatCompletion from task-04 via task-05)

## Acceptance Criteria

- [ ] App component checks config on mount
- [ ] App shows SetupWizard if apiKey or model is missing
- [ ] App shows ChatView when config is complete
- [ ] ChatView displays messages with correct color coding
- [ ] ChatView shows streaming text in real-time
- [ ] InputBar accepts user input and calls onSubmit
- [ ] User messages are added to messages array
- [ ] AI responses are streamed and added to messages array
- [ ] Tool calls are displayed with tool_call role
- [ ] Tool results are displayed with tool_result role
- [ ] StatusBar shows current model name
- [ ] StatusBar shows status during AI processing
- [ ] /help command shows available commands
- [ ] /model command shows current model
- [ ] /clear command clears message history
- [ ] /exit command exits the application
- [ ] CLI entry point renders App component
- [ ] `turbodev --setup` forces setup wizard
- [ ] `turbodev` without args shows chat UI (or setup if needed)

## Notes

- The app uses a simple flat messages array for display; conversationHistory is separate for LLM context
- Streaming content is accumulated in a temporary state and committed to messages after stream ends
- The app intentionally keeps a simple layout: chat view at top, input bar, then status bar at bottom
- Error handling in the agent loop is minimal; errors from LLM client will throw and terminate the stream
- The CLI entry point uses dynamic import for SetupWizard to avoid importing it unnecessarily
- No conversation persistence across sessions is implemented (out of scope per requirements)
- The design prioritizes simplicity and follows the article's philosophy of minimal, focused code