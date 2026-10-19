# Clinical Review search and draft delivery — 27 September 2026

The local review source/model is `59b35d8f3b176fb542b6ff561472206477f9bbda`.
Imported from committed Git source (840 files), not an edited runtime export.
Integration fingerprint `e85d2acc35d79864642fcf1402953767dff68853f07fdcf7141bf5012fae2436`.

Review search now uses the Atlas's already source-checked vocabulary, plus the
dedicated shoulder's existing synonyms. No new anatomical equivalences, source
admissions or models were invented. Achilles finds left/right calcaneal tendons
as distinct whole-body records and the three independent specimen contexts.
Names, IDs, links, source frames, scopes and laterality are preserved. Unicode
normalization and exact cranial-nerve token matching use the shared search helper.

Two CC BY 4.0-attributed Achilles CT drafts are now reviewable. Their evidence
limitations are visible; no acquired images or clinical approval are supplied.
The learner runtime remains `36c53fb`. Review-before-release is intentional:
review packets match the protected review viewer, not the older learner export.
The integration test now pins both deliveries separately and verifies exact
review/model fingerprints; stale-revision rejection remains tested. Independent
Atlas/case/lecture rights and personal institution-scoped records are unchanged.

## Verification

- Source: six index tests, four page tests, four async status tests, five queue
  tests and TypeScript pass. No source geometry or teaching modified by search.
- Website: five integration tests pass, including the real endpoints in disposable
  memory storage, prior-revision rejection, isolation, append-only corrections,
  source/model delivery, imported synonyms and both unapproved CT draft panels.
- Protected model inventory unchanged (136 models); review source/artifact hashes,
  review viewer build, website production build and TypeScript pass. No dependencies
  added; bundled licence notices regenerated from existing licensed packages.
- Browser: initial Achilles search returned three specimens only; after import it
  returns five records. Keyboard navigation opens the exact left-tendon workspace.
  CT disclosure shows the new draft/references/credit; no unsaved edits and scoped
  approval disabled. No record or checklist was saved/approved.
- Mobile inspection at requested 390px viewport: source/evidence remain readable;
  document measured 377px wide vs375px client area (minor global overflow), with
  no overflowing main-content element. Pointer/mobile acceptance is not complete.
- Local preview is the development test account, not verified live professional
  attribution. No public deployment or production DB mutation.

Logs/recovery are in the coordinating workspace's
`work/REVIEW-SEARCH-CHECKPOINT-20260927.md`. Next: complete mobile/pointer acceptance,
then a coherent learner teaching export. Clinical/privacy release gates remain.
