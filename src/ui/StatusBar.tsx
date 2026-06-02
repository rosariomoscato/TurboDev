import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface Props {
  model?: string;
  status?: string;
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, Math.max(0, max - 3))}...` : text;
}

function AnimatedThinking({ text }: { text: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % (text.length + 2));
    }, 100);
    return () => clearInterval(timer);
  }, [text.length]);

  const cursor = frame % (text.length + 2);

  return (
    <Box>
      {text.split('').map((char, i) => {
        const dist = Math.abs(i - cursor);
        if (dist === 0) {
          return <Text key={i} color="white" bold>{char}</Text>;
        }
        if (dist === 1) {
          return <Text key={i} color="yellow" bold>{char}</Text>;
        }
        return <Text key={i} color="yellow" dimColor>{char}</Text>;
      })}
    </Box>
  );
}

export default function StatusBar({ model, status }: Props) {
  const columns = process.stdout.columns || 100;
  const width = Math.max(40, columns - 2);
  const base = 'TurboDev | ';
  const isThinking = status === 'AI thinking...';
  const suffix = isThinking ? ' | ' : status ? ` | ${status}` : '';
  const modelText = truncate(model || 'No model', Math.max(10, width - base.length - suffix.length - 4));

  return (
    <Box borderStyle="single" paddingX={1} width={width}>
      <Text color="gray">TurboDev</Text>
      <Text color="gray"> | </Text>
      <Text color="cyan">{modelText}</Text>
      {isThinking ? (
        <>
          <Text color="gray"> | </Text>
          <AnimatedThinking text={status} />
        </>
      ) : status ? (
        <>
          <Text color="gray"> | </Text>
          <Text color="yellow">{status}</Text>
        </>
      ) : null}
    </Box>
  );
}
