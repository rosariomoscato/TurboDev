# Task 10: Agent Loop Update

## Status

pending

## Wave

4

## Description

This is the central integration task. It modifies `src/agent/loop.ts` to accept an `AgentConfig` parameter and enforce all agent-specific settings: tool filtering, permission checks via callbacks, model/temperature/topP overrides, max step limits, and custom system prompts. The agent loop is the heart of TurboDev — this task wires together the types (task-01), permissions (task-05), system prompt (task-07), tools (task-08), and LLM client (task-06) into a cohesive, agent-aware execution engine.

## Dependencies

**Depends on:** task-01-agent-types.md (AgentConfig), task-05-permission-system.md (resolveToolPermission used via tools), task-06-llm-client-update.md (chatCompletion accepts temperature/topP), task-07-system-prompt-update.md (generateSystemPrompt accepts agent), task-08-tools-update.md (executeToolCall accepts ToolCallContext)
**Blocks:** task-13-app-integration.md (calls runAgent with AgentConfig)

**Context from dependencies:** task-01 creates `AgentConfig`. task-06 updates `chatCompletion` to accept `options?: { temperature?: number; topP?: number }` as the 4th parameter. task-07 updates `generateSystemPrompt(projectContext?, agent?)` to filter tools and use custom prompts. task-08 updates `executeToolCall(call, context?)` where context includes `agent` and `onPermissionAsk`. task-05 creates `resolveToolPermission` which is called internally by the updated `executeToolCall`.

## Files to Modify

- `src/agent/loop.ts` — Accept AgentConfig, enforce permissions, max steps, model/temperature overrides

## Technical Details

### Current State

Current `runAgent` signature (line 25):
```ts
export async function runAgent(
  userMessage: string,
  conversationHistory: ChatMessage[],
  projectContext: string | null,
  onStream?: (chunk: AgentStreamChunk) => void,
  callbacks?: AgentCallbacks
): Promise<AgentResult>
```

### Implementation Steps

1. Import `AgentConfig` from `./types.js`
2. Add `agent: AgentConfig` parameter (after `projectContext`, before `onStream`)
3. Generate system prompt using the agent-aware version: `generateSystemPrompt(projectContext ?? undefined, agent)`
4. Pass `agent.model`, `temperature`, and `topP` to `chatCompletion`
5. Add step counting with `agent.steps` limit
6. Create `ToolCallContext` from agent config and callbacks
7. Pass context to `executeToolCall`
8. Filter tool invocations against agent's enabled tools before execution

### Code Snippets

```ts
import { chatCompletion, ChatMessage, TimeoutError } from '../llm/client.js';
import { executeToolCall, ToolCallContext } from './tools.js';
import { extractToolInvocations, formatToolResult } from './parser.js';
import { generateSystemPrompt } from './system-prompt.js';
import type { AgentConfig } from './types.js';

export interface AgentCallbacks {
  onQuestion?: (question: string, options?: string[]) => Promise<string>;
  onPermissionAsk?: (tool: string, detail?: string) => Promise<boolean>;
}

export interface AgentStreamChunk {
  type: 'content' | 'tool_call' | 'tool_result' | 'question' | 'permission_ask';
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
  agent: AgentConfig,
  onStream?: (chunk: AgentStreamChunk) => void,
  callbacks?: AgentCallbacks
): Promise<AgentResult> {
  const systemPrompt = generateSystemPrompt(projectContext ?? undefined, agent);
  let messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  let fullAssistantResponse = '';
  let totalToolCalls = 0;
  let steps = 0;
  const maxSteps = agent.steps;

  const toolContext: ToolCallContext = {
    agent,
    onPermissionAsk: callbacks?.onPermissionAsk,
  };

  const llmModel = agent.model;
  const llmOptions: { temperature?: number; topP?: number } = {};
  if (agent.temperature !== undefined) llmOptions.temperature = agent.temperature;
  if (agent.topP !== undefined) llmOptions.topP = agent.topP;

  try {
    while (true) {
      steps++;
      if (maxSteps && steps > maxSteps) {
        const summaryMsg = `Maximum steps (${maxSteps}) reached. Here is a summary of work done so far:\n\n${fullAssistantResponse}`;
        messages.push({ role: 'assistant', content: summaryMsg });
        fullAssistantResponse = summaryMsg;
        break;
      }

      let assistantResponse = '';

      for await (const chunk of chatCompletion(messages, llmModel, undefined, llmOptions)) {
        if (chunk.content) {
          assistantResponse += chunk.content;
          fullAssistantResponse += chunk.content;
          onStream?.({ type: 'content', text: chunk.content });
        }
      }

      messages.push({ role: 'assistant', content: assistantResponse });

      const toolInvocations = extractToolInvocations(assistantResponse);

      if (toolInvocations.length === 0) break;

      totalToolCalls += toolInvocations.length;

      for (const invocation of toolInvocations) {
        if (invocation.name === 'question' && callbacks?.onQuestion) {
          // existing question handling — unchanged
          const args = invocation.args;
          const questionText = typeof args.question === 'string' ? args.question : String(args.question);
          const options = Array.isArray(args.options) ? args.options.map(String) : undefined;

          onStream?.({ type: 'question', text: questionText });

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

          const result = await executeToolCall(invocation as any, toolContext);
          const resultText = formatToolResult(result);

          onStream?.({ type: 'tool_result', text: resultText });
          messages.push({ role: 'user', content: resultText });
        }
      }
    }
  } catch (error) {
    // same error handling as before
    if (error instanceof TimeoutError) {
      return {
        messages,
        assistantResponse: fullAssistantResponse,
        toolCalls: totalToolCalls,
        error: { type: 'timeout', message: error.message }
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
```

### Key Changes from Current Code

1. **New `agent` parameter** in `runAgent` signature (position 4)
2. **Agent-aware system prompt** via `generateSystemPrompt(projectContext, agent)`
3. **Model override**: `chatCompletion(messages, agent.model, undefined, llmOptions)`
4. **Temperature/topP override**: passed via `llmOptions`
5. **Max steps**: `if (maxSteps && steps > maxSteps)` breaks the loop with a summary
6. **Permission-aware tool execution**: `executeToolCall(call, toolContext)` where context contains agent + permission callback
7. **Step counter**: incremented each iteration of the while loop

## Acceptance Criteria

- [ ] `runAgent` accepts `agent: AgentConfig` as 4th parameter
- [ ] Agent's custom prompt is used in system prompt generation
- [ ] Agent's model override is passed to `chatCompletion`
- [ ] Agent's temperature/topP override is passed to `chatCompletion`
- [ ] Max steps limit breaks the loop and returns a summary message
- [ ] `ToolCallContext` with agent and permission callback is passed to `executeToolCall`
- [ ] The `question` tool handling continues to work via `onQuestion` callback
- [ ] Error handling (timeout, API error) is preserved
- [ ] The `AgentStreamChunk` type includes `'permission_ask'` type
- [ ] File compiles with `npx tsc --noEmit`

## Notes

- The signature change breaks existing callers. The caller in `App.tsx` will be updated in task-13. For now, the TypeScript compiler will flag the issue — that's expected and will be resolved by task-13.
- The step counter counts each LLM API call as one step. Tool invocations within a single response count as part of that step (not additional steps).
- The max steps summary message is appended as an assistant message so it appears in the chat naturally.
