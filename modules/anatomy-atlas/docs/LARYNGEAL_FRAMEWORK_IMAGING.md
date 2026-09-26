# Laryngeal framework imaging — draft extension

Eight previously pending placements, on four existing exact display identities:

| Structure | New topics | Source files |
| --- | --- | --- |
| Thyroid cartilage, FMA55099 | Ultrasound | FJ2808 |
| Cricoid cartilage, FMA9615 | Ultrasound | FJ2440, FJ2769 |
| Right arytenoid cartilage, FMA55113 | CT, MRI, ultrasound | FJ2792 |
| Left arytenoid cartilage, FMA55114 | CT, MRI, ultrasound | FJ2775 |

No new meshes, controls, scan data or procedural instructions. The original six
laryngeal CT/MRI lessons retain their exact recorded hashes. The new branch checks
the complete source identity and explicit topic allowlist; it does not bind by
name/FMA alone, infer a patient correspondence or transfer approval.

## References and permitted use

Original, short factual summaries with links only. No article text, images,
figures, tables, videos, segmentations or other assets are redistributed.
Article accessibility is not an image-reuse licence; in particular the ultrasound
paper's figures are not admitted as commercially licensed Atlas media.

- [Parmar et al., 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4126113/): primary prospective ultrasound study; supports landmarks and visibility limits. Selected healthy cohort, not universal patient visibility.
- [Prospective thyroidectomy ultrasound study, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11166737/): supports the cartilage-window limitation, not a promise of diagnostic accuracy.
- [Cérat et al., 1988](https://pubmed.ncbi.nlm.nih.gov/3385869/): CT/histology correlation; specimen evidence, not a clinical acquisition protocol.
- [High-resolution larynx MRI study, 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8349453/): fixed-specimen research, explicitly distinguished from routine clinical MRI.

The static model cannot establish movement, nerve function, a diagnosis, scan
registration or probe position. All lessons remain drafts for revision-bound
radiologist sign-off. Atlas, imaging-case and paid-lecture access stay independent.

## Verification and continuity

`node scripts/pin-laryngeal-framework-imaging.mjs --check` checks identities and
actual bundle bytes. `node scripts/validate-laryngeal-framework-imaging.mjs`
replays parent `4e47ebaad006d0b7a9472cfe8d958a40e4b85236` from Git, compares all
9,936 topic placements, verifies export/review records and executes the real
notes callback. Malformed identities must not receive the new teaching.

The new append-only transition records eight placements without changing earlier
pins/transitions. The offline history adapter rejects mixed/unrecorded states and
projects only these eight exact identities/topics. The oesophagus history chain
uses it before its existing snapshot; no runtime or approval migration occurs.

The apparent pancreas gap found during triage was not a product defect: archived
four-component pancreas records intentionally have pending imaging, while the
corrected three-component display identity already has four draft imaging topics.
Use `api.bodyDisplayCatalog(context.catalog)` for future displayed-content triage.

Automated checks do not prove clinical accuracy, GPU rendering, mobile acceptance,
publication or external backup. These require their own evidence.
