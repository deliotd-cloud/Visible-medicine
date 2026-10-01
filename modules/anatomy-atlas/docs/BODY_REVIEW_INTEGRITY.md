# Clinical-review display integrity

The root-body worksheet parser checks displayed evidence against source-generated
SHA-256 pins for the current build's trusted catalogue and teaching resolver.
An exact anatomical ID selects the pin; packet names, FMA codes or claimed hashes
cannot select substitute material. The shared `bodyReviewSnapshot` supplies both
the worksheet builder and pin generator. The client verifies the same evidence
without loading a second complete teaching collection.

The comparison covers source identity and attribution, all nine topic tabs and
their references/notes/answer keys, interactive reasoning, guided-tour evidence,
checklists, limitations and the source-bound Atlas link. Well-typed altered text,
missing evidence and unknown topic/source fields fail closed. JSON property order
and omitted optional `undefined` values do not change the transport evidence.
Snapshots are detached copies, not writable references to the trusted catalogue.
The async parser awaits native WebCrypto SHA-256, with no custom crypto library
or dependency. Missing crypto, failed hashing or malformed evidence fail closed.
The display-pin hash domain includes schema, catalogue scope and exact ID; it is
separate from existing source, teaching, checklist and decision revision domains.
Those material/decision hashes are not migrated merely to optimize client loading.

This is not a signature verifier or an authentication mechanism. The server
independently recomputes the material, track revision and checklist version before
saving a decision, rejects stale submissions, and enforces reviewer access. A
transport mismatch must be reloaded; it is not clinical approval. No saved
decisions are rewritten or promoted by this change. Imaging still requires its
separate privacy, licensing, registration and radiologist acceptance gates.

## Checks

- `node scripts/generate-body-review-display-pins.mjs --check`: source-derived
  manifest matches every current worksheet. Existing production review-revision
  and body-review test gates invoke this check; stale pins cannot silently ship.
  Regenerate with the same command without `--check` after an intentional source
  or teaching change, then verify the changed evidence for radiologist review.
- `node --test scripts/test-body-review-display-digests.mjs`: native digest
  comparison, independently recomputed material hashes, complete evidence scopes,
  JSON transport and malformed-input rejection.

- `node --test scripts/test-body-review-integrity.mjs`: all current worksheets and
  JSON transport, every topic's altered body text, all topic fields, source/scope
  substitution, omitted checklists/limitations, reasoning and tour corruption.
- `npm run body-review:test`: existing material, API, display and rendering checks,
  including well-typed corruption regressions.
- `node scripts/validate-body-decisions.mjs`: independent save/revision guards.
- `node scripts/body-renderer-revisions.mjs --check`: verify this non-renderer
  change does not silently alter the renderer revision.

For a compatibility-only change, capture the ordered worksheet digest before
editing and pass it as `VM_REVIEW_BASELINE_SHA256` to the integrity test. It checks
that all worksheet content/fingerprints remain byte-identical without pinning a
permanent old-content fixture that would impede legitimate future teaching edits.

Website Clinical Review requires a generated import from the new Atlas revision
and integrated verification. A source-only checkpoint is not a deployed fix.
