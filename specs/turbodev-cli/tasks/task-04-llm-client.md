# Task 04: LLM Client + Models

## Status

complete

## Wave

2

## Description

Implement the OpenRouter LLM client with streaming support using the OpenAI SDK, plus a function to fetch available models from OpenRouter. The client will be used by both the setup wizard (to list models) and the agent loop (to chat with the AI). OpenRouter's API is OpenAI-compatible, so we use the `openai` npm package with a custom base URL.

## Dependencies

**Depends on:** task-01-project-scaffolding (provides openai dependency), task-02-config-store (provides API key from config)
**Blocks:** task-05-agent-loop (needs chatCompletion), task-06-setup-wizard (needs fetchModels)

**Context from dependencies:** Task-02 creates `src/config/store.ts` with `loadConfig()` that returns `{ apiKey, model }`. The LLM client imports this to get the user's API key.

## Files to Create

- `src/llm/client.ts` — OpenRouter client with streaming chat completion
- `src/llm/models.ts` — Fetch available models from OpenRouter API

## Files to Modify

- None

## Technical Details

### Implementation Steps

#### 1. OpenRouter Client (src/llm/client.ts)

1. Import OpenAI SDK and config store
2. Create a function `createOpenRouterClient()` that:
   - Loads config to get API key
   - Returns configured OpenAI client with `baseURL: 'https://openrouter.ai/api/v1'`
   - Throws error if API key is not set
3. Create `chatCompletion()` function:
   - Accepts `messages` array (OpenAI message format: `{ role, content }`)
   - Accepts optional `model` parameter (if not provided, uses model from config)
   - Calls `client.chat.completions.create()` with `stream: true`
   - Returns async generator that yields chunks of text
   - Handles errors and re-throws with descriptive messages
4. Export both functions

**Full src/llm/client.ts:**
```typescript
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
```

#### 2. Model Fetcher (src/llm/models.ts)

1. Import OpenAI SDK and config store
2. Create `fetchAvailableModels()` function that:
   - Loads config to get API key
   - Creates OpenAI client with OpenRouter base URL
   - Calls `client.models.list()` (OpenAI API endpoint that OpenRouter supports)
   - Returns array of models with id, name, and pricing info
   - Filters out non-chat models if needed (OpenRouter has many models)
   - Throws error if API key is not set or API call fails
3. Export the function

**Full src/llm/models.ts:**
```typescript
import OpenAI from 'openai';
import { loadConfig } from '../config/store.js';

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
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
    
    return response.data.map(model => ({
      id: model.id,
      name: model.id,
      description: model.description,
      contextLength: model.context_length
    }));
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`Failed to fetch models: ${error.message}`);
    }
    throw error;
  }
}
```

### Code Snippets

All code snippets are provided above in Implementation Steps.

### Environment Variables

- None (API key stored in ~/.turbodevrc)

### API Endpoints

- `https://openrouter.ai/api/v1/chat/completions` — Chat completion endpoint
- `https://openrouter.ai/api/v1/models` — List models endpoint
- Both are OpenAI-compatible APIs via OpenRouter

## Acceptance Criteria

- [ ] `createOpenRouterClient()` throws error when API key is not in config
- [ ] `chatCompletion()` returns async generator that yields stream chunks
- [ ] Stream chunks have `{ content, done }` structure
- [ ] `done: true` is emitted when stream completes
- [ ] `chatCompletion()` uses model from config if no model parameter provided
- [ ] `chatCompletion()` throws descriptive error if no model is set
- [ ] `chatCompletion()` throws descriptive error on API failures
- [ ] `fetchAvailableModels()` returns array of models with id and name
- [ ] `fetchAvailableModels()` throws error if API key not set
- [ ] Both functions work with OpenRouter's OpenAI-compatible API
- [ ] API errors are caught and re-thrown with user-friendly messages

## Notes

- OpenRouter's API is OpenAI-compatible, so the standard OpenAI SDK works seamlessly
- The `baseURL` is the only configuration needed to point to OpenRouter instead of OpenAI
- Streaming is implemented as an async generator for easy consumption in the agent loop and TUI
- Model IDs from OpenRouter are strings like `anthropic/claude-3-haiku`, `openai/gpt-4-turbo`, etc.
- The setup wizard will use `fetchAvailableModels()` to populate a selectable list
- Error messages reference the setup command (`turbodev --setup`) to guide users who haven't configured yet