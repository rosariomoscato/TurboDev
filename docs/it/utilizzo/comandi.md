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

### /exit

Esce da TurboDev.

```
/exit
```
