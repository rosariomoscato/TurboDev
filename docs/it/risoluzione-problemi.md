# Risoluzione problemi

Problemi comuni e soluzioni.

## Problemi di configurazione

### "API key is required"

Assicurati di avere una chiave API OpenRouter valida. Esegui `/setup` per reinserirla.

Ottieni una chiave su [openrouter.ai](https://openrouter.ai).

### "Model not found"

L'ID del modello deve corrispondere al formato di OpenRouter: `provider/model-name`. Usa `/model` per sfogliare i modelli disponibili.

## Problemi con gli agenti

### L'agente non compare nella lista /agent

- Verifica che il file sia in `.turbodev/agents/` (progetto) o `~/.config/turbodev/agents/` (globale)
- Assicurati che il nome del file termini con `.md`
- Verifica che `disable: true` non sia impostato
- Riavvia TurboDev dopo aver aggiunto nuovi file agente

### L'agente personalizzato non sovrascrive quello predefinito

Il merge è **superficiale** — solo i campi specificati vengono sovrascritti. Assicurati che il nome del file corrisponda esattamente al nome predefinito (es. `editor.md` per sovrascrivere l'agente editor).

### Il prompt di permesso non appare

- Verifica che l'agente abbia `permission: edit: ask` (non `allow`)
- Controlla che lo strumento non sia disabilitato tramite `tools: edit_file: false` (gli strumenti disabilitati restituiscono subito un errore, nessun prompt)

## Problemi con gli strumenti

### Errore "not found" con edit_file

`old_str` deve corrispondere **esattamente** — inclusi spazi bianchi e indentazione. Copia il testo esatto dal file.

### Timeout del comando bash

Aumenta il timeout nel comando:

```
bash({ "command": "npm test", "timeout": 60000 })
```

## Problemi con AGENTS.md

### AGENTS.md non rilevato all'avvio

- Il file deve trovarsi nella **directory di lavoro corrente** dove hai avviato TurboDev
- Il nome del file deve essere esattamente `AGENTS.md` (maiuscolo)
- Se lo crei durante una sessione con `/init`, viene caricato immediatamente

### /init non rileva il tipo di progetto

Il rilevamento del progetto cerca:
- **Node.js**: `package.json`
- **Python**: `pyproject.toml` o `requirements.txt`
- **Rust**: `Cargo.toml`
- **Go**: `go.mod`

## Problemi generali

### L'AI si blocca o ci mette troppo

Premi **Escape** per cancellare la richiesta corrente. La barra di input riapparirà e potrai riprovare o riformulare il messaggio.

Se il problema persiste:
- Il modello potrebbe star generando una risposta molto lunga — prova un modello più veloce
- La finestra di contesto potrebbe essere piena — usa `/compact` per riassumere la conversazione
- Verifica la connessione di rete a OpenRouter

### Messaggio "Request cancelled"

Se vedi `Request cancelled. You can try sending your message again.` — tu (o un timeout) hai interrotto la richiesta. Invia semplicemente di nuovo il messaggio.

### TurboDev è lento

- Prova un modello più veloce (es. `anthropic/claude-haiku-4-20250514`)
- Usa l'agente plan per analisi rapide senza modifiche
- Riduci `steps` nella configurazione dell'agente per limitare le iterazioni

### Schermo vuoto o sfarfallio

Assicurati di usare un emulatore di terminale moderno. Consigliati:
- [WezTerm](https://wezterm.org)
- [Alacritty](https://alacritty.org)
- [Kitty](https://sw.kovidgoyal.net/kitty/)
- [iTerm2](https://iterm2.com) (macOS)
