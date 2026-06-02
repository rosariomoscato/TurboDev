# Sessioni

Gestisci le sessioni di conversazione.

TurboDev salva automaticamente ogni conversazione su disco. Puoi riprendere una sessione precedente o iniziarne una nuova in qualsiasi momento.

## Avvio

Quando avvii TurboDev e esiste una sessione precedente, ti verrà chiesto:

```
Resume previous session?
  Titolo sessione (4 min fa, 12 messaggi)
  [y/n]
```

- Premi **y** per riprendere la sessione precedente con tutti i messaggi e il contesto intatti
- Premi **n** per iniziare una nuova sessione vuota

## Salvataggio automatico

Le sessioni vengono salvate automaticamente dopo ogni scambio di messaggi in:

```
.turbodev/sessions/session-{id}.json
```

Ogni sessione contiene:

- Messaggi (utente e assistente)
- Token utilizzati e lunghezza del contesto
- Costo cumulativo della sessione
- Nome dell'agente attivo

## Gestione sessioni

### /new

Inizia una nuova sessione vuota. La sessione corrente viene salvata automaticamente.

```
/new
```

### /sessions

Elenca tutte le sessioni salvate, ordinate dalla più recente:

```
/sessions
```

Output di esempio:

```
Sessions:
1. Aggiungere OAuth (2 min fa)
2. Bug fix CSS (1 ora fa)
3. Refactor API (ieri)
1-3 seleziona · Esc annulla
```

Digita il numero della sessione per ripristinarla. La sessione corrente viene salvata prima del passaggio.

## Torna all'utilizzo

- [Interfaccia terminale](/it/utilizzo/)
- [Comandi](/it/utilizzo/comandi)
