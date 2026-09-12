# Cardiac circulation walkthrough

Open **Heart → Explore heart chambers → Follow circulation**. A single optional button beside the existing Study view control starts six manually advanced steps. There is no autoplay, persistent toolbar, new route or extra default model download. Exit keeps the current view available for inspection; Finish and Reassemble return to all four cavities.

| Step | Existing preset | Selected cavities | Optional vessel context |
| --- | --- | --- | --- |
| Systemic return | right-atrial-inflow | Right atrium | Superior vena cava |
| Right atrium to right ventricle | right | Right atrium and right ventricle | None |
| Out towards the lungs | pulmonary-outflow | Right ventricle | Right and left pulmonary arteries |
| Return from the lungs | left-atrial-inflow | Left atrium | Four source-labelled pulmonary vein groups |
| Left atrium to left ventricle | left | Left atrium and left ventricle | None |
| Out towards the body | aortic-outflow | Left ventricle | Ascending aorta |

## Interaction and source boundaries

Each step selects its receiving/reference cavity, applies the existing preset, resets separation/cutaway/fade and requests the chosen camera frame. Both cavities remain independently selectable in the atrioventricular comparisons. Previous/Next restore the step's original view after exploratory changes. Manual layer toggles, selecting a different chamber outside the current step, other presets and layer Undo exit the walkthrough; Redo does not restart it. Existing vessel context toggles and Retry remain usable. Separation hides context as before and is explicitly labelled non-anatomical; advancing reassembles the view. Existing context colour keys remain visible, with duplicate guide prose suppressed while the walkthrough is open.

The resolver uses the existing exact parent/source relationship gate and requires all six steps to resolve uniquely. A failed step disables the sequence rather than silently skipping to a new connection. Four selectable chamber cavities and eight already-audited vessel landmarks are reused. The four chamber–vessel definitions, source files, GLBs, catalogue, coordinates, nested identities, imaging teaching and existing lecture/resource entitlements are unchanged. It does not add unique anatomy or mark any pending imaging topic authored.

This is a sequence for teaching a route, **not the timing of a heartbeat**: the two sides work together. There are no animated blood particles, fabricated connecting tubes, pressures, oxygen measurements, disease states or patient registration. Tricuspid/mitral/pulmonary/aortic valves, individual ostia, the separately delineated pulmonary trunk and capillary exchange are not supplied. The transition from pulmonary arterial outflow to venous return explicitly identifies the unshown lung interval. The source cavities are not myocardial walls, quantitative blood pools or a specific cardiac phase. Source colours do not encode measured oxygenation or scan signal.

## References and rights

Short original factual summaries checked 12 September 2026:

- [NHLBI: How blood flows through the heart](https://www.nhlbi.nih.gov/health/heart/blood-flow) supports systemic return, pulmonary arterial/venous flow and aortic outflow.
- [NCI SEER: Structure of the heart](https://training.seer.cancer.gov/anatomy/cardiovascular/heart/structure.html) supports chamber pairs, valve relationships and simultaneous right/left pump operation.

No source illustrations, article passages, videos or scans are copied. In particular, NHLBI's embedded Nucleus animations carry separate copyright and are not imported. Existing BodyParts3D CC BY 4.0 credits, licence and modification notices remain. No dependency, font, texture, model purchase or external paid service is added.

## Verification and remaining acceptance

`node scripts/validate-cardiac-context.mjs` retains the existing source triangle/bounds/membership and four-preset regression tests, and additionally exercises the real workbench callbacks for all six steps, both chamber pairs, Previous/Next, Finish/Exit, manual exploration, cutaway/separation reset and source rejection. Actual React static markup is checked. The GPU component alone is replaced in this harness: these checks are **not** browser/GPU, touchscreen, keyboard-focus or clinical acceptance. No personal review records are read or fabricated.

Radiologist review must still assess the factual copy, FMA/source identity and extent, chamber/vessel positions, camera usefulness and apparent surface gaps. Explicit device testing is still needed for picking, transparency, screen labels, focus transitions and compact controls at 200% text enlargement. Future CT/MRI/US correspondence needs licensed scans and independently validated registration; this walkthrough neither supplies nor unlocks imaging or paid lectures.

Milestone checks: cardiac-context validation passed 534 assertions; shared nested layer history passed 173,219 assertions across 11 study families/14 parent views; TypeScript and production build passed. The older pulmonary-context validator stops at its historical 46-binding assertion because that unchanged input already contains 48 relevant bindings in baseline `73e9c78faaefa41ae938271ee40e75d41946119b`. Its test and teaching-binding file are unchanged by this milestone. This is not a whole-suite pass; that historical-scope regression remains to be repaired without weakening its original checksum.
