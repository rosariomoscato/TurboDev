# Economy Mode

L'**Economy Mode** di TurboDev riduce il consumo di token istruendo l'AI a produrre output conciso. Quando attiva, il system prompt include una direttiva che fa sì che l'LLM elimini le parole di riempimento, usi frammenti di frase e mantenga il codice esatto — stessa accuratezza tecnica, ~50-70% token in output in meno, risparmio diretto sui costi.

Ispirato a [Caveman](https://github.com/JuliusBrussee/caveman), implementato nativamente — nessuna skill esterna o dipendenza.

## Come Funziona

1. Attivi un livello con `/economy eco` o `/economy ultra`
2. TurboDev aggiunge una direttiva di concisione al system prompt
3. L'LLM produce risposte più brevi — frammenti invece di paragrafi
4. Codice, comandi, percorsi file e messaggi di errore restano **byte-exact**
5. Il livello è persistito in `~/.turbodevrc` e sopravvive ai restart

La direttiva economy costa ~60 token (trascurabile rispetto al risparmio in output).

## Livelli

| Livello | Descrizione | Risparmio Output Stimato | Badge |
|---|---|---|---|
| `off` (default) | Output normale — frasi complete, spiegazioni | 0% | — |
| `eco` | Diretto e conciso. Niente filler, niente convenevoli. | ~50% | `ECO` (giallo) |
| `ultra` | Frammenti telegrafici. Nessuna spiegazione se non richiesta. | ~70% | `ULTRA` (rosso) |

## Comandi

| Comando | Descrizione |
|---|---|
| `/economy` | Mostra il livello corrente e l'usage |
| `/economy eco` | Attiva livello eco (alias: `/economy on`) |
| `/economy ultra` | Attiva livello ultra |
| `/economy off` | Disattiva economy mode |

## Prima / Dopo

### Normale (69 token)

> "The reason your React component is re-rendering is likely because you're creating a new object reference on each render cycle. I'd recommend using useMemo to memoize the object."

### Eco (~35 token)

> "Component re-renders because inline object prop creates new ref each cycle. Wrap in `useMemo`."

### Ultra (~19 token)

> "Inline object prop = new ref each render = re-render. Use `useMemo`."

Stessa soluzione. Stessa accuratezza. Meno token.

## Cosa Resta Esatto

Economy mode comprime lo **stile del testo**, non il **contenuto tecnico**:

- ✅ Blocchi di codice — byte-exact
- ✅ Comandi e flag CLI — exact
- ✅ Percorsi file — exact
- ✅ Messaggi di errore — exact
- ✅ Lingua dell'utente — preservata (input italiano → output italiano conciso)
- ❌ Parole di riempimento ("let me...", "sure!", "I'll now...") — eliminate
- ❌ Ripetere la domanda — eliminato
- ❌ Transizioni e convenevoli — eliminati

## Persistenza

Il livello è salvato in `~/.turbodevrc`:

```json
{
  "economy": {
    "level": "eco"
  }
}
```

All'avvio, TurboDev carica il livello salvato e attiva economy mode automaticamente. Cambialo in qualsiasi momento con `/economy`.

## StatusBar

Quando economy mode è attivo, la StatusBar mostra un badge colorato:

- `ECO` (giallo) — livello eco attivo
- `ULTRA` (rosso) — livello ultra attivo

Il badge si trova accanto all'indicatore di costo, così puoi vedere risparmio e spesa a colpo d'occhio.

## Quando Usarlo

- **`eco`** — lavoro quotidiano. Risposte dirette, ancora leggibili. Miglior equilibrio tra chiarezza e risparmio.
- **`ultra`** — sessioni power. Massima densità, minimo testo. Sai cosa stai facendo e vuoi solo la risposta.
- **`off`** — apprendimento/esplorazione. Quando vuoi spiegazioni complete e contesto.

## Ispirazione

Economy Mode è ispirato a [Caveman](https://github.com/JuliusBrussee/caveman) di Julius Brussee — una skill per Claude Code che ha dimostrato che una semplice istruzione nel prompt può tagliare il 65% dei token in output senza perdere accuratezza tecnica. TurboDev implementa il suo prompt di concisione nativo; non installa o bundle la skill Caveman.
