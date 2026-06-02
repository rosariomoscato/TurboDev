import { describe, it, expect } from 'vitest';
import { estimateTokens, countMessageTokens } from '../tokens.js';
import type { ChatMessage } from '../client.js';

describe('estimateTokens', () => {
  it('returns a positive number for non-empty text', () => {
    expect(estimateTokens('hello world')).toBeGreaterThan(0);
  });

  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('uses ~4 chars per token', () => {
    expect(estimateTokens('a')).toBe(1);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
    expect(estimateTokens('abcdefgh')).toBe(2);
  });

  it('handles long text', () => {
    const text = 'a'.repeat(4000);
    expect(estimateTokens(text)).toBe(1000);
  });
});

describe('countMessageTokens', () => {
  it('returns 0 for empty array', () => {
    expect(countMessageTokens([])).toBe(0);
  });

  it('counts single message content + role overhead', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'hello' },
    ];
    const result = countMessageTokens(messages);
    expect(result).toBe(estimateTokens('hello') + 4);
  });

  it('sums multiple messages', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are an assistant' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there' },
    ];
    const result = countMessageTokens(messages);
    const expected =
      estimateTokens('You are an assistant') + 4 +
      estimateTokens('hello') + 4 +
      estimateTokens('hi there') + 4;
    expect(result).toBe(expected);
  });

  it('adds 4 tokens role overhead per message', () => {
    const single: ChatMessage[] = [{ role: 'user', content: 'test' }];
    const double: ChatMessage[] = [
      { role: 'user', content: 'test' },
      { role: 'user', content: 'test' },
    ];
    const diff = countMessageTokens(double) - countMessageTokens(single);
    expect(diff).toBe(estimateTokens('test') + 4);
  });

  it('handles empty content', () => {
    const messages: ChatMessage[] = [
      { role: 'assistant', content: '' },
    ];
    expect(countMessageTokens(messages)).toBe(4);
  });
});
