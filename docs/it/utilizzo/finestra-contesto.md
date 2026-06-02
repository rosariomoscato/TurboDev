# Finestra di contesto

Gestisci la finestra di contesto e la lunghezza della conversazione.

TurboDev traccia l'utilizzo dei token in tempo reale e lo mostra nella barra di stato. Quando la finestra di contesto si riempie, l'auto-compattazione mantiene la conversazione attiva.

## Utilizzo token

La barra di stato mostra un indicatore dei token come `1.24K/128K`:

- **Valore a sinistra** — Token stimati utilizzati (inclusi prompt di sistema, cronologia e risultati degli strumenti)
- **Valore a destra** — Lunghezza massima del contesto per il modello corrente

### Codifica colore

| Colore | Utilizzo | Comportamento |
|--------|----------|---------------|
| Verde | Sotto il 50% | Funzionamento normale |
| Giallo | 50%–75% | Avviso — considera la compattazione |
| Rosso | Sopra il 75% | Auto-compattazione al 85% |

## Auto-compattazione

Quando l'utilizzo dei token raggiunge il **75%**, TurboDev ti notifica. All'**85%**, la conversazione viene compattata automaticamente:

1. L'intera conversazione viene inviata all'LLM
2. L'LLM genera un riassunto conciso
3. La conversazione viene sostituita con il riassunto
4. Puoi continuare a chattare normalmente

Il riassunto preserva le decisioni chiave, le modifiche al codice e il contesto necessario per il compito in corso.

## Compattazione manuale

Usa `/compact` in qualsiasi momento per attivare manualmente la compattazione:

```
/compact
```

Utile quando:
- Vuoi liberare contesto prima di un compito complesso
- La conversazione è deviata e vuoi ripartire pulito
- Stai per raggiungere il limite di contesto e vuoi compattare quando preferisci

## Come vengono contati i token

TurboDev stima i token a circa **4 caratteri per token**. È un'approssimazione vicina per la maggior parte dei modelli LLM. Il conteggio include:

- **Prompt di sistema** — Istruzioni dell'agente, definizioni degli strumenti, contenuto di AGENTS.md
- **Cronologia della conversazione** — Tutti i messaggi utente e assistente
- **Risultati degli strumenti** — Output da letture di file, comandi bash, ecc.

Il conteggio dei token viene mostrato immediatamente all'avvio (solo prompt di sistema) e aggiornato dopo ogni scambio di messaggi.

## Tracciamento dei costi

TurboDev recupera il prezzo per token da OpenRouter e calcola il costo in tempo reale:

- **Token di input** — Token inviati al modello (prompt di sistema + cronologia + nuovo messaggio)
- **Token di output** — Token generati dal modello (risposta)
- **Formula del costo** — `(tokenInput × prezzoPrompt) + (tokenOutput × prezzoCompletamento)`

Il costo cumulativo viene mostrato nella barra di stato (es. `$0.0023`) e salvato con la sessione.

## Torna all'utilizzo

- [Interfaccia terminale](/it/utilizzo/)
- [Comandi](/it/utilizzo/comandi)
