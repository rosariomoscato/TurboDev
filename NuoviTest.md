# NuoviTest — Test Avanzati Sistema Agenti

Questi test verificano la creazione di agenti custom, l'override dei built-in, gli agenti globali e la pulizia.

---

## Test 10 — Creare un agente custom via Markdown

### Cosa testiamo

Un agente definito da file `.md` nella directory progetto viene caricato dal registry e i suoi permessi sono rispettati.

### Passi

1. Crea la directory:

```bash
mkdir -p /home/rosario/Progetti/TurboDev/.turbodev/agents
```

2. Crea il file `/home/rosario/Progetti/TurboDev/.turbodev/agents/reviewer.md` con questo contenuto:

```markdown
---
description: Code reviewer che analizza codice senza modificarlo
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
You are a code reviewer agent. Your job is to:
- Read and analyze code
- Identify potential bugs, security issues, and style problems
- Suggest improvements without making changes
Never attempt to modify any files.
```

3. Riavvia TurboDev: `npm run dev`

4. Digita `/agent`

5. Ora dovresti vedere **3 agenti**:

```
Available agents:
1. editor — Full-access coding agent. Default agent with all tools enabled for development work. (current)
2. plan — Planning and analysis agent. Limited permissions — asks for approval before editing files or running commands.
3. reviewer — Code reviewer che analizza codice senza modificarlo
```

6. Switcha su reviewer: `/3`

7. La StatusBar dovrebbe mostrare `reviewer` in **verde**

8. Il prompt dovrebbe mostrare `You (reviewer):`

9. Prova a chiedere di leggere qualcosa:

```
leggi il file package.json e dimmi quali sono le dipendenze
```

Dovrebbe funzionare — `read_file` non e disabilitato.

10. Ora prova a chiedere di modificare qualcosa:

```
modifica il file package.json aggiungendo una dipendenza
```

L'agente dovrebbe ricevere un errore dal tool: `Tool "edit_file" is denied for agent "reviewer"` perche `tools.edit_file: false` e `permission.edit: deny`.

### Cosa verificare

- L'agente custom `reviewer` compare nella lista `/agent`
- Ha il colore verde nella StatusBar
- Puo leggere file (read_file funziona)
- Non puo modificare file (edit_file viene negato)
- Non puo eseguire comandi bash (bash viene negato)
- Non puo creare directory (mkdir viene negato)

---

## Test 11 — Override di un agente built-in

### Cosa testiamo

Un file `.md` con nome `editor.md` sovrascrive parzialmente l'agente built-in `editor`. Solo i campi specificati nel file vengono sovrascritti, il resto rimane invariato.

### Passi

1. Assicurati che la directory esista:

```bash
ls /home/rosario/Progetti/TurboDev/.turbodev/agents/
```

2. Crea il file `/home/rosario/Progetti/TurboDev/.turbodev/agents/editor.md` con questo contenuto:

```markdown
---
description: Il mio editor personalizzato con temperatura bassa
temperature: 0.2
---
You are TurboDev, my personal coding assistant. Be very concise and direct.
```

3. Riavvia TurboDev: `npm run dev`

4. Digita `/agent`

5. L'agente `editor` ora dovrebbe avere la descrizione "Il mio editor personalizzato con temperatura bassa" invece della descrizione built-in originale.

6. Switcha su editor se non sei gia li: `/1`

7. Fai una domanda qualsiasi:

```
dimmi cosa pensi di TypeScript in 2 frasi
```

La risposta dovrebbe essere piu concisa e deterministica del solito grazie a `temperature: 0.2` (invece del default `0.7`).

8. Verifica che l'agente editor abbia ancora tutti i tool abilitati:

```
leggi il file src/agent/types.ts e dimmi cosa fa
```

Dovrebbe poter leggere senza problemi — il campo `tools` non e stato sovrascritto nel `.md`, quindi il merge mantiene i tool del built-in.

### Cosa verificare

- La descrizione e sovrascritta: "Il mio editor personalizzato..." invece di "Full-access coding agent..."
- La temperatura custom (`0.2`) viene applicata — le risposte sono piu deterministiche
- I tool rimangono tutti abilitati (il campo `tools` non era nel `.md`, quindi il built-in viene preservato)
- I permessi rimangono `allow` per edit e bash
- Il colore rimane cyan

---

## Test 12 — Agente globale (non specifico del progetto)

### Cosa testiamo

Agenti definiti in `~/.config/turbodev/agents/` sono disponibili in tutti i progetti, non solo in quello corrente.

### Passi

1. Crea la directory globale:

```bash
mkdir -p ~/.config/turbodev/agents
```

2. Crea il file `~/.config/turbodev/agents/helper.md` con questo contenuto:

```markdown
---
description: Helper generico per domande generali
mode: primary
color: magenta
---
You are a helpful assistant for general questions. Answer concisely in the same language the user writes in.
```

3. Riavvia TurboDev: `npm run dev`

4. Digita `/agent`

5. Ora dovresti vedere **4 agenti** (o piu, a seconda dei test precedenti):

```
Available agents:
1. editor — Il mio editor personalizzato con temperatura bassa (current)
2. plan — Planning and analysis agent. Limited permissions...
3. reviewer — Code reviewer che analizza codice senza modificarlo
4. helper — Helper generico per domande generali
```

6. Switcha su helper: `/4`

7. La StatusBar dovrebbe mostrare `helper` in **magenta**

8. Fai una domanda generica:

```
quanti continenti ci sono nel mondo?
```

9. Dovresti vedere la risposta dell'agente helper.

### Prova che l'agente globale funziona anche in altri progetti

10. Esci da TurboDev: `/exit`

11. Vai in un'altra directory qualsiasi:

```bash
mkdir -p /tmp/test-project
cd /tmp/test-project
```

12. Copia il TurboDev li (o usa un link simbolico):

```bash
ln -s /home/rosario/Progetti/TurboDev/node_modules . 2>/dev/null
ln -s /home/rosario/Progetti/TurboDev/dist . 2>/dev/null
ln -s /home/rosario/Progetti/TurboDev/package.json . 2>/dev/null
node /home/rosario/Progetti/TurboDev/dist/index.js
```

Oppure, se hai installato TurboDev globalmente, semplicemente `turbodev` da `/tmp/test-project`.

13. Digita `/agent` — `helper` dovrebbe essere disponibile anche qui (perche e globale), mentre `reviewer` NON dovrebbe esserci (perche era specifico del progetto TurboDev).

### Cosa verificare

- L'agente globale `helper` appare nella lista `/agent`
- Ha il colore magenta
- Funziona correttamente quando selezionato
- E disponibile in qualsiasi directory (non solo nel progetto TurboDev)
- Gli agenti di progetto (come `reviewer`) NON sono disponibili in altre directory
- L'ordine di risoluzione e: built-in ← globale ← progetto (progetto vince)

---

## Test 13 — Pulizia dopo i test

### Passi

Rimuovi tutti i file e directory creati durante i test:

```bash
rm -rf /home/rosario/Progetti/TurboDev/.turbodev
rm -f /tmp/turbodev-test.txt /tmp/turbodev-plan-test.txt
rm -rf /tmp/test-project
```

Se vuoi rimuovere anche l'agente globale:

```bash
rm -f ~/.config/turbodev/agents/helper.md
rmdir ~/.config/turbodev/agents 2>/dev/null
rmdir ~/.config/turbodev 2>/dev/null
```

Riavvia TurboDev e digita `/agent` — dovresti tornare ai 2 soli agenti built-in: `editor` e `plan`.

### Cosa verificare

- Dopo la pulizia, `/agent` mostra solo `editor` e `plan`
- La directory `.turbodev` non esiste piu nel progetto
- TurboDev funziona correttamente senza file custom

---

## Test Rapido — Riepilogo in 2 minuti

Se vuoi rifare tutti i test velocemente dopo la pulizia:

| Step | Azione | Risultato atteso |
|------|--------|------------------|
| 1 | `npm run dev` | Parte con StatusBar che mostra `editor` in cyan |
| 2 | `/agent` | Lista 2 agenti, editor e (current) |
| 3 | Premi Tab | Switcha a `plan` (giallo) |
| 4 | `leggi package.json` | Legge senza chiedere permessi |
| 5 | `crea un file /tmp/test.txt` | Chiede `? Allow edit_file? [y/n]` |
| 6 | Premi `y` | Il file viene creato |
| 7 | Premi Tab | Torna a `editor` (cyan) |
| 8 | `@plan dimmi che giorno e oggi` | Risposta con prefisso `[plan]` in magenta |
| 9 | `/exit` | Esce |
