# Genicular imaging orientation

Five existing bilateral arterial groups now have eighteen introductory draft
placements: ten CT, two MRI and six Ultrasound. Nine branch/modality combinations
share three study introductions. No new model, image, interaction or dependency.
Use Knee & leg, Hip & thigh or Whole body, select a genicular artery and open
the existing Imaging panel. The genicular dissection study remains unchanged.

| Existing source pair | CT | MRI | Ultrasound |
| --- | --- | --- | --- |
| Middle FMA22562/22563 | CBCT scope and resolution | Pending | Pending |
| Superior medial FMA22586/22587 | Origin variation | Pending | Limited localisation evidence |
| Superior lateral FMA22588/22589 | Shared-origin distinction | Pending | Limited localisation evidence |
| Inferior medial FMA43890/43891 | Inferior origins | MRI landmarks | Limited localisation evidence |
| Inferior lateral FMA43892/43893 | Branch distinction | Pending | Pending |

X-ray remains pending. Missing sections are not populated by transferring evidence
from a neighbouring artery. All 9,909 other topic placements, shoulder content,
source identities and dissection recipes are preserved. Middle-genicular sources
retain their disconnected pieces; no invented bridge, lumen or origin variant.

## Primary references and scope

- [Callese TE et al. (2023)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10156764/),
  *Classification of Genicular Artery Anatomic Variants Using Intraoperative
  Cone-Beam Computed Tomography*, doi:10.1007/s00270-023-03411-3.
  CT teaching uses the observed branching patterns and modality limitations.
  Technically adequate intraprocedural CBCT in a selected osteoarthritis cohort
  does not establish routine CT visibility, general population prevalence or this
  model's branching variant. Article CC BY 4.0; no media or article text imported.
- [Sinno E et al. (2020)](https://doi.org/10.1186/s40634-020-00288-w),
  *Magnetic resonance imaging landmarks for preoperative localization of inferior
  medial genicular artery: a proof of concept analysis*.
  MRI teaching is restricted to the inferior medial branch and the study's
  non-contrast T2 fat-suppressed landmark method. Selected patients, no universal
  safe distances and no mesh validation. Article CC BY 4.0; no media imported.
- [Han KH et al. (2019)](https://doi.org/10.17085/apm.2019.14.1.67),
  *Localization of the genicular arteries under ultrasound guidance*.
  Supports limited observations for three branches, not a verified complete
  Doppler map. Arterial identity was assigned from expected course/appearance;
  no independent angiographic/dissection confirmation. No nerve identity or
  procedural target is inferred. Publisher article is **CC BY-NC 4.0** and is
  **not included or licensed as a product asset**. Only an external citation and
  newly written brief factual observations are provided; no abstract, figure,
  table, scan, diagram, PDF or passage is copied or adapted into the product.

No external reference grants access to a paid lecture or authorises patient-data
release. Original code/notes retain project MIT terms. Existing model credits
remain BodyParts3D, © The Database Center for Life Science, CC BY 4.0. No paid
service, font, texture or fee-bearing dependency is introduced.

## Source, history and clinical gates

`content/genicular-imaging-pins.json` pins all ten complete source identities,
the original bundle and saved parent revision. Runtime dispatch fails closed on
any identity change. The exact eighteen-topic transition is reconstructed only
by offline editorial-history helpers; previous pins/hashes are not rebased.
The focused validator compares independently compiled saved-parent application
output, every unchanged topic, source mutations, content contracts and private
review material. Unique shared fragments are counted once per reference when
checking the conservative 200-word factual-summary budget.

Run `npm run genicular-imaging:test`. The preceding abdominal connective suite
normalises this exact new transition before checking its unchanged baseline.
Review records are not migrated or approved. Radiologist sign-off must assess
source identity/course, modality-specific visibility, study limitations and
clinical wording against the current source/content/renderer revisions.
No acquired imaging, patient registration, physical-device or clinical acceptance
is implied by source tests. Actual build/browser/recovery outcomes are recorded
in the coordinating task checkpoint; website release gates remain separate.
