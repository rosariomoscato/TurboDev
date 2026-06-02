import { chatCompletion, ChatMessage, TimeoutError } from '../llm/client.js';
import { countMessageTokens, estimateTokens } from '../llm/tokens.js';
import { getContextLength } from '../llm/models.js';
import { loadConfig } from '../config/store.js';
import { executeToolCall } from './tools.js';
import { ToolCallContext } from './tools.js';
import { extractToolInvocations, formatToolResult } from './parser.js';
import { generateSystemPrompt } from './system-prompt.js';
import { AgentConfig } from './types.js';

export interface AgentCallbacks {
  onQuestion?: (question: string, options?: string[]) => Promise<string>;
  onPermissionAsk?: (tool: string, detail?: string) => Promise<boolean>;
}

export interface AgentStreamChunk {
  type: 'content' | 'tool_call' | 'tool_result' | 'question' | 'permission_ask';
  text: string;
}

export interface AgentResult {
  messages: ChatMessage[];
  assistantResponse: string;
  toolCalls: number;
  tokenCount: number;
  contextLength: number;
  inputTokens: number;
  outputTokens: number;
  error?: {
    type: 'timeout' | 'api_error' | 'unknown';
    message: string;
  };
}

export async function runAgent(
  userMessage: string,
  conversationHistory: ChatMessage[],
  projectContext: string | null,
  agent: AgentConfig,
  onStream?: (chunk: AgentStreamChunk) => void,
  callbacks?: AgentCallbacks,
  abortSignal?: AbortSignal
): Promise<AgentResult> {
  const systemPrompt = generateSystemPrompt(projectContext ?? undefined, agent);
  let messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  let fullAssistantResponse = '';
  let totalToolCalls = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let steps = 0;
  const maxSteps = agent.steps;

  const toolContext: ToolCallContext = {
    agent,
    onPermissionAsk: callbacks?.onPermissionAsk,
  };

  const llmOptions: { temperature?: number; topP?: number } = {};
  if (agent.temperature !== undefined) llmOptions.temperature = agent.temperature;
  if (agent.topP !== undefined) llmOptions.topP = agent.topP;

  try {
    while (true) {
      steps++;
      if (maxSteps && steps > maxSteps) {
        const summaryMsg = `Maximum steps (${maxSteps}) reached. Here is a summary of work done so far:\n\n${fullAssistantResponse}`;
        fullAssistantResponse = summaryMsg;
        break;
      }

      let assistantResponse = '';

      const inputBeforeCall = countMessageTokens(messages);

      for await (const chunk of chatCompletion(messages, agent.model, undefined, llmOptions, abortSignal)) {
        if (chunk.content) {
          assistantResponse += chunk.content;
          fullAssistantResponse += chunk.content;

          onStream?.({
            type: 'content',
            text: chunk.content
          });
        }
      }

      totalInputTokens += inputBeforeCall;
      totalOutputTokens += estimateTokens(assistantResponse);

      messages.push({
        role: 'assistant',
        content: assistantResponse
      });

      const toolInvocations = extractToolInvocations(assistantResponse);

      if (toolInvocations.length === 0) {
        break;
      }

      totalToolCalls += toolInvocations.length;

      for (const invocation of toolInvocations) {
        if (invocation.name === 'question' && callbacks?.onQuestion) {
          const args = invocation.args;
          const questionText = typeof args.question === 'string' ? args.question : String(args.question);
          const options = Array.isArray(args.options) ? args.options.map(String) : undefined;

          onStream?.({
            type: 'question',
            text: questionText
          });

          const answer = await callbacks.onQuestion(questionText, options);
          const resultText = formatToolResult({
            success: true,
            result: { question: questionText, answer }
          });

          onStream?.({ type: 'tool_result', text: resultText });
          messages.push({ role: 'user', content: resultText });
        } else {
          onStream?.({
            type: 'tool_call',
            text: `tool: ${invocation.name}(${JSON.stringify(invocation.args)})`
          });

          const result = await executeToolCall(invocation as any, toolContext);
          const resultText = formatToolResult(result);

          onStream?.({
            type: 'tool_result',
            text: resultText
          });

          messages.push({
            role: 'user',
            content: resultText
          });
        }
      }
    }
  } catch (error) {
    if (error instanceof TimeoutError) {
      return {
        messages,
        assistantResponse: fullAssistantResponse,
        toolCalls: totalToolCalls,
        tokenCount: 0,
        contextLength: 0,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        error: {
          type: 'timeout',
          message: error.message
        }
      };
    }

    const isCancelled = error instanceof Error && error.message === 'Request cancelled by user';

    return {
      messages,
      assistantResponse: fullAssistantResponse,
      toolCalls: totalToolCalls,
      tokenCount: 0,
      contextLength: 0,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      error: {
        type: isCancelled ? 'api_error' : (error instanceof Error && error.message.includes('API error') ? 'api_error' : 'unknown'),
        message: isCancelled ? 'Cancelled by user' : (error instanceof Error ? error.message : String(error))
      }
    };
  }

  const tokenCount = countMessageTokens(messages);
  const modelId = agent.model || loadConfig().model;
  const contextLength = getContextLength(modelId || '');

  return {
    messages,
    assistantResponse: fullAssistantResponse,
    toolCalls: totalToolCalls,
    tokenCount,
    contextLength,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens
  };
}
