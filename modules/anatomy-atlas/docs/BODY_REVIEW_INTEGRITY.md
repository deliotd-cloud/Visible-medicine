# Clinical-review display integrity

The root-body worksheet parser checks displayed evidence against the current
build's trusted catalogue and teaching resolver. An exact anatomical ID selects
the source; packet names, FMA codes or claimed hashes cannot select substitute
material. The shared `bodyReviewSnapshot` supplies both the worksheet builder and
the comparison, preventing a separate client-side teaching copy from drifting.

The comparison covers source identity and attribution, all nine topic tabs and
their references/notes/answer keys, interactive reasoning, guided-tour evidence,
checklists, limitations and the source-bound Atlas link. Well-typed altered text,
missing evidence and unknown topic/source fields fail closed. JSON property order
and omitted optional `undefined` values do not change the transport evidence.
Snapshots are detached copies, not writable references to the trusted catalogue.

This is not a signature verifier or an authentication mechanism. The server
independently recomputes the material, track revision and checklist version before
saving a decision, rejects stale submissions, and enforces reviewer access. A
transport mismatch must be reloaded; it is not clinical approval. No saved
decisions are rewritten or promoted by this change. Imaging still requires its
separate privacy, licensing, registration and radiologist acceptance gates.

## Checks

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
