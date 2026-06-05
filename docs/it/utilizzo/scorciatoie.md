# Scorciatoie da tastiera

Naviga TurboDev in modo efficiente.

## Generiche

| Tasto | Azione |
|-------|--------|
| `Invio` | Invia messaggio / Conferma |
| `Tab` | Passa da un agente primario all'altro |
| `Escape` | Annulla l'azione corrente / **Interrompi la richiesta AI** |

## Selettore modelli

| Tasto | Azione |
|-------|--------|
| `↑` / `k` | Pagina precedente |
| `↓` / `j` | Pagina successiva |
| `1`–`9` | Seleziona modello |
| `Esc` / `q` / `c` | Annulla |

## Selettore agenti

| Tasto | Azione |
|-------|--------|
| `1`–`9` | Seleziona agente |
| `Esc` | Annulla |

## Selettore sessioni

| Tasto | Azione |
|-------|--------|
| `1`–`9` | Seleziona sessione da ripristinare |
| `Esc` | Annulla |

## Prompt sessione all'avvio

| Tasto | Azione |
|-------|--------|
| `y` | Riprendi la sessione precedente |
| `n` | Inizia una nuova sessione vuota |

## Menu comandi

| Tasto | Azione |
|-------|--------|
| `/` | Apri il menu comandi |
| `↑` / `↓` | Naviga tra i comandi |
| `Invio` | Seleziona comando |

## Menzione @ e riferimenti file

### Menzione agenti

Digita `@` seguito dal nome di un agente per invocarlo direttamente:

```
@plan analizza il flusso di autenticazione
```

Questo invia il tuo messaggio all'agente specificato, indipendentemente da quale agente sia attualmente attivo.

### Riferimento a file e cartelle

Digita `@` per aprire il selettore dei riferimenti, che elenca tutti gli agenti, file e cartelle del progetto:

```
@src/tools/read-file.ts spiegami cosa fa
```

**Come funziona:**

1. Digita `@` nella barra di input — appare il selettore dei riferimenti
2. Continua a digitare per filtrare (es. `@src` mostra solo i percorsi sotto `src/`)
3. Naviga con `↑`/`↓` e premi `Invio` per selezionare
4. Continua a digitare la tua istruzione dopo il riferimento
5. Premi `Invio` per inviare — il contenuto del file o l'elenco della cartella viene incluso come contesto per l'AI

| Tasto | Azione |
|-------|--------|
| `@` | Apri il selettore dei riferimenti |
| Digita dopo `@` | Filtra file, cartelle e agenti |
| `↑` / `↓` | Naviga nella lista |
| `Invio` | Seleziona il riferimento |
| `Esc` | Chiudi il selettore |

**Riferimenti supportati:**
- **File** (`@src/App.tsx`) — il contenuto completo del file viene incluso nel messaggio
- **Cartella** (`@docs/`) — l'elenco dei file nella cartella viene incluso
- **Agente** (`@plan`) — instrada il messaggio a quell'agente
