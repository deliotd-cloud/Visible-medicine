# Cerebellar clinical correlations — draft

11 October 2026. Local, unpublished teaching; no radiologist approval recorded.

## Where to inspect

In native CT head or MRI head, select Left cerebellar hemisphere, Right cerebellar
hemisphere or Cerebellar vermis. Open **Learn this anatomy → Clinical correlation**.
The existing compact disclosure contains the clinical note, modality-specific
pitfall, unscored reflection with a revealable explanation, and primary references.
No new permanent toolbar or top-level navigation is added.

Authorized administrators can inspect **Clinical Review → Head learning →
Cerebellar clinical correlations** at `/workspace/atlas-review/head-learning`.
The separate evidence packet includes native CT/MRI IDs, exact scan links, MRI
vermis partial-coverage status and a review checklist. Open **Private corrections
& saved history** inside it, or use the Teaching structure picker and choose
**Cerebellar clinical corrections · Private notes → Open summary**.

Saved notes belong only to the signed-in account and institution. Choose Draft
notes or Corrections requested, enter the scope and correction, then save. Each
save appends a version rather than overwriting history. Corrections requested
require at least ten characters. Checklist ticks and saves do not approve or
publish the teaching or change masks; previous anatomy, comparison, brainstem,
ventricular and guided-sequence reviews do not approve this clinical packet.

Use **Download working copy** before leaving with unfinished notes. The private
JSON preserves edits and their source identity but does not confirm a server
save. History refresh never discards open edits or silently rebases them. After
an uncertain save or competing edit, compare history and explicitly load a
current entry or start fresh. An account, institution or source change requires
reloading the page; historical packet versions cannot be resumed as current.
Do not enter patient data. Self-reported qualifications are not credentials.

## Exact scope

- Clinical packet: `49f55fc8ff432818ebc3b2fbe6e17891ec7dd25d5092d1699870fde06f02631d`.
- Head manifest: `0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5`.
- Image-only comparison: `53fb7d5fd236b6b1ef27466a9f4a9ffbae89702015ea0971bd0781cc4a1071d0`.
- Three concepts, six native placements. No new masks, accepted boundary edits,
  geometry, study upload or fabricated exact 3D part.
- CT/MRI are different subjects, not registered image volumes. The existing
  whole-cerebellum 3D reference is not silently substituted for a hemisphere/vermis.
- Existing cerebellar anatomy, guided learning, brainstem, ventricular and shared
  teaching packet bytes/revisions are preserved.

`lib/head-cerebellar-clinical.ts` holds original notes, source limitations and
bindings. Server verification requires the exact image-only comparison packet and
the SHA-256 of the independent clinical packet. Learner resolution rejects stale
head/comparison revisions, unsupported modalities, unmapped concepts and invented
3D targets. Review withholds the packet when its verified identity is unavailable.
The existing authorization gate runs before verification or rendering. The new
module and component are included in the generated Review integration binding.

The protected `/api/atlas-review/head-cerebellar-clinical` endpoint reuses the
existing account/institution and same-origin guards, bounded JSON parsing and
append-only table. A dedicated storage identity isolates these notes from other
teaching histories. Saves require the current clinical/head/checklist revisions
and expected history version; an atomic compare-and-insert accepts only one
competing save. No database migration, new service or permission change is needed.
The clinical revision also binds the existing image-only comparison; no exact
3D destination is added or substituted. The full correction path is included in
the Review build binding. Existing clinical content and packet bytes are unchanged.

The binding/session pattern follows the current
[Cloudflare D1 API](https://developers.cloudflare.com/d1/worker-api/d1-database/)
and [prepared statement methods](https://developers.cloudflare.com/d1/worker-api/prepared-statements/).
This local implementation is not a hosted release or a clinical sign-off event.

## Evidence and clinical review

Sources accessed 11 October 2026. Original factual paraphrases only:

- [Stoodley et al. (2016)](https://pubmed.ncbi.nlm.nih.gov/27812503/): lesion-site
  and task-dependent outcomes in 18 isolated cerebellar strokes, not a fixed
  whole-hemisphere functional map.
- [Ilg et al. (2008)](https://pubmed.ncbi.nlm.nih.gov/18835866/): balance and
  leg-placement correlations in 12 chronic postoperative focal lesions, not a
  vermis-only stroke cohort or segmentation of the deep nuclei.
- [Hwang et al. (2012)](https://pubmed.ncbi.nlm.nih.gov/22305149/): CT limitations
  in a selected MRI-positive acute posterior fossa cohort, not universal accuracy.
- [Oppenheim et al. (2000)](https://pubmed.ncbi.nlm.nih.gov/11003275/): early DWI
  false negatives in a historical stroke series; mainly brainstem among missed
  vertebrobasilar lesions, not cerebellar-specific or current-protocol performance.

Owner review must confirm wording, factual accuracy, cohort limits, native
laterality, partial coverage and absence of patient-specific diagnostic claims.
Structural MRI is not assumed to be DWI. No functional territories or deep nuclei
are claimed to be outlined. These notes do not constitute clinical advice,
registration validation, model approval or permission for publication.

No source prose, figures, models, scans, datasets, fonts or textures were imported;
no dependency, paid API or new fee was introduced. Bibliographic access does not
grant redistribution rights to publisher material. See `LICENSES/THIRD_PARTY_NOTICES.md`.
