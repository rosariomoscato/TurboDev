# Installazione

Installa TurboDev sul tuo sistema.

## npm

```bash
npm install -g @rosariomoscato/turbodev
```

## Usando npx (senza installazione)

```bash
npx @rosariomoscato/turbodev
```

## Dal codice sorgente

```bash
git clone https://github.com/rosariomoscato/TurboDev.git
cd TurboDev
npm install
npm run build
npm link
```

Dopo l'installazione, esegui `turbodev` da qualsiasi directory di progetto.

## Verifica dell'installazione

```bash
turbodev --version
```

## Primo avvio

Al primo avvio, TurboDev eseguirà la **procedura guidata di configurazione** che richiede:

1. **Chiave API** — La tua chiave API OpenRouter
2. **Modello** — Il modello LLM preferito

Puoi rieseguire la configurazione in qualsiasi momento con il comando `/setup`.
