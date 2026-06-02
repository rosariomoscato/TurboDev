import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';

const COMMANDS = [
  { label: '/agent', value: '/agent', description: 'Switch agent' },
  { label: '/clear', value: '/clear', description: 'Clear chat history' },
  { label: '/compact', value: '/compact', description: 'Compact conversation' },
  { label: '/exit', value: '/exit', description: 'Exit TurboDev' },
  { label: '/help', value: '/help', description: 'Show available commands' },
  { label: '/init', value: '/init', description: 'Initialize AGENTS.md' },
  { label: '/model', value: '/model', description: 'Select your model' },
  { label: '/new', value: '/new', description: 'Start new session' },
  { label: '/sessions', value: '/sessions', description: 'List and switch sessions' },
  { label: '/setup', value: '/setup', description: 'Re-run setup wizard' },
];

interface Props {
  onSubmit: (input: string) => void;
  agentName?: string;
}

export default function InputBar({ onSubmit, agentName }: Props) {
  const [value, setValue] = useState('');
  const [showCommands, setShowCommands] = useState(false);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value);
    setValue('');
    setShowCommands(false);
  };

  const handleCommandSelect = (item: { value: string }) => {
    onSubmit(item.value);
    setValue('');
    setShowCommands(false);
  };

  const handleChange = (newValue: string) => {
    setValue(newValue);
    setShowCommands(newValue === '/');
  };

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan" bold>You{agentName ? ` (${agentName})` : ''}:</Text>
        <Text color="gray"> </Text>
        <TextInput
          value={value}
          onChange={handleChange}
          onSubmit={handleSubmit}
          placeholder="Type a message..."
        />
      </Box>
      {showCommands && (
        <Box marginTop={0}>
          <SelectInput
            items={COMMANDS.map(cmd => ({
              label: `${cmd.label} — ${cmd.description}`,
              value: cmd.value,
              key: cmd.value
            }))}
            onSelect={handleCommandSelect}
          />
        </Box>
      )}
    </Box>
  );
}