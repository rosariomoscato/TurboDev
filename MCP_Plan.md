# Piano di implementazione MCP per TurboDev

Decisioni iniziali:
- **Client MCP**: SDK ufficiale `@modelcontextprotocol/sdk`
- **Trasporti V1**: Solo stdio
- **Primitive V1**: Solo tools
- **Config**: `.turbodev/mcp.json` (project-level)

---

## Cos'è MCP per TurboDev

MCP (Model Context Protocol) è un protocollo standard (JSON-RPC 2.0) per connettere client AI a **server esterni** che espongono **tools**, **resources** e **prompts**. Per TurboDev significa: l'utente configura server MCP (es. filesystem, GitHub, database, Sentry...) e l'agente può invocarne i tool come se fossero nativi — **"USB-C port for AI"**.

---

## Architettura

```
src/mcp/                          # nuovo modulo (specchia src/skills/)
├── types.ts                      # MCPServerConfig, MCPClientState, MCPTool
├── loader.ts                     # parse + validazione .turbodev/mcp.json
├── client.ts                     # wrapper @modelcontextprotocol/sdk (connect/list/call/disconnect)
├── registry.ts                   # lifecycle multi-server (manager di client attivi)
├── bridge.ts                     # registra tool MCP in TOOL_REGISTRY con nome prefissato
└── __tests__/

src/agent/permissions.ts          # +gestione permessi mcp (per-server)
src/agent/tools.ts                # +helper per tool dinamici (TOOL_REGISTRY mutabile)
src/agent/loop.ts                 # nessun cambiamento core (tool sono in registry)
src/ui/App.tsx                    # +`/mcp` command, status bar, connect/disconnect lifecycle
```

---

## Formato config (Claude Desktop-compatibile)

`.turbodev/mcp.json` (la cartella `.turbodev/` esiste già nel progetto):

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      "env": { "API_KEY": "$MCP_API_KEY" }
    }
  }
}
```

Espansione variabili `$VAR` + `~`, validazione schema, ignore se file malformato.

---

## Convenzioni chiave

| Aspetto | Scelta | Motivo |
|---|---|---|
| **Nome tool** | `mcp__<server>__<tool>` | Stessa convenzione Claude Code, zero collisioni, grep-friendly |
| **Permission default** | `'ask'` (sicurezza) | L'utente approva esplicitamente tool esterni |
| **Config precedence** | Project > Global > Built-in (per Wave futuro) | Come skills |
| **Tool discovery** | `tools/list` all'avvio, cached | Senza `notifications/list_changed` in V1 |
| **Shutdown** | Graceful `client.close()` su SIGINT/exit | Evita processi orfani |

---

## Wave breakdown (modello skills, 5 onde)

### Wave 1 — Foundation (parallelo)
- `task-01-types` — Tipi MCP + estendi `AgentConfig.permission.mcp: Record<server, PermissionAction> | PermissionAction`
- `task-02-config-loader` — Reader `.turbodev/mcp.json` con validazione, env expansion, fallback graceful
- `task-03-deps` — `npm i @modelcontextprotocol/sdk`, verifica build con tsup

### Wave 2 — Client core (dipende da W1)
- `task-04-client-wrapper` — `MCPClient` class: connect via `StdioClientTransport`, listTools, callTool, close, gestione errori (spawn fail, crash server, timeout handshake)
- `task-05-registry` — `MCPRegistry`: connecta tutti i server da config, colleziona tool, espone `getTools()`, `reload()`, `shutdownAll()`

### Wave 3 — Bridge agent (dipende da W2)
- `task-06-dynamic-tools` — Funzione `registerMCPTools(registry, agent)` che aggiunge tool `mcp__server__tool` a `TOOL_REGISTRY`; type-widen di `ToolName` per accettare `string` oltre all'union (mantenendo autocomplete dove possibile)
- `task-07-permissions` — `resolveToolPermission` estesa: se nome inizia con `mcp__`, estrai server e applica `agent.permission.mcp[server]` o default `'ask'`
- `task-08-system-prompt` — Verifica: tool dinamici appaiono automaticamente in `generateSystemPrompt` tramite `TOOL_REGISTRY`; aggiungi sezione MCP count nello status

### Wave 4 — Agent loop & lifecycle (dipende da W3)
- `task-09-loop-wiring` — Passa registry MCP all'agent loop; invoca `callTool` con `abortSignal` per supportare ESC; risultato MCP → `formatToolResult`
- `task-10-app-lifecycle` — In `App.tsx`: connect all'avvio (dopo skills), `shutdownAll()` su unmount/exit, reload su `/mcp reload`

### Wave 5 — UI, tests, docs (dipende da W4)
- `task-11-mcp-command` — `/mcp` (lista server + tool + stato: connected/error/disabled), `/mcp reload`, status bar `MCP:3` accanto a skills indicator
- `task-12-tests` — Unit: loader, name-prefix validator, permission resolver. Integration: mock stdio MCP server con `@modelcontextprotocol/server-everything`
- `task-13-docs` — VitePress IT/EN (`docs/it/mcp.md`, `docs/en/mcp.md`), sezione README roadmap check, esempio in AGENTS.md

---

## Criteri di accettazione

- [ ] `.turbodev/mcp.json` parsato all'avvio, errori non bloccano l'app
- [ ] Server MCP avviati come processi figli via stdio, handshake `initialize` riuscito
- [ ] Tool MCP esposti all'LLM come `mcp__<server>__<tool>` con descrizione + input schema
- [ ] L'LLM può chiamare i tool MCP nel formato `tool: mcp__filesystem__read_file({...})`
- [ ] Permesso default `ask`: ogni prima invocazione chiede conferma all'utente
- [ ] Server crash gestito: errore nel risultato del tool, app resta up
- [ ] `/mcp` mostra stato; `/mcp reload` riconnette
- [ ] Shutdown pulito: niente zombie processi
- [ ] Build (`npm run build`) e test (`npm test`) verdi

---

## Note tecniche

- **tsup**: `@modelcontextprotocol/sdk` è ESM-only — verificare `tsup.config.ts`, probabilmente va in `noExternal` o builda correttamente già (progetto è già `"type": "module"`)
- **Node engines**: SDK richiede Node 18+; `package.json` ha già `>=18.0.0` ✓
- **Security**: env vars mai loggate; `command` deve risolvere via PATH (no shell injection: usare `spawn` diretto, no `shell: true`)
- **Non-goal V1**: resources, prompts, sampling, elicitation, remote HTTP, notifications `list_changed`, OAuth — tutti nella roadmap successiva

---

## Tempo stimato

~5-6 giornate di lavoro se si eseguono i task in parallelo per ondata usando subagent (come per skills). Possibile target fine settimana del 25 Giu (in linea con roadmap).
