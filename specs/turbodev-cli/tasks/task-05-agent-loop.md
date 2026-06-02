# Task 05: Agent Loop

## Status

complete

## Wave

3

## Description

Implement the core agent loop that orchestrates the interaction between the user and the LLM. The loop receives user messages, sends them to the LLM (with streaming), parses any tool calls from the LLM response, executes those tools, feeds the results back to the LLM, and continues until the LLM stops requesting tools. This is the heart of the coding agent — where the "magic" happens according to the article.

## Dependencies

**Depends on:** task-03-tools (provides tool registry, parser, system prompt), task-04-llm-client (provides chatCompletion streaming)
**Blocks:** task-07-chat-ui (imports and calls agent loop for each user message)

**Context from dependencies:** Task-03 creates `src/agent/tools.ts` with `executeToolCall()`, `extractToolInvocations()`, and `generateSystemPrompt()`. Task-04 creates `src/llm/client.ts` with `chatCompletion()` async generator. The agent loop integrates these: LLM response → parse tools → execute → feed back → repeat.

## Files to Create

- `src/agent/loop.ts` — Agent loop with streaming and tool execution

## Files to Modify

- None

## Technical Details

### Implementation Steps

The agent loop needs to handle two modes: streaming to the UI (when called from chat) vs. non-streaming for testing. We'll implement it with a callback approach so the TUI can handle streaming output.

1. Define types for agent messages and stream callbacks:
   - `AgentMessageType`: 'user' | 'assistant' | 'tool_call' | 'tool_result'
   - `StreamCallback`: function to receive streaming text chunks

2. Implement `runAgent()` function:
   - Accepts `userMessage`, `conversationHistory`, `onStream` callback
   - Adds system prompt to messages
   - Adds user message to messages
   - Calls `chatCompletion()` with streaming
   - Yields chunks to `onStream` callback as they arrive
   - Accumulates assistant response
   - After stream ends, parses tool invocations from full response
   - If no tools: returns assistant response and messages
   - If tools: for each tool, execute and add tool_result to messages, then call LLM again
   - Inner loop continues until LLM response has no tool calls
   - Returns final messages array and assistant response

3. Export `runAgent` function

**Full src/agent/loop.ts:**
```typescript
import { chatCompletion, ChatMessage } from '../llm/client.js';
import { executeToolCall, extractToolInvocations, formatToolResult } from './tools.js';
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
  onStream?: (chunk: AgentStreamChunk) => void
): Promise<AgentResult> {
  const systemPrompt = generateSystemPrompt();
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
      
      const result = await executeToolCall(invocation);
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
```

### Code Snippets

All code snippets are provided above in Implementation Steps.

### Environment Variables

- None

### API Endpoints

- None (uses chatCompletion from task-04)

## Acceptance Criteria

- [ ] `runAgent()` adds system prompt to message history
- [ ] `runAgent()` streams LLM response chunks via `onStream` callback
- [ ] Stream chunks have `type` ('content', 'tool_call', 'tool_result') and `text`
- [ ] After streaming completes, tool invocations are parsed from full response
- [ ] Tool calls are executed and results are fed back to LLM
- [ ] Inner loop continues until LLM response has no tool calls
- [ ] Multi-step tool chains work (e.g., read file → edit file → confirm)
- [ ] Final returned messages array includes all interactions
- [ ] `toolCalls` in result counts total number of tool executions
- [ ] Agent loop terminates correctly when LLM responds without tools

## Notes

- The agent loop is faithful to the article's architecture: outer loop for user input, inner loop for tool execution
- The `onStream` callback enables the TUI to render streaming responses in real-time
- Tool results are sent back to the LLM as user messages with `tool_result(...)` format (article convention)
- The agent maintains conversation history for context continuity
- Infinite loop protection is implicit: the LLM must eventually stop calling tools, which is normal behavior
- The system prompt includes the tool descriptions, so the LLM knows what tools are available
- This task produces the core "brain" of TurboDev — the integration point between tools, LLM, and streaming