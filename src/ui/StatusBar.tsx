import React, { useState, useEffect, memo } from 'react';
import { Box, Text } from 'ink';
import { AgentConfig } from '../agent/types.js';
import { useGitStatus } from './GitStatus.js';

interface Props {
  model?: string;
  status?: string;
  agent?: AgentConfig;
  tokenCount?: number;
  contextLength?: number;
  sessionCost?: number;
  thinkingStart?: number;
  economyLevel?: string;
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

function shortModel(modelId: string): string {
  const parts = modelId.split('/');
  const name = parts.length > 1 ? parts.slice(1).join('/') : modelId;
  return name.length > 28 ? name.slice(0, 25) + '...' : name;
}

function miniBar(percent: number): string {
  const filled = Math.round(percent * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function AnimatedThinking({ text, startTime }: { text: string; startTime?: number }) {
  const [frame, setFrame] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const spinTimer = setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 800);
    return () => clearInterval(spinTimer);
  }, []);

  useEffect(() => {
    if (!startTime) return;
    setElapsed(0);
    const secTimer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(secTimer);
  }, [startTime]);

  const timerText = startTime && elapsed > 0 ? ` ${elapsed}s` : '';
  return <Text color="yellow" bold>{SPINNER_FRAMES[frame]} {text}{timerText}</Text>;
}

function formatCost(cost: number): string {
  if (cost < 0.001) return `$${cost.toFixed(6)}`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

const StatusBar = memo(function StatusBar({ model, status, agent, tokenCount, contextLength, sessionCost, thinkingStart, economyLevel }: Props) {
  const columns = process.stdout.columns || 100;
  const width = Math.max(40, columns - 2);
  const isThinking = status === 'AI thinking...' || (status?.includes('thinking...') ?? false);
  const modelText = shortModel(model || 'No model');
  const gitStatus = useGitStatus(process.cwd());

  const usagePercent = contextLength ? (tokenCount || 0) / contextLength : 0;
  let tokenColor = 'green';
  if (usagePercent > 0.75) tokenColor = 'red';
  else if (usagePercent > 0.5) tokenColor = 'yellow';

  const percent = Math.round(usagePercent * 100);

  const content = (
    <>
      <Text color="gray">TurboDev</Text>
      <Text color="gray"> | </Text>
      <Text color={mapAgentColor(agent?.color)}>{agent?.name || 'editor'}</Text>
      <Text color="gray"> | </Text>
      <Text color="cyan">{modelText}</Text>
      {gitStatus.isRepo && gitStatus.branch ? (
        <>
          <Text color="gray"> | </Text>
          <Text color="cyan">{gitStatus.branch}</Text>
          {gitStatus.dirty > 0 ? (
            <Text color="yellow"> ●{gitStatus.dirty}</Text>
          ) : (
            <Text color="green"> ✓</Text>
          )}
          {gitStatus.ahead > 0 ? (
            <Text color="cyan"> ↑{gitStatus.ahead}</Text>
          ) : null}
          {gitStatus.behind > 0 ? (
            <Text color="yellow"> ↓{gitStatus.behind}</Text>
          ) : null}
        </>
      ) : null}
      {tokenCount !== undefined && contextLength && contextLength > 0 ? (
        <>
          <Text color="gray"> | </Text>
          <Text color={tokenColor}>{miniBar(usagePercent)} {formatTokens(tokenCount)}/{formatTokens(contextLength)}</Text>
        </>
      ) : null}
      {percent > 0 ? (
        <>
          <Text color="gray"> </Text>
          <Text color={tokenColor}>{percent}%</Text>
        </>
      ) : null}
      {sessionCost !== undefined && sessionCost > 0 ? (
        <>
          <Text color="gray"> | </Text>
          <Text color="magenta">{formatCost(sessionCost)}</Text>
        </>
      ) : null}
      {economyLevel && economyLevel !== 'off' ? (
        <>
          <Text color="gray"> | </Text>
          <Text color={economyLevel === 'ultra' ? 'red' : 'yellow'} bold>
            {economyLevel === 'ultra' ? 'ULTRA' : 'ECO'}
          </Text>
        </>
      ) : null}
      {isThinking ? (
        <>
          <Text color="gray"> | </Text>
          <AnimatedThinking text={status || ''} startTime={thinkingStart} />
        </>
      ) : status ? (
        <>
          <Text color="gray"> | </Text>
          <Text color="yellow">{status}</Text>
        </>
      ) : null}
    </>
  );

  return (
    <Box flexDirection="column">
      <Text color="gray">{'─'.repeat(width)}</Text>
      <Box paddingX={1}>
        {content}
      </Box>
    </Box>
  );
});

export default StatusBar;
