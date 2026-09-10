# Lower-limb motor relationships

Implemented 11 September 2026, following the wider-body priority. In the independent lower-limb views, expand **Muscles by nerve**, choose a group and show its supplied muscle selections with regional bones. Individual selections reuse Learn, dissection and Frame. The panel starts collapsed and does not add another 3D window.

## Scope and identity

Fifteen named nerve/branch groups link 42 source muscle selections through 43 explicit relationships. Adductor magnus is one surface with two qualified relationships, not two separately segmented territories. The biceps femoris heads remain distinct; psoas major is not assigned to the femoral nerve, and the nerve to obturator internus is distinct from the obturator nerve. Pectineus and gemellar variation are disclosed. Tibial-division thigh branches are not conflated with distal tibial branches or automatically expanded into plantar targets.

These are **typical teaching relationships**, not demonstrated nerve findings in the donor. No nerve mesh, root map, sensory field, tract, patient scan, motor-entry point or lesion simulation has been added. Absence from a regional list does not mean absence of innervation; only available pinned muscles are offered. The 1,022-entry body atlas and 67 independent source surfaces are unchanged.

Relationships are authored explicitly in `content/um-limb-motor.ts`, attached to muscle lessons, and bound to exact surface records and bundle hashes through the existing teaching pins. A changed or foreign surface receives no inferred replacement. No string matching of motor-supply prose is used. `lib/um-limb-motor.ts` creates the available regional groups and their muscle-plus-bone selections. One guarded `show-only` reducer action updates visibility/selection; Undo restores the previous tissue state. Study changes return separation to zero and disable close-up clipping. Existing custom-dissection links remain structure-only; they do not falsely serialize a nerve study as a named source recipe.

## References and rights

The brief, original relationships reuse the source-bound attachment/motor-supply lessons and their existing citations. Checks on 11 September 2026 included [Texas Tech Health El Paso's lower-limb anatomy table](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html), [femoral-muscle teaching](https://www.ncbi.nlm.nih.gov/books/NBK500008/) and [foot-muscle teaching](https://www.ncbi.nlm.nih.gov/books/NBK539705/). The [primary deep-hip innervation study](https://pubmed.ncbi.nlm.nih.gov/11331970/) supports the gemellar variation caution. Anatomical names and factual relationships are used, not a reproduced table, figure, article or question bank. Reference copyright stays with its owners; citation does not confer model rights or endorsement. No dependency, font, texture, external runtime request or paid service is added.

## Validation still needed

- Specialist adjudication of every mapping, exceptions and scope; no clinical approval is implied by automated checks.
- Browser, touch, keyboard, screen-reader and GPU acceptance. Source-level/React markup checks are not substitutes.
- Individual territory segmentation and genuine licensed peripheral-nerve geometry before spatial nerve teaching.
- Independently approved imaging manifests, registration and lecture entitlements before any scan/paid-resource linkage.

Run `node scripts/pin-um-limb-teaching.mjs --check` and `node scripts/validate-um-limb-motor.mjs` for binding, group, source-scope, malformed-selection and atomic Undo/Redo checks. Existing learning, clinical, navigation and knee regression suites remain applicable.
