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
- **Barra di stato** — Modello corrente, nome e colore dell'agente, indicatore di elaborazione

## La barra di stato

La barra di stato in basso mostra:

| Elemento | Descrizione |
|----------|-------------|
| ID modello | Modello LLM corrente |
| Nome agente | Agente corrente con il suo colore |
| Spinner | Animazione braille mentre l'AI sta elaborando |

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

## Flusso di lavoro

1. Digita il tuo messaggio e premi Invio
2. L'AI elabora e risponde (con streaming)
3. Se sono necessari strumenti, vengono eseguiti automaticamente o chiedono permesso
4. La risposta appare nell'area chat
5. Ripeti

## Prossimi passi

- [Comandi](/it/utilizzo/comandi)
- [Scorciatoie da tastiera](/it/utilizzo/scorciatoie)
