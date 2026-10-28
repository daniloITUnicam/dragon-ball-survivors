# Test archiviati

Test di funzioni che il gioco non usa più, tenuti come riferimento (`tools/run_tests.py` non li esegue: legge solo `tests/*.js`).

- `charge_walk.js`, `goku_grid.js`, `sprites_goku.js`: i fogli importati dei personaggi (Goku a griglia da 16 colonne, pose di carica e di scatto, ritratti). I fogli sono in `assets/sprites/_inutilizzati/personaggi/`: il gioco disegna i personaggi da sé. Il supporto ai fogli resta provato da `sprites_pack.js` e `sprites_boss.js`, che `run_tests.py` esegue su una build con quei fogli rimessi.
- `rocks_walk.js`: il vecchio atlas di 20 rocce sulle pianure (`_inutilizzati/rocce-vecchie/`) e i cicli di camminata di Goku dal foglio.
