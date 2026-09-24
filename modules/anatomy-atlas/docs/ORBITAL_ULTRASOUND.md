# Orbital muscle ultrasound orientation — draft

## Saved work in progress — owner pause, 25 September

Focused orbital checks pass: 14 changed topics, 9,922 unchanged topics,
14 actual note renders and 238 identity rejections. TypeScript and the
pulmonary-vein regression checks pass. Original orbital pin verification passes.
The older `validate-orbital-neck-muscle-imaging.mjs` stops at its preceding
teaching/recipe hash: actual
`81846b46d6b41e6d6adbcf5444fe73a5ba842a1609a771330b1763f630a61f3f`,
expected `af1eb1c86e04e349807d15211b23d177d694abc2268d1d09e94a443ee63fff10`.
The cause is not yet isolated; do not rewrite its expected baseline to pass.
On resume, compare with exact pre-change source, then correct replay if needed.
Lint, production build and browser verification of this addition are pending.
Nothing from this batch has been deployed; this is a recovery checkpoint,
not a completed or clinically approved teaching release.

Fourteen existing source-bound selections (seven left/right muscle pairs) gain
Ultrasound notes in the existing Imaging panel. No new model, image, scan,
dependency, paid service or navigation surface is introduced. Exact source
identity, laterality and existing anatomical attachment notes are retained.

## References and limits

- Chandra et al., 2014, [Echographic study of extraocular muscle thickness in
  normal Indian population](https://pmc.ncbi.nlm.nih.gov/articles/PMC4250497/),
  DOI 10.1016/j.sjopt.2014.05.003. The study supports orientation of rectus
  profiles and the distinction between levator and the superior muscle complex.
  Its technique and sample do not supply atlas measurement thresholds.
- Wan et al., 1988, [Orbital myositis involving the oblique muscles: an
  echographic study](https://pubmed.ncbi.nlm.nih.gov/3062525/),
  DOI 10.1016/S0161-6420(88)32987-8. Only the indexed abstract was reviewed.
  Its seven pathological cases support the possibility of echographic depiction
  of obliques, not dependable visibility or a normal-appearance reference.

The lessons are original short orientation prose, not reproductions of article
figures, tables, protocols or diagnostic criteria. Reading links do not license
the publications for redistribution. No publisher image is incorporated.
Existing credited BodyParts3D surfaces retain their existing licence obligations.

An orbital-specific shared note replaces the generic neck ultrasound guidance
for these selections only. It contains no probe pressure, placement, frequency,
gaze manoeuvre, procedure or measurement instructions. Recti, levator and
obliques must not be treated as equally resolved on every patient examination.
The assembled atlas is not a registered scan, reflectivity map, measurement
standard or proof of normal function. Dedicated ophthalmic acquisition safety
requires an appropriate clinical protocol outside this orientation module.

## Verification and review

Baseline: `8b73216dd8f4b4e8b40eb0ba77fe9dde1bca569f`.
`npm run orbital-ultrasound:test` checks all fourteen rendered notes, full
catalogue/preceding teaching preservation, source-identity rejection, export
records, draft status and reference-prose budgets. Old baseline pins are not
rewritten; offline history removes only this exact recorded transition before
checking older teaching. Geometry, CT/MRI topics and other regions are unchanged.

Owner radiologist sign-off is still required for terminology, muscle-specific
orientation, source applicability and representation boundaries. If real cases
are linked later, separately verify privacy, patient side, scan plane, matching
structure IDs and revision-bound approval. No patient registration or lecture
access entitlement is inferred from this teaching addition.
