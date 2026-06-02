# Task 04: Register Grep + Bash Tools

## Status

complete

## Wave

2

## Description

Registra i tool `grep` e `bash` (implementati nei task-01 e task-02) nel tool registry e aggiorna il system prompt. Questo task collega le implementazioni indipendenti dei tool all'infrastruttura esistente, rendendoli effettivamente disponibili per l'agente AI.

## Dependencies

**Depends on:** task-01-grep-tool.md, task-02-bash-tool.md
**Blocks:** task-05-question-tool.md

**Context from dependencies:** task-01 crea `turbodev/src/tools/grep.ts` che esporta `GrepArgs`, `GrepResult`, `grepTool`. task-02 crea `turbodev/src/tools/bash.ts` che esporta `BashArgs`, `BashResult`, `bashTool`. Entrambi seguono lo stesso pattern dei tool esistenti (`readFileTool`, `listFilesTool`, ecc.).

## Files to Create

Nessun nuovo file.

## Files to Modify

- `turbodev/src/agent/tools.ts` — Aggiungere grep e bash al `TOOL_REGISTRY` e ai tipi `ToolName`, `ToolArgs`
- `turbodev/src/agent/system-prompt.ts` — Nessuna modifica necessaria (il system prompt viene generato automaticamente dal registry)

## Technical Details

### Modifiche a tools.ts

1. Aggiungere gli import:

```typescript
import { grepTool, GrepArgs, GrepResult } from '../tools/grep.js';
import { bashTool, BashArgs, BashResult } from '../tools/bash.js';
```

2. Aggiornare il tipo `ToolName`:

```typescript
export type ToolName = 'read_file' | 'list_files' | 'edit_file' | 'mkdir' | 'grep' | 'bash';
```

3. Aggiornare il tipo `ToolArgs`:

```typescript
export type ToolArgs =
  | ReadFileArgs
  | ListFilesArgs
  | EditFileArgs
  | MkdirArgs
  | GrepArgs
  | BashArgs;
```

4. Aggiungere le entries nel `TOOL_REGISTRY`:

```typescript
grep: {
  name: 'grep',
  description: `
    Search file contents using regular expressions.
    Args: { pattern: string, include?: string, path?: string }
      - pattern: Regex pattern to search for
      - include: File glob filter (e.g. "*.ts", "*.{ts,tsx}"). Optional.
      - path: Directory to search in. Defaults to current directory. Optional.
    Returns: { matches: [{ file: string, line: number, content: string }], total: number, truncated: boolean }
    `.trim(),
  fn: grepTool
},
bash: {
  name: 'bash',
  description: `
    Execute a shell command and return its output.
    Args: { command: string, timeout?: number, workdir?: string }
      - command: The shell command to execute
      - timeout: Timeout in milliseconds (default: 30000). Optional.
      - workdir: Working directory for the command. Defaults to current directory. Optional.
    Returns: { stdout: string, stderr: string, exitCode: number|null, timedOut: boolean, command: string }
    `.trim(),
  fn: bashTool
}
```

### system-prompt.ts

Nessuna modifica necessaria. Il system prompt viene generato dinamicamente da `TOOL_REGISTRY`:

```typescript
const toolsStr = Object.values(TOOL_REGISTRY)
  .map(tool => `TOOL\n===\nName: ${tool.name}\nDescription: ${tool.description}\n=================\n`)
  .join('\n');
```

Aggiungendo i tool al registry, appariranno automaticamente nel system prompt.

## Acceptance Criteria

- [ ] `tools.ts` importa `grepTool` e `bashTool` con i relativi tipi
- [ ] Il tipo `ToolName` include `'grep'` e `'bash'`
- [ ] Il tipo `ToolArgs` include `GrepArgs` e `BashArgs`
- [ ] Il `TOOL_REGISTRY` ha le entries `grep` e `bash` con descrizioni accurate
- [ ] Il system prompt generato da `generateSystemPrompt()` include grep e bash
- [ ] Il build (`npm run build` in `turbodev/`) passa senza errori
- [ ] Il tool `bash` non e' nel system prompt del task-01 (grep) ne' del task-02 (bash) — solo qui

## Notes

- Le descrizioni dei tool nel registry devono essere concise ma complete — l'LLM le usa per decidere quale tool invocare e con quali argomenti
- Il system prompt non va modificato manualmente — si aggiorna automaticamente tramite il registry
- Non registrare il tool `question` in questo task — avviene nel task-05
