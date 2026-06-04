import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
  onSubmit: (input: string) => void;
  onSlash?: () => void;
  agentName?: string;
  initialValue?: string;
}

export default function InputBar({ onSubmit, onSlash, agentName, initialValue }: Props) {
  const [value, setValue] = useState(initialValue ?? '');

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value);
    setValue('');
  };

  const handleChange = (newValue: string) => {
    if (newValue === '/' && onSlash) {
      setValue('');
      onSlash();
      return;
    }
    setValue(newValue);
  };

  return (
    <Box>
      <Text color="cyan" bold>You{agentName ? ` (${agentName})` : ''}:</Text>
      <Text color="gray"> </Text>
      <TextInput
        value={value}
        onChange={handleChange}
        onSubmit={handleSubmit}
        placeholder="Type a message... (/ for commands)"
      />
    </Box>
  );
}
