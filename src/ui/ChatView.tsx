import React from 'react';
import { Box, Text } from 'ink';

interface MessageDisplay {
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result';
  content: string;
}

interface Props {
  messages: MessageDisplay[];
}

export default function ChatView({ messages }: Props) {
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
    <Box flexDirection="column">
      {messages.map((msg, i) => (
        <Box key={i}>
          <Text color={getColor(msg.role)}>{msg.content}</Text>
        </Box>
      ))}
    </Box>
  );
}