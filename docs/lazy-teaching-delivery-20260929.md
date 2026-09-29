# On-demand teaching delivery — 29 September 2026

Local website import of Atlas `ed5215fcd3a8c4c113f8072b552f0a3cc1b5aa82`.
Regional initial JavaScript:7,631,095→3,897,572bytes,48.9% reduction. Full teaching
is deferred, not removed or rewritten. Source synchronous exports/review stay
unchanged; renderer fingerprints intentionally refreshed. No new dependencies.

Hidden mobile panels/workspace modes/closed quiz disclosures do not request notes.
Shared load success/pending, current-selection derivation and unmounted-subscriber
guards prevent stale content. Failed downloads leave the model usable. Chromium
may cache failed imports: repeated failure offers a manual Reload atlas with an
unsaved-view reset warning; never automatic.

Actual website iframe: desktop/phone,30 exact source-derived section comparisons,
no initial teaching download,shared loading,deliberately failed request/cached
retry/manual reload/recovery; mobile tour notes/MRI/next/Play/Pause/Exit pass.
Normal signed-in Clinical Review femur question, explanation, reference and Draft
status pass; no approval submitted. All137model hashes unchanged.

Source checks include7loader/boundary tests,36tour/camera tests,33,460content
assertions,1,104review selections/9,936topics/308reasoning packets,372tour-imaging
lessons,types and builds. Website integration tests bind new source/manifest/input
hashes. Six previous bundle-text checks now inspect the manifest-verified deferred
teaching chunk; all original text/source/clinical limits remain asserted. A new
production-output test checks recursive eager imports, reachable deferred teaching
and the reviewed5MB initial-JS ceiling.

Final website checks:278tests pass; TypeScript and production build pass.
Local coordination evidence: `work/lazy-teaching-website-tests-final-20260929.log`,
`work/lazy-teaching-website-{types,build}-20260929.log`,
`work/lazy-teaching-website-browser-20260929.json`,
`work/lazy-teaching-review-browser-20260929.json`.
Source documents include detailed exploratory timing limitations; loading-screen
LCP is not model readiness or public-site performance.

The local dev server hit its existing hot-reload AsyncLocalStorage recursion
after source replacement; only the owned preview was restarted, then normal
routes and real browser checks passed. Prior generated assets are recoverable at
coordination `work/lazy-teaching-prior-generated-20260929`; no source model deletion.

No publication or clinical/privacy/release approval. No patient files, CT masks,
desktop PACS changes or fracture-task modifications. GitHub/C checkpoints recorded
separately; D recovery remains pending while the drive is full.
