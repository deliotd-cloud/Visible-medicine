# Elbow arterial CT orientation drafts

Fourteen exact catalogue identities (seven bilateral families) receive CT drafts;
the baseline is `98562916526b9530cd3e9c67cc9511fbb09bfbe9`. Other lessons and
source models must remain unchanged. These original orientation prompts reuse
the existing `content/elbow-arterial.ts` anatomical facts and distinguish arm
collaterals from forearm recurrent branches. Return separation to 0% when
comparing source positions; neither mesh junctions nor patient registration are
validated.

The compact CTA context credits [Habarta et al. (2022)](https://link.springer.com/article/10.1007/s11678-022-00686-9),
*Surgical management of a traumatic elbow dislocation with disruption of the
brachial artery*, under [Creative Commons Attribution 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
The compact context is adapted; adaptation does not imply author endorsement.
The case demonstrates acquired CTA detection of brachial disruption. It does
not validate visibility of every collateral/recurrent vessel, a diagnostic test
or the Atlas meshes. No figures or case details are imported. The
[upper limb anatomy table](https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html)
is a factual reference only; no media or text is copied. The shared source-derived
CTA summary is below 200 words; family prompts are original Atlas orientation.

CTA means acquired contrast-enhanced imaging, not mesh enhancement. Branch
identity is not patency, perfusion, a continuous lumen, diagnostic evidence or
procedural guidance. This CT reference supplies no ultrasound evidence. No
scans, identifiers, imported images or approval are included. Radiologist review
remains pending and bound to the revision; Atlas, case and lecture access remain
independent.

## Verification and clinical review

Run `node scripts/validate-elbow-arterial-ct.mjs` to check the exact recorded
transition. The pin and `--record` writers are one-time, exclusive-creation tools,
not commands to refresh an old baseline after arbitrary edits. The validator
checks all current whole-body topics, exact source identity, immutable models,
review packets, mutated identities and the actual teaching callback via SSR.

Radiologist sign-off remains required for each affected revision: confirm the
named parent and recurrent/collateral distinction, laterality, suitability of the
CT-orientation wording, and the limits of the cited case evidence. Confirm source
geometry separately; a teaching decision is not a model or patient-registration
approval. MRI, X-ray and ultrasound stay pending for these selections.

This is a local source change, not a website publication. Integration must use a
new generated module and corresponding revision-bound review material; do not
carry prior approval or lecture access across the update.

### Local evidence, 26 September

The recorded transition changes 14 CT topics and preserves 9,922 other topics,
all shoulder teaching, dissection recipes, catalogue identities and model bytes.
The focused suite passes 476 identity-mutation rejections and renders all 14
real teaching callbacks via React SSR, including citations and the no-study
disclosure. It also checks review packets, fresh response arrays, exact-parent
history reconstruction, idempotence, and rejection of mixed/unrecorded history.
This is not browser/GPU evidence or clinical approval. The body-renderer revision
is refreshed; no approval record is migrated.

Integration checks pass: original coronary/common-interosseous transition hashes
remain unchanged; the content contract passes 33,460 checks with 48 rejection
cases; 1,104 review selections match their 9,936 topic snapshots; TypeScript,
scoped Oxlint and the regional production build pass. The build output is on D
and retains the existing large-chunk warning. The history helper also recognizes
only the exact earlier elbow-clinical placeholder state, with 28 additional
mixed/foreign-copy rejections. No browser acceptance or publication is claimed.
