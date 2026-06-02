# Requirements: Agent Tools & Timeout Handling

## Summary

TurboDev e' un CLI AI coding agent che attualmente dispone di 4 strumenti base (`read_file`, `list_files`, `edit_file`, `mkdir`). Per trasformarlo in un agente piu' capace e robusto, questa feature aggiunge tre nuovi strumenti essenziali (`grep`, `bash`, `question`) e introduce la gestione del timeout per le chiamate LLM.

Il tool `grep` permette all'agente di cercare nel contenuto dei file usando regex — fondamentale per navigare progetti di dimensioni medio-grandi. Il tool `bash` permette l'esecuzione di comandi shell, abilitando test, build, git e qualsiasi operazione da terminale. Il tool `question` permette all'agente di porre domande all'utente durante l'esecuzione per chiarire requisiti ambigui o chiedere decisioni.

La gestione del timeout previene che l'applicazione si blocchi o termini in modo anomalo quando il modello AI non risponde in tempo. In caso di timeout, l'utente visualizza un messaggio di errore e puo' continuare a usare TurboDev.

## Goals

- Aggiungere il tool `grep` per ricerca nel contenuto dei file con supporto regex e filtro per pattern di file
- Aggiungere il tool `bash` per esecuzione di comandi shell con timeout configurabile
- Aggiungere il tool `question` per permettere all'agente di porre domande all'utente durante l'esecuzione
- Implementare timeout per le chiamate LLM streaming per evitare che l'app si blocchi
- Mostrare un messaggio di errore user-friendly in caso di timeout e permettere all'utente di continuare la conversazione
- Mantenere la coerenza con l'architettura esistente (tool registry, parser `tool: NAME({JSON})`, streaming UI)

## Non-Goals

- Gestione avanzata dei permessi per i tool (es. approvazione esplicita prima di eseguire bash)
- Supporto MCP (Model Context Protocol)
- Persistenza della conversazione tra sessioni
- Configurazione a livello di progetto (es. `.turbodevrc` nella cartella di progetto)
- Sistema di skill/plugin
- Unit test automatici (il progetto non ha un framework di test)

## Acceptance Criteria

- [ ] L'agente puo' usare `grep` per cercare nel contenuto dei file con regex e filtro per estensione
- [ ] L'agente puo' usare `bash` per eseguire comandi shell con output catturato e timeout
- [ ] L'agente puo' usare `question` per chiedere chiarimenti all'utente durante l'esecuzione
- [ ] Se il modello LLM non risponde entro il timeout configurato, l'app non si blocca ne' termina
- [ ] In caso di timeout, l'utente vede un messaggio di errore chiaro e puo' inviare un nuovo messaggio
- [ ] I nuovi tool appaiono nel system prompt e sono usabili dal modello AI
- [ ] L'architettura esistente (tool registry, parser, UI) rimane intatta e coerente

## Assumptions

- I modelli AI su OpenRouter supportano il formato `tool: NAME({JSON})` come i modelli attualmente usati
- L'utente ha Node.js >= 18 con supporto per `AsyncIterable` e `AbortController`
- Il timeout di default per le chiamate LLM e' di 120 secondi, ritenuto ragionevole per modelli complessi
- Il timeout di default per i comandi bash e' di 30 secondi, sufficiente per la maggior parte delle operazioni
- Il tool `question` mostra opzioni predefinite ma permette sempre una risposta libera dell'utente

## Technical Constraints

- **Linguaggio:** TypeScript strict mode con ESM modules
- **Runtime:** Node.js >= 18 (nessuna dipendenza nativa)
- **UI Framework:** Ink v4 + React 18 (terminal UI)
- **LLM SDK:** `openai` npm package puntato a OpenRouter
- **Tool invocation format:** `tool: NAME({JSON_ARGS})` nel testo della risposta LLM
- **Build tool:** tsup con output ESM
- **Nessun framework di test** presente nel progetto — la verifica e' manuale o tramite build
- I tool seguono il pattern esistente: interfaccia Args, interfaccia Result, funzione async esportata, registrazione in `TOOL_REGISTRY`
