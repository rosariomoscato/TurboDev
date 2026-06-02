import { chatCompletion, ChatMessage } from '../llm/client.js';
import { executeToolCall } from './tools.js';
import { extractToolInvocations, formatToolResult } from './parser.js';
import { generateSystemPrompt } from './system-prompt.js';

export interface AgentStreamChunk {
  type: 'content' | 'tool_call' | 'tool_result';
  text: string;
}

export interface AgentResult {
  messages: ChatMessage[];
  assistantResponse: string;
  toolCalls: number;
}

export async function runAgent(
  userMessage: string,
  conversationHistory: ChatMessage[],
  projectContext: string | null,
  onStream?: (chunk: AgentStreamChunk) => void
): Promise<AgentResult> {
  const systemPrompt = generateSystemPrompt(projectContext ?? undefined);
  let messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  let fullAssistantResponse = '';
  let totalToolCalls = 0;

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

  return {
    messages,
    assistantResponse: fullAssistantResponse,
    toolCalls: totalToolCalls
  };
}