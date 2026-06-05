import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
  onSubmit: (input: string) => void;
  onSlash?: () => void;
  onReference?: (query: string | null) => void;
  onInsertReference?: null | ((text: string) => void);
  agentName?: string;
  initialValue?: string;
}

export default function InputBar({ onSubmit, onSlash, onReference, onInsertReference, agentName, initialValue }: Props) {
  const [value, setValue] = useState(initialValue ?? '');
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (!onReference) return;
    const prev = prevValueRef.current;
    const current = value;

    const atAdded = current.includes('@') && !prev.includes('@');
    const atRemoved = !current.includes('@') && prev.includes('@');

    if (atAdded) {
      const atIndex = current.lastIndexOf('@');
      const query = current.slice(atIndex + 1);
      onReference(query);
    } else if (atRemoved) {
      onReference(null);
    } else if (current.includes('@')) {
      const atIndex = current.lastIndexOf('@');
      const before = current.slice(0, atIndex);
      const hasSpace = before.includes(' ');
      if (!hasSpace && before.length > 0 && !before.startsWith('@')) {
        onReference(null);
      } else {
        const query = current.slice(atIndex + 1);
        const spaceIdx = query.indexOf(' ');
        onReference(spaceIdx >= 0 ? null : query);
      }
    }

    prevValueRef.current = current;
  }, [value, onReference]);

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
        placeholder="Type a message... (/ commands, @ files)"
      />
    </Box>
  );
}
