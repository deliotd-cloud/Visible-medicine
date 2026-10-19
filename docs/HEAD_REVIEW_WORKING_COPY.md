# Private head-review working copies

Local implementation checkpoint, 8 October 2026. Parent website `faae81124e6e0fb387de9c38defe782e6401bbd1`; Atlas source `ee6647564d871ebc86fa81c44c87718feb178567` unchanged.

## Use

In authorized Clinical Review → Head learning, both the original linked-teaching notes and the separate MRI-only notes have **Download working copy**. Use it before leaving the page if unfinished notes matter, especially when a save is uncertain or the session/source has changed. Confirm the browser saved the file and keep it private. Never enter patient data.

The JSON contains the exact displayed review context, checklist, source/packet revisions, draft fields including whitespace and incomplete corrections, base version (null until history loads), and unsaved/uncertain/reload flags. It contains no scans or credentials. A self-entered reviewer name is not verified identity; the filename contains only the kind and timestamp.

This is a local working copy, not saved history, a signed review or approval. All approval/registration/server-save-confirmation flags are false. It cannot be imported as a saved review event. If restoring notes, compare revisions with the current material and copy the text manually into the appropriate form; saving still needs normal authorization and validation. Clinical decisions remain separate.

## Behaviour and boundaries

- Available outside disabled editing fields, including during loading, saving or a required reload.
- Snapshot only: no fetch, retry, localStorage, server mutation, auto-import, history change, clearing of unsaved state or unlocking of saves.
- Original save/error status remains visible. The download status only says that the browser was asked to download; disk completion cannot be confirmed by this API.
- Strict existing context/field limits still apply, but the 10-character minimum for saving a correction request does not prevent preserving an unfinished correction. Saved-event contracts are unchanged and reject working-copy envelopes.
- Blob URLs and temporary anchors are cleaned up; a synchronous download failure advises preserving the open page and copying notes.

## Verification

31 focused tests pass, covering both copy contracts, exact whitespace and revision retention, non-approval flags, malformed data refusal, independent copies, Blob/filename cleanup, original-form server rendering, MRI-form callbacks during loading/unsaved/uncertain/changed-source states, and existing history/save protections. Full canonical nonincremental TypeScript and the local website build pass. The combined Review verifier retains integration `8512098c1ffbd23fe5c5e70d872debecf44a2baadf1d6c64727548bff2063060`; no regenerated Review content is necessary.

Eight local HTTP checks pass: CT/MRI/3D routes, protected review gate, two denied review APIs and exact bytes of both new client chunks. Nine repeated anonymous denied-save/page-recovery checks pass. These are software/synthetic checks, not actual signed-in account, browser download-disk, native-image, GPU or clinical acceptance. Those remain explicit acceptance items; development elsewhere is not blocked by them.

Evidence and source-only same-machine recovery: `E:/VisibleMedicine-LocalStaging/20261008-review-working-copy/`. The scoped checkpoint and incremental bundle are recorded in `saved-state.json`; this is not GitHub or off-device backup. Local preview session 29202 on port 3000 replaces 73023; historical port 3001 is unchanged. The build's 144 redundant model copies were removed only after exact existing E recovery copies were verified; canonical models were retained. An unrelated existing blank-line-at-EOF warning in the pending master-plan tail was left untouched; scoped staged whitespace verification is separate.

No dependency, license, source mask, desktop PACS, authentication, entitlement, approval, public deployment or external upload change. The existing Sites local-only preview flow was reused. Specialist files and the full pending master-plan tail are preserved. Continue substantive source-backed regional/multimodal teaching and guided-learning coverage next, alongside actual account/release evidence when available; do not repeat this completed safeguard as ongoing status work.
