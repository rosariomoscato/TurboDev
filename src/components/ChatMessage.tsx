import React, { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

// ── Types ────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ChatMessageData {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  metadata?: Record<string, unknown>;
}

interface ChatMessageProps {
  message: ChatMessageData;
  onCopy?: (content: string) => void;
  isStreaming?: boolean;
}

// ── Style helpers ────────────────────────────────────────────────────────

const roleColors: Record<MessageRole, string> = {
  user: 'cyan',
  assistant: 'green',
  system: 'yellow',
  tool: 'magenta',
};

const roleLabels: Record<MessageRole, string> = {
  user: '👤 Tu',
  assistant: '🤖 TurboDev',
  system: '⚙️ Sistema',
  tool: '🔧 Tool',
};

// ── Component ────────────────────────────────────────────────────────────

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onCopy,
  isStreaming = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (onCopy) {
      onCopy(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [message.content, onCopy]);

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // ── Render ──

  return (
    <Box
      flexDirection="column"
      marginY={1}
      borderStyle={message.role === 'assistant' ? 'round' : 'single'}
      borderColor={roleColors[message.role]}
      paddingX={1}
      paddingY={1}
    >
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Box>
          <Text color={roleColors[message.role]} bold>
            {roleLabels[message.role]}
          </Text>
          <Text dimColor>
            {' '}
            {message.timestamp.toLocaleTimeString('it-IT', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </Box>

        <Box>
          {onCopy && (
            <Text
              color={copied ? 'green' : 'gray'}
              underline
              onPress={handleCopy}
            >
              {copied ? '✓ Copiato' : '📋 Copia'}
            </Text>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box flexDirection="column">
        {message.isLoading ? (
          <Box>
            <Spinner type="dots" />
            <Text> Sto pensando...</Text>
          </Box>
        ) : (
          <>
            <Text wrap="wrap">
              {message.content.length > 500 && !expanded
                ? `${message.content.slice(0, 500)}...`
                : message.content}
            </Text>

            {message.content.length > 500 && (
              <Text
                color="blue"
                underline
                onPress={toggleExpand}
                marginTop={1}
              >
                {expanded ? '▲ Mostra meno' : '▼ Mostra tutto'}
              </Text>
            )}
          </>
        )}
      </Box>

      {/* Metadata (se presente) */}
      {message.metadata && Object.keys(message.metadata).length > 0 && (
        <Box
          marginTop={1}
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
          flexDirection="column"
        >
          <Text bold dimColor>
            📊 Metadati
          </Text>
          {Object.entries(message.metadata).map(([key, value]) => (
            <Text key={key} dimColor>
              <Text bold>{key}:</Text> {String(value)}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ── Esportazioni ─────────────────────────────────────────────────────────

export default ChatMessage;

// ── Esempio di utilizzo ──────────────────────────────────────────────────
//
// import ChatMessage from './components/ChatMessage.js';
//
// const messages: ChatMessageData[] = [
//   {
//     id: '1',
//     role: 'user',
//     content: 'Ciao! Come posso ottimizzare questo codice?',
//     timestamp: new Date(),
//   },
//   {
//     id: '2',
//     role: 'assistant',
//     content: 'Certo! Mostrami il codice e ti aiuto a ottimizzarlo...',
//     timestamp: new Date(),
//     metadata: { tokens: 42, model: 'gpt-4' },
//   },
// ];
//
// <Box flexDirection="column">
//   {messages.map((msg) => (
//     <ChatMessage key={msg.id} message={msg} />
//   ))}
// </Box>
