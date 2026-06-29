# Memoria Persistente

TurboDev ha un sistema di **memoria persistente** integrato che permette all'agente AI di ricordare le tue preferenze, decisioni e fatti del progetto tra una sessione e l'altra. Niente più partenze da zero ogni volta che riapri il terminale — l'agente impara e conserva il contesto che conta.

## Come Funziona

1. All'avvio, TurboDev carica `.turbodev/memory.md` (un file Markdown plain, gitignored)
2. Il contenuto viene iniettato nel system prompt sotto una sezione `## Memory`
3. L'LLM vede i fatti persistenti e li usa come contesto
4. Quando l'LLM impara qualcosa di duraturo, chiama automaticamente il tool `save_memory`
5. La memoria **sopravvive alla compattazione** perché vive nel system prompt (non nella cronologia della conversazione)

Puoi anche gestire la memoria manualmente con i comandi `/memory` o editando direttamente il file.

## Formato Markdown

`.turbodev/memory.md` è un file Markdown plain con una sezione per categoria:

```markdown
# Project Memory

## preferences
- User prefers TypeScript over JavaScript
- Prefers functional style over OOP

## decisions
- Using OpenRouter as LLM provider

## architecture
- React + Ink for TUI, tsup for bundling

## facts
- Node 22 LTS is installed
```

Il file è sempre leggibile e modificabile. Dopo modifiche manuali, esegui `/memory reload` per aggiornare la sessione.

## Categorie

| Categoria | Descrizione | Esempi |
|---|---|---|
| `preferences` | Come l'utente preferisce le cose | "prefers pnpm over npm", "likes functional style" |
| `decisions` | Scelte a livello progetto che persistono | "using PostgreSQL 16", "deploying to Vercel" |
| `architecture` | Fatti strutturali sul codebase | "React + Ink for TUI", "tsup for bundling" |
| `facts` | Contesto generale (default) | "Node 22 is installed", "kDrive slows file I/O" |

## Il Tool `save_memory`

L'LLM ha un tool `save_memory` che chiama quando impara qualcosa di duraturo:

```
tool: save_memory({"content": "User prefers pnpm, never npm", "category": "preferences"})
```

**Cosa salva l'LLM**: preferenze, decisioni, fatti di architettura, contesto del progetto — cose utili in *sessioni future*.

**Cosa NON salva l'LLM**: stato transitorio ("attualmente sto editando il file X"), fatti ovvi, cose già in `AGENTS.md`.

Il tool è sempre attivo e non può essere disabilitato per agente. Scrive solo in `.turbodev/memory.md` (gitignored) — non può modificare altri file.

## Comandi

| Comando | Descrizione |
|---|---|
| `/memory` | Mostra tutte le entry di memoria raggruppate per categoria |
| `/memory show` | Come `/memory` |
| `/memory add <text>` | Aggiunge una entry a `facts` (categoria default) |
| `/memory add <category> <text>` | Aggiunge una entry a una categoria specifica |
| `/memory clear` | Cancella tutta la memoria (chiede conferma) |
| `/memory clear <category>` | Cancella una categoria (chiede conferma) |
| `/memory reload` | Rilegge `.turbodev/memory.md` da disco |

### Esempi

```
/memory add preferences Use 2-space indentation, never tabs
/memory add decisions We deploy to Vercel, not Netlify
/memory add The project uses Tailwind CSS v4
/memory clear decisions
```

## Modifica Manuale

Il file di memoria è Markdown plain — aprilo in qualsiasi editor:

```bash
# Nel tuo editor
vim .turbodev/memory.md
```

Dopo aver salvato, esegui `/memory reload` in TurboDev per picks up le modifiche.

## Budget di Token

La memoria viene iniettata nel system prompt, il che consuma token della context window. TurboDev mostra un warning quando la memoria supera ~500 token (circa 2KB di Markdown).

Per ridurre l'uso di memoria:
- `/memory clear <category>` per rimuovere entry obsolete
- Modifica `.turbodev/memory.md` manualmente e `/memory reload`
- `/memory clear` per cancellare tutto e ripartire da zero

## Sicurezza della Compattazione

Quando una conversazione viene compattata (`/compact` o auto-compattazione all'85%), la cronologia della conversazione viene riassunta ma il **system prompt viene preservato**. Poiché la memoria vive nel system prompt, i tuoi fatti persistenti sopravvivono alla compattazione — non vengono mai persi o riassunti.

## AGENTS.md vs Memoria

| | AGENTS.md | Memoria (.turbodev/memory.md) |
|---|---|---|
| **Scritto da** | Utente (manuale) | LLM (via `save_memory`) + Utente |
| **Committato in git** | Sì (condiviso col team) | No (gitignored, personale) |
| **Contenuto** | Spec del progetto, setup, convenzioni | Fatti appresi, preferenze, decisioni |
| **Scope** | Statico, autorevole | Dinamico, supplementare |

Entrambi coesistono nel system prompt. AGENTS.md è la spec autorevole del progetto; la memoria è contesto supplementare che l'AI ha appreso.

## Limitazioni (V1)

- **Solo a livello progetto** — niente memoria globale cross-project (V2)
- **Niente deduplication** — se l'LLM salva lo stesso fatto due volte, pulisci manualmente
- **Niente auto-capture dalla compattazione** — solo il tool `save_memory` e `/memory add`
- **Soft cap ~500 token** — niente truncation automatica, solo warning nell'UI
- **Niente memoria per-agente** — tutti gli agenti in un progetto condividono lo stesso file
