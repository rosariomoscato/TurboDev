# Agent Skills

Estendi le capacità degli agenti con skill pack installabili.

Le Agent Skills sono pacchetti di istruzioni riutilizzabili che insegnano agli agenti come eseguire compiti specializzati. Seguono la [specifica aperta Agent Skills](https://agentskills.io) e vengono scoperte automaticamente all'avvio.

## Cosa sono le Skills?

Una **skill** è una directory contenente un file `SKILL.md` con metadati in formato YAML frontmatter e istruzioni in Markdown. Quando un agente incontra un compito che corrisponde alla descrizione di una skill, carica automaticamente le istruzioni complete tramite lo strumento `load_skill`.

Le skill usano la **divulgazione progressiva** per risparmiare token:

1. **Metadati** (~100 token) — sempre inclusi nel prompt di sistema così l'LLM sa che la skill esiste
2. **Istruzioni complete** — caricate su richiesta quando l'LLM chiama `load_skill`
3. **File di risorsa** — file aggiuntivi (riferimenti, script) caricati su richiesta tramite `load_skill` con un percorso `resource`

## Fonti delle Skill

Le skill vengono scoperte da tre fonti, in ordine di priorità (la priorità maggiore sovrascrive quella minore per nome):

| Fonte | Posizione | Descrizione |
|-------|-----------|-------------|
| **Built-in** | Incluse in TurboDev | Skill distribuite nel pacchetto npm |
| **Globali** | `~/.config/turbodev/skills/` | Skill installate dall'utente, condivise tra progetti |
| **Progetto** | `<progetto>/.agents/skills/` | Skill specifiche del progetto, massima priorità |

## Struttura delle Directory

Una directory di skill segue questa struttura:

```
.agents/skills/
  mia-skill/
    SKILL.md
    riferimenti/
      RIFERIMENTO.md
    script/
      helper.sh
```

### Formato SKILL.md

Il file `SKILL.md` contiene YAML frontmatter seguito da istruzioni in Markdown:

```markdown
---
name: mia-skill
description: Descrizione di cosa fa la skill e quando usarla.
license: MIT
compatibility: Node.js 18+
allowedTools: Bash(git:*) Read
metadata:
  author: "Il Tuo Nome"
  version: "1.0.0"
---

# Mia Skill

Le istruzioni per l'agente vanno qui. Questo contenuto viene caricato
quando l'agente chiama `load_skill("mia-skill")`.

Puoi fare riferimento a file aggiuntivi:

- Vedi [Riferimento](riferimenti/RIFERIMENTO.md) per la documentazione API dettagliata
```

### Campi Obbligatori

| Campo | Descrizione |
|-------|-------------|
| `name` | Identificatore della skill. 1–64 caratteri, alfanumerici minuscoli e trattini. Deve corrispondere al nome della directory. |
| `description` | Descrizione leggibile di cosa fa la skill. Massimo 1024 caratteri. |

### Campi Opzionali

| Campo | Descrizione |
|-------|-------------|
| `license` | Nome della licenza o riferimento a un file di licenza incluso |
| `compatibility` | Requisiti di ambiente (prodotto, pacchetti, rete, ecc.) |
| `allowedTools` | Strumenti pre-approvati separati da spazi. Esempio: `Bash(git:*) Read` |
| `metadata` | Coppie chiave-valore arbitrarie per metadati aggiuntivi |

## Abilitare e Disabilitare le Skill

Per impostazione predefinita, tutte le skill scoperte sono abilitate. Disabilita skill specifiche nella configurazione:

```json
{
  "skills": {
    "disabled": ["nome-skill-da-disabilitare"]
  }
}
```

## Comandi

- `/skills` — Elenca tutte le skill scoperte con il loro stato e fonte

## Come Funziona

1. All'avvio, TurboDev scansiona tutte e tre le fonti di skill e le unisce per nome
2. I metadati delle skill abilitate vengono inclusi nel prompt di sistema dell'agente
3. Quando l'LLM decide che una skill è rilevante, chiama `load_skill` per ottenere le istruzioni complete
4. Se la skill fa riferimento a file aggiuntivi, l'LLM può caricarli tramite `load_skill` con un percorso `resource`

## Creare una Skill

Per creare una skill specifica per il progetto:

1. Crea una directory sotto `.agents/skills/<nome-skill>/`
2. Aggiungi un file `SKILL.md` con frontmatter e istruzioni
3. Facoltativamente, aggiungi file di riferimento, script o altre risorse
4. Riavvia TurboDev — la skill verrà scoperta automaticamente

[Scopri di più sugli strumenti](/it/agenti/strumenti)
