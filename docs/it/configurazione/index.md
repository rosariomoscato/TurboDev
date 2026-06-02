# Configurazione

Configura TurboDev per il tuo flusso di lavoro.

## Procedura guidata di configurazione

Al primo avvio, TurboDev esegue una procedura guidata interattiva:

1. **Chiave API** — Inserisci la tua chiave API OpenRouter
2. **Modello** — Seleziona il modello LLM predefinito

Riesegui la procedura guidata in qualsiasi momento con `/setup`.

## Cambiare modello

Usa il comando `/model` per sfogliare e cambiare modello durante una sessione:

```
/model
```

Si aprirà un selettore interattivo con i modelli più diffusi. Naviga con i tasti freccia, seleziona con un numero.

## Dove viene salvata la configurazione

TurboDev salva la configurazione in:

```
~/.config/turbodev/config.json
```

Questo file contiene:

```json
{
  "apiKey": "sk-or-...",
  "model": "anthropic/claude-sonnet-4-20250514"
}
```

::: warning Attenzione
Non committare mai la tua chiave API nel controllo di versione.
:::

## Prossimi passi

- [Modelli](/it/configurazione/modelli) — Sfoglia i modelli disponibili
- [AGENTS.md](/it/configurazione/agents-md) — File di contesto del progetto
