# Task 01: Grep Tool

## Status

complete

## Wave

1

## Description

Implementa il tool `grep` che permette all'agente AI di cercare nel contenuto dei file usando espressioni regolari. Questo tool e' fondamentale per navigare progetti di dimensioni medio-grandi: senza di esso, l'agente puo' solo leggere file singoli e listare directory, rendendo impossibile trovare codice specifico in un progetto.

Il tool supporta ricerca regex, filtro per pattern di file (es. `*.ts`), e restituisce le corrispondenze con file path, numero di riga e contenuto della riga. Usa `child_process.execSync` con `rg` (ripgrep) se disponibile, altrimenti fallback su una ricerca manuale con `fs.readdir` ricorsivo e `RegExp`.

## Dependencies

**Depends on:** None (Wave 1)
**Blocks:** task-04-register-tools.md

**Context from dependencies:** Nessuna dipendenza. Questo task crea un file nuovo e indipendente.

## Files to Create

- `turbodev/src/tools/grep.ts` — Implementazione del tool grep con ricerca regex nel contenuto dei file

## Files to Modify

Nessun file esistente viene modificato in questo task. La registrazione nel tool registry avviene nel task-04.

## Technical Details

### Interfaccia Args

```typescript
export interface GrepArgs {
  pattern: string;       // Regex pattern da cercare
  include?: string;      // Filtro glob per i file (es. "*.ts", "*.{ts,tsx}")
  path?: string;         // Directory in cui cercare (default: cwd)
}
```

### Interfaccia Result

```typescript
export interface GrepMatch {
  file: string;       // Path relativo del file
  line: number;       // Numero di riga (1-based)
  content: string;    // Contenuto della riga
}

export interface GrepResult {
  matches: GrepMatch[];
  total: number;      // Numero totale di corrispondenze
  truncated: boolean; // true se i risultati sono stati tagliati (max 50)
}
```

### Implementation Steps

1. Creare `turbodev/src/tools/grep.ts`
2. Esportare `GrepArgs`, `GrepMatch`, `GrepResult`
3. Implementare `grepTool(args: GrepArgs): Promise<GrepResult>`
4. Usare `child_process.execSync` per lanciare `rg` (ripgrep) con i flag appropriati
5. Se `rg` non e' disponibile, implementare un fallback manuale:
   - Usare `fs.readdir` ricorsivo per trovare i file
   - Filtrare per `include` glob pattern usando `path.extname` o un semplice matcher
   - Leggere ogni file e cercare con `new RegExp(pattern)`
   - Raccogliere le corrispondenze con file, riga e contenuto
6. Limitare i risultati a 50 corrispondenze e impostare `truncated: true` se superato
7. Gestire errori (pattern regex invalido, path inesistente, ecc.)

### Comando ripgrep equivalente

```bash
rg --line-number --no-heading --color=never {pattern} {path}
```

Con filtro include, usare il flag `-g`:
```bash
rg --line-number --no-heading --color=never -g "{include}" {pattern} {path}
```

### Parse dell'output ripgrep

Ogni riga dell'output ha il formato: `{file}:{line_number}:{content}`

### Fallback manuale (senza ripgrep)

```typescript
import fs from 'fs/promises';
import path from 'path';

async function walkDir(dir: string, includePattern?: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    if (entry.isDirectory()) {
      files.push(...await walkDir(fullPath, includePattern));
    } else if (entry.isFile()) {
      if (!includePattern || matchesGlob(entry.name, includePattern)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function matchesGlob(filename: string, pattern: string): boolean {
  // Gestire pattern semplici come "*.ts" o "*.{ts,tsx}"
  if (pattern.startsWith('*.')) {
    const ext = pattern.slice(1); // ".ts"
    if (pattern.includes('{')) {
      const exts = pattern.match(/\{([^}]+)\}/)?.[1].split(',') || [];
      return exts.some(e => filename.endsWith(e.trim()));
    }
    return filename.endsWith(ext);
  }
  return true;
}
```

### Costanti

```typescript
const MAX_RESULTS = 50;
const DEFAULT_TIMEOUT_MS = 30000;
```

## Acceptance Criteria

- [ ] Il file `turbodev/src/tools/grep.ts` esiste ed esporta `GrepArgs`, `GrepResult`, `grepTool`
- [ ] `grepTool` cerca nel contenuto dei file usando regex
- [ ] Supporta filtro `include` per estensione file (es. `"*.ts"`, `"*.{ts,tsx}"`)
- [ ] Restituisce corrispondenze con file path, numero riga e contenuto
- [ ] Limita i risultati a 50 con `truncated: true` se superato
- [ ] Usa ripgrep se disponibile, fallback manuale altrimenti
- [ ] Salta directory nascoste e `node_modules`
- [ ] Gestisce errori (regex invalido, path inesistente) senza crash

## Notes

- Non modificare `tools.ts` o `system-prompt.ts` in questo task — la registrazione avviene nel task-04
- Il fallback manuale non deve essere perfetto — deve solo funzionare ragionevolmente per i casi comuni
- Non aggiungere dipendenze npm — usare solo Node.js built-in modules (`fs`, `path`, `child_process`)
