# Comandi

I comandi slash di TurboDev.

Tutti i comandi iniziano con `/`. Digita `/` nella barra di input per aprire la palette dei comandi — naviga con `↑`/`↓` e seleziona con `Invio`.

## Comandi generali

| Comando | Descrizione |
|---------|-------------|
| `/agent` | Apre il selettore degli agenti |
| `/clear` | Cancella la cronologia della chat |
| `/compact` | Compatta la conversazione per liberare spazio nel contesto |
| `/exit` | Esci da TurboDev |
| `/help` | Mostra i comandi disponibili |
| `/init` | Crea o aggiorna `AGENTS.md` |
| `/model` | Apre il selettore dei modelli |
| `/new` | Inizia una nuova sessione |
| `/sessions` | Elenca e passa da una sessione all'altra |
| `/setup` | Esegue di nuovo la procedura guidata |
| `/skills` | Elenca le agent skill scoperte |
| `/mcp` | Elenca i server MCP e i tool |
| `/mcp reload` | Rilegge `.turbodev/mcp.json` e riconnette |
| `/memory` | Mostra le entry di memoria persistente |
| `/memory add [cat] <text>` | Aggiunge una entry (categorie: preferences, decisions, architecture, facts) |
| `/memory clear [cat]` | Cancella tutta la memoria o una categoria |
| `/memory reload` | Ricarica la memoria da disco |
| `/economy` | Mostra lo stato di economy mode |
| `/economy eco` | Attiva output conciso (diretto, no filler) |
| `/economy ultra` | Attiva output ultra-conciso (telegrafico) |
| `/economy off` | Disattiva economy mode |

## Comandi Git

| Comando | Descrizione |
|---------|-------------|
| `/branch` | Elenca i branch locali |
| `/branch <name>` | Passa al branch specificato |
| `/commit <msg>` | Aggiunge tutto allo staging e fa commit con il messaggio |
| `/git add` | Aggiunge file allo staging (tutti per impostazione predefinita) |
| `/git diff` | Mostra le modifiche non in staging |
| `/git log` | Mostra il log dei commit (10 per impostazione predefinita) |
| `/git remote` | Elenca i remote |
| `/git stash` | Salva le modifiche in stash |
| `/git status` | Mostra lo stato dell'albero di lavoro |
| `/pull` | Effettua pull dal remote |
| `/push` | Effettua push del branch corrente sul remote |
| `/rollback` | Mostra i commit recenti per il rollback |

## Comandi GitHub

| Comando | Descrizione |
|---------|-------------|
| `/gh auth` | Avvia la procedura guidata di autenticazione GitHub |
| `/pr <titolo>` | Crea una pull request con il titolo specificato |
| `/pr list` | Elenca le pull request aperte |

## Dettagli dei comandi

### /init

Crea o aggiorna `AGENTS.md` nel tuo progetto.

```
/init
```

Se `AGENTS.md` esiste già, puoi scegliere di:

1. **Sovrascrivere** — Ricominciare da capo
2. **Aggiungere** — Inserire nuove sezioni al file esistente

La procedura guidata rileva il tipo di progetto e genera le sezioni pertinenti.

### /model

Apre un selettore interattivo dei modelli.

```
/model
```

Naviga con `↑`/`↓` o `j`/`k`, seleziona con un numero (1–9), annulla con `Esc` o `q`. Se ci sono più di 9 modelli, sono disponibili più pagine.

### /agent

Apre il selettore degli agenti.

```
/agent
```

Digita il numero dell'agente per selezionarlo, premi `Esc` per annullare. Mostra tutti gli agenti primari disponibili con le relative descrizioni.

### /setup

Esegue di nuovo la procedura guidata iniziale per cambiare la chiave API o il modello.

```
/setup
```

### /clear

Cancella l'intera cronologia della chat e il contesto della conversazione.

```
/clear
```

### /compact

Compatta la conversazione riassumendola tramite AI. Libera spazio nella finestra di contesto, permettendo sessioni più lunghe senza perdere i punti chiave della conversazione.

```
/compact
```

L'auto-compattazione si attiva al **85%** della finestra di contesto. Riceverai una notifica al **75%**. Usa `/compact` manualmente in qualsiasi momento.

### /new

Inizia una nuova sessione vuota. La sessione corrente viene salvata automaticamente e può essere ripresa in seguito con `/sessions`.

```
/new
```

### /sessions

Elenca tutte le sessioni salvate, ordinate per le più recenti. Seleziona una sessione digitandone il numero per ripristinarla.

```
/sessions
```

Mostra ogni sessione con titolo, tempo relativo e numero di messaggi. Premi `Esc` per annullare.

### /commit

Aggiunge tutte le modifiche allo staging e fa commit con il messaggio fornito.

```
/commit fix: risolto problema di login
```

Equivalente a `git add -A && git commit -m "fix: risolto problema di login"`.

### /gh auth

Avvia la procedura guidata di autenticazione GitHub. Supporta il login via browser o token di accesso personale. Richiede che la [GitHub CLI (`gh`)](https://cli.github/) sia installata.

```
/gh auth
```

### /skills

Elenca tutte le agent skill scoperte con stato, fonte e descrizione.

```
/skills
```

Mostra il nome di ogni skill, se è abilitata o disabilitata, dove è stata trovata (builtin, globale o progetto) e la sua descrizione. Le skill vengono caricate da tre fonti in ordine di priorità: progetto (`.agents/skills/`) > globale (`~/.config/turbodev/skills/`) > builtin.

### /mcp

Elenca tutti i server MCP (Model Context Protocol) configurati con stato della connessione, numero di tool ed eventuali errori.

```
/mcp
```

Formato dell'output:

```
MCP Servers (1 connected, 5 tools total):
  ✓ filesystem            5 tools    connected
  ✗ db                    error       ECONNREFUSED

Use /mcp reload to re-read .turbodev/mcp.json and reconnect.
```

Icone di stato: `✓` connesso, `✗` errore, `○` altro. La barra di stato mostra `MCP:N` (magenta) quando ci sono N server connessi.

### /mcp reload

Rilegge `.turbodev/mcp.json`, disconnette i server rimossi/cambiati e connette quelli nuovi. I server invariati restano connessi (no churn).

```
/mcp reload
```

Usalo dopo aver modificato il file di configurazione. Vedi [configurazione MCP](/it/configurazione/mcp) per il riferimento completo.

### /memory

Mostra tutte le entry di memoria persistente raggruppate per categoria. L'AI usa questi fatti come contesto tra le sessioni.

```
/memory
```

La memoria è salvata in `.turbodev/memory.md` (Markdown plain, gitignored). L'AI può salvare fatti autonomamente tramite il tool `save_memory`, oppure puoi gestirli con i comandi seguenti. Vedi [Memoria Persistente](/it/configurazione/memory) per il riferimento completo.

### /memory add

Aggiunge una nuova entry di memoria. La categoria predefinita è `facts`.

```
/memory add Use pnpm, never npm
/memory add preferences I prefer 2-space indentation
/memory add decisions We deploy to Vercel
```

Categorie: `preferences`, `decisions`, `architecture`, `facts`.

### /memory clear

Cancella tutta la memoria, o solo una categoria. Chiede conferma `[y/n]`.

```
/memory clear              # cancella tutto
/memory clear decisions    # cancella una categoria
```

### /memory reload

Rilegge `.turbodev/memory.md` da disco. Usalo dopo aver modificato manualmente il file.

```
/memory reload
```

### /exit

Esce da TurboDev.

```
/exit
```
