# Introduzione

Inizia a usare TurboDev.

**TurboDev** è un agente AI per il coding che funziona interamente nel terminale. Conversa con modelli LLM (tramite OpenRouter), esegue strumenti, gestisci file e codice — tutto senza uscire dalla CLI.

## Funzionalità

- **Chat AI nel terminale** — Conversazioni in streaming in tempo reale con modelli LLM
- **Sistema multi-agente** — Passa da un agente specializzato all'altro (editor, plan) con un solo tasto
- **Agenti personalizzati** — Definisci i tuoi agenti tramite file Markdown
- **Sistema di permessi** — Controllo granulare sulle azioni degli agenti
- **Integrazione strumenti** — Leggi, modifica, crea file, esegui comandi bash, cerca nel codice
- **Contesto automatico** — Analisi del progetto tramite `AGENTS.md`
- **Persistenza delle sessioni** — Le conversazioni vengono salvate e riprendibili tra un riavvio e l'altro
- **Gestione della finestra di contesto** — Tracciamento token in tempo reale, auto-compattazione e `/compact` manuale
- **Tracciamento costi in tempo reale** — Visualizza la spesa nella barra di stato
- **Interruzione delle richieste** — Premi Escape per cancellare una richiesta AI in corso

## Prerequisiti

- **Node.js** 18 o versione successiva
- Una chiave API **OpenRouter** ([ottienila qui](https://openrouter.ai))

## Avvio rapido

::: tip Consiglio
Esegui `npx @rosariomoscato/turbodev` in qualsiasi directory di progetto per iniziare subito.

```bash
# Installa globalmente
npm install -g @rosariomoscato/turbodev

# Vai alla directory del tuo progetto
cd /percorso/del/tuo/progetto

# Avvia TurboDev
turbodev
```

Al primo avvio, la procedura guidata ti chiederà la chiave API OpenRouter e il modello preferito.

## Prossimi passi

- [Configura il tuo ambiente](/it/configurazione/)
- [Scopri i comandi](/it/utilizzo/comandi)
- [Esplora il sistema degli agenti](/it/agenti/)
- [Personalizza i permessi](/it/agenti/permessi)
