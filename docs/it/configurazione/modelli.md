# Modelli

Scegli e configura i modelli LLM.

TurboDev utilizza [OpenRouter](https://openrouter.ai) per accedere a un'ampia gamma di modelli LLM da provider come Anthropic, OpenAI, Google, Meta e altri ancora.

## Cambiare modello

### Durante una sessione

Usa il comando `/model` per aprire il selettore interattivo dei modelli:

```
/model
```

Naviga con `↑`/`↓` o `j`/`k`, seleziona con un numero, annulla con `Esc` o `q`.

### Modello per agente

Ogni agente può utilizzare un modello diverso. Impostalo nella configurazione Markdown dell'agente:

```markdown
---
description: Agente di pianificazione veloce
model: anthropic/claude-haiku-4-20250514
mode: primary
---
```

## Modelli più diffusi

| Modello | Provider | Ideale per |
|---------|----------|------------|
| `anthropic/claude-sonnet-4-20250514` | Anthropic | Coding generale, attività complesse |
| `anthropic/claude-haiku-4-20250514` | Anthropic | Analisi rapida, pianificazione |
| `openai/gpt-4o` | OpenAI | Uso generale |
| `google/gemini-2.5-pro` | Google | Attività con contesto lungo |
| `deepseek/deepseek-chat` | DeepSeek | Coding economico |

## Parametri del modello

Puoi affinare il comportamento del modello per ogni agente:

### Temperature

Controlla la casualità. Valori bassi = più concentrato, valori alti = più creativo.

```markdown
---
description: Analizzatore preciso
temperature: 0.1
---
```

| Intervallo | Comportamento |
|------------|---------------|
| 0.0–0.2 | Molto concentrato, deterministico |
| 0.3–0.5 | Equilibrato |
| 0.6–1.0 | Creativo, vario |

### Top P

Alternativa alla temperature per controllare la diversità delle risposte.

```markdown
---
description: Brainstorming diversificato
top_p: 0.9
---
```

## Torna alla configurazione

- [Configurazione](/it/configurazione/)
- [AGENTS.md](/it/configurazione/agents-md)
