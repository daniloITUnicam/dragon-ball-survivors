> **Sprite disattivati (16/10/2026):** per ora il gioco usa solo la grafica disegnata dal codice. Tutti i fogli generati sono in `_archivio/` (ignorata dalla build); per riattivarli rimetti i `.png` e `sprites.json` di `_archivio/` in questa cartella e ricompila.

# Sprite sheets dei personaggi

I PNG `<id>.png` / `<id>_<n>.png` e `sprites.json` in questa cartella sono generati da `tools/import_pack.py` a partire dalle cartelle di frame del pack (qui accanto). Ricompila con `python3 build.py`: i fogli sostituiscono la grafica generata dal codice.
Nomi: `<id>.png` (forma base) e `<id>_<n>.png` (forma n, da 0). Guida completa: [`docs/SPRITES.md`](../../docs/SPRITES.md). Autori degli sprite: [`CREDITS.md`](../../CREDITS.md).
Nome sbagliato o file non PNG = ignorato (la build lo segnala).
