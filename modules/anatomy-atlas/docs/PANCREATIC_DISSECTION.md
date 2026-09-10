# Pancreatic duct dissection

## Using the study

Select Pancreas in the abdominal or whole-body atlas, then **Explore pancreatic ducts**. Alternatively search `pancreatic duct`, `FMA10419` or `FMA63103` from any region. Source-bound links open the correct study and selected part; Back to atlas preserves the local parent view and camera. Exam guards remain in place.

The existing side rail offers Both duct sources, Pancreatic duct and Duct-tree source presets. Individual visibility, labels, fade others, framing, six camera views, cutaway, layer undo/redo and the existing separation styles are shared with other dissections. Advanced controls and teaching stay collapsed. The single faint envelope starts on, is nonselectable and disappears during separation; reassembly restores it if enabled. Its visibility cannot shift the cutaway's source-space frame. A failed asset can be retried without resetting the study.

## Exact source scope

| Selection | Source index | Source file | Triangles |
| --- | --- | --- | ---: |
| Pancreatic duct, FMA10419 | PART-OF | FJ1896 | 3,368 |
| Pancreatic duct-tree source, FMA63103 | IS-A | FJ2630 | 4,432 |
| Pancreatic envelope reference, FMA7198 | IS-A | FJ1895 | 4,890 |

The PART-OF duct-tree group contains FJ1896 **and** FJ2630; the IS-A entry contains FJ2630 alone. Selecting these two files separately does not establish two complete independent trees, nor identify an accessory duct. Index provenance is explicit in each record. IS-A and PART-OF raw hashes differ because their OBJ headers differ: the exporter verifies vertices and faces against the retained parent files, rather than assuming filenames imply identical bytes.

This partitions the corrected parent into three surfaces without altering any retained triangle position or winding. The original parent archive is unchanged. FJ2629 remains excluded from display as a near-coincident alternative envelope, not a missing tissue layer to invent. No connectivity, lumen patency, papilla, flow or main/accessory branching variant is validated. Closed oriented source topology is a software property, not clinical certification.

## Architecture and linking

`lib/pancreatic.ts` requires the entire canonical corrected parent and current display-correction binding. The old four-source aggregate and mutated or foreign records fail closed. The two stable child IDs end in `pancreatic-duct-source` and `pancreatic-tree-source`; the reference ends in `pancreatic-context-source`. Source tree, raw hashes, bundle hash, parent ID, transform, bounds and anchors are retained in the sidecar. There are two new nested representations of anatomy already present in the root—not two additional unique whole-body structures.

The common nested registry, search, route parser and learning locator accept the new `pancreatic` study. Child and parent hashes must match. Context never becomes a learning destination. The production resource registry remains empty. Anatomy access does not grant access to CT/MRI/X-ray/US resources or separately paid lectures; no asset endpoint, entitlement, approval or spatial registration is created by this extension.

One explicitly authored concept supplies Anatomy, Function, Clinical, Pathology and unscored recall teaching for the two related source selections. Separate source notes explain their different index meanings. CT/MRI/US entries remain pending. The previous 63 teaching bindings and nine parents are byte-equivalent after projecting out the two new bindings and corrected pancreas parent; no existing lesson is rebound. Totals are 65 nested representations, 40 concepts, 74 references and ten unique parents, not comprehensive clinical coverage.

## Teaching evidence and rights

Primary pages read on 10 September 2026:

- [NCI SEER: Anatomy of the pancreas and duodenum](https://training.seer.cancer.gov/biliary/anatomy/) — duct/duodenum relationship, neighbouring organs and endocrine versus exocrine function. Cancer-registry boundaries are not adopted as mesh segmentation or diagnostic rules.
- [NIDDK: Definition and facts for pancreatitis](https://www.niddk.nih.gov/health-information/digestive-diseases/pancreatitis/definition-facts) — inflammation and possible duct narrowing, blockage and leakage. Its displayed review date is November 2017; no epidemiological estimate or treatment recommendation is reproduced.

Teaching is original concise paraphrase with links. No diagrams, articles, cases, scans, textures, fonts or question banks are imported or relicensed. BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Preserve attribution, licence links and modification notices. The 232,172-byte derivative is covered by the same commercial-compatible CC BY 4.0 terms as the existing source; it introduces no paid dependency or service. Hosting costs and commercial clinical readiness are separate questions, not a zero-cost guarantee.

## Verification and remaining acceptance

Run `npm run pancreatic-dissection:test` for reproducible export and independent source-triangle checks. Shared nested teaching, navigation, learning, history, cutaway and origin-guide suites cover the new study too; their reports distinguish controlled software callbacks from real-browser acceptance. Type checking and the production build are separate gates. Licensing and inventory reports retain the original catalogue and lockfile.

Required before clinical publication: specialist source-label/position review; assessment of overlap, separation directions and label readability on actual desktop/mobile devices; clear differentiation of a source tree component from an accessory duct; teaching and recall-question review; validated patient-space transforms/segmentation and modality-specific annotations before any scan synchronization; server-side resource authorization before protected teaching delivery. No clinical or device acceptance is claimed here.
