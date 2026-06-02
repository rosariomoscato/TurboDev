import OpenAI from 'openai';
import { loadConfig } from '../config/store.js';

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  promptPrice?: number;
  completionPrice?: number;
}

export interface ModelPricing {
  prompt: number;
  completion: number;
}

const contextLengthCache = new Map<string, number>();
const pricingCache = new Map<string, ModelPricing>();

export function cacheContextLengths(models: ModelInfo[]): void {
  for (const model of models) {
    if (model.contextLength) {
      contextLengthCache.set(model.id, model.contextLength);
    }
    if (model.promptPrice !== undefined && model.completionPrice !== undefined) {
      pricingCache.set(model.id, { prompt: model.promptPrice, completion: model.completionPrice });
    }
  }
}

export function getContextLength(modelId: string): number {
  return contextLengthCache.get(modelId) ?? 128000;
}

export function getModelPricing(modelId: string): ModelPricing | null {
  return pricingCache.get(modelId) ?? null;
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
      contextLength: model.context_length,
      promptPrice: model.pricing?.prompt ? parseFloat(model.pricing.prompt) : undefined,
      completionPrice: model.pricing?.completion ? parseFloat(model.pricing.completion) : undefined,
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