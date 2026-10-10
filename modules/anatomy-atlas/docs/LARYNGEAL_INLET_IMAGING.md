# Laryngeal inlet imaging orientation

Four retained source identities gain eight CT/MRI draft placements: right/left
corniculate FMA55115/FMA55116 and right/left cuneiform FMA55117/FMA55118.
Exact identities reuse `content/laryngeal-framework-quiz-pins.json`; no new
geometry, source pin, scan, contour, registration or approval is introduced.
Other topics and structures must remain unchanged from source `2d72005e`.

## Evidence and editorial limits

Checked 10 October 2026:

- [TTUHSC dissection teaching](https://anatomy.ttuhscep.edu/nervous_system/deepneck_ans.html)
  supports the two different anatomical relationships.
- [Al Qahtani et al., 2017](https://doi.org/10.1016/j.jasi.2017.05.004),
  Figure 8E and section 4.6, illustrates the CT landmarks. This is an educational
  study, not a cartilage detection-rate study or universal scan protocol.
- [Sakai et al., 1990](https://pubmed.ncbi.nlm.nih.gov/2298998/) supports MRI
  orientation to the surrounding folds, not guaranteed resolution of each tiny
  cartilage. The notes explicitly distinguish these claims.
- [Rubin et al., 1998](https://pubmed.ncbi.nlm.nih.gov/9799998/) and its
  [publisher results](https://www.sciencedirect.com/science/article/abs/pii/S0385814698000182)
  describe a combined MRI/CT cadaver reconstruction including corniculate units.
  This does not prove isolated MRI conspicuity or correspond to the Atlas mesh.

Only short original factual teaching and reading links are authored. No figures,
article wording, annotations, scans, models or tables are copied. Publisher and
institutional source rights are not relicensed. Existing code/teaching MIT and
BodyParts3D attribution remain; no dependency, service fee or new asset added.

## Verification and review

`npm run laryngeal-inlet-imaging:test` checks the eight-topic transition against
the exact prior source, unchanged unrelated teaching/Review/source identities,
fresh arrays, altered-identity refusal, stale/tampered Review rejection and
actual note rendering. Generate current renderer/display pins before running.
Run content, Review, source-hold, type and inventory checks against the same tree.

The owner must review anatomical relationships, clarity of MRI visibility limits
and clinical relevance at the exact teaching revision. Draft readiness is not
clinical sign-off, validated scan matching or a cleared image licence. Website
delivery requires normal generated-module integration; none is implied here.
