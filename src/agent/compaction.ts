import { chatCompletion, ChatMessage } from '../llm/client.js';
import { compactionAgent } from './builtins.js';

export async function compactConversation(
  messages: ChatMessage[],
  model?: string,
): Promise<{ summary: string; newMessages: ChatMessage[] }> {
  const conversationText = messages
    .filter(m => m.role !== 'system')
    .map(m => `[${m.role}]: ${m.content}`)
    .join('\n\n---\n\n');

  const compactionMessages: ChatMessage[] = [
    { role: 'system', content: compactionAgent.prompt! },
    { role: 'user', content: `Summarize this conversation:\n\n${conversationText}` },
  ];

  let summary = '';
  for await (const chunk of chatCompletion(compactionMessages, model)) {
    if (chunk.content) {
      summary += chunk.content;
    }
  }

  const systemMessage = messages.find(m => m.role === 'system');
  const newMessages: ChatMessage[] = [];
  if (systemMessage) {
    newMessages.push(systemMessage);
  }
  newMessages.push({
    role: 'user',
    content: `[Previous conversation summary]\n${summary}`,
  });

  return { summary, newMessages };
}
