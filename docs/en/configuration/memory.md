# Persistent Memory

TurboDev has a built-in **persistent memory** system that lets the AI agent remember your preferences, decisions, and project facts across sessions. No more starting from scratch every time you reopen the terminal — the agent learns and retains context that matters.

## How It Works

1. At startup, TurboDev loads `.turbodev/memory.md` (a plain Markdown file, gitignored)
2. The content is injected into the system prompt under a `## Memory` heading
3. The LLM sees your persisted facts and uses them as context
4. When the LLM learns something durable, it calls the `save_memory` tool automatically
5. Memory **survives compaction** because it lives in the system prompt (not conversation history)

You can also manage memory manually with `/memory` commands or by editing the file directly.

## The Markdown Format

`.turbodev/memory.md` is a plain Markdown file with one section per category:

```markdown
# Project Memory

## preferences
- User prefers TypeScript over JavaScript
- Prefers functional style over OOP

## decisions
- Using OpenRouter as LLM provider

## architecture
- React + Ink for TUI, tsup for bundling

## facts
- Node 22 LTS is installed
```

The file is always human-readable and editable. After manual edits, run `/memory reload` to update the session.

## Categories

| Category | Description | Examples |
|---|---|---|
| `preferences` | How the user likes things done | "prefers pnpm over npm", "likes functional style" |
| `decisions` | Project-level choices that persist | "using PostgreSQL 16", "deploying to Vercel" |
| `architecture` | Structural facts about the codebase | "React + Ink for TUI", "tsup for bundling" |
| `facts` | General context (default) | "Node 22 is installed", "kDrive slows file I/O" |

## The `save_memory` Tool

The LLM has a `save_memory` tool that it calls when it learns something durable:

```
tool: save_memory({"content": "User prefers pnpm, never npm", "category": "preferences"})
```

**What the LLM saves**: preferences, decisions, architecture facts, project context — things useful in *future* sessions.

**What the LLM does NOT save**: transient state ("currently editing file X"), obvious facts, things already in `AGENTS.md`.

The tool is always enabled and cannot be disabled per-agent. It writes only to `.turbodev/memory.md` (gitignored) — it cannot modify other files.

## Commands

| Command | Description |
|---|---|
| `/memory` | Show all memory entries grouped by category |
| `/memory show` | Same as `/memory` |
| `/memory add <text>` | Add an entry to `facts` (default category) |
| `/memory add <category> <text>` | Add an entry to a specific category |
| `/memory clear` | Clear all memory (asks for confirmation) |
| `/memory clear <category>` | Clear one category (asks for confirmation) |
| `/memory reload` | Re-read `.turbodev/memory.md` from disk |

### Examples

```
/memory add preferences Use 2-space indentation, never tabs
/memory add decisions We deploy to Vercel, not Netlify
/memory add The project uses Tailwind CSS v4
/memory clear decisions
```

## Manual Editing

The memory file is plain Markdown — open it in any editor:

```bash
# In your editor
vim .turbodev/memory.md
```

After saving, run `/memory reload` in TurboDev to pick up the changes.

## Token Budget

Memory is injected into the system prompt, which consumes context window tokens. TurboDev shows a warning when memory exceeds ~500 tokens (roughly 2KB of Markdown).

To reduce memory usage:
- `/memory clear <category>` to remove outdated entries
- Edit `.turbodev/memory.md` manually and `/memory reload`
- `/memory clear` to wipe everything and start fresh

## Compaction Safety

When a conversation is compacted (`/compact` or auto-compaction at 85%), the conversation history is summarized but the **system prompt is preserved**. Because memory lives in the system prompt, your persisted facts survive compaction — they are never lost or summarized away.

## AGENTS.md vs Memory

| | AGENTS.md | Memory (.turbodev/memory.md) |
|---|---|---|
| **Authored by** | User (manual) | LLM (via `save_memory`) + User |
| **Committed to git** | Yes (shared with team) | No (gitignored, personal) |
| **Content** | Project spec, setup, conventions | Learned facts, preferences, decisions |
| **Scope** | Static, authoritative | Dynamic, supplementary |

Both coexist in the system prompt. AGENTS.md is the authoritative project spec; memory is supplementary context the AI has learned.

## Limitations (V1)

- **Project-level only** — no global cross-project memory (V2)
- **No deduplication** — if the LLM saves the same fact twice, clean up manually
- **No auto-capture from compaction** — only the `save_memory` tool and `/memory add`
- **~500 token soft cap** — no automatic truncation, just a UI warning
- **No per-agent memory** — all agents in a project share the same memory file
