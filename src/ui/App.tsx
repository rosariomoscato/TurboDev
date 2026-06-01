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