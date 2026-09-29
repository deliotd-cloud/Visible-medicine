# Lower-limb bone reasoning — 29 September 2026

Eight original draft concepts cover femur, patella, tibia, fibula, talus,
calcaneus, navicular and cuboid on sixteen existing bilateral ISA surfaces.
The bank now contains 166 concepts and 308 bindings; all prior 158 are unchanged.
No geometry, membership, anatomical ID, dependency or paid service is added.

Existing Apply anatomy and system switches give access. Four authored choices
stay within knee/leg or tarsal groups on the same side. Femoral membership remains
thigh/pelvis/leg; its question is available in leg and whole-body scopes, not
thigh/pelvis alone where curated bone alternatives are absent. Whole-body Bones
practice includes all thirteen upper/lower-limb concepts, without repeating the
contralateral version of a question.

Factual reference: [TTUHSC El Paso lower-limb bones](https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html),
checked 29 September 2026. The 163 words of questions/explanations are original
brief factual synthesis. No copyrighted tables, images, question-bank items or
extended prose copied. A reference link is not a licence for source media.

Whole-bone surfaces are not separately segmented landmarks, tendon or nerve
models, joint-motion simulations or fracture cases. The fibular question makes
the absent nerve explicit. This is anatomy teaching, not patient-specific advice.
The radiologist must review exact wording, depicted landmarks, side/region
correspondence, answer alternatives and the teaching revision before sign-off.

Focused checks live in `scripts/test-lower-limb-bone-reasoning.mjs`; browser
acceptance is separately recorded in
`docs/lower-limb-bone-reasoning-browser-validation.json`. No test or source
reference establishes clinical approval, imaging registration or publication.

## Historical pause checkpoint

Paused at the owner's request before browser acceptance and website integration.
Source verification passed: 2690 focused assertions (294 negative mutations,
32 playable scopes),19833 general reasoning checks, upper-limb/upper-arm/vessel
regressions,308 review packets, TypeScript, requirements inventory and both
contained module builds. The new browser script is authored but **not run**;
the browser validation JSON referenced above does not exist yet.

Do not treat the lower-limb drafts as website-delivered or clinically approved.
Resume with real leg/foot/whole-body browser acceptance, then the guarded learner
and Clinical Review import. The website remains at the preceding verified
upper-limb-bone revision. No scan or model changes; source references and tests
are saved for continuation.

## Resumed browser acceptance

Owner resumed on 29 September. Real generated-viewer acceptance now passes
leg desktop (4 questions), foot phone (4) and whole body at 320x480 with 200% text
(13 upper/lower bone concepts). Deliberate misses and retries2/2,2/2,7/7 pass;
same-side choices, source references, draft disclosure and no horizontal overflow
are verified. Updated upper-bone regression also passes3/3/13 questions across
three viewports. No page errors in either suite. Lower-limb evidence retains one
aborted spine-skeleton request in the whole-body case; no bone-question or
assertion failure. Upper-bone regression recorded no resource failures.

Current evidence now exists at the browser validation path above. This proves
source-viewer acceptance only; website import and its acceptance are recorded
separately in the website/parent checkpoint. No clinical approval is implied.
