import OpenAI from 'openai';
import { loadConfig } from '../config/store.js';

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
  model?: string
): AsyncGenerator<StreamChunk> {
  const config = loadConfig();
  const client = createOpenRouterClient();
  const modelToUse = model || config.model;

  if (!modelToUse) {
    throw new Error('No model selected. Please run setup: turbodev --setup');
  }

  try {
    const stream = await client.chat.completions.create({
      model: modelToUse,
      messages: messages,
      stream: true,
      temperature: 0.7
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason === 'stop';
      yield { content, done };
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenRouter API error: ${error.message}`);
    }
    throw error;
  }
}