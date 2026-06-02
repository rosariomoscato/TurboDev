import React, { useState, useEffect, useRef } from 'react';
import { Box, useApp, useInput, Text } from 'ink';
import { loadConfig, saveConfig } from '../config/store.js';
import { runAgent } from '../agent/loop.js';
import { ChatMessage } from '../llm/client.js';
import { fetchAvailableModels, getModelPricing } from '../llm/models.js';
import { loadAgentsMd } from '../context/agents-md.js';
import { loadAllAgents } from '../agent/registry.js';
import { createTaskTool } from '../tools/task.js';
import { registerTaskTool } from '../agent/tools.js';
import type { AgentConfig } from '../agent/types.js';
import SetupWizard from './SetupWizard.js';
import InitWizard from './InitWizard.js';
import ChatView from './ChatView.js';
import InputBar from './InputBar.js';
import StatusBar from './StatusBar.js';
import { MessageDisplay } from './types.js';
import { compactConversation } from '../agent/compaction.js';
import { generateSystemPrompt } from '../agent/system-prompt.js';
import { estimateTokens } from '../llm/tokens.js';
import { getContextLength } from '../llm/models.js';
import { saveSession, loadSession, listSessions, getLatestSession, generateSessionId, generateTitle, deleteSession } from '../session/store.js';
import type { Session } from '../session/types.js';
import { version } from '../../package.json';

const versionString = `v${version}${__GIT_HASH__ !== 'dev' ? ` (${__GIT_HASH__})` : ''}`;

function formatTokens(count: number): string {
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ora';
  if (diffMin < 60) return `${diffMin} min fa`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h fa`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'ieri';
  return `${diffD}g fa`;
}

export default function App() {
  const { exit } = useApp();
  const [config, setConfig] = useState(loadConfig());
  const [setupNeeded, setSetupNeeded] = useState(!config.apiKey || !config.model);
  const [agentsContext, setAgentsContext] = useState<string | null>(() => loadAgentsMd(process.cwd()));
  const [showInitWizard, setShowInitWizard] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const [allAgents] = useState<AgentConfig[]>(() => loadAllAgents(process.cwd()));
  const [primaryAgents] = useState<AgentConfig[]>(() => allAgents.filter(a => a.mode !== 'subagent' && !a.hidden));
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [currentAgent, setCurrentAgent] = useState<AgentConfig>(() => allAgents.filter(a => a.mode !== 'subagent' && !a.hidden)[0]);

  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState('');
  const [tokenCount, setTokenCount] = useState(0);
  const [contextLength, setContextLength] = useState(0);
  const [sessionCost, setSessionCost] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionCreatedAt, setSessionCreatedAt] = useState('');
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const [sessionList, setSessionList] = useState<Session[]>([]);
  const [showSessionPrompt, setShowSessionPrompt] = useState(false);
  const [pendingSession, setPendingSession] = useState<Session | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [models, setModels] = useState<{id: string}[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const modelsPerPage = 9;

  const [pendingQuestion, setPendingQuestion] = useState<{
    question: string;
    options?: string[];
    resolve: (answer: string) => void;
  } | null>(null);

  const [pendingPermission, setPendingPermission] = useState<{
    tool: string;
    detail?: string;
    resolve: (allowed: boolean) => void;
  } | null>(null);

  const currentAgentRef = useRef(currentAgent);
  currentAgentRef.current = currentAgent;

  const primaryAgentsRef = useRef(primaryAgents);

  const compactionNotified = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (showSessionPrompt) return;
    const timer = setTimeout(() => setShowBanner(false), 5000);
    return () => clearTimeout(timer);
  }, [showSessionPrompt]);

  function autoSave(msgs: MessageDisplay[], tokens: number, ctxLen: number) {
    if (!sessionId) return;
    const now = new Date().toISOString();
    saveSession(process.cwd(), {
      id: sessionId,
      title: sessionTitle || 'New session',
      createdAt: sessionCreatedAt || now,
      updatedAt: now,
      messages: msgs.map(m => ({ role: m.role, content: m.content, agentName: m.agentName })),
      agentName: currentAgent.name,
      tokenCount: tokens,
      contextLength: ctxLen,
      totalCost: sessionCost,
    });
  }

  useEffect(() => {
    if (sessionId && messages.length > 0) {
      autoSave(messages, tokenCount, contextLength);
    }
  }, [messages, tokenCount, contextLength]);

  useEffect(() => {
    registerTaskTool(createTaskTool(process.cwd(), currentAgent, runAgent));
  }, []);

  useEffect(() => {
    fetchAvailableModels().catch(() => {});
  }, []);

  useEffect(() => {
    const latest = getLatestSession(process.cwd());
    if (latest) {
      setPendingSession(latest);
      setShowSessionPrompt(true);
    } else {
      setSessionId(generateSessionId());
      setSessionCreatedAt(new Date().toISOString());
      const sysPrompt = generateSystemPrompt(agentsContext ?? undefined, currentAgent);
      setTokenCount(estimateTokens(sysPrompt));
      setContextLength(getContextLength(currentAgent.model || config.model));
    }
  }, []);

  const totalPages = Math.ceil(models.length / modelsPerPage);
  const displayedModels = models.slice(currentPage * modelsPerPage, (currentPage + 1) * modelsPerPage);

  const handleModelSelection = (index: number) => {
    const actualIndex = (currentPage * modelsPerPage) + index;
    if (actualIndex >= 0 && actualIndex < models.length) {
      const model = models[actualIndex];
      saveConfig({ model: model.id });
      setConfig(loadConfig());
      setShowModelSelector(false);
      setCurrentPage(0);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Model changed to: ${model.id}`
      }]);
    }
  };

  const handleModelNavigation = (action: 'next' | 'prev') => {
    if (action === 'next' && currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (action === 'prev' && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleQuestion = async (question: string, options?: string[]): Promise<string> => {
    return new Promise((resolve) => {
      setPendingQuestion({ question, options, resolve });
    });
  };

  const handleQuestionAnswer = (answer: string) => {
    if (pendingQuestion) {
      setMessages(prev => [...prev,
        { role: 'question', content: `? ${pendingQuestion.question}` },
        { role: 'user', content: answer }
      ]);
      pendingQuestion.resolve(answer);
      setPendingQuestion(null);
    }
  };

  const handlePermissionAsk = async (tool: string, detail?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingPermission({ tool, detail, resolve });
    });
  };

  const handlePermissionAnswer = (answer: string) => {
    if (pendingPermission) {
      const approved = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
      setMessages(prev => [...prev, {
        role: 'user' as const,
        content: approved ? 'Allowed' : 'Denied'
      }]);
      pendingPermission.resolve(approved);
      setPendingPermission(null);
    }
  };

  const switchAgent = (agent: AgentConfig, index: number) => {
    setCurrentAgent(agent);
    setCurrentAgentIndex(index);
    registerTaskTool(createTaskTool(process.cwd(), agent, runAgent));
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Switched to agent: ${agent.name}`
    }]);
  };

  const handleAgentSelection = (input: string) => {
    const num = parseInt(input, 10);
    if (!isNaN(num) && num > 0 && num <= primaryAgents.length) {
      switchAgent(primaryAgents[num - 1], num - 1);
    }
    setShowAgentSelector(false);
  };

  const isInputMode = showModelSelector || showAgentSelector || showSessionSelector;

  useInput((input, key) => {
    if (showSessionPrompt) {
      const answer = input.toLowerCase();
      if (answer === 'y' || answer === 's') {
        if (pendingSession) restoreSession(pendingSession);
      } else if (answer === 'n') {
        setSessionId(generateSessionId());
        setSessionCreatedAt(new Date().toISOString());
        const sysPrompt = generateSystemPrompt(agentsContext ?? undefined, currentAgent);
        setTokenCount(estimateTokens(sysPrompt));
        setContextLength(getContextLength(currentAgent.model || config.model));
      }
      setShowSessionPrompt(false);
      setPendingSession(null);
      return;
    }

    if (key.escape && status && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus('');
      return;
    }

    if (key.tab && !isInputMode && !pendingQuestion && !pendingPermission) {
      const agents = primaryAgentsRef.current;
      const nextIndex = (currentAgentIndex + 1) % agents.length;
      switchAgent(agents[nextIndex], nextIndex);
      return;
    }

    if (showAgentSelector) {
      if (key.escape) {
        setShowAgentSelector(false);
        return;
      }
      handleAgentSelection(input);
      return;
    }

    if (showSessionSelector) {
      if (key.escape) {
        setShowSessionSelector(false);
        return;
      }
      const num = parseInt(input, 10);
      if (!isNaN(num) && num > 0 && num <= sessionList.length) {
        const session = sessionList[num - 1];
        autoSave(messages, tokenCount, contextLength);
        setSessionId(session.id);
        setSessionTitle(session.title);
        setSessionCreatedAt(session.createdAt);
        setTokenCount(session.tokenCount);
        setContextLength(session.contextLength);
        const restoredMessages = session.messages.map(m => ({
          role: m.role as any,
          content: m.content,
          ...(m.agentName ? { agentName: m.agentName } : {})
        }));
        setMessages(restoredMessages);
        const history = session.messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
        setConversationHistory(history);
        const agent = allAgents.find(a => a.name === session.agentName);
        if (agent) setCurrentAgent(agent);
        setShowSessionSelector(false);
      }
      return;
    }

    if (!showModelSelector) return;

    if (key.escape || input === 'c' || input === 'q') {
      setShowModelSelector(false);
      setStatus('');
      setCurrentPage(0);
      return;
    }

    if (key.downArrow || input === 'n' || input === 'j') {
      handleModelNavigation('next');
      return;
    }

    if (key.upArrow || input === 'p' || input === 'k') {
      handleModelNavigation('prev');
      return;
    }

    const num = parseInt(input, 10);
    if (!Number.isNaN(num) && num > 0 && num <= displayedModels.length) {
      handleModelSelection(num - 1);
    }
  });

  const runAgentWithAgent = async (
    input: string,
    agent: AgentConfig,
    history: ChatMessage[]
  ) => {
    let finalContent = '';

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const result = await runAgent(
      input,
      history,
      agentsContext,
      agent,
      (chunk) => {
        if (chunk.type === 'content') {
          finalContent += chunk.text;
        } else if (chunk.type === 'tool_call') {
          finalContent = '';
        }
      },
      { onQuestion: handleQuestion, onPermissionAsk: handlePermissionAsk },
      controller.signal
    );

    abortControllerRef.current = null;

    return { result, finalContent };
  };

  function calcCost(inputTokens: number, outputTokens: number, modelId: string): number {
    const pricing = getModelPricing(modelId);
    if (!pricing) return 0;
    return (inputTokens * pricing.prompt) + (outputTokens * pricing.completion);
  }

  const restoreSession = (session: Session) => {
    setSessionId(session.id);
    setSessionTitle(session.title);
    setSessionCreatedAt(session.createdAt);
    setTokenCount(session.tokenCount);
    setContextLength(session.contextLength);
    setSessionCost(session.totalCost || 0);
    setMessages(session.messages.map(m => ({
      role: m.role as any,
      content: m.content,
      ...(m.agentName ? { agentName: m.agentName } : {})
    })));
    setConversationHistory(
      session.messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    );
    const agent = allAgents.find(a => a.name === session.agentName);
    if (agent) setCurrentAgent(agent);
  };

  const handleUserInput = async (input: string) => {
    if (pendingPermission) {
      handlePermissionAnswer(input);
      return;
    }

    if (pendingQuestion) {
      handleQuestionAnswer(input);
      return;
    }

    if (showAgentSelector) {
      handleAgentSelection(input);
      return;
    }

    if (showModelSelector) {
      if (input === 'c' || input === 'q') {
        setShowModelSelector(false);
        setStatus('');
        setCurrentPage(0);
        return;
      }
      if (input === 'n' || input === 'j') {
        handleModelNavigation('next');
        return;
      }
      if (input === 'p' || input === 'k') {
        handleModelNavigation('prev');
        return;
      }
      const num = parseInt(input, 10);
      if (!isNaN(num) && num > 0 && num <= displayedModels.length) {
        handleModelSelection(num - 1);
      }
      return;
    }

    if (showSessionSelector) {
      return;
    }

    if (contextLength > 0 && tokenCount > 0) {
      const usageRatio = tokenCount / contextLength;

      if (usageRatio >= 0.85) {
        const percent = Math.round(usageRatio * 100);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Context window ${percent}% full (${formatTokens(tokenCount)}/${formatTokens(contextLength)}). Compacting conversation...`
        }]);

        try {
          const { newMessages } = await compactConversation(
            conversationHistory,
            currentAgent.model || config.model
          );
          setConversationHistory(newMessages);
          setTokenCount(0);
          compactionNotified.current = false;
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Conversation compacted. Continuing.'
          }]);
        } catch {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Compaction failed. Continuing with full context.'
          }]);
        }
      } else if (usageRatio >= 0.75 && !compactionNotified.current) {
        compactionNotified.current = true;
        const percent = Math.round(usageRatio * 100);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Context window ${percent}% full (${formatTokens(tokenCount)}/${formatTokens(contextLength)}). Auto-compaction will trigger at 85%.`
        }]);
      }
    }

    if (input.startsWith('/')) {
      const command = input.slice(1);

      if (command === 'help') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Commands: /help, /init, /model, /agent, /setup, /clear, /compact, /new, /sessions, /exit\nTab: switch agent'
        }]);
        return;
      }

      if (command === 'init') {
        setShowInitWizard(true);
        return;
      }

      if (command === 'model') {
        setStatus('Fetching models...');
        fetchAvailableModels()
          .then(fetchedModels => {
            const popularModels = fetchedModels.filter(m =>
              ['anthropic/claude-3', 'openai/gpt-4', 'openai/gpt-3.5', 'google/gemini-pro', 'meta-llama/llama-3', 'deepseek/deepseek', 'glm/glm'].some(prefix => m.id.startsWith(prefix))
            );
            const sortedModels = popularModels.map(m => ({id: m.id})).sort((a, b) => a.id.localeCompare(b.id));
            setModels(sortedModels);
            setShowModelSelector(true);
            setStatus('');
          })
          .catch(err => {
            setMessages(prev => [...prev, {
              role: 'assistant',
            content: `Failed to fetch models: ${err.message}`
            }]);
            setStatus('');
            setShowModelSelector(false);
            setCurrentPage(0);
          });
        return;
      }

      if (command === 'agent') {
        setShowAgentSelector(true);
        return;
      }

      if (command === 'setup') {
        setSetupNeeded(true);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Setup wizard initiated...'
        }]);
        return;
      }

      if (command === 'clear') {
        setMessages([]);
        setConversationHistory([]);
        return;
      }

      if (command === 'compact') {
        if (conversationHistory.length === 0) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Nothing to compact — conversation is empty.'
          }]);
          return;
        }
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Compacting conversation...'
        }]);
        try {
          const { newMessages } = await compactConversation(
            conversationHistory,
            currentAgent.model || config.model
          );
          setConversationHistory(newMessages);
          setTokenCount(0);
          compactionNotified.current = false;
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Conversation compacted successfully.'
          }]);
        } catch {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Compaction failed. Continuing with full context.'
          }]);
        }
        return;
      }

      if (command === 'new') {
        autoSave(messages, tokenCount, contextLength);
        const newId = generateSessionId();
        setSessionId(newId);
        setSessionTitle('');
        setSessionCreatedAt(new Date().toISOString());
        setMessages([]);
        setConversationHistory([]);
        setTokenCount(0);
        setContextLength(0);
        setSessionCost(0);
        return;
      }

      if (command === 'sessions') {
        const sessions = listSessions(process.cwd());
        setSessionList(sessions);
        setShowSessionSelector(true);
        return;
      }

      if (command === 'exit') {
        exit();
        return;
      }

      if (command.trim()) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Unknown command: ${command}`
        }]);
      }
      return;
    }

    if (!sessionTitle && !input.startsWith('/')) {
      setSessionTitle(generateTitle(input));
    }

    const mentionMatch = input.match(/^@([\w-]+)(?:\s+(.*))?$/);
    if (mentionMatch) {
      const agentName = mentionMatch[1];
      const message = mentionMatch[2] || '';
      const mentionedAgent = allAgents.find(a => a.name === agentName);

      if (mentionedAgent) {
        setMessages(prev => [...prev, {
          role: 'user',
          content: `@${agentName}: ${message}`
        }]);
        setStatus(`@${agentName} thinking...`);

        const { result, finalContent } = await runAgentWithAgent(message || 'Hello', mentionedAgent, []);

        setTokenCount(result.tokenCount);
        setContextLength(result.contextLength);
        setSessionCost(prev => prev + calcCost(result.inputTokens, result.outputTokens, mentionedAgent.model || config.model));

        if (result.error) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Error: ${result.error!.message}`,
            agentName: mentionedAgent.name
          }]);
        } else if (finalContent) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: finalContent,
            agentName: mentionedAgent.name
          }]);
        }

        setStatus('');
        return;
      }
    }

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setStatus('AI thinking...');

    const { result, finalContent } = await runAgentWithAgent(input, currentAgent, conversationHistory);

    setTokenCount(result.tokenCount);
    setContextLength(result.contextLength);
    setSessionCost(prev => prev + calcCost(result.inputTokens, result.outputTokens, currentAgent.model || config.model));

    if (result.error) {
      const isCancelled = result.error.message === 'Cancelled by user';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isCancelled
          ? 'Request cancelled. You can try sending your message again.'
          : `${result.error!.message}\n\nYou can try sending your message again.`
      }]);
    } else {
      if (finalContent) {
        setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);
      }
      setConversationHistory(result.messages.filter(m => m.role !== 'system'));
    }

    setStatus('');
  };

  const activeOnSubmit = pendingPermission
    ? handlePermissionAnswer
    : pendingQuestion
    ? handleQuestionAnswer
    : handleUserInput;

  if (showInitWizard) {
    return (
      <InitWizard
        cwd={process.cwd()}
        onComplete={() => {
          const ctx = loadAgentsMd(process.cwd());
          setAgentsContext(ctx);
          setShowInitWizard(false);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: ctx
              ? `AGENTS.md loaded from ${process.cwd()}/AGENTS.md`
              : 'AGENTS.md not found.'
          }]);
        }}
      />
    );
  }

  if (setupNeeded) {
    return (
      <SetupWizard
        onComplete={() => {
          setConfig(loadConfig());
          setSetupNeeded(false);
        }}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        {showBanner && (
          <Box flexDirection="column" marginBottom={1}>
            <Text color="cyan">
{'████████╗██╗   ██╗██████╗ ██████╗  ██████╗ ██████╗ ███████╗██╗   ██╗\n╚══██╔══╝██║   ██║██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██╔════╝██║   ██║\n   ██║   ██║   ██║██████╔╝██████╔╝██║   ██║██║  ██║█████╗  ██║   ██║\n   ██║   ██║   ██║██╔══██╗██╔══██╗██║   ██║██║  ██║██╔══╝  ╚██╗ ██╔╝\n   ██║   ╚██████╔╝██║  ██║██████╔╝╚██████╔╝██████╔╝███████╗ ╚████╔╝\n   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝  ╚═══╝'}
            </Text>
            <Text color="gray">by Rosario Moscato · {versionString}</Text>
            <Text color={agentsContext ? 'green' : 'yellow'}>
              {agentsContext
                ? `AGENTS.md loaded`
                : `No AGENTS.md found — use /init to create one`}
            </Text>
            <Text color="gray">Agent: {currentAgent.name}</Text>
          </Box>
        )}
        {showSessionPrompt && pendingSession && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="cyan" bold>Resume previous session?</Text>
            <Text color="gray">  {pendingSession.title || 'Untitled'} ({relativeTime(pendingSession.updatedAt)}, {pendingSession.messages.length} messages)</Text>
            <Text color="gray">  [y/n]</Text>
          </Box>
        )}
        <ChatView messages={messages} />
        {showAgentSelector && (
          <Box flexDirection="column" alignItems="flex-start" marginY={1}>
            <Text color="cyan" bold>Select Agent</Text>
            {primaryAgents.map((a, i) => (
              <Box key={a.name}>
                <Text color={a.name === currentAgent.name ? 'green' : 'gray'}>
                  {i + 1}. {a.name}{a.name === currentAgent.name ? ' (current)' : ''} — {a.description}
                </Text>
              </Box>
            ))}
            <Text color="gray">1-{primaryAgents.length} select · Esc cancel</Text>
          </Box>
        )}
        {showSessionSelector && (
          <Box flexDirection="column" alignItems="flex-start" marginY={1}>
            <Text color="cyan" bold>Sessions</Text>
            {sessionList.map((s, i) => (
              <Box key={s.id}>
                <Text color={s.id === sessionId ? 'green' : 'gray'}>
                  {i + 1}. {s.title || 'Untitled'} <Text dimColor>({relativeTime(s.updatedAt)})</Text>
                  {s.id === sessionId ? ' (current)' : ''}
                </Text>
              </Box>
            ))}
            <Text color="gray">1-{sessionList.length} select · Esc cancel</Text>
          </Box>
        )}
        {showModelSelector && (
          <Box flexDirection="column" alignItems="flex-start" marginY={1}>
            <Text color="cyan" bold>Select AI Model</Text>
            <Text color="gray">Page {currentPage + 1}/{totalPages} - Total: {models.length} models</Text>
            {displayedModels.map((model, index) => {
              const displayName = model.id.length > 38 ? model.id.slice(0, 35) + '...' : model.id;
              return (
                <Box key={model.id}>
                  <Text color="gray">{index + 1}. {displayName}</Text>
                </Box>
              );
            })}
            {totalPages > 1 && (
              <Text color="gray">1-9 select · n/j/↓ next page · p/k/↑ previous · c/q/Esc cancel</Text>
            )}
          </Box>
        )}
      </Box>
      {!isInputMode && !showSessionPrompt && !status && (
        <Box flexDirection="column">
          {pendingPermission && (
            <>
              <Text color="red" bold>? Allow {pendingPermission.tool}?</Text>
              {pendingPermission.detail && (
                <Text color="gray">  Command: {pendingPermission.detail}</Text>
              )}
              <Text color="gray">  [y/n]</Text>
            </>
          )}
          {pendingQuestion && (
            <>
              <Text color="magenta" bold>? {pendingQuestion.question}</Text>
              {pendingQuestion.options?.map((opt, i) => (
                <Text key={i} color="gray">  {i + 1}. {opt}</Text>
              ))}
            </>
          )}
          <InputBar onSubmit={activeOnSubmit} agentName={currentAgent.name} />
        </Box>
      )}
      <Box marginTop={1}>
        <StatusBar model={config.model} status={status} agent={currentAgent} tokenCount={tokenCount} contextLength={contextLength} sessionCost={sessionCost} />
      </Box>
    </Box>
  );
}
