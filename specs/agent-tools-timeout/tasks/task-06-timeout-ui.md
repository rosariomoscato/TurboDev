# Task 06: Timeout Error Handling in Agent Loop + UI

## Status

complete

## Wave

4

## Description

 Integra la gestione del timeout LLM (implementato nel task-03) nell'agent loop e nella UI. Quando il modello AI non risponde entro il timeout, l'errore `TimeoutError` deve essere catturato nel loop, comunicato alla UI con un messaggio chiaro, e l'utente deve poter continuare a usare TurboDev senza riavviare l'applicazione.

Attualmente, qualsiasi errore non gestito in `runAgent` causa un crash dell'app. Questo task aggiunge error boundary nell'agent loop e nella UI per gestire graceful i timeout (e potenzialmente altri errori LLM).

## Dependencies

**Depends on:** task-03-llm-timeout.md, task-05-question-tool.md
**Blocks:** None

**Context from dependencies:**
- task-03 modifica `src/llm/client.ts` per esportare la classe `TimeoutError` e lanciarla quando la chiamata streaming va in timeout. Il timeout di default e' 120 secondi.
- task-05 modifica `src/agent/loop.ts` per aggiungere il parametro `callbacks` e il supporto per tool interattivi. La signature di `runAgent` diventa: `runAgent(userMessage, conversationHistory, onStream?, callbacks?)`.

## Files to Create

Nessun nuovo file.

## Files to Modify

- `turbodev/src/agent/loop.ts` — Aggiungere try/catch attorno alla chiamata streaming per catturare `TimeoutError` e altri errori, ritornando un risultato parziale con informazioni sull'errore
- `turbodev/src/ui/App.tsx` — Gestire gli errori di timeout nella `handleUserInput`, mostrare un messaggio di errore user-friendly, permettere all'utente di continuare

## Technical Details

### Modifiche a loop.ts

Aggiungere un tipo di risultato che include la possibilita' di errore:

```typescript
export interface AgentResult {
  messages: ChatMessage[];
  assistantResponse: string;
  toolCalls: number;
  error?: {
    type: 'timeout' | 'api_error' | 'unknown';
    message: string;
  };
}
```

Modificare `runAgent` per catturare errori:

```typescript
import { TimeoutError } from '../llm/client.js';

export async function runAgent(
  userMessage: string,
  conversationHistory: ChatMessage[],
  onStream?: (chunk: AgentStreamChunk) => void,
  callbacks?: AgentCallbacks
): Promise<AgentResult> {
  const systemPrompt = generateSystemPrompt();
  let messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  let fullAssistantResponse = '';
  let totalToolCalls = 0;

  try {
    while (true) {
      let assistantResponse = '';

      for await (const chunk of chatCompletion(messages)) {
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
          const args = invocation.args as QuestionArgs;
          onStream?.({ type: 'question', text: args.question });
          const answer = await callbacks.onQuestion(args.question, args.options);
          const resultText = formatToolResult({
            success: true,
            result: { question: args.question, answer }
          });
          onStream?.({ type: 'tool_result', text: resultText });
          messages.push({ role: 'user', content: resultText });
        } else {
          onStream?.({
            type: 'tool_call',
            text: `tool: ${invocation.name}(${JSON.stringify(invocation.args)})`
          });
          const result = await executeToolCall(invocation as any);
          const resultText = formatToolResult(result);
          onStream?.({ type: 'tool_result', text: resultText });
          messages.push({ role: 'user', content: resultText });
        }
      }
    }
  } catch (error) {
    if (error instanceof TimeoutError) {
      return {
        messages,
        assistantResponse: fullAssistantResponse,
        toolCalls: totalToolCalls,
        error: {
          type: 'timeout',
          message: error.message
        }
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

### Modifiche a App.tsx

Modificare la sezione di `handleUserInput` che gestisce il risultato di `runAgent`:

```typescript
const result = await runAgent(
  input,
  conversationHistory,
  (chunk) => {
    if (chunk.type === 'content') {
      finalContent += chunk.text;
    } else if (chunk.type === 'tool_call') {
      setMessages(prev => [...prev, { role: 'tool_call', content: chunk.text }]);
    } else if (chunk.type === 'tool_result') {
      setMessages(prev => [...prev, { role: 'tool_result', content: chunk.text }]);
    } else if (chunk.type === 'question') {
      setMessages(prev => [...prev, { role: 'question', content: chunk.text }]);
    }
  },
  { onQuestion: handleQuestion }
);

if (result.error) {
  const errorPrefix = result.error.type === 'timeout'
    ? '⏱ Timeout'
    : result.error.type === 'api_error'
    ? '⚠ API Error'
    : '⚠ Error';

  setMessages(prev => [...prev, {
    role: 'assistant',
    content: `${errorPrefix}: ${result.error!.message}\n\nYou can try sending your message again.`
  }]);
  // NON impostare conversationHistory — l'errore non va nella storia
  // per evitare che il contesto corrotto influenzi le chiamate successive
} else {
  if (finalContent) {
    setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);
  }
  setConversationHistory(result.messages);
}

setStatus('');
```

### Import necessari

In `loop.ts`:
```typescript
import { TimeoutError } from '../llm/client.js';
```

### Comportamento atteso in caso di timeout

1. L'utente invia un messaggio
2. L'UI mostra "AI thinking..."
3. Dopo 120 secondi senza risposta, il timeout scatta
4. Il loop cattura il `TimeoutError` e ritorna con `error.type === 'timeout'`
5. L'UI mostra un messaggio tipo: `⏱ Timeout: LLM request timed out after 120s. The model did not respond in time. You can try sending your message again.`
6. La status bar torna allo stato idle
7. L'utente puo' inviare un nuovo messaggio — l'app funziona normalmente

### Cosa NON salvare in caso di errore

Quando si verifica un timeout, la `conversationHistory` NON deve essere aggiornata con le informazioni dell'errore. Questo perche':
- Il contesto parziale potrebbe essere corrotto o incompleto
- Il messaggio dell'utente rimane visibile nella chat ma non nella storia per l'LLM
- L'utente puo' semplicemente rinviare lo stesso messaggio

## Acceptance Criteria

- [ ] `loop.ts` importa `TimeoutError` da `../llm/client.js`
- [ ] `AgentResult` ha un campo opzionale `error` con `type` e `message`
- [ ] Il body principale di `runAgent` e' avvolto in un try/catch
- [ ] `TimeoutError` viene catturato e ritorna `error.type === 'timeout'`
- [ ] Altri errori API vengono catturati e ritornano con `error.type === 'api_error'` o `'unknown'`
- [ ] In caso di timeout, l'UI mostra un messaggio chiaro con indicazione di retry
- [ ] In caso di timeout, la `conversationHistory` NON viene aggiornata
- [ ] Dopo un timeout, l'utente puo' inviare un nuovo messaggio e l'app funziona normalmente
- [ ] L'UI mostra "AI thinking..." durante l'attesa e torna idle dopo il timeout
- [ ] Il build (`npm run build` in `turbodev/`) passa senza errori

## Notes

- Il try/catch deve avvolgere l'intero `while(true)` loop, non solo la singola chiamata streaming — un errore durante l'esecuzione dei tool deve essere gestito allo stesso modo
- Non usare `process.exit()` ne' `throw` non gestito — l'errore deve sempre risultare in un risultato graceful
- Il messaggio di errore nella UI deve essere informativo ma non tecnico — l'utente finale non deve vedere stack trace
- La gestione del timeout e' complementare al question tool: entrambi modificano `loop.ts` e `App.tsx`, ma il task-05 (question) viene eseguito prima di questo task, quindi questo task lavora sulla versione gia' aggiornata dei file
