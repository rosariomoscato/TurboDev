# TurboDev

**Terminal-based AI coding agent** — il tuo coding partner nel terminale.

<p align="center">
  <img src="assets/TurboDev2.png" alt="TurboDev Screenshot" width="700" />
</p>

## Cos'è

TurboDev è un agente AI per il coding che funziona interamente nel terminale. Permette di chattare con modelli LLM (via OpenRouter), eseguire tool, gestire file e codice — tutto senza uscire dalla CLI.

## Funzionalità

- **Chat AI nel terminale** — conversa con modelli LLM in tempo reale con streaming
- **Selezione modello** — scegli tra decine di modelli popolari (DeepSeek, GPT-4, Claude, Gemini, Llama, GLM...)
- **Agent loop con tool** — l'AI può leggere file, eseguire comandi e interagire con il tuo progetto
- **Setup guidato** — configurazione interattiva di API key e modello al primo avvio
- **Interfaccia React/Ink** — UI moderna e reattiva direttamente nel terminale

## Installazione

```bash
git clone https://github.com/rosariomoscato/TurboDev.git
cd TurboDev/turbodev
npm install
npm run build
```

## Utilizzo

```bash
# Avvio
npm start

# Oppure con dev mode (hot reload)
npm run dev

# Setup guidato
npx turbodev --setup
```

### Comandi in chat

| Comando | Descrizione |
|---------|-------------|
| `/help` | Mostra i comandi disponibili |
| `/model` | Seleziona il modello AI |
| `/setup` | Rilancia il setup wizard |
| `/clear` | Pulisce la chat |
| `/exit` | Esci da TurboDev |

## Configurazione

TurboDev richiede una **API key OpenRouter** per funzionare. Il setup wizard ti guiderà nella configurazione al primo avvio, oppure puoi lanciarlo con `/setup`.

La configurazione viene salvata in `~/.turbodev/config.json`.

## Stack Tecnico

- **TypeScript** — linguaggio principale
- **React + Ink** — UI terminale declarativa
- **OpenRouter** — provider LLM multi-modello
- **tsup** — build system

## Autore

**Rosario Moscato**

## Licenza

MIT
