# Extensor-mechanism guided MRI inspection

14 October 2026. Private website teaching draft, not clinical or release approval.
Atlas source remains `5d34da55a8cab5a9a0751ac0afa56437bee79cb9`; protected Review
remains `a783b17a488d8b33568e7dc0af4379af293dbe1023c30d86e4d5c9225679e4d8`.

## Open and review

With the existing authorized account, open
`/workspace/atlas-review/regional-mri`, choose a sequence, expand
**Guided learning · this sequence**, then choose **Extensor mechanism**.
Draft teaching revision: `knee-extensor-guided-inspection-20261014-v1`.

The fixed sequence is quadriceps tendon → patella → patellar tendon. Only the
exact loader-owned, accepted-scoped annotation with geometry from the current
sequence is selectable. Multiple variants require an explicit choice. Missing,
provisional, deferred or geometry-free steps remain unavailable; neither an
accepted patellar facet nor a whole-patella annotation in another sequence can
substitute for the current whole patella.

At implementation, the local source has accepted-scoped tendon candidates but
its whole-patella candidate is provisional. This path does not promote it. The
middle step therefore stays unavailable while the tendon steps can be inspected.
Native focus follows verified geometry in the selected plane. Existing source,
sequence, step, cancellation and unsaved-correction guards remain unchanged.

The quadriceps tendon may offer the existing independent right-source specimen
as a semantic reference. Opposite-side comparisons stay unmirrored. There is no
current patellar-tendon 3D mapping: native inspection remains possible without
inventing one or retaining the preceding quadriceps target. The existing body
patella reference is usable only when a separately accepted whole-patella source
actually exists in the selected sequence. Its positive integration test uses
synthetic data and does not alter real source status. Reference selection is not
scan matching, completed camera motion or patient-space registration. MRI
identifiers, coordinates and source geometry are not sent to the public model.

## Teaching and rights

Original short captions cite primary anatomical studies:

- Waligora et al., *Clinical anatomy of the quadriceps femoris and extensor
  apparatus of the knee* (2009), DOI10.1007/s11999-009-1052-y:
  https://pubmed.ncbi.nlm.nih.gov/19690926/
- Andrikoula et al., *The extensor mechanism of the knee joint: an anatomical
  study* (2006), DOI10.1007/s00167-005-0680-3:
  https://pubmed.ncbi.nlm.nih.gov/16283173/

The main agent inspected the indexed primary abstracts. The first supports
variable quadriceps-tendon layering; the second describes patellar-tendon
attachments. Neither proves layers, attachments, complete extent, normality or
diagnosis in this acquisition. A bone mask does not establish cartilage,
retinacular coverage, tracking or patellar height. No measurements, diagnostic
thresholds, publisher figures/text, scans, models, datasets, fonts, dependencies
or fees were added. Existing commercial asset licenses/notices are unchanged.

## Verification and acceptance boundary

The six original ligament/meniscal steps keep exact captions, citations and
revision identities (metadata SHA256
`526a7999ca808f38b95f810ba928815f6e324958bbb1309a82f1b8a786cd72d8`).
Four guide tests cover slots, exact candidates, ownership and refusal; four
actual-loader/canonical-catalogue integration tests cover preserved metadata,
provisional patella, explicit tendon variants, native-plane focusing, unmapped
3D targets and accepted synthetic whole-patella semantics. Existing lifecycle,
privacy, corrections, geometry and mapping regressions are checked separately.
The preceding meniscal test changes only its guide-count and explicit historical
ligament filter; its original assertions remain intact.

The current milestone's exact check results, privacy/anonymous HTTP tests and
source-only recovery readback are recorded after verification at:
`F:/VisibleMedicine/recovery/checkpoints/20261014-extensor-guided/checkpoint.json`.
A path in this document is not proof of a completed checkpoint; inspect its
terminal result. No new guide approval is saved or counted in the persisted
inbox. The radiologist's review should cover exact source/teaching revisions,
captions, real candidate status/extent, variant choice, native focus and the
side/frame/missing-mapping limits. Signed-in browser/GPU and clinical acceptance
remain separate. Broader UI redesign is proposal-only. No public deployment or
new website/private-data/off-device backup is claimed.
