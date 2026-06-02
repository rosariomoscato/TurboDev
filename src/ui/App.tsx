import React, { useState, useEffect, useRef } from 'react';
import { Box, useApp, useInput, Text } from 'ink';
import { loadConfig, saveConfig } from '../config/store.js';
import { runAgent } from '../agent/loop.js';
import { ChatMessage } from '../llm/client.js';
import { fetchAvailableModels } from '../llm/models.js';
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
import { version } from '../../package.json';

export default function App() {
  const { exit } = useApp();
  const [config, setConfig] = useState(loadConfig());
  const [setupNeeded, setSetupNeeded] = useState(!config.apiKey || !config.model);
  const [agentsContext, setAgentsContext] = useState<string | null>(() => loadAgentsMd(process.cwd()));
  const [showInitWizard, setShowInitWizard] = useState(false);

  const [allAgents] = useState<AgentConfig[]>(() => loadAllAgents(process.cwd()));
  const [primaryAgents] = useState<AgentConfig[]>(() => allAgents.filter(a => a.mode !== 'subagent'));
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [currentAgent, setCurrentAgent] = useState<AgentConfig>(() => allAgents.filter(a => a.mode !== 'subagent')[0]);

  const [messages, setMessages] = useState<MessageDisplay[]>([
    {
      role: 'assistant',
      content: [
        '████████╗██╗   ██╗██████╗ ██████╗  ██████╗ ██████╗ ███████╗██╗   ██╗',
        '╚══██╔══╝██║   ██║██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██╔════╝██║   ██║',
        '   ██║   ██║   ██║██████╔╝██████╔╝██║   ██║██║  ██║█████╗  ██║   ██║',
        '   ██║   ██║   ██║██╔══██╗██╔══██╗██║   ██║██║  ██║██╔══╝  ╚██╗ ██╔╝',
        '   ██║   ╚██████╔╝██║  ██║██████╔╝╚██████╔╝██████╔╝███████╗ ╚████╔╝ ',
        '   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝  ╚═══╝  ',
        '',
        'by Rosario Moscato',
        `v${version}`,
        '',
        agentsContext
          ? `AGENTS.md loaded from ${process.cwd()}/AGENTS.md`
          : `No AGENTS.md found in ${process.cwd()}/ — use /init to create one`,
        `Agent: ${allAgents.filter(a => a.mode !== 'subagent')[0]?.name || 'editor'}`,
        ''
      ].join('\n')
    }
  ]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
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

  useEffect(() => {
    registerTaskTool(createTaskTool(process.cwd(), currentAgent, runAgent));
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

  useInput((input, key) => {
    if (key.tab && !showModelSelector && !pendingQuestion && !pendingPermission) {
      const agents = primaryAgentsRef.current;
      const nextIndex = (currentAgentIndex + 1) % agents.length;
      switchAgent(agents[nextIndex], nextIndex);
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
      { onQuestion: handleQuestion, onPermissionAsk: handlePermissionAsk }
    );

    return { result, finalContent };
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

    if (input.startsWith('/')) {
      const command = input.slice(1);

      if (command === 'help') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Commands: /help, /init, /model, /agent, /setup, /clear, /exit\nTab: switch agent'
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
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Available agents:\n' + primaryAgents.map((a, i) =>
            `${i + 1}. ${a.name} — ${a.description}${a.name === currentAgent.name ? ' (current)' : ''}`
          ).join('\n') + '\n\nType /<number> to switch (e.g. /2)'
        }]);
        return;
      }

      const agentNum = parseInt(command, 10);
      if (!isNaN(agentNum)) {
        if (agentNum > 0 && agentNum <= primaryAgents.length) {
          switchAgent(primaryAgents[agentNum - 1], agentNum - 1);
          return;
        }
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

    if (result.error) {
      const errorPrefix = result.error.type === 'timeout'
        ? 'Timeout'
        : result.error.type === 'api_error'
        ? 'API Error'
        : 'Error';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `${errorPrefix}: ${result.error!.message}\n\nYou can try sending your message again.`
      }]);
    } else {
      if (finalContent) {
        setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);
      }
      setConversationHistory(result.messages);
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
          setAgentsContext(loadAgentsMd(process.cwd()));
          setShowInitWizard(false);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'AGENTS.md context loaded.'
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
        <ChatView messages={messages} />
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
      {!showModelSelector && (
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
        <StatusBar model={config.model} status={status} agent={currentAgent} />
      </Box>
    </Box>
  );
}
