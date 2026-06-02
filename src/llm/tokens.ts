import type { ChatMessage } from './client.js';

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function countMessageTokens(messages: ChatMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    total += estimateTokens(msg.content);
    total += 4;
  }
  return total;
}
