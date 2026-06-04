import React, { useState, useEffect, useRef } from 'react';
import { Box, useApp, useInput, Text, Static } from 'ink';
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
import { renderMarkdown } from './markdown.js';
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
import { gitTool } from '../tools/git.js';
import { githubTool } from '../tools/github.js';
import GithubAuthWizard from './GithubAuthWizard.js';
import { saveGithubAuthState } from '../config/store.js';

const gitHash = typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'dev';
const versionString = `v${version}${gitHash !== 'dev' ? ` (${gitHash})` : ''}`;

interface PaletteCommand {
  label: string;
  value: string;
  description: string;
  template?: boolean;
}

const PALETTE_COMMANDS: PaletteCommand[] = [
  { label: '/agent', value: '/agent', description: 'Switch agent' },
  { label: '/branch', value: '/branch', description: 'List branches' },
  { label: '/branch ...', value: '/branch ', description: 'Switch branch', template: true },
  { label: '/clear', value: '/clear', description: 'Clear chat history' },
  { label: '/commit ...', value: '/commit ', description: 'Stage all and commit', template: true },
  { label: '/compact', value: '/compact', description: 'Compact conversation' },
  { label: '/exit', value: '/exit', description: 'Exit TurboDev' },
  { label: '/gh auth', value: '/gh auth', description: 'GitHub auth wizard' },
  { label: '/git diff', value: '/git diff', description: 'Show unstaged changes' },
  { label: '/git log', value: '/git log', description: 'Show commit log' },
  { label: '/git remote', value: '/git remote', description: 'List remotes' },
  { label: '/git stash', value: '/git stash', description: 'Stash changes' },
  { label: '/git status', value: '/git status', description: 'Show working tree status' },
  { label: '/help', value: '/help', description: 'Show available commands' },
  { label: '/init', value: '/init', description: 'Initialize AGENTS.md' },
  { label: '/model', value: '/model', description: 'Select your model' },
  { label: '/new', value: '/new', description: 'Start new session' },
  { label: '/pr ...', value: '/pr ', description: 'Create a pull request', template: true },
  { label: '/pr list', value: '/pr list', description: 'List pull requests' },
  { label: '/pull', value: '/pull', description: 'Pull from remote' },
  { label: '/push', value: '/push', description: 'Push to remote' },
  { label: '/rollback', value: '/rollback', description: 'Show recent commits' },
  { label: '/sessions', value: '/sessions', description: 'List and switch sessions' },
  { label: '/setup', value: '/setup', description: 'Re-run setup wizard' },
].sort((a, b) => a.label.localeCompare(b.label));

function mapAgentColor(color?: string): string {
  const colorMap: Record<string, string> = {
    cyan: 'cyan', yellow: 'yellow', green: 'green',
    red: 'red', magenta: 'magenta', blue: 'blue', gray: 'gray',
  };
  if (!color) return 'cyan';
  return colorMap[color] || 'cyan';
}

function shortModelName(modelId: string): string {
  const parts = modelId.split('/');
  const name = parts.length > 1 ? parts.slice(1).join('/') : modelId;
  return name.length > 35 ? name.slice(0, 32) + '...' : name;
}

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

/** Format structured git tool output into human-readable text for the chat. */
function formatGitOutput(operation: string, data: any): string {
  if (operation === 'status') {
    const lines: string[] = [`Branch: ${data.branch}`];
    if (data.staged?.length > 0) lines.push(`Staged: ${data.staged.join(', ')}`);
    if (data.modified?.length > 0) lines.push(`Modified: ${data.modified.join(', ')}`);
    if (data.not_added?.length > 0) lines.push(`Untracked: ${data.not_added.join(', ')}`);
    if (data.ahead > 0) lines.push(`Ahead: ${data.ahead} commits`);
    if (data.behind > 0) lines.push(`Behind: ${data.behind} commits`);
    if (lines.length === 1) lines.push('Working tree clean');
    return lines.join('\n');
  }
  if (operation.startsWith('log')) {
    return data.map((c: any) => `${c.hash?.slice(0,7) || c} ${c.message || ''} (${c.date || ''})`).join('\n');
  }
  return JSON.stringify(data, null, 2);
}

export default function App() {
  const { exit } = useApp();
  const [config, setConfig] = useState(loadConfig());
  const [setupNeeded, setSetupNeeded] = useState(!config.apiKey || !config.model);
  const [agentsContext, setAgentsContext] = useState<string | null>(() => loadAgentsMd(process.cwd()));
  const [showInitWizard, setShowInitWizard] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [showGithubAuth, setShowGithubAuth] = useState(false);

  const [allAgents] = useState<AgentConfig[]>(() => loadAllAgents(process.cwd()));
  const [primaryAgents] = useState<AgentConfig[]>(() => allAgents.filter(a => a.mode !== 'subagent' && !a.hidden));
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [currentAgent, setCurrentAgent] = useState<AgentConfig>(() => allAgents.filter(a => a.mode !== 'subagent' && !a.hidden)[0]);

  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState('');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [thinkingStart, setThinkingStart] = useState<number>(0);
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
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [inputKey, setInputKey] = useState(0);
  const [inputPrefill, setInputPrefill] = useState('');
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
  const streamingBufferRef = useRef('');
  const streamingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showSessionPrompt) return;
    const timer = setTimeout(() => setShowBanner(false), 2500);
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
  }, [messages.length, tokenCount, contextLength]);

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

  const isInputMode = showModelSelector || showAgentSelector || showSessionSelector || showCommandPalette;

  useInput((input, key) => {
    if (showSessionPrompt) {
      const answer = input.toLowerCase();
      const sessionToHandle = pendingSession;
      if (answer === 'y' || answer === 's') {
        setShowSessionPrompt(false);
        setShowBanner(false);
        setPendingSession(null);
        if (sessionToHandle) restoreSession(sessionToHandle);
      } else if (answer === 'n') {
        setShowSessionPrompt(false);
        setShowBanner(false);
        setPendingSession(null);
        const newId = generateSessionId();
        setSessionId(newId);
        setSessionCreatedAt(new Date().toISOString());
        const sysPrompt = generateSystemPrompt(agentsContext ?? undefined, currentAgent);
        setTokenCount(estimateTokens(sysPrompt));
        setContextLength(getContextLength(currentAgent.model || config.model));
      } else {
        return;
      }
      return;
    }

    if (key.escape && status && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus('');
      setThinkingStart(0);
      return;
    }

    if (showCommandPalette) {
      if (key.escape) {
        setShowCommandPalette(false);
        setPaletteIndex(0);
        return;
      }
      if (key.upArrow) {
        setPaletteIndex((prev) => (prev - 1 + PALETTE_COMMANDS.length) % PALETTE_COMMANDS.length);
        return;
      }
      if (key.downArrow) {
        setPaletteIndex((prev) => (prev + 1) % PALETTE_COMMANDS.length);
        return;
      }
      if (key.return) {
        const cmd = PALETTE_COMMANDS[paletteIndex];
        setShowCommandPalette(false);
        setPaletteIndex(0);
        if (cmd.template) {
          setInputPrefill(cmd.value);
          setInputKey((k) => k + 1);
        } else {
          handleUserInput(cmd.value);
        }
        return;
      }
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
          streamingBufferRef.current = finalContent;
          if (!streamingTimerRef.current) {
            streamingTimerRef.current = setTimeout(() => {
              setStreamingMessage(streamingBufferRef.current);
              streamingTimerRef.current = null;
            }, 600);
          }
        } else if (chunk.type === 'tool_call') {
          finalContent = '';
          streamingBufferRef.current = '';
          if (streamingTimerRef.current) {
            clearTimeout(streamingTimerRef.current);
            streamingTimerRef.current = null;
          }
          setStreamingMessage('');
        }
      },
      { onQuestion: handleQuestion, onPermissionAsk: handlePermissionAsk },
      controller.signal
    );

    abortControllerRef.current = null;
    if (streamingTimerRef.current) {
      clearTimeout(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    streamingBufferRef.current = '';
    setStreamingMessage('');

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
          content: [
            'General Commands:',
            '  /help           Show this help',
            '  /init           Initialize project (AGENTS.md)',
            '  /model          Change AI model',
            '  /agent          Switch agent',
            '  /setup          Run setup wizard',
            '  /clear          Clear conversation',
            '  /compact        Compact conversation',
            '  /new            New session',
            '  /sessions       List sessions',
            '  /exit           Exit TurboDev',
            '',
            'Git Commands:',
            '  /git status     Show working tree status',
            '  /git log [n]    Show commit log (default 10)',
            '  /git diff       Show unstaged changes',
            '  /git add [f]    Stage files (default: all)',
            '  /git stash      Stash changes',
            '  /git remote     List remotes',
            '  /git help       Show git command help',
            '  /commit <msg>   Stage all and commit',
            '  /push           Push to remote',
            '  /pull           Pull from remote',
            '  /branch         List branches',
            '  /branch <name>  Switch branch',
            '  /rollback       Show recent commits to revert',
            '',
            'GitHub Commands:',
            '  /pr list        List pull requests',
            '  /pr <title>     Create a pull request',
            '  /gh auth        GitHub authentication wizard',
            '',
            'Tab: switch agent',
          ].join('\n')
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

      // ── Git slash commands ──────────────────────────────────────────

      if (command === 'git status') {
        setStatus('Running git status...');
        try {
          const result = await gitTool({ operation: 'status' });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.success
              ? formatGitOutput('status', result.data)
              : `Git error: ${result.error}`
          }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command.startsWith('git log')) {
        const parts = command.split(/\s+/);
        const count = parts.length > 2 ? parseInt(parts[2], 10) : 10;
        setStatus(`Running git log (${count})...`);
        try {
          const result = await gitTool({ operation: 'log', count: isNaN(count) ? 10 : count });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.success
              ? formatGitOutput('log', result.data)
              : `Git error: ${result.error}`
          }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command === 'git diff') {
        setStatus('Running git diff...');
        try {
          const result = await gitTool({ operation: 'diff' });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.success
              ? (result.data || 'No changes.')
              : `Git error: ${result.error}`
          }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command.startsWith('git add')) {
        const filesArg = command.slice('git add'.length).trim();
        const files = filesArg ? filesArg.split(/\s+/) : ['.'];
        setStatus(`Staging files: ${files.join(', ')}...`);
        try {
          const result = await gitTool({ operation: 'add', files });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.success
              ? `Staged: ${(result.data?.files || files).join(', ')}`
              : `Git error: ${result.error}`
          }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command === 'git stash') {
        setStatus('Stashing changes...');
        try {
          const result = await gitTool({ operation: 'stash_push' });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.success
              ? 'Changes stashed successfully.'
              : `Git error: ${result.error}`
          }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command === 'git remote') {
        setStatus('Listing remotes...');
        try {
          const result = await gitTool({ operation: 'remote' });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.success
              ? formatGitOutput('remote', result.data)
              : `Git error: ${result.error}`
          }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command === 'git' || command === 'git help') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: [
            'Git Commands:',
            '  /git status     Show working tree status',
            '  /git log [n]    Show commit log (default 10)',
            '  /git diff       Show unstaged changes',
            '  /git add [f]    Stage files (default: all)',
            '  /git stash      Stash changes',
            '  /git remote     List remotes',
            '',
            'Shorthands:',
            '  /commit <msg>   Stage all and commit',
            '  /push           Push to remote',
            '  /pull           Pull from remote',
            '  /branch         List branches',
            '  /branch <name>  Switch branch',
            '  /rollback       Show recent commits to revert',
          ].join('\n')
        }]);
        return;
      }

      if (command.startsWith('commit')) {
        const msg = command.slice('commit'.length).trim();
        if (!msg) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Usage: /commit <message>'
          }]);
          return;
        }
        setStatus('Staging and committing...');
        try {
          const addResult = await gitTool({ operation: 'add', files: ['.'] });
          if (!addResult.success) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Git add error: ${addResult.error}`
            }]);
            setStatus('');
            return;
          }
          const commitResult = await gitTool({ operation: 'commit', message: msg });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: commitResult.success
              ? `Committed: ${commitResult.data?.commit || msg}`
              : `Git error: ${commitResult.error}`
          }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command === 'push') {
        setStatus('Pushing to remote...');
        try {
          const result = await gitTool({ operation: 'push' });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.success
              ? 'Pushed successfully.'
              : `Git error: ${result.error}`
          }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command === 'pull') {
        setStatus('Pulling from remote...');
        try {
          const result = await gitTool({ operation: 'pull' });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.success
              ? `Pulled successfully. Files changed: ${result.data?.files?.length ?? 0}`
              : `Git error: ${result.error}`
          }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command === 'branch') {
        setStatus('Listing branches...');
        try {
          const result = await gitTool({ operation: 'branch_list' });
          if (result.success) {
            const branches = result.data?.branches || [];
            const lines = branches.map((b: any) =>
              `${b.current ? '* ' : '  '}${b.name} ${b.commit ? '(' + b.commit.slice(0, 7) + ')' : ''}`
            );
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: lines.length > 0 ? lines.join('\n') : 'No branches found.'
            }]);
          } else {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Git error: ${result.error}`
            }]);
          }
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command.startsWith('branch ')) {
        const branchName = command.slice('branch '.length).trim();
        if (!branchName) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Usage: /branch <name>'
          }]);
          return;
        }
        setStatus(`Switching to branch ${branchName}...`);
        try {
          const result = await gitTool({ operation: 'checkout', branch: branchName });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.success
              ? `Switched to branch: ${branchName}`
              : `Git error: ${result.error}`
          }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      // ── GitHub slash commands ───────────────────────────────────────

      if (command === 'pr list') {
        setStatus('Listing pull requests...');
        try {
          const result = await githubTool({ operation: 'pr_list' });
          if (result.success && Array.isArray(result.data)) {
            const lines = result.data.map((pr: any) =>
              `#${pr.number} ${pr.title} (${pr.author?.login || pr.author || 'unknown'}) [${pr.headRefName || ''}]`
            );
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: lines.length > 0 ? lines.join('\n') : 'No pull requests found.'
            }]);
          } else {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: result.success
                ? JSON.stringify(result.data, null, 2)
                : `GitHub error: ${result.error}`
            }]);
          }
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command.startsWith('pr ')) {
        const title = command.slice('pr '.length).trim();
        if (!title) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Usage: /pr <title>'
          }]);
          return;
        }
        setStatus('Getting current branch...');
        try {
          const statusResult = await gitTool({ operation: 'status' });
          if (!statusResult.success) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Git error: ${statusResult.error}`
            }]);
            setStatus('');
            return;
          }
          const currentBranch = statusResult.data?.branch;
          setStatus(`Creating PR: "${title}" from ${currentBranch}...`);
          const prResult = await githubTool({
            operation: 'pr_create',
            title,
            head: currentBranch,
          });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: prResult.success
              ? `Pull request created: ${prResult.data || title}`
              : `GitHub error: ${prResult.error}`
          }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command === 'rollback') {
        setStatus('Loading recent commits...');
        try {
          const result = await gitTool({ operation: 'log', count: 10 });
          if (result.success) {
            const lines = result.data.map((c: any, i: number) =>
              `${i + 1}. ${c.hash?.slice(0,7)} ${c.message || ''} (${c.date || ''})`
            );
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: [
                'Recent commits (ask the AI to revert or reset, or use git revert <hash>):',
                ...lines,
              ].join('\n')
            }]);
          } else {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Git error: ${result.error}`
            }]);
          }
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        }
        setStatus('');
        return;
      }

      if (command === 'gh auth') {
        setShowGithubAuth(true);
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
        setThinkingStart(Date.now());

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
        setThinkingStart(0);
        return;
      }
    }

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setStatus('AI thinking...');
    setThinkingStart(Date.now());

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
    setThinkingStart(0);
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

  if (showGithubAuth) {
    return (
      <GithubAuthWizard
        onComplete={(authenticated) => {
          saveGithubAuthState({
            authenticated,
            lastChecked: new Date().toISOString(),
          });
          setShowGithubAuth(false);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: authenticated ? 'GitHub authentication successful!' : 'GitHub authentication skipped.'
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
            <Text color="brightCyan">{'█████ █   █ ████  ████   ███   ████  █████ █   █'}</Text>
            <Text color="cyan">{'  █   █   █ █   █ █   █ █   █  █   █ █    █   █'}</Text>
            <Text color="cyan">{'  █   █   █ ████  ████  █   █  █   █ ████   █ █ '}</Text>
            <Text color="cyan">{'  █   █   █ █  █  █   █ █   █  █   █ █      █ █ '}</Text>
            <Text color="cyan">{'  █    ███  █   █ ████   ███    ███  █████   █  '}</Text>
            <Box flexDirection="column">
              <Text color="gray">{'─'.repeat(48)}</Text>
              <Box>
                <Text color="gray">{' Model  '}</Text>
                <Text color="white">{shortModelName(config.model || 'No model')}</Text>
                <Text color="gray">{'  │  Agent  '}</Text>
                <Text color={mapAgentColor(currentAgent.color)}>{currentAgent.name}</Text>
                <Text color="gray">{'  │  '}</Text>
                <Text color="gray">{versionString}</Text>
              </Box>
              <Box>
                <Text color="gray">{' '}</Text>
                <Text color={agentsContext ? 'green' : 'yellow'}>{agentsContext ? '● AGENTS.md' : '○ No AGENTS.md'}</Text>
                <Text color="gray">{'  │  '}</Text>
                <Text color="cyan">rosmoscato.xyz/turbodev</Text>
              </Box>
            </Box>
          </Box>
        )}
        {showSessionPrompt && pendingSession && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="cyan" bold>Resume previous session?</Text>
            <Text color="gray">  {pendingSession.title || 'Untitled'} ({relativeTime(pendingSession.updatedAt)}, {pendingSession.messages.length} messages)</Text>
            <Text color="gray">  [y/n]</Text>
          </Box>
        )}
        <Static items={messages}>
          {(msg, index) => {
            if (msg.role === 'assistant') {
              return (
                <Box key={index} flexDirection="column">
                  {msg.agentName && (
                    <Text color="magenta" bold>[{msg.agentName}]</Text>
                  )}
                  <Text>{renderMarkdown(msg.content)}</Text>
                </Box>
              );
            }
            return (
              <Box key={index}>
                <Text color={
                  msg.role === 'user' ? 'cyan' :
                  msg.role === 'question' ? 'magenta' :
                  msg.role === 'tool_call' ? 'yellow' :
                  msg.role === 'tool_result' ? 'green' :
                  msg.role === 'permission_ask' ? 'red' : 'gray'
                }>{msg.content}</Text>
              </Box>
            );
          }}
        </Static>
        {streamingMessage && (
          <Box flexDirection="column">
            <Text color="gray">{currentAgent.name}: </Text>
            <Text>{renderMarkdown(streamingMessage.split('\n').slice(-6).join('\n'))}</Text>
          </Box>
        )}
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
        {showCommandPalette && (
          <Box flexDirection="column" alignItems="flex-start" marginY={1}>
            <Text color="cyan" bold>Command palette</Text>
            {PALETTE_COMMANDS.map((cmd, i) => (
              <Box key={cmd.label}>
                <Text color={i === paletteIndex ? 'green' : 'gray'}>
                  {i === paletteIndex ? '> ' : '  '}{cmd.label} — {cmd.description}
                </Text>
              </Box>
            ))}
            <Text color="gray">↑/↓ navigate · Enter select · Esc cancel</Text>
          </Box>
        )}
      </Box>
      {!isInputMode && !showSessionPrompt && (!status || pendingPermission || pendingQuestion) && (
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
          <InputBar
            key={inputKey}
            onSubmit={activeOnSubmit}
            onSlash={() => { setPaletteIndex(0); setShowCommandPalette(true); }}
            agentName={currentAgent.name}
            initialValue={inputPrefill}
          />
        </Box>
      )}
      <Box marginTop={1}>
        <StatusBar model={config.model} status={status} agent={currentAgent} tokenCount={tokenCount} contextLength={contextLength} sessionCost={sessionCost} thinkingStart={thinkingStart} />
      </Box>
    </Box>
  );
}
