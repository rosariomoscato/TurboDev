# MCP (Model Context Protocol)

TurboDev supporta la connessione a server di strumenti esterni tramite il [Model Context Protocol](https://modelcontextprotocol.io) (MCP) — uno standard open adottato da Claude Code, VS Code Copilot, Cursor, ChatGPT e altri. Un singolo server MCP funziona su tutti questi tool, TurboDev incluso.

**Scope V1**: solo transport stdio, solo primitiva tools, solo configurazione a livello progetto.

## Quick Start

Crea il file `.turbodev/mcp.json` nella root del progetto (formato compatibile con Claude Desktop):

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
    }
  }
}
```

Avvia TurboDev. Il server viene lanciato come processo figlio via stdio, viene eseguito l'handshake MCP `initialize`, e ogni tool esposto dal server viene registrato con un nome prefissato (`mcp__<server>__<tool>`) così l'LLM può invocarlo come un tool nativo.

Digita `/mcp` per verificare la connessione:

```
MCP Servers (1 connected, 5 tools total):
  ✓ filesystem            5 tools    connected

Use /mcp reload to re-read .turbodev/mcp.json and reconnect.
```

## Riferimento Configurazione

Il file di configurazione si trova in `<project>/.turbodev/mcp.json` e segue lo schema `mcpServers` di Claude Desktop byte-per-byte — puoi copiare configurazioni tra tool.

| Campo | Tipo | Richiesto | Descrizione |
|---|---|---|---|
| `command` | `string` | sì | Eseguibile da lanciare (risolto via `PATH`, mai tramite shell). |
| `args` | `string[]` | no | Argomenti passati al comando. |
| `env` | `Record<string, string>` | no | Variabili d'ambiente per il processo figlio. Supporta espansione `$VAR`, `${VAR}`, e `~` iniziale. |

Esempio con tutti i campi:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "$GITHUB_TOKEN",
        "LOG_DIR": "~/logs/mcp"
      }
    }
  }
}
```

I campi sconosciuti in una voce server vengono ignorati (compatibilità forward). Le voci non valide vengono saltate con un warning nel log; le voci valide nello stesso file vengono comunque caricate.

## Comandi

| Comando | Descrizione |
|---|---|
| `/mcp` | Elenca tutti i server con stato (`connected`/`error`/`disabled`), numero di tool e messaggi di errore. |
| `/mcp reload` | Rilegge `.turbodev/mcp.json`, disconnette i server rimossi/cambiati, connette quelli nuovi. I server invariati non vengono toccati (no churn). |

La status bar mostra `MCP:N` (magenta) quando ci sono N server connessi.

## Permessi

I tool MCP hanno default **`ask`** — l'utente deve approvare la prima invocazione per ogni server. Override per-server in un file agent Markdown:

```yaml
---
name: my-agent
permission:
  mcp: { filesystem: allow, github: ask }
---
```

Oppure globalmente per tutti i server MCP:

```yaml
permission:
  mcp: allow   # autorizza ogni tool MCP senza chiedere
```

Ordine di risoluzione: voce per-server → stringa globale → default `ask`. Disabilitare un tool specifico via `tools: { "mcp__filesystem__read_file": false }` continua a funzionare e ha precedenza (ritorna `deny`).

## Sicurezza

- **Niente shell**: `command`/`args` sono passati a `child_process.spawn` direttamente, mai tramite shell — nessuna injection possibile.
- **Espansione env locale**: `$VAR` e `~` vengono espansi da TurboDev prima dello spawn; il server riceve i valori già risolti.
- **I segreti non vengono mai loggati**: se una voce config non è valida, viene loggato solo il *nome* del server, mai command, args o valori env.
- **Default `ask`**: i tool esterni non possono eseguire senza opt-in esplicito dell'utente.

## Risoluzione Problemi

| Sintomo | Causa / Fix |
|---|---|
| `✗ server    error  ENOENT` | Il `command` non è trovato in `PATH`. Verifica che l'eseguibile sia installato (es. `npx -y @modelcontextprotocol/server-filesystem --help` funziona fuori da TurboDev). |
| `✗ server    error  MCP connect timeout (10s)` | Il server è partito ma non risponde all'handshake `initialize`. Controlla lo stderr del server nella console. |
| Il server sparisce da `/mcp` dopo reload | La voce è stata rimossa da `.turbodev/mcp.json` o ha fallito la validazione — controlla il warning nel log. |
| Permesso negato su ogni chiamata | `permission.mcp` dell'agent è impostato a `deny`, oppure il nome server in `permission.mcp` non matcha la chiave in `mcpServers`. |
| Il tool ritorna `Cancelled by user` | Hai premuto Escape durante la chiamata. Ri-emetti la richiesta per riprovare. |

## Limitazioni (V1)

- **Solo transport stdio** — niente server HTTP remoti (Phase 2)
- **Solo primitiva tools** — niente resources, prompts, sampling o elicitation (Phase 2/3)
- **Solo config a livello progetto** — niente `~/.config/turbodev/mcp.json` globale (Phase 2)
- **Niente `notifications/tools/list_changed`** — usa `/mcp reload` per aggiornare i tool lato server
- **Niente OAuth** — solo auth basata su env var

## Scoprire Server

Sfoglia i server di riferimento ufficiali su [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) e il catalogo community su [modelcontextprotocol.io](https://modelcontextprotocol.io). Qualsiasi server basato su stdio che segue lo spec MCP funziona con TurboDev.
