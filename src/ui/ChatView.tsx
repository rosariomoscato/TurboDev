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