# Validation maintenance — 17 September 2026

Baseline: `a0b5bac61bd53e9c5732f867846768b5084b175b`.
Test-only repair: no clinical copy, geometry, accepted source pins, dependencies,
approval, entitlements, website export or patient data change.

## Nested teaching and cranial source partitions

The nested pin writer still attempted to find an independent lesson for each
unnamed cranial artery source fragment. The corresponding runtime deliberately
does not inherit parent teaching onto these fragments, and the direct teaching
validator already excluded this separate study. The pin writer now uses that
same explicit scope, and rejects any new cranial-component teaching concept
until an explicit source-pinning workflow exists. It does not skip arbitrary
unmatched targets. All 71 saved bindings and 11 parents remain byte-for-byte
unchanged; the full nested command passes 8,914 checks.

The adjacent component validator had two independent harness assumptions:
`next/link` was loaded as if standalone Next were installed, rather than through
the installed Vinext implementation, and it assumed the pre-supplement root
selection count. It now loads the real installed Vinext link implementation and
accounts for exactly the source-bound corpus-spongiosum supplement. The
remaining historical root count remains 1,101; arbitrary growth is not accepted.
The suite verifies all 29 fragments across three parents, exact face/normal
partition export, source/side rejection, non-inheritance of lessons, source-bound
navigation and controlled component interactions: 1,530 checks passed.

Local evidence:

- `.local/test-logs/2026-09-17T01-05-18.500Z-56268-34aeb056.log`:
  nested teaching PASS; initial cranial harness failure retained.
- `.local/test-logs/2026-09-17T01-06-05.721Z-49644-884a2deb.log`:
  intermediate historical-count failure retained.
- `.local/test-logs/2026-09-17T01-06-38.583Z-47828-d15d3cb3.log`:
  complete cranial component command PASS.

These are controlled component/source tests, not browser/GPU or clinical
acceptance. Runtime inputs are unchanged; builds are not rerun solely for test
script maintenance. The prior source milestone records applicable runtime builds.

## Pelvic imaging history

The old validator restored only the 44 original pelvic notes on today's catalog
and compared that mixed-era snapshot with the original whole-corpus digest.
Later accepted teaching and source additions made that assertion invalid.
It now compiles both recorded historical Git revisions, without current-source
fallbacks, and checks the immutable predecessor digest and exact reconstruction
by the historical adapter. All original accepted hashes remain unchanged.
The historical comparison uses the raw catalog, not today's augmented display.

The old preserved-file assertions now compare the actual recorded pre/post
commits, not today's evolved UI/package with its predecessor. Current source
identity, source-file rows, four model hashes, schemas, citations, lesson
resolution, altered-binding rejection and actual note renders remain live.
Capitalisation no longer makes the specialised-ultrasound wording assertion
fail. No content was edited to satisfy these tests.

PASS: 11 selections, 44 placements and actual note renders, 616 rejected
mutations, 24 distinct texts, historical source verified. The 9,874 untargeted
current topic slots are checked for non-interception by this resolver, not
claimed identical to all historical teaching. The report's `preservedPaths`
refers only to the original historical transition. Its 12 budget entries include
one licence link; it does not mean 12 independent factual clinical sources.
Evidence: `docs/pelvic-organ-imaging-validation.json`.

The dedicated pelvic history suite also passed normally and with
`--verify-source`: 44 restored, 9,874 preserved, 70 rejected, original source
verified. Its inputs were unchanged by this repair, so it was not run again
solely to recreate output. Exact worker run evidence belongs in the coordinating
checkpoint; no new browser, clinical or deployment acceptance is implied.
