# Task 02: Bash Tool

## Status

complete

## Wave

1

## Description

Implementa il tool `bash` che permette all'agente AI di eseguire comandi shell nel sistema dell'utente. Questo tool trasforma TurboDev da un semplice editor di file a un agente completo: permette di eseguire test, build, git, npm, e qualsiasi altro comando da terminale. Il tool cattura stdout e stderr, ha un timeout configurabile, e restituisce il risultato all'agente.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-04-register-tools.md

**Context from dependencies:** Nessuna dipendenza. Questo task crea un file nuovo e indipendente.

## Files to Create

- `turbodev/src/tools/bash.ts` — Implementazione del tool bash per esecuzione comandi shell

## Files to Modify

Nessun file esistente viene modificato in questo task. La registrazione nel tool registry avviene nel task-04.

## Technical Details

### Interfaccia Args

```typescript
export interface BashArgs {
  command: string;        // Il comando shell da eseguire
  timeout?: number;       // Timeout in millisecondi (default: 30000)
  workdir?: string;       // Directory di lavoro (default: process.cwd())
}
```

### Interfaccia Result

```typescript
export interface BashResult {
  stdout: string;         // Output standard
  stderr: string;         // Output errore
  exitCode: number | null; // Exit code (null se killed da timeout)
  timedOut: boolean;      // true se il comando e' andato in timeout
  command: string;        // Il comando eseguito (per riferimento)
}
```

### Implementation Steps

1. Creare `turbodev/src/tools/bash.ts`
2. Esportare `BashArgs`, `BashResult`, `bashTool`
3. Usare `child_process.spawn` per eseguire il comando
4. Impostare un timeout con `setTimeout` che killa il processo figlio
5. Raccogliere stdout e stderr come stringhe
6. Gestire gli eventi `close` e `error` del processo
7. Troncare output eccessivamente lunghi (max 10000 caratteri per canale)
8. Ritornare il risultato con tutti i campi

### Implementazione core

```typescript
import { spawn } from 'child_process';
import path from 'path';

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_OUTPUT_LENGTH = 10000;

export async function bashTool(args: BashArgs): Promise<BashResult> {
  const timeout = args.timeout ?? DEFAULT_TIMEOUT_MS;
  const cwd = args.workdir
    ? path.resolve(process.cwd(), args.workdir)
    : process.cwd();

  return new Promise((resolve) => {
    const proc = spawn('sh', ['-c', args.command], {
      cwd,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, timeout);

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        stdout: truncate(stdout, MAX_OUTPUT_LENGTH),
        stderr: truncate(stderr, MAX_OUTPUT_LENGTH),
        exitCode: code,
        timedOut,
        command: args.command,
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        timedOut: false,
        command: args.command,
      });
    });
  });
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '\n... [truncated]';
}
```

### Costanti

```typescript
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_OUTPUT_LENGTH = 10000;
```

## Acceptance Criteria

- [ ] Il file `turbodev/src/tools/bash.ts` esiste ed esporta `BashArgs`, `BashResult`, `bashTool`
- [ ] `bashTool` esegue comandi shell tramite `spawn('sh', ['-c', command])`
- [ ] Cattura stdout e stderr come stringhe
- [ ] Ha un timeout di default di 30 secondi, configurabile via argomento
- [ ] Se il comando va in timeout, il processo viene killato e `timedOut: true` nel risultato
- [ ] Tronca output oltre 10000 caratteri
- [ ] Supporta directory di lavoro personalizzata tramite `workdir`
- [ ] Gestisce errori del processo (es. comando non trovato) senza crash

## Notes

- Non modificare `tools.ts` o `system-prompt.ts` in questo task — la registrazione avviene nel task-04
- Non aggiungere dipendenze npm — usare solo Node.js built-in `child_process`
- Il tool esegue comandi arbitrari — la sicurezza e' responsabilita' dell'utente. Non implementare whitelist o approvazione in questo task
- Usa `spawn` non `exec` per avere un controllo migliore sul timeout e sui processi figli
