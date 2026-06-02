# Permessi

Controlla cosa possono fare gli agenti.

Il sistema di permessi ti permette di gestire quali azioni un agente può eseguire. Puoi configurare i permessi per consentire, richiedere approvazione o negare operazioni specifiche.

## Azioni di permesso

| Azione | Comportamento |
|--------|---------------|
| `allow` | Esegue senza chiedere |
| `ask` | Richiede l'approvazione dell'utente prima di eseguire |
| `deny` | Blocca completamente l'azione |

## Permessi predefiniti

| Agente | edit | bash |
|--------|------|------|
| editor | allow | allow |
| plan | ask | ask |

## Configurazione

### Nel Markdown

Imposta i permessi nel frontmatter dell'agente:

```yaml
permission:
  edit: deny
  bash: ask
```

### Pattern glob per bash

Per i comandi bash, puoi impostare permessi per singolo comando usando pattern glob:

```yaml
permission:
  bash:
    "*": ask
    "git status": allow
    "git *": allow
    "rm *": deny
```

**L'ultima regola corrispondente vince.** Inserisci prima i pattern generali, poi quelli specifici.

#### Corrispondenza dei pattern

| Pattern | Corrisponde a |
|---------|---------------|
| `*` | Qualsiasi comando |
| `git *` | Qualsiasi comando git con argomenti |
| `npm test` | Esattamente `npm test` |
| `rm *` | Qualsiasi comando rm |

### Esempi

#### Agente in sola lettura

```yaml
permission:
  edit: deny
  bash: deny
```

L'agente può leggere i file ma non può modificare nulla né eseguire comandi.

#### Agente di sviluppo sicuro

```yaml
permission:
  edit: ask
  bash:
    "*": ask
    "git status": allow
    "git diff": allow
    "npm test": allow
```

Le modifiche e la maggior parte dei comandi richiedono approvazione, ma la lettura dello stato di git e l'esecuzione dei test sono consentiti automaticamente.

#### Agente con accesso completo

```yaml
permission:
  edit: allow
  bash: allow
```

Nessuna approvazione necessaria — l'agente può fare tutto. Questa è la configurazione predefinita per l'agente editor.

## Sovrascrittura tramite strumenti

Impostare uno strumento su `false` nella configurazione `tools` ha la priorità sui permessi:

```yaml
tools:
  edit_file: false
permission:
  edit: allow    # Questo viene ignorato — edit_file è disabilitato
```

## Flusso dei permessi

1. L'agente tenta di utilizzare uno strumento
2. TurboDev verifica se lo strumento è disabilitato (`tools: false`)
3. Se non è disabilitato, verifica l'azione di permesso
4. Se `ask`, mostra un prompt all'utente
5. Se `deny`, restituisce un errore all'agente
6. Se `allow`, esegue lo strumento immediatamente

### Prompt utente

Quando viene attivato `ask`:

```
? Consentire edit_file?
  Comando: modifica di src/app.ts
  [y/n]
```

Digita `y` per consentire, `n` per negare. La risposta dell'agente dipende dalla tua scelta.

[Scopri di più sugli agenti](/it/agenti/)
