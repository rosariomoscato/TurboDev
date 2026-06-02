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

## /exit

Esce da TurboDev.

```
/exit
```
