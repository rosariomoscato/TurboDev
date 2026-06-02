import OpenAI from 'openai';
import { loadConfig } from '../config/store.js';

const DEFAULT_TIMEOUT_MS = 120_000;

export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`LLM request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

function createOpenRouterClient(): OpenAI {
  const config = loadConfig();

  if (!config.apiKey) {
    throw new Error('OpenRouter API key not set. Please run setup: turbodev --setup');
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config.apiKey
  });
}

export async function* chatCompletion(
  messages: ChatMessage[],
  model?: string,
  timeoutMs?: number,
  options?: { temperature?: number; topP?: number },
  externalSignal?: AbortSignal
): AsyncGenerator<StreamChunk> {
  const config = loadConfig();
  const client = createOpenRouterClient();
  const modelToUse = model || config.model;

  if (!modelToUse) {
    throw new Error('No model selected. Please run setup: turbodev --setup');
  }

  const timeoutSignal = AbortSignal.timeout(timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const signals = externalSignal
    ? AbortSignal.any([timeoutSignal, externalSignal])
    : timeoutSignal;

  try {
    const stream = await client.chat.completions.create(
      {
        model: modelToUse,
        messages: messages,
        stream: true,
        temperature: options?.temperature ?? 0.7,
        ...(options?.topP !== undefined && { top_p: options.topP })
      },
      { signal: signals }
    );

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason === 'stop';
      yield { content, done };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      if (externalSignal?.aborted) {
        throw new Error('Request cancelled by user');
      }
      throw new TimeoutError(timeoutMs ?? DEFAULT_TIMEOUT_MS);
    }
    if (error instanceof OpenAI.APIError) {
      if (externalSignal?.aborted || (error.message && error.message.toLowerCase().includes('aborted'))) {
        throw new Error('Request cancelled by user');
      }
      throw new Error(`OpenRouter API error: ${error.message}`);
    }
    throw error;
  }
}