# CT explorer reference: evidence and implementation notes

Inspected 12 September 2026. Design input for the existing atlas goal, not a new dataset admission, runtime feature or clinical approval.

Owner update later on 12 September: the user has their own dataset, states it is anonymized and approved for use, and supplied its local location. Private read-only header inventory is complete; CT volume candidates were identified, no masks were found, and de-identification verification remains pending. No pixels were decoded or uploaded, and raw case metadata/manifests remain outside the site checkout. Prioritize this dataset for the first private pilot. Do not request another public dataset unnecessarily, assume all modalities belong to the same subject, infer this is the separately held CT-head material, or treat the intake as publication clearance.

## What was actually observed

Reference: [hinumpy's CT explorer reel](https://www.instagram.com/reel/DdKVCiihYlk/). The public browser page and several playback frames were inspected. Text-only retrieval was throttled; browser playback was accessible after dismissing optional cookies and the sign-up overlay. No account login, comment, message or request for the creator's guide was submitted. Some screenshot captures timed out; this was a sampled inspection, not a frame-by-frame recording or audit of the running application.

- The caption attributes the build to one GPT-6 Astra prompt and describes selecting an organ across views. Video subtitles claim a 30-minute run.
- A dark four-pane workspace shows a 3D view alongside axial, coronal and sagittal CT views. A right-kidney selection, coloured highlighting, crosshairs, orientation markers and slice sliders are visible.
- A narrow structure list and a footer crediting the TotalSegmentator dataset are visible. The exact dataset release, subject and file hashes cannot be established from the reel.
- Build footage shows a Python data-preparation workflow. Another subtitle says an error required an approval before work continued. This is compatible with one initial task prompt; it is not evidence of one model response or a completely unattended run.

## Assessment of the time claim

**Plausible for a bounded prototype; not independently verified.** Existing image volumes and segmentation masks can supply the anatomical content while an agent builds a viewer and conversion pipeline. That is materially different from generating all anatomy, collecting scans and validating the resulting atlas from scratch. The footer suggests existing data, but the actual input inventory and preparation time remain unknown.

[Official Astra documentation](https://developers.openai.com/api/docs/models/gpt-6-astra) describes coding and multistep tool capabilities. It does not authenticate this creator's model usage, timing, initial workspace, number of prompts, edits or testing. A reproducible timing claim would require the exact initial prompt, starting files, dataset/dependency versions, complete timestamped run including approvals/retries, and the resulting runnable source. A promotional reel alone neither proves nor disproves it.

Clinical and commercial readiness remain separate questions. Visual plausibility is not evidence of orientation, correspondence, segmentation accuracy, privacy clearance, device support or asset rights. These requirements also should not be used to dismiss useful rapid-prototyping techniques: deliver small visible slices of functionality and validate them in parallel.

## Ideas to apply to Visible Medicine

1. **One selection across views.** Use a stable organ ID and consistent selection colour in 3D, image overlays and the inspector. Preserve explicit component/aggregate and side mappings; show unavailable when no mapping exists.
2. **Optional compact MPR.** Keep the model-first default and offer a deliberate four-pane comparison. On mobile, switch between anatomy and a single image plane rather than shrinking four panes or adding long vertical stacks. Keep window/level and opacity in a disclosure.
3. **Same-study reconstruction pilot.** Build one useful, rights-cleared organ/region example from a volume and its own reviewed masks. Keep the scan-derived model distinct from the generic reference atlas. Do not stretch the generic body into apparent alignment.
4. **Reproducible offline preparation.** Retain input hashes, segmentation IDs, image affine/units, conversion settings and output hashes. Reuse validated preprocessing rather than require paid runtime AI or repeated segmentation for learners.
5. **Fast, visible acceptance milestones.** Demonstrate a selected organ in all views, correct orientation, accurate slice navigation, reversible return from dissection, and clear missing/access-denied states before adding more controls. Confirm the actual deployed revision when asking for review.

The existing [comparison shell](IMAGING_COMPARISON.md) and [decoded-volume reslicer](VOLUME_VIEWER.md) provide foundations, not a connected patient-data product. Outstanding work is the approved real-volume/segmentation adapter, reviewed source-ID crosswalk, overlays and same-study spatial controls, then optional simultaneous MPR and browser/device review. Do not rebuild those foundations or claim the reel's integration already exists in our atlas.

The provisional Visible Medicine CT/MRI head atlas remains separately owned and NOT_FOR_PUBLICATION according to the last inspected checkpoint. This reference does not authorize transferring its pixels or approvals. Atlas, imaging and paid lecture entitlements remain independent. Exploded display positions must not drive patient-space crosshairs; restore assembled geometry for spatial comparison and preserve the dissection state for return.

## Dataset lead, not reuse clearance

The [TotalSegmentator v2.0.1 dataset record](https://zenodo.org/records/10047292) describes CT images with supplied segmentations; this establishes an existing-data route, not which release the reel used. The extracted record did not expose usable licence text, so no dataset commercial-use conclusion is recorded here.

The [upstream toolkit README](https://github.com/wasserth/TotalSegmentator) distinguishes Apache-2.0 open tasks from separately licensed tasks with non-commercial free licences. Do not apply the code licence to all weights, scans or derived assets. Before any import, pin the exact dataset and task/weight versions, inspect their complete terms, confirm redistribution and privacy suitability, retain required notices and obtain scoped radiologist approval. No dataset, model weights, dependency, image, texture, reel or third-party code was downloaded into the product in this inspection.

This note supplements [the earlier two-reel direction](VIEWER_CT_REFERENCE_DIRECTION.md) and the audited-repository work; it does not replace the active source-preserving regional dissection milestone.
