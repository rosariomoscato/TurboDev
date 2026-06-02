import { chatCompletion, ChatMessage, TimeoutError } from '../llm/client.js';
import { executeToolCall } from './tools.js';
import { extractToolInvocations, formatToolResult } from './parser.js';
import { generateSystemPrompt } from './system-prompt.js';

export interface AgentCallbacks {
  onQuestion?: (question: string, options?: string[]) => Promise<string>;
}

export interface AgentStreamChunk {
  type: 'content' | 'tool_call' | 'tool_result' | 'question';
  text: string;
}

export interface AgentResult {
  messages: ChatMessage[];
  assistantResponse: string;
  toolCalls: number;
  error?: {
    type: 'timeout' | 'api_error' | 'unknown';
    message: string;
  };
}

export async function runAgent(
  userMessage: string,
  conversationHistory: ChatMessage[],
  projectContext: string | null,
  onStream?: (chunk: AgentStreamChunk) => void,
  callbacks?: AgentCallbacks
): Promise<AgentResult> {
  const systemPrompt = generateSystemPrompt(projectContext ?? undefined);
  let messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  let fullAssistantResponse = '';
  let totalToolCalls = 0;

  try {
    while (true) {
      let assistantResponse = '';

      for await (const chunk of chatCompletion(messages)) {
        if (chunk.content) {
          assistantResponse += chunk.content;
          fullAssistantResponse += chunk.content;

          onStream?.({
            type: 'content',
            text: chunk.content
          });
        }
      }

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

          const result = await executeToolCall(invocation as any);
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
        error: {
          type: 'timeout',
          message: error.message
        }
      };
    }

    return {
      messages,
      assistantResponse: fullAssistantResponse,
      toolCalls: totalToolCalls,
      error: {
        type: error instanceof Error && error.message.includes('API error') ? 'api_error' : 'unknown',
        message: error instanceof Error ? error.message : String(error)
      }
    };
  }

  return {
    messages,
    assistantResponse: fullAssistantResponse,
    toolCalls: totalToolCalls
  };
}
