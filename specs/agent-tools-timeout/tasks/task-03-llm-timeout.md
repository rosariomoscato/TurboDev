# Task 03: LLM Streaming Timeout

## Status

complete

## Wave

1

## Description

Aggiunge un timeout alle chiamate LLM streaming nel client OpenRouter. Attualmente, se il modello AI non risponde, la chiamata `chatCompletion` in `src/llm/client.ts` rimane in attesa indefinitamente, bloccando l'applicazione. Questo task introduce un `AbortController` con timeout configurabile per garantire che la chiamata venga interrotta dopo un tempo massimo, lanciando un errore gestibile.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-06-timeout-ui.md

**Context from dependencies:** Nessuna dipendenza. Questo task modifica un file esistente indipendente.

## Files to Create

Nessun nuovo file.

## Files to Modify

- `turbodev/src/llm/client.ts` — Aggiungere AbortController con timeout alla chiamata streaming

## Technical Details

### Codice esistente (src/llm/client.ts)

Il file attualmente crea uno streaming senza alcun timeout:

```typescript
const stream = await client.chat.completions.create({
  model: modelToUse,
  messages: messages,
  stream: true,
  temperature: 0.7
});
```

### Modifiche richieste

1. Aggiungere un timeout configurabile (default: 120000ms = 2 minuti)
2. Usare `AbortSignal.timeout()` per creare un signal con timeout
3. Passare il signal alla chiamata `create` tramite l'opzione `signal`
4. Intercettare l'errore di abort e lanciare un errore specifico con tipo `TimeoutError`
5. Esportare una classe `TimeoutError` personalizzata per permettere al consumer di distinguere i timeout da altri errori

### Implementation Steps

1. Definire una costante `DEFAULT_TIMEOUT_MS = 120000`
2. Creare una classe `TimeoutError` che estende `Error`
3. Modificare `chatCompletion` per accettare un parametro opzionale `timeoutMs`
4. Creare `const signal = AbortSignal.timeout(timeoutMs ?? DEFAULT_TIMEOUT_MS)`
5. Passare `{ signal }` come opzione alla chiamata `client.chat.completions.create`
6. Nel catch, verificare se l'errore e' un `AbortError` e lanciare `TimeoutError` al suo posto
7. Aggiungere `timeoutMs` opzionale anche nella signature della funzione

### Codice modificato

```typescript
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

const DEFAULT_TIMEOUT_MS = 120000;

export async function* chatCompletion(
  messages: ChatMessage[],
  model?: string,
  timeoutMs?: number
): AsyncGenerator<StreamChunk> {
  const config = loadConfig();
  const client = createOpenRouterClient();
  const modelToUse = model || config.model;

  if (!modelToUse) {
    throw new Error('No model selected. Please run setup: turbodev --setup');
  }

  const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const signal = AbortSignal.timeout(timeout);

  try {
    const stream = await client.chat.completions.create(
      {
        model: modelToUse,
        messages: messages,
        stream: true,
        temperature: 0.7
      },
      { signal }
    );

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason === 'stop';
      yield { content, done };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(
        `LLM request timed out after ${timeout / 1000}s. ` +
        `The model did not respond in time. You can try again.`
      );
    }
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenRouter API error: ${error.message}`);
    }
    throw error;
  }
}
```

### Note su AbortSignal.timeout()

- Disponibile in Node.js >= 17.3 (il progetto richiede >= 18, quindi OK)
- Crea un AbortSignal che si attiva automaticamente dopo il tempo specificato
- L'OpenAI SDK supporta l'opzione `signal` per interrompere la richiesta

## Acceptance Criteria

- [ ] `client.ts` esporta la classe `TimeoutError`
- [ ] La funzione `chatCompletion` accetta un terzo parametro opzionale `timeoutMs`
- [ ] Un `AbortSignal.timeout` viene passato alla chiamata OpenAI SDK
- [ ] In caso di abort, viene lanciato un `TimeoutError` con messaggio descrittivo
- [ ] Il timeout di default e' di 120 secondi
- [ ] Gli errori API non-timeout continuano a essere gestiti come prima
- [ ] Il build (`npm run build` in `turbodev/`) passa senza errori

## Notes

- Non modificare `loop.ts` o `App.tsx` — la gestione UI del timeout avviene nel task-06
- Non aggiungere dipendenze npm — `AbortSignal.timeout` e' una API built-in di Node.js
- Il `signal` puo' anche essere usato per abort manuale in futuro (es. l'utente preme Ctrl+C)
