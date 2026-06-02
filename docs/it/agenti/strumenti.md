# Strumenti

Strumenti disponibili per gli agenti di TurboDev.

Gli agenti hanno accesso a un insieme di strumenti per interagire con il tuo codice. La disponibilità degli strumenti può essere controllata per ogni agente tramite la configurazione `tools`.

## Riferimento

| Strumento | Descrizione |
|-----------|-------------|
| `read_file` | Legge il contenuto di un file |
| `edit_file` | Crea o modifica file |
| `list_files` | Elenca il contenuto di una directory |
| `mkdir` | Crea directory |
| `grep` | Cerca nel contenuto dei file con regex |
| `bash` | Esegue comandi shell |
| `question` | Pone una domanda all'utente |
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

## task

Invoca un sottoagente per un'attività specializzata.

**Argomenti**: `{ agent: string, prompt: string, description: string }`

```
task({ "agent": "explore", "prompt": "trova tutte le route API", "description": "Esplora le route API" })
```

::: warning Attenzione
Lo strumento `task` è disabilitato per l'agente plan per impostazione predefinita.
:::

## Controllare l'accesso agli strumenti

Gli strumenti possono essere abilitati o disabilitati per ogni agente nella configurazione Markdown:

```yaml
tools:
  edit_file: false
  bash: false
  task: false
```

Quando uno strumento è disabilitato (`false`), l'agente riceve un errore se tenta di utilizzarlo: `Tool "edit_file" is denied for agent "plan"`.

[Scopri di più sui permessi](/it/agenti/permessi)
