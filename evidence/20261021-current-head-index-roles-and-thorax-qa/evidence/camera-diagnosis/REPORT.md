# Regional focus framing diagnosis — 21 October 2026

Disposition: report only. No camera or product candidate was staged.

The thorax route requests its regional camera preset. At the observed dissection stage, pectoralis major is removed while the framing policy retains the other visible thorax sources, including upper and lower context. The camera fits that complete region. A smaller central rib and heart silhouette with surrounding open space is therefore consistent with the current fit and does not prove a camera defect. The existing camera effect also retains manual orbit, zoom, pan, reset, and saved scale in its focused checks. A tighter silhouette would be a different regional framing policy, which this observation does not justify.

Atlas source remained clean at HEAD `190a63238eadcf906abe89dcbb6a67c88afe70b9`, tree `c314f1cbfa394caed4c6874864fda7dea0a3286c`. `app/fitted-camera.tsx` SHA-256 was `F9D7AA3B4EF534EEEBB02F8BB3736898D0255062ECB7597A7D56493472FB54C6` before and after. A final `git status --porcelain=v1` produced no entries.

Focused commands already run in the clean Atlas checkout:

- `node scripts/validate-thorax-framing.mjs` exited 0; reported 72 projected fits and 367 selection checks. Tool result chunk `8baa59`.
- `node scripts/validate-camera-zoom.mjs` exited 0; reported 414 camera effect checks. Tool result chunk `12a585`.

The command stdout was shown in terminal tool results but was not saved as a file. There is no retained stdout log or stdout SHA-256 receipt. `EVIDENCE.json` records the commands, exit codes, result IDs, and this limit. No new validation, build, browser interaction, product source edit, commit, or deployment was performed for this handoff. The earlier browser observation is bounded visual evidence, not clinical or full device acceptance.
