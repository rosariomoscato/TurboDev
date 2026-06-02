# Comandi

I comandi slash di TurboDev.

Tutti i comandi iniziano con `/`. Digita `/` nella barra di input per vedere i comandi disponibili.

## Riferimento

| Comando | Descrizione |
|---------|-------------|
| `/help` | Mostra i comandi disponibili |
| `/init` | Crea o aggiorna `AGENTS.md` |
| `/model` | Apre il selettore dei modelli |
| `/agent` | Apre il selettore degli agenti |
| `/setup` | Esegue di nuovo la procedura guidata |
| `/clear` | Cancella la cronologia della chat |
| `/compact` | Compatta la conversazione per liberare spazio nel contesto |
| `/new` | Inizia una nuova sessione |
| `/sessions` | Elenca e passa da una sessione all'altra |
| `/exit` | Esci da TurboDev |

## /init

Crea o aggiorna `AGENTS.md` nel tuo progetto.

```
/init
```

Se `AGENTS.md` esiste già, puoi scegliere di:

1. **Sovrascrivere** — Ricominciare da capo
2. **Aggiungere** — Inserire nuove sezioni al file esistente

La procedura guidata rileva il tipo di progetto e genera le sezioni pertinenti.

## /model

Apre un selettore interattivo dei modelli.

```
/model
```

Naviga con `↑`/`↓` o `j`/`k`, seleziona con un numero (1–9), annulla con `Esc` o `q`. Se ci sono più di 9 modelli, sono disponibili più pagine.

## /agent

Apre il selettore degli agenti.

```
/agent
```

Digita il numero dell'agente per selezionarlo, premi `Esc` per annullare. Mostra tutti gli agenti primari disponibili con le relative descrizioni.

## /setup

Esegue di nuovo la procedura guidata iniziale per cambiare la chiave API o il modello.

```
/setup
```

## /clear

Cancella l'intera cronologia della chat e il contesto della conversazione.

```
/clear
```

## /compact

Compatta la conversazione riassumendola tramite AI. Libera spazio nella finestra di contesto, permettendo sessioni più lunghe senza perdere i punti chiave della conversazione.

```
/compact
```

L'auto-compattazione si attiva al **85%** della finestra di contesto. Riceverai una notifica al **75%**. Usa `/compact` manualmente in qualsiasi momento.

## /new

Inizia una nuova sessione vuota. La sessione corrente viene salvata automaticamente e può essere ripresa in seguito con `/sessions`.

```
/new
```

## /sessions

Elenca tutte le sessioni salvate, ordinate per le più recenti. Seleziona una sessione digitandone il numero per ripristinarla.

```
/sessions
```

Mostra ogni sessione con titolo, tempo relativo e numero di messaggi. Premi `Esc` per annullare.

## /exit

Esce da TurboDev.

```
/exit
```
