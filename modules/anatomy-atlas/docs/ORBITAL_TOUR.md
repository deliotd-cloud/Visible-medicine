# Right orbital muscle tour

Draft `right-orbital-muscle-orientation-v1` supplies six stops: right medial,
lateral, superior and inferior recti, then superior and inferior obliques. All
six exact current muscle records exist in `head-neck-muscles`; none was inferred
or omitted. The separately identified right eyeball is the sole context member.
Each close-up frames its selected muscle together with that globe, using existing
left/right/superior/inferior camera directions and fading other surfaces.

The globe requires `eye-corrected-parent`, the existing source-bound display
correction that suppresses disconnected opposite-side triangles. Its archived
compound record in `head-neck-organs-recovery` is not a substitute. The six muscle
records remain identical to the archived source; retained globe surfaces preserve
their coordinates. No asset, geometry, source hash, imaging lesson, entitlement
or clinical decision is added or changed. The existing player can resolve the
existing structure-specific modality notes; this module adds no imaging data.

Original short captions draw on the muscle rows of the primary
[Texas Tech Eye anatomy table](https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html),
checked on 28 September 2026. The table supports the stated usual actions and
CN III/IV/VI supply, including the conceptual superior-oblique trochlear route.
No reference media or prose is copied. Captions are capped at180words, and the
combined tour title, description, stop titles and captions at190words.

This is a static reference, not a complete orbit or verified tendon/pulley/nerve
map. The trochlea is described, not rendered. Gaze, forces, diagnosis, acquired
imaging and patient registration are not modeled. Anatomical and clinical review
remain pending; sign-off must bind the actual revision and scope.

`node scripts/test-orbital-tour.mjs` checks the seven exact identities against
baseline `d3d3a750`, the existing globe correction, both model byte hashes, local
finite frames and invalid identity/bundle/region/frame cases. It also rejects
source/geometry/laterality/review mutations through explicit source-pin comparison
and exercises the existing globe display pipeline's mutation refusal. The shared
resolver checks availability and bundle identity; full revision-bound review
binding remains the existing review layer's responsibility. No test implies
browser/GPU acceptance, publication or clinical approval.

## Acceptance, 28 September 2026

Source checks pass: six exact targets plus corrected globe, unchanged model bytes,
13-tour library, 28 player checks, 95 tour-bound review records, 296 step/modality
bindings and the full 33,460-check content contract. The twelve preceding tour
definitions are unchanged. Review rejects 42 new orbital mutations in addition
to the existing 271 invalid packets. TypeScript and the regional production build
pass; renderer revision is regenerated from the current source.

Actual local browser sampling at 375 x 812 traversed all six stops. Selected
muscle labels, compact controls and source-position context were displayed with
one canvas and no horizontal overflow. Superior/inferior-oblique screenshots
were visually inspected. Opening step explanation paused playback; the final
step's CT and MRI notes resolved to inferior oblique. Finish returned to Explore;
switching between larynx and orbit required explicit Start again. Entering via the
actual Guided learning control and exiting restored keyboard focus to that
control. An earlier script-only click bypassed focus and was not a product defect.

This is desktop-browser mobile emulation, not physical-device or anatomical
certification. Teaching remains draft. Website import, publication and radiologist
approval are separate gates; no patient imaging was loaded or uploaded.
