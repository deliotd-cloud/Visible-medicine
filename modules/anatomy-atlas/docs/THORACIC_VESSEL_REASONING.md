# Thoracic vessel reasoning drafts

Six new Apply anatomy concepts use existing source selections. No geometry,
scan, imaging registration or clinical decision is added. All remain draft.

| Selection | FMA | Component | Catalogue side |
|---|---|---|---|
| Ascending aorta | FMA3736 | FJ3413 | midline |
| Arch of aorta | FMA3768 | FJ3411 | midline |
| Descending thoracic aorta | FMA87217 | FJ1931 | unspecified |
| Superior vena cava | FMA4720 | FJ3645 | unspecified |
| Azygos vein | FMA4838 | FJ3416 | unspecified |
| Hemiazygos vein | FMA4944 | FJ3434 | midline |

All belong to thorax-vessels-recovery, ISA, region thorax. The new vessel matcher
requires the authored ID, FMA, category/system, bundle, node, tree, side, ordered
regional membership and component hash. It does not rely on display names.
Existing muscle/organ/neural-organ questions retain their prior contract.

The bank appends six concepts after the unchanged 140. Catalogue side matching
stays intact, yielding three available choices in each group of three vessels.
The tag midline is a source classification, not a claim that the hemiazygos runs
in the anatomical midline. No side is inferred for unspecified selections.
Only actually loaded/in-scope curated alternatives may appear. Narrowing to an
isolated vessel cannot create a one-choice question. Focus, retry, one question
per concept and delayed feedback use the existing session engine.

## References and boundaries

The coordinator inspected TTUHSC El Paso [arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html)
and [veins](https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html) tables on
27 September 2026. These copyrighted pages are factual references, not imported
or relicensed material. Original concise prompts/explanations cite the sources;
no tables, diagrams, page layout, scans or question-bank items are reproduced.
Azygos-system variability and usual rather than universal arterial patterns
must be retained. Surface models do not prove lumen, patency or blood flow.

Radiologist/educator review is still required for every question, explanation
and distractor set. The current Clinical Review body worksheet excludes this
interactive question bank; its teaching approval must not be represented as
approval of these assessments. A dedicated revision-bound review surface is a
remaining requirement. Website import is separate from this source implementation.

## Verification

Focused source tests cover exact new identities and mutation rejection, unchanged
140-concept prefix, actual regional/whole-body session eligibility, loaded/focus/
retry constraints, same-side choices and gated feedback. The broad reasoning
validator retains all prior prefix hashes and official source-index checks.
Final check results and real-browser acceptance are recorded in the coordinating
checkpoint, separately from clinical correctness or public release.

Verified source batch: 636 focused assertions / 102 negative source mutations;
17,993 broad reasoning checks / 4,153 identity negatives; 33,460 content-contract
checks; TypeScript, regional production build and both renderer revision checks
pass. Reference-derived text totals 100 words for the artery table and 126 for veins.

Actual 375 × 577 touch browser: vessels-only Thorax offers six draft questions.
A five-question session exercised wrong/correct feedback and completed; Retry
missed offered the single missed hemiazygos question and accepted its correction.
No horizontal overflow. These are source-preview results, not website delivery.
