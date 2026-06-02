# Task 05: Question Tool Integration

## Status

complete

## Wave

3

## Description

Implementa il tool `question` che permette all'agente AI di porre domande all'utente durante l'esecuzione. Questo tool e' diverso dagli altri perche' richiede un'interazione bidirezionale: l'agente pone una domanda, l'utente risponde, e la risposta viene iniettata di nuovo nel flusso dell'agente.

Il task include: creazione del tool, registrazione nel registry, modifica dell'agent loop per supportare callback interattive, e integrazione nella UI Ink per mostrare la domanda e raccogliere la risposta.

## Dependencies

**Depends on:** task-04-register-tools.md
**Blocks:** task-06-timeout-ui.md

**Context from dependencies:** task-04 registra grep e bash nel tool registry aggiornando `ToolName`, `ToolArgs`, e `TOOL_REGISTRY` in `turbodev/src/agent/tools.ts`. Questo task aggiunge un ulteriore tool allo stesso registry.

## Files to Create

- `turbodev/src/tools/question.ts` — Implementazione del tool question

## Files to Modify

- `turbodev/src/agent/tools.ts` — Aggiungere question al registry
- `turbodev/src/agent/loop.ts` — Aggiungere callback `onQuestion` e supporto per tool interattivi
- `turbodev/src/ui/App.tsx` — Gestire le domande dell'agente, mostrare opzioni, raccogliere risposta
- `turbodev/src/ui/ChatView.tsx` — Aggiungere il tipo di messaggio `question` per la visualizzazione

## Technical Details

### Architettura del Question Tool

Il question tool e' speciale: non puo' essere una semplice funzione async che ritorna un risultato. Deve comunicare con la UI e attendere la risposta dell'utente. L'approccio:

1. `runAgent` accetta un callback opzionale `onQuestion: (question: string, options?: string[]) => Promise<string>`
2. Quando il tool `question` viene invocato, il loop chiama `onQuestion` e attende
3. In App.tsx, il callback imposta uno stato per mostrare la domanda e ritorna una Promise
4. Quando l'utente risponde, la Promise viene risolta
5. La risposta viene iniettata come `tool_result` e il loop continua

### Interfaccia Args (question.ts)

```typescript
export interface QuestionArgs {
  question: string;       // Il testo della domanda
  options?: string[];     // Opzioni predefinite (opzionale)
}
```

### Interfaccia Result (question.ts)

```typescript
export interface QuestionResult {
  question: string;       // La domanda posta
  answer: string;         // La risposta dell'utente
}
```

### Implementazione question.ts

Il tool in se' e' semplice — la complessita' e' nel loop e nella UI:

```typescript
export async function questionTool(args: QuestionArgs): Promise<QuestionResult> {
  // Questo tool non fa nulla di per se' — il loop lo intercetta
  // e chiama il callback onQuestion. Il risultato viene costruito dal loop.
  // Questa funzione serve solo come placeholder nel registry.
  return {
    question: args.question,
    answer: ''  // Verra' riempito dal loop
  };
}
```

**IMPORTANTE:** Il loop deve intercettare il tool `question` PRIMA di chiamare `executeToolCall`. Invece di eseguire il tool normalmente, il loop chiama `onQuestion` e costruisce il risultato manualmente.

### Modifiche a loop.ts

```typescript
export interface AgentCallbacks {
  onQuestion?: (question: string, options?: string[]) => Promise<string>;
}

export interface AgentStreamChunk {
  type: 'content' | 'tool_call' | 'tool_result' | 'question';
  text: string;
}

export async function runAgent(
  userMessage: string,
  conversationHistory: ChatMessage[],
  onStream?: (chunk: AgentStreamChunk) => void,
  callbacks?: AgentCallbacks
): Promise<AgentResult> {
  // ... (codice esistente per setup messages)

  while (true) {
    // ... (streaming e accumulo risposta)

    const toolInvocations = extractToolInvocations(assistantResponse);
    if (toolInvocations.length === 0) break;

    totalToolCalls += toolInvocations.length;

    for (const invocation of toolInvocations) {
      if (invocation.name === 'question' && callbacks?.onQuestion) {
        // Intercetta il question tool
        const args = invocation.args as QuestionArgs;
        onStream?.({
          type: 'question',
          text: args.question
        });

        const answer = await callbacks.onQuestion(args.question, args.options);
        const resultText = formatToolResult({
          success: true,
          result: { question: args.question, answer }
        });

        onStream?.({ type: 'tool_result', text: resultText });
        messages.push({ role: 'user', content: resultText });
      } else {
        // Tool normale
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
  // ... (return)
}
```

### Modifiche a App.tsx

Aggiungere stato per la domanda in sospeso e un meccanismo di Promise per la risposta:

```typescript
// Nuovo stato
const [pendingQuestion, setPendingQuestion] = useState<{
  question: string;
  options?: string[];
  resolve: (answer: string) => void;
} | null>(null);

// Callback onQuestion
const handleQuestion = async (question: string, options?: string[]): Promise<string> => {
  return new Promise((resolve) => {
    setPendingQuestion({ question, options, resolve });
  });
};

// Quando l'utente risponde alla domanda
const handleQuestionAnswer = (answer: string) => {
  if (pendingQuestion) {
    setMessages(prev => [...prev,
      { role: 'question', content: pendingQuestion.question },
      { role: 'user', content: answer }
    ]);
    pendingQuestion.resolve(answer);
    setPendingQuestion(null);
  }
};

// Modifica a handleUserInput per gestire le risposte alle domande
// Quando pendingQuestion !== null, l'input dell'utente va a handleQuestionAnswer
// invece che a handleUserInput normale

// Nel render, mostrare la domanda se pendingQuestion esiste
// e usare InputBar con onSubmit che punta a handleQuestionAnswer
```

La logica di `handleUserInput` deve essere modificata per intercettare il caso in cui `pendingQuestion` e' attivo. In quel caso, l'input dell'utente non va all'agente ma risolve la domanda:

```typescript
const handleUserInput = async (input: string) => {
  // Se c'e' una domanda in sospeso, l'input e' la risposta
  if (pendingQuestion) {
    handleQuestionAnswer(input);
    return;
  }

  // ... logica esistente per comandi e agent
  // Aggiungere callbacks alla chiamata runAgent:
  const result = await runAgent(
    input,
    conversationHistory,
    (chunk) => { /* ... esistente ... */ },
    { onQuestion: handleQuestion }
  );
};
```

### Modifiche a ChatView.tsx

Aggiungere il colore per il tipo `question`:

```typescript
interface MessageDisplay {
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'question';
  content: string;
}

const getColor = (role: string) => {
  switch (role) {
    case 'user': return 'cyan';
    case 'assistant': return 'white';
    case 'tool_call': return 'yellow';
    case 'tool_result': return 'green';
    case 'question': return 'magenta';
    default: return 'gray';
  }
};
```

### Modifiche a tools.ts

Aggiungere al registry:

```typescript
import { questionTool, QuestionArgs, QuestionResult } from '../tools/question.js';

export type ToolName = 'read_file' | 'list_files' | 'edit_file' | 'mkdir' | 'grep' | 'bash' | 'question';

export type ToolArgs =
  | ReadFileArgs
  | ListFilesArgs
  | EditFileArgs
  | MkdirArgs
  | GrepArgs
  | BashArgs
  | QuestionArgs;

// Nel TOOL_REGISTRY aggiungere:
question: {
  name: 'question',
  description: `
    Ask the user a question and wait for their response. Use this to clarify ambiguous instructions or get decisions.
    Args: { question: string, options?: string[] }
      - question: The question text to present to the user
      - options: Optional list of suggested answers the user can choose from
    Returns: { question: string, answer: string }
    `.trim(),
  fn: questionTool
}
```

### System prompt - nota

Il tool verra' incluso automaticamente nel system prompt grazie alla generazione dinamica da `TOOL_REGISTRY`.

## Acceptance Criteria

- [ ] `question.ts` esiste ed esporta `QuestionArgs`, `QuestionResult`, `questionTool`
- [ ] `tools.ts` registra il tool `question` nel `TOOL_REGISTRY`
- [ ] `loop.ts` accetta un parametro `callbacks` con `onQuestion`
- [ ] `loop.ts` intercetta il tool `question` e chiama `onQuestion` invece di `executeToolCall`
- [ ] `loop.ts` aggiunge il tipo `'question'` a `AgentStreamChunk`
- [ ] `App.tsx` gestisce lo stato `pendingQuestion` con resolve di Promise
- [ ] Quando `pendingQuestion` e' attivo, l'input dell'utente risponde alla domanda
- [ ] `ChatView.tsx` mostra i messaggi di tipo `question` con colore `magenta`
- [ ] Il build (`npm run build` in `turbodev/`) passa senza errori
- [ ] L'utente puo' sempre digitare una risposta libera, anche se ci sono opzioni predefinite

## Notes

- Il question tool e' l'unico tool "interattivo" — tutti gli altri sono eseguiti automaticamente
- L'approccio con Promise + resolve callback e' il piu' semplice per comunicare tra agent loop (async) e UI React (state-driven)
- Le opzioni predefinite sono solo suggerimenti — l'utente deve sempre poter digitare qualsiasi cosa
- Non mostrare le opzioni come menu' selezionabile — basta mostrarle come testo e l'utente digita la risposta
