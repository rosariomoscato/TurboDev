import React from 'react';
import { Box, Text } from 'ink';
import { MessageDisplay } from './types.js';
import { renderMarkdown } from './markdown.js';

interface Props {
  messages: MessageDisplay[];
}

export default function ChatView({ messages }: Props) {
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

  return (
    <Box flexDirection="column">
      {messages.map((msg, i) => {
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
        if (msg.role === 'permission_ask') {
          return (
            <Box key={i}>
              <Text color="red" bold>? Allow {msg.content}?</Text>
            </Box>
          );
        }
        return (
          <Box key={i}>
            <Text color={getColor(msg.role)}>{msg.content}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
