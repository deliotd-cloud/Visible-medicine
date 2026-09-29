# Upper-limb bone reasoning — local integration

Atlas source: `a3f12f72d660bcbe7b27e172eaadafa8d9d09e44`.

Five original draft questions on ten existing bilateral bone selections now
reach the shared regional/whole-body learner and Clinical Review. The bank has
158 concepts; all preceding 153 are preserved. Shoulder/arm and forearm offer
three same-side bone alternatives, whole body five. Existing Apply anatomy and
system switches provide access; there is no extra navigation or toolbar.

Exact source identities and geometry remain unchanged, including the legacy
right-shoulder IDs. All 137 model hashes are preserved. No scans, copied diagrams,
new dependencies, fonts, paid service or approval decisions are added. Original
brief factual synthesis references the TTUHSC El Paso bones table; its link is
not a media reuse licence. All content requires revision-bound radiologist review.

## Verification

- Source focused/general/previous-family/review checks, types and both module
  builds pass. Source browser also preserves all 20 regional muscle questions.
- Website integration test checks all ten bone review packets, five same-side
  alternatives, teaching fingerprints, draft/reference fields, altered-answer
  rejection and equal learner/review source hashes.
- The website test run passed 275 tests; one pre-existing pelvic-organ test's
  bundler process stopped without an assertion failure. An isolated single-test
  rerun passed unchanged (276 covered in total). Original failure retained.
- Website TypeScript, clinical-review binding verification and production build
  pass; existing large-chunk/static-classification warnings remain.
- Actual website sessions pass shoulder desktop, forearm phone and whole-body
  320×480 at 200% text. Deliberate misses, retry, reference visibility and layout
  checks pass with no page or resource errors.
- Normal local sign-in and Clinical Review navigation display the clavicle
  question, explanation, draft status and source link; no approval submitted.

Parent workspace evidence: `work/upper-limb-bone-website-{tests,test-retry,types,build}-20260929.log`,
`work/upper-limb-bone-website-browser-20260929.json` and
`work/upper-limb-bone-review-browser-20260929.json`.

The separate fracture work is preserved and excluded from this commit.
No publishing or clinical release is authorised. GitHub/C recovery receipts and
the pending D-drive copy are recorded in the parent workspace checkpoint; D is
full, so no new D restore or cleanup is claimed. Native MRI remains complete.
