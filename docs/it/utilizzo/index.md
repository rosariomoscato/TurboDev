# Interfaccia terminale (TUI)

Usare TurboDev nel terminale.

## Avviare una sessione

```bash
cd /percorso/del/tuo/progetto
turbodev
```

TurboDev apre una sessione interattiva nel terminale con:

- **Banner** — Logo ASCII art, stato di AGENTS.md e agente corrente (visibile per 5 secondi)
- **Area chat** — Cronologia della conversazione
- **Barra di input** — Mostra il nome dell'agente corrente, digita qui i tuoi messaggi
- **Barra di stato** — Modello, agente, utilizzo token, costo, indicatore di elaborazione

## La barra di stato

La barra di stato in basso mostra:

| Elemento | Descrizione |
|----------|-------------|
| ID modello | Modello LLM corrente |
| Nome agente | Agente corrente con il suo colore |
| Utilizzo token | `X.XXK/YK` — token usati / dimensione finestra di contesto |
| Costo | Costo cumulativo della sessione (es. `$0.0023`) |
| Spinner | Animazione braille mentre l'AI sta elaborando |

### Indicatore utilizzo token

L'utilizzo dei token è codificato per colore:

| Colore | Significato |
|--------|-------------|
| Verde | Sotto il 50% della finestra di contesto |
| Giallo | 50%–75% della finestra di contesto |
| Rosso | Sopra il 75% — l'auto-compattazione si attiva all'85% |

### Tracciamento dei costi

Il costo viene calcolato in tempo reale in base al prezzo per token del modello da OpenRouter. Si accumula su tutti i messaggi della sessione e viene salvato quando la sessione viene persistita.

## Colori degli agenti

Ogni agente ha un colore distinto nella barra di stato:

| Agente | Colore |
|--------|--------|
| editor | Ciano |
| plan | Giallo |

Gli agenti personalizzati possono definire il proprio colore.

## Indicatore di elaborazione

Quando l'AI sta elaborando, uno spinner braille si anima nella barra di stato:

```
⠋ AI sta pensando...
```

## Richieste di permesso

Quando un agente ha bisogno di approvazione (es. l'agente plan sta modificando un file), vedrai:

```
? Consentire edit_file?
  Comando: modifica di AGENTS.md
  [y/n]
```

Digita `y` per consentire, `n` per negare.

## Richieste di domanda

Gli agenti possono farti domande:

```
? Quale framework di test preferisci?
  1. vitest
  2. jest
```

Digita la tua risposta e premi Invio.

## Persistenza delle sessioni

Quando avvii TurboDev e esiste una sessione precedente, ti verrà chiesto:

```
Resume previous session?
  La mia funzionalità (4 min fa, 12 messaggi)
  [y/n]
```

Premi `y` per ripristinare la sessione precedente, oppure `n` per iniziare da zero. Le sessioni vengono salvate automaticamente dopo ogni scambio di messaggi in `.turbodev/sessions/`.

## Interrompere le richieste

Mentre l'AI sta elaborando (spinner visibile), puoi premere **Escape** per cancellare la richiesta immediatamente. La barra di input è nascosta durante l'elaborazione per evitare messaggi sovrapposti.

## Flusso di lavoro

1. Digita il tuo messaggio e premi Invio
2. L'AI elabora e risponde (con streaming)
3. Se sono necessari strumenti, vengono eseguiti automaticamente o chiedono permesso
4. La risposta appare nell'area chat
5. Ripeti

## Prossimi passi

- [Comandi](/it/utilizzo/comandi)
- [Scorciatoie da tastiera](/it/utilizzo/scorciatoie)
