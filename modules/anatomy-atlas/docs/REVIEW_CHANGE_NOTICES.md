# Recorded review-change notices

The private body, nested-dissection and independent-specimen decision editors
show a short notice beside the existing review status when the selected track
requires re-review. “What changed?” is collapsed initially; opening it compares
the recorded source, teaching, viewer, checklist, worksheet and track metadata.
It does not display private notes, reviewer details, raw identifiers or hashes.

These are fingerprint comparisons, **not** a reconstruction of the old teaching
text, a clinical assessment, a changed-mesh claim or patient-space registration.
A viewer revision may change while the source and teaching fingerprints match.
No new revision exists for an unavailable track; historical records are not a
current approval. Foreign-scope/identity/frame/track records or malformed metadata
produce only a generic unavailable explanation, with no inferred field changes.

Existing `bodyReviewStale`, `nestedReviewStale` and `specimenReviewStale` rules
remain authoritative. In particular, renderer-only metadata differences do not
make an otherwise-current teaching-track revision stale. The notice has no
storage, network requests, controls for saving, or side effects. It neither
reuses checklist confirmations nor changes parser, API, approval, account,
institution, source-hold, optimistic-concurrency or entitlement gates.

Source-owned implementation:

- `lib/review-change-summary.ts`: pure, scope/identity-checked comparisons.
- `app/review/review-change-notice.tsx` and CSS: passive native disclosure,
  table headers, escaped text and keyboard-focus styling.
- Existing decision editors pass only their loaded selected-track record.

Run `node --test scripts/test-review-change-notice.mjs` from the Atlas checkout.
The test uses actual current contexts, synthetic saved metadata, the real notice
and editor functions. It covers loading/current/absent/stale/foreign states,
renderer-only teaching independence, unavailable tracks, immutability and escaping.
The confined hook harness is not a network, authentication, signed-in browser,
GPU, accessibility-conformance or clinical-acceptance test. Existing actual SQLite
decision/security validators remain separate verification gates.

Deliver through the normal generated website Review import and revision binding;
never edit generated website copies. No assets, dependencies, licence obligations,
fees, anatomy meshes, clinical masks or desktop PACS changes are needed.
