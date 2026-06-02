# AGENTS.md

File di contesto del progetto per TurboDev.

`AGENTS.md` è un file Markdown che fornisce il contesto del progetto agli agenti AI di TurboDev. Aiuta l'agente a comprendere la struttura, le convenzioni e i requisiti del tuo progetto.

## Creare AGENTS.md

### Procedura guidata interattiva

Usa il comando `/init` all'interno di TurboDev:

```
/init
```

Questa avvia una procedura guidata interattiva che:

1. Rileva il tipo di progetto (Node.js, Python, Rust, Go)
2. Ti permette di scegliere quali sezioni includere
3. Genera il file automaticamente

### Sezioni

La procedura guidata può generare queste sezioni:

| Sezione | Descrizione |
|---------|-------------|
| **Project Overview** | Descrizione generale del progetto |
| **Setup Commands** | Comandi di installazione, build e dev (rilevati automaticamente) |
| **Code Style** | Convenzioni di linting e formattazione |
| **Testing Instructions** | Come eseguire i test (rilevato automaticamente) |
| **Design** | Pattern UI, palette colori, tipografia |
| **Security Considerations** | Linee guida di sicurezza |
| **Deployment Notes** | Istruzioni di deployment |

### Creazione manuale

Crea `AGENTS.md` nella root del tuo progetto:

```markdown
# AGENTS.md

## Project Overview

Il mio progetto fantastico — una REST API costruita con Express e TypeScript.

## Setup Commands

- Installa le dipendenze: `npm install`
- Avvia il server di sviluppo: `npm run dev`
- Build: `npm run build`

## Code Style

- Usa TypeScript in modalità strict
- Segui i pattern esistenti nel codice
- Esegui il linting prima di ogni commit

## Testing Instructions

- Esegui i test: `npm test`
- Correggi eventuali test falliti prima di effettuare il commit
```

## Come funziona

TurboDev carica il contenuto di `AGENTS.md` nel prompt di sistema, fornendo all'agente AI il contesto su:

- Cosa fa il tuo progetto
- Come compilarlo e testarlo
- Le tue convenzioni di codifica
- Quali strumenti e framework utilizzi

::: tip Consiglio
Committa `AGENTS.md` nel tuo repository in modo che tutto il team possa beneficiare di un contesto AI coerente.
:::

## Posizione del file

TurboDev cerca `AGENTS.md` nella **directory di lavoro corrente** (dove avvii TurboDev).

Se non viene trovato un file `AGENTS.md`, TurboDev mostra un avviso all'avvio. Puoi crearlo in qualsiasi momento con `/init`.

## Dopo la creazione

Se crei `AGENTS.md` durante una sessione (tramite `/init`), TurboDev carica immediatamente il nuovo contesto — non è necessario riavviare.
