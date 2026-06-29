# Strumenti

Strumenti disponibili per gli agenti di TurboDev.

Gli agenti hanno accesso a un insieme di strumenti per interagire con il tuo codice. La disponibilità degli strumenti può essere controllata per ogni agente tramite la configurazione `tools`.

## Riferimento

| Strumento | Descrizione |
|-----------|-------------|
| `bash` | Esegue comandi shell |
| `edit_file` | Crea o modifica file |
| `git` | Esegue operazioni Git |
| `github` | Esegue operazioni GitHub |
| `grep` | Cerca nel contenuto dei file con regex |
| `list_files` | Elenca il contenuto di una directory |
| `mkdir` | Crea directory |
| `question` | Pone una domanda all'utente |
| `read_file` | Legge il contenuto di un file |
| `load_skill` | Carica istruzioni di skill o file di risorsa |
| `save_memory` | Salva un fatto durevole nella memoria persistente |
| `task` | Invoca un sottoagente |

## read_file

Legge l'intero contenuto di un file.

**Argomenti**: `{ path: string }`

```
read_file({ "path": "src/index.ts" })
```

## edit_file

Crea o modifica un file. Se `old_str` è vuoto, crea il file con `new_str`. Altrimenti, cerca e sostituisce la prima occorrenza di `old_str` con `new_str`.

**Argomenti**: `{ path: string, old_str: string, new_str: string }`

```
edit_file({ "path": "src/app.ts", "old_str": "hello", "new_str": "world" })
```

## list_files

Elenca file e directory in un dato percorso.

**Argomenti**: `{ path?: string }` (directory corrente come predefinita)

```
list_files({ "path": "src" })
```

## mkdir

Crea una nuova directory, incluse le directory padre.

**Argomenti**: `{ path: string }`

```
mkdir({ "path": "src/components/ui" })
```

## grep

Cerca nel contenuto dei file usando espressioni regolari.

**Argomenti**: `{ pattern: string, include?: string, path?: string }`

```
grep({ "pattern": "TODO", "include": "*.ts" })
```

## bash

Esegue un comando shell e restituisce l'output.

**Argomenti**: `{ command: string, timeout?: number, workdir?: string }`

```
bash({ "command": "npm test", "timeout": 60000 })
```

## question

Pone una domanda all'utente e attende la risposta.

**Argomenti**: `{ question: string, options?: string[] }`

```
question({ "question": "Quale framework?", "options": ["react", "vue"] })
```

## load_skill

Carica le istruzioni complete o un file di risorsa specifico da una agent skill. L'LLM lo chiama automaticamente quando determina che una skill è rilevante per il compito corrente.

**Argomenti**: `{ name: string, resource?: string }`

```
load_skill({ "name": "react-component" })
load_skill({ "name": "react-component", "resource": "references/patterns.md" })
```

Quando `resource` è omesso, restituisce le istruzioni complete del SKILL.md. Quando fornito, restituisce il contenuto del file specificato nella directory della skill.

::: tip
Questo strumento è sempre abilitato e non può essere disabilitato per agente. L'LLM ha accesso solo ai metadati della skill nel prompt di sistema finché non chiama `load_skill`.
:::

## save_memory

Salva un fatto durevole nella memoria persistente (`.turbodev/memory.md`) per sessioni future. L'LLM lo chiama quando impara qualcosa che vale la pena ricordare.

**Argomenti**: `{ content: string, category?: string }`

```
save_memory({ "content": "User prefers pnpm over npm", "category": "preferences" })
save_memory({ "content": "Project uses PostgreSQL 16" })
```

Categorie: `preferences`, `decisions`, `architecture`, `facts` (predefinita). Salva solo informazioni rilevanti per **sessioni future** — non stato transitorio.

::: tip
Questo strumento è sempre attivo e scrive solo in `.turbodev/memory.md` (gitignored). Non può modificare altri file. La memoria sopravvive alla compattazione perché vive nel prompt di sistema.
:::

Vedi [Memoria Persistente](/it/configurazione/memory) per il riferimento completo.

## task

Invoca un sottoagente per un'attività specializzata.

**Argomenti**: `{ agent: string, prompt: string, description: string }`

```
task({ "agent": "explore", "prompt": "trova tutte le route API", "description": "Esplora le route API" })
```

::: warning Attenzione
Lo strumento `task` è disabilitato per l'agente plan per impostazione predefinita.
:::

## git

Esegue operazioni Git tramite simple-git. Supporta 26 operazioni tra cui status, log, diff, add, commit, push, pull, branch, stash, remote e altre.

**Argomenti**: `{ operation: string, args?: any }`

```
git({ "operation": "status" })
git({ "operation": "log", "args": { "maxCount": 10 } })
git({ "operation": "commit", "args": { "message": "fix: risolto bug" } })
```

Operazioni disponibili: `status`, `log`, `diff`, `add`, `commit`, `push`, `pull`, `branch`, `checkout`, `stash`, `remote`, `fetch`, `reset`, `revert`, `tag`, `merge`, `rebase`, `init`, `clone`, `addRemote`, `removeRemote`, `listRemotes`, `raw`, `diffSummary`, `show`, `clean`.

::: danger Pericolo
Le operazioni Git che modificano il repository (commit, push, reset, revert, clean, ecc.) richiedono l'autorizzazione esplicita dell'utente.
:::

## github

Esegue operazioni GitHub tramite la CLI `gh`. Supporta 15 operazioni tra cui gestione PR, issue, release e autenticazione.

**Argomenti**: `{ operation: string, args?: any }`

```
github({ "operation": "createPr", "args": { "title": "Correzione bug", "body": "Descrizione" } })
github({ "operation": "listPrs" })
github({ "operation": "createIssue", "args": { "title": "Segnalazione bug", "body": "Passi per riprodurre" } })
```

Operazioni disponibili: `authStatus`, `createPr`, `listPrs`, `viewPr`, `mergePr`, `closePr`, `createIssue`, `listIssues`, `closeIssue`, `createRelease`, `listReleases`, `repoView`, `repoClone`, `runList`, `runView`.

Richiede che la [GitHub CLI (`gh`)](https://cli.github/) sia installata e autenticata. Esegui `/gh auth` per configurare l'autenticazione.

## Controllare l'accesso agli strumenti

Gli strumenti possono essere abilitati o disabilitati per ogni agente nella configurazione Markdown:

```yaml
tools:
  edit_file: false
  bash: false
  task: false
```

Quando uno strumento è disabilitato (`false`), l'agente riceve un errore se tenta di utilizzarlo: `Tool "edit_file" is denied for agent "plan"`.

## Strumenti MCP (dinamici)

Oltre agli strumenti nativi sopra, gli agenti possono invocare **strumenti MCP** registrati dinamicamente dai server MCP esterni dichiarati in `.turbodev/mcp.json`. Questi strumenti appaiono automaticamente nel prompt di sistema quando almeno un server è connesso.

I nomi dei tool MCP seguono la convenzione `mcp__<server>__<tool>` — ad esempio, un server `filesystem` che espone un tool `read_file` è richiamabile come:

```
tool: mcp__filesystem__read_file({"path": "/tmp/esempio.txt"})
```

I tool MCP non sono elencati nella configurazione `tools:` (sono dinamici). Per disabilitare uno specifico tool MCP, usa il suo nome prefissato completo:

```yaml
tools:
  "mcp__filesystem__delete": false
```

I permessi dei tool MCP hanno default `ask` e si configurano tramite `permission.mcp`. Vedi [Permessi](/it/agenti/permessi#strumenti-mcp) e [configurazione MCP](/it/configurazione/mcp) per i dettagli.

[Scopri di più sui permessi](/it/agenti/permessi)
