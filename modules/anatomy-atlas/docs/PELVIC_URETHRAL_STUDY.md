# Male pelvic urethral comparison

The existing Study windows & focuses library now includes “Male pelvis: urethra
& corpus spongiosum” in Pelvis and Whole body. This adds no permanent toolbar or
new mesh. It is a source-frame teaching comparison, not a segmented urinary lumen.

Two targets: urethra FMA19667 and corpus spongiosum FMA19617 (bulb/shaft only).
Context: bladder FMA15900, prostate FMA9600, right/left hip FMA16586/FMA16587.
Exact identities reuse the admitted corpus-spongiosum catalog and its context
records. Six structures appear for both sides; five for either unilateral view.
Four organ identities are required. Hip bones are optional in a side-filtered
scope, but any present contextual identity must match its complete source record.
Changed or duplicated IDs/FMA IDs, sources, geometry bounds or review metadata
disable the focus rather than substitute matching names. Upstream admission
continues to require the entire source context, coordinate frame and bundles.
The study library and guide derive targets from source-permitted recipe members,
so a missing or altered source cannot advertise an incomplete comparison.

Opening uses posterior framing and resets existing separation/visibility state.
Existing preview, select, isolate, remove/Undo, side filters and source-bound
links are reused. The selected structure's notes expose only its actual content:
urethral CT/MRI/US/X-ray drafts exist, while corpus-specific imaging remains
pending. This view does not load an imaging case or grant paid lecture access.

No new external asset, dependency, font, clinical dataset or anatomy assertion is
imported. Existing BodyParts3D attribution/licensing stays visible and unchanged.
No patient scans, masks, source geometry or clinical acceptance records changed.
Co-display does not establish lumen enclosure/continuity, patient registration,
pathology or a procedural approach. Glans and paired cavernous bodies are absent.
Radiologist approval must identify the actual content, sources and renderer.

Verification: `npm run pelvic-urethral-study:test` checks 6 side/region scopes,
32 focused and 32 ordinary links, source mutation rejection and an exact
two-focus historical transition. Old recipe/content digests are not rebaselined.
The offline history adapter never participates in runtime or approval migration.
See `docs/pelvic-urethral-study-validation.json`; main checkpoint separately
records browser checks, builds, review bindings, backups and deployment limits.
Local headless Chromium checks at 1440×960 and 390×844 verified rendering with
no page errors or mobile horizontal overflow; Remove/Undo, urethral imaging-note
access without a patient study, keyboard separation to 100%, menu search/preview,
and reopening with separation reset to 0% passed. This is not physical-device QA.
An unrelated model-first named-handler baseline gate still fails on inputs
identical to baseline 8ad450fc; its accepted fixture was not changed or waived.

The corpus model still needs authenticated hosted staging before website export.
A locally working comparison does not constitute hosted delivery or clinical
acceptance. The main website's generated modules must not be edited by hand.
