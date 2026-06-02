import OpenAI from 'openai';
import { loadConfig } from '../config/store.js';

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
}

const contextLengthCache = new Map<string, number>();

export function cacheContextLengths(models: ModelInfo[]): void {
  for (const model of models) {
    if (model.contextLength) {
      contextLengthCache.set(model.id, model.contextLength);
    }
  }
}

export function getContextLength(modelId: string): number {
  return contextLengthCache.get(modelId) ?? 128000;
}

export async function fetchAvailableModels(): Promise<ModelInfo[]> {
  const config = loadConfig();

  if (!config.apiKey) {
    throw new Error('OpenRouter API key not set');
  }

  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config.apiKey
  });

  try {
    const response = await client.models.list();

    const models = response.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      description: model.description,
      contextLength: model.context_length
    }));

    cacheContextLengths(models);

    return models;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`Failed to fetch models: ${error.message}`);
    }
    throw error;
  }
}