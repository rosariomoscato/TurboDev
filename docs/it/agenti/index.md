# Agenti

Configura e usa agenti specializzati.

Gli agenti sono assistenti AI specializzati che puoi configurare per attività e flussi di lavoro specifici. Ti permettono di creare strumenti mirati con prompt personalizzati, modelli e accesso agli strumenti.

::: tip Consiglio
Usa l'agente **plan** per analizzare il codice e valutare suggerimenti senza apportare alcuna modifica al codice.
:::

Puoi passare da un agente all'altro durante una sessione usando **Tab**, selezionarli tramite il comando `/agent`, oppure invocarli con `@menzione`.

---

## Tipi

TurboDev ha due tipi di agenti: agenti primari e sottoagenti.

### Agenti primari

Gli agenti primari sono i principali assistenti con cui interagisci direttamente. Puoi scorrerli usando **Tab**. Questi agenti gestiscono la conversazione principale. L'accesso agli strumenti è configurato tramite i permessi: ad esempio, editor ha tutti gli strumenti abilitati, mentre plan è limitato.

::: tip Consiglio
Usa **Tab** per passare da un agente primario all'altro durante una sessione.
:::

TurboDev include due agenti primari: **editor** e **plan**.

### Sottoagenti

I sottoagenti sono assistenti specializzati che gli agenti primari possono invocare per attività specifiche. Puoi anche invocarli manualmente **menzionandoli con @** nei tuoi messaggi.

---

## Agenti predefiniti

### Editor

*Modalità*: `primary` · *Colore*: `cyan`

Editor è l'agente primario **predefinito** con tutti gli strumenti abilitati. È l'agente standard per il lavoro di sviluppo quando hai bisogno di accesso completo alle operazioni sui file e ai comandi di sistema.

**Strumenti**: Tutti abilitati
**Permessi**: `edit: allow`, `bash: allow`

### Plan

*Modalità*: `primary` · *Colore*: `yellow`

Un agente limitato progettato per la pianificazione e l'analisi. Utilizza un sistema di permessi per darti maggior controllo e prevenire modifiche involontarie. Per impostazione predefinita:

- `edit`: **ask** — richiede approvazione prima di modificare file
- `bash`: **ask** — richiede approvazione prima di eseguire comandi

**Strumenti**: Tutti abilitati tranne `task`
**Permessi**: `edit: ask`, `bash: ask`

---

## Utilizzo

1. **Agenti primari**: Usa **Tab** per scorrerli. Oppure digita `/agent` per aprire il selettore.

2. **@menzione**: Invoca direttamente qualsiasi agente menzionandolo:
   ```
   @plan analizza il flusso di autenticazione
   ```

3. **Invocazione sottoagente**: Gli agenti primari possono invocare automaticamente sottoagenti per attività specializzate.

---

## Configurazione

Gli agenti possono essere definiti tramite file Markdown. Posizionali in:

- **Globali**: `~/.config/turbodev/agents/`
- **Per progetto**: `.turbodev/agents/`

Il nome del file Markdown diventa il nome dell'agente. Ad esempio, `review.md` crea un agente chiamato `review`.

### Esempio

`.turbodev/agents/reviewer.md`:

```markdown
---
description: Revisore di codice che analizza il codice senza modificarlo
mode: primary
tools:
  edit_file: false
  mkdir: false
  bash: false
permission:
  edit: deny
  bash: deny
color: green
---
Sei un agente revisore di codice. Il tuo compito è:
- Leggere e analizzare il codice
- Identificare potenziali bug, problemi di sicurezza e di stile
- Suggerire miglioramenti senza apportare modifiche
Non tentare mai di modificare alcun file.
```

### Ordine di unione

Quando un file agente personalizzato ha lo stesso nome di un agente predefinito (es. `editor.md`), TurboDev esegue un **merge superficiale**:

- Predefinito ← Globale ← Progetto (il progetto ha la priorità)
- Solo i campi specificati vengono sovrascritti
- Il `name` predefinito viene sempre preservato

---

## Opzioni

### description

Una breve descrizione di cosa fa l'agente e quando utilizzarlo.

```yaml
description: Revisiona il codice per migliori pratiche e potenziali problemi
```

**Obbligatoria.**

### temperature

Controlla la casualità e la creatività delle risposte.

| Intervallo | Comportamento |
|------------|---------------|
| 0.0–0.2 | Concentrato, deterministico — ideale per l'analisi |
| 0.3–0.5 | Equilibrato — sviluppo generale |
| 0.6–1.0 | Creativo — brainstorming ed esplorazione |

```yaml
temperature: 0.1
```

### top_p

Alternativa alla temperature per controllare la diversità delle risposte. Valori da 0.0 a 1.0.

```yaml
top_p: 0.9
```

### steps

Numero massimo di iterazioni agentiche prima di forzare una risposta solo testo. Utile per controllare i costi.

```yaml
steps: 25
```

### model

Sovrascrive il modello per questo agente. Utile per utilizzare modelli diversi ottimizzati per attività diverse.

```yaml
model: anthropic/claude-haiku-4-20250514
```

### mode

Determina come l'agente può essere utilizzato: `primary`, `subagent`, o `all`. Il valore predefinito è `all`.

```yaml
mode: primary
```

### prompt

Prompt di sistema personalizzato per l'agente. Scritto come corpo del Markdown (dopo il frontmatter).

````markdown
---
description: Pianificatore veloce
mode: primary
---
Sei uno specialista di pianificazione. Sii conciso e diretto.
````

### tools

Abilita o disabilita strumenti specifici per questo agente.

```yaml
tools:
  edit_file: false
  mkdir: false
  bash: false
```

### permission

Configura quali azioni l'agente può eseguire.

```yaml
permission:
  edit: deny
  bash: ask
```

Per bash, puoi usare pattern glob:

```yaml
permission:
  bash:
    "*": ask
    "git status": allow
    "git *": allow
```

::: tip Consiglio
Le regole vengono valutate in ordine e **l'ultima regola corrispondente vince**. Inserisci prima i pattern generali, poi quelli specifici.
:::

[Scopri di più sui permessi](/it/agenti/permessi)

### taskPermission

Controlla quali sottoagenti questo agente può invocare tramite lo strumento task. Utilizza pattern glob.

```yaml
taskPermission:
  "*": deny
  "code-reviewer": allow
```

### color

Aspetto visivo nell'interfaccia terminale. Usa un nome di colore valido: `cyan`, `yellow`, `green`, `red`, `magenta`, `blue`, `white`, `gray`.

```yaml
color: green
```

### hidden

Nasconde un sottoagente dal menu di autocompletamento. Utile per agenti interni che devono essere invocati solo programmaticamente.

```yaml
hidden: true
```

### disable

Disabilita completamente un agente in modo che non appaia da nessuna parte.

```yaml
disable: true
```

---

## Casi d'uso

- **Agente editor**: Sviluppo completo con tutti gli strumenti abilitati
- **Agente plan**: Analisi e pianificazione senza modifiche
- **Agente di revisione**: Revisione del codice con accesso in sola lettura
- **Agente di debug**: Indagine mirata con strumenti bash e lettura
- **Agente documentazione**: Scrittura di documentazione con operazioni sui file ma senza comandi di sistema

---

## Esempi

### Scrittore di documentazione

`.turbodev/agents/docs-writer.md`:

```markdown
---
description: Scrive e mantiene la documentazione del progetto
mode: subagent
tools:
  bash: false
color: magenta
---
Sei uno scrittore tecnico. Crea documentazione chiara e completa.
Concentrati su:
- Spiegazioni chiare
- Struttura appropriata
- Esempi di codice
- Linguaggio facile da capire
```

### Auditors di sicurezza

`.turbodev/agents/security-auditor.md`:

```markdown
---
description: Esegue audit di sicurezza e identifica vulnerabilità
mode: subagent
tools:
  edit_file: false
  bash: false
permission:
  edit: deny
  bash: deny
color: red
---
Sei un esperto di sicurezza. Concentrati sull'identificazione di potenziali problemi di sicurezza.
Cerca:
- Vulnerabilità nella validazione degli input
- Difetti di autenticazione e autorizzazione
- Rischi di esposizione dei dati
- Vulnerabilità nelle dipendenze
- Problemi di sicurezza nella configurazione
```
