import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { AgentConfig } from '../agent/types.js';

interface Props {
  model?: string;
  status?: string;
  agent?: AgentConfig;
  tokenCount?: number;
  contextLength?: number;
  sessionCost?: number;
}

function mapAgentColor(color?: string): string {
  const colorMap: Record<string, string> = {
    cyan: 'cyan', yellow: 'yellow', green: 'green',
    red: 'red', magenta: 'magenta', blue: 'blue', gray: 'gray',
  };
  if (!color) return 'cyan';
  return colorMap[color] || 'cyan';
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, Math.max(0, max - 3))}...` : text;
}

function formatTokens(count: number): string {
  const k = count / 1000;
  if (k >= 100) return `${Math.round(k)}K`;
  if (k >= 1) return `${k.toFixed(k < 10 ? 2 : 1)}K`;
  return `${k.toFixed(2)}K`;
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function AnimatedThinking({ text }: { text: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 150);
    return () => clearInterval(timer);
  }, []);

  return <Text color="yellow" bold>{SPINNER_FRAMES[frame]} {text}</Text>;
}

function formatCost(cost: number): string {
  if (cost < 0.001) return `$${cost.toFixed(6)}`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

export default function StatusBar({ model, status, agent, tokenCount, contextLength, sessionCost }: Props) {
  const columns = process.stdout.columns || 100;
  const width = Math.max(40, columns - 2);
  const isThinking = status === 'AI thinking...';
  const suffix = isThinking ? ' | ' : status ? ` | ${status}` : '';
  const modelText = truncate(model || 'No model', Math.max(10, width - suffix.length - 4));

  const usagePercent = contextLength ? (tokenCount || 0) / contextLength : 0;
  let tokenColor = 'green';
  if (usagePercent > 0.75) tokenColor = 'red';
  else if (usagePercent > 0.5) tokenColor = 'yellow';

  return (
    <Box borderStyle="single" paddingX={1} width={width}>
      <Text color="gray">TurboDev</Text>
      <Text color="gray"> | </Text>
      <Text color={mapAgentColor(agent?.color)}>{agent?.name || 'editor'}</Text>
      <Text color="gray"> | </Text>
      <Text color="cyan">{modelText}</Text>
      {tokenCount !== undefined && contextLength && contextLength > 0 ? (
        <>
          <Text color="gray"> | </Text>
          <Text color={tokenColor}>{formatTokens(tokenCount)}/{formatTokens(contextLength)}</Text>
        </>
      ) : null}
      {sessionCost !== undefined && sessionCost > 0 ? (
        <>
          <Text color="gray"> | </Text>
          <Text color="magenta">{formatCost(sessionCost)}</Text>
        </>
      ) : null}
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
