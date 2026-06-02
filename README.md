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
- **7 tool integrati** — l'AI può leggere, cercare, modificare file, eseguire comandi shell e farti domande
- **Supporto AGENTS.md** — contesto e istruzioni di progetto caricate automaticamente dallo standard aperto
- **Wizard /init** — genera un file AGENTS.md interattivo con auto-detection del tipo di progetto
- **Rendering Markdown** — risposte formattate con titoli, list, codice e grassetto nel terminale
- **Setup guidato** — configurazione interattiva di API key e modello al primo avvio
- **Gestione errori** — timeout LLM, errori API e domande interattive all'utente
- **Interfaccia React/Ink** — UI moderna e reattiva direttamente nel terminale

## Installazione

```bash
git clone https://github.com/rosariomoscato/TurboDev.git
cd TurboDev
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
| `/init` | Genera AGENTS.md con wizard interattivo |
| `/model` | Seleziona il modello AI |
| `/setup` | Rilancia il setup wizard |
| `/clear` | Pulisce la chat |
| `/exit` | Esci da TurboDev |

### Tool disponibili

| Tool | Descrizione |
|------|-------------|
| `read_file` | Legge il contenuto di un file |
| `list_files` | Elenca i file in una directory |
| `edit_file` | Crea o modifica un file |
| `mkdir` | Crea directory |
| `grep` | Cerca nei file con regex (usa ripgrep se disponibile) |
| `bash` | Esegue comandi shell con timeout |
| `question` | Chiede chiarimenti all'utente |

## Configurazione

TurboDev richiede una **API key OpenRouter** per funzionare. Il setup wizard ti guiderà nella configurazione al primo avvio, oppure puoi lanciarlo con `/setup`.

La configurazione viene salvata in `~/.turbodevrc`.

## AGENTS.md

TurboDev supporta lo standard aperto [AGENTS.md](https://agents.md/) — un file markdown che fornisce contesto e istruzioni al AI agent. Se presente nella directory di lavoro, viene caricato automaticamente all'avvio e passato come contesto di progetto.

Il comando `/init` genera il file tramite un wizard interattivo che:
- Auto-detecta il tipo di progetto (Node.js, Python, Rust, Go)
- Permette di selezionare le sezioni da includere (Setup Commands, Code Style, Testing, ecc.)
- Se il file esiste già, chiede se sovrascrivere o aggiungere nuove sezioni

- **TypeScript** — linguaggio principale
- **React + Ink** — UI terminale declarativa
- **OpenRouter** — provider LLM multi-modello
- **tsup** — build system

## Autore

**Rosario Moscato**

## Licenza

MIT
