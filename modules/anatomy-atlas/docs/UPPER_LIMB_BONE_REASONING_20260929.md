# Upper-limb bone reasoning — 29 September 2026

Five original draft concepts cover the clavicle, scapula, humerus, radius and
ulna on ten existing bilateral ISA surfaces. No anatomy geometry is added or
altered. The bank now contains 158 concepts and 292 source bindings; the previous
153 concepts are unchanged.

The existing Apply anatomy option serves these questions without new navigation.
Shoulder/arm and forearm each offer three same-side bone choices; whole-body
scope offers five. The humerus retains both regional memberships. Hidden,
unloaded, wrong-side or source-mismatched surfaces are not admitted as answers.
Legacy right-shoulder anatomical IDs remain unchanged.

## Reference and limits

Factual reference checked: [TTUHSC El Paso upper-limb bones](https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html).
Questions and explanations are original short factual synthesis (119 words),
not copied tables, diagrams or question-bank material. The reference is
copyrighted; linking it does not grant image or table reuse rights. No new
asset, font, dependency, service or mandatory fee is introduced.

Teaching covers the clavicular connection, glenoid socket, humeral radial groove,
radius/ulna relationship during pronation, and olecranon/triceps attachment.
Whole-bone meshes do not establish a separately selectable landmark, depict the
radial nerve, simulate joint motion, or demonstrate patient-specific pathology.

All five concepts remain revision-1 drafts. The radiologist must review factual
wording, depicted landmarks, side/region mapping, answer alternatives and teaching
suitability before approving the actual revision. Source identity, automated
tests and references do not establish clinical validation or release clearance.

## Evidence

`scripts/test-upper-limb-bone-reasoning.mjs` checks source pins against the official
ISA index, preserves the historical bank, rejects identity mutations, tests
regional/whole-body choices and scoring/retry, and renders draft/reference gates.
Browser acceptance is recorded separately; this document is not a claim of
publication, imaging registration or clinical approval.

Completed source checks: 1,769 focused assertions with 186 negative source
mutations and 22 regional/whole-body targets; 19,079 general reasoning checks;
upper-arm and thoracic-vessel regressions; review packets for all 292 eligible
representations; TypeScript, requirements inventory and both module builds.
Real generated-viewer sessions pass shoulder desktop (3 questions), forearm phone
(3) and whole body at 320×480 with 200% text (5). Deliberate misses and all retries
score correctly, with source references, draft status, same-side choices and no
horizontal overflow or page/resource errors. The existing 20-question muscle
regression passes all three viewports after ordinary Bones filtering.
Evidence: `docs/upper-limb-bone-reasoning-browser-validation.json`. Its retained
initial harness failure concerned an intentionally disabled zero-entry system
switch; the corrected harness records that state rather than forcing it on/off.
