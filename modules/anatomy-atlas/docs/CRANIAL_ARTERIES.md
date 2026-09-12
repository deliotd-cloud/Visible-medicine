# Additional cranial arteries

Status: source-preserved educational surfaces and original teaching drafts; radiologist/device acceptance pending.

In **Head & neck** or **Whole body**, search for **posterior inferior cerebellar**, **superior cerebellar** or **right middle cerebral artery**. Select a structure for its source limits and draft teaching. Expand **Arterial connections** to compare its usual parent, or show the available connections and bones in one reversible step. Existing hide/Undo, side filters, labels, isolation/fading and separation controls are reused; no extra permanently expanded panel is added.

## Supplied geometry

| Selections | Official source definition | Files / disconnected components | Triangles |
| --- | --- | --- | --- |
| Right and left PICA | ISA FMA50519 / FMA50520 | 13 files / 14 components each | 4,040 each |
| Right and left superior cerebellar artery | ISA FMA50574 / FMA50575 | 1 file / 1 component each | 406 each |
| Right MCA | PART-OF FMA50082 | 3 files / 6 components | 2,342 |

All five selections together retain **31 original files, 36 source components and 11,234 triangles**. PICA and MCA components remain grouped selections, not separately named arterial segments. No disconnected part is bridged, removed or repositioned. A small proximal portion of each superior cerebellar source crosses source X=0; its official laterality is retained rather than modifying geometry to satisfy a sign test. The exporter changes only exact-coordinate indexing/normals and Float32 scene encoding. Original source bytes are retained in `content/sources/cranial-arteries`, under their separate dataset licence.

## Source and overlap evidence

The pinned ISA and PART-OF archive directories, CRC/size and per-file SHA256 are checked during retrieval. `scripts/cranial-artery-sources.mjs` lists exact definitions and hashes. `docs/cranial-artery-source-audit.json` records six candidate groups screened against all **1,082 pre-extension display records**, 99 bounded surface comparisons and 15 candidate-pair comparisons. No direct component ownership, represented exact-geometry match, shared triangles or positive translated-copy screen was found. These screens do not prove absence of all self-intersection or clinical correctness.

`scripts/export-cranial-arteries.mjs` admits five groups only after checking the pinned audit and current source-hold policy. `lib/cranial-arteries.ts` uses the common atomic source-admission guard. Changed/missing context, asset or geometry bindings fail instead of silently substituting tissue. The original raw catalogue and all previous display records remain unchanged; the extended display has 1,087 selections.

The cervical/cerebral relationship graph now has **19 arterial selections, 19 source-ID pairs and 38 reciprocal rows**. It adds typical ICA→right MCA, vertebral→same-side PICA and basilar→superior cerebellar relationships, without using surface distance to infer anatomical connectivity. Original cerebral pins remain immutable; the extension has its own source/asset pins. The complete extended source set is required to show this graph. No continuous lumen, flow, perfusion territory, angiographic registration or donor-specific branching is claimed.

## Explicit deferrals and review

- AICA FMA50544 is supplied as one parent definition containing two bilateral files. It is audited but **not admitted**: displaying the combined group under a single-side filter would be misleading. A future source-component identity/presentation must support both sides without inventing separate FMA labels.
- No corresponding left MCA group is defined in the pinned tables. Do not synthesize it by reflecting the right group or relabelling another source.
- Fine perforators, separate M1/M2 or PICA segments, complete distal trees and vascular territories are not reconstructed. Surface proximity is not evidence of a patent junction.
- Required radiologist review: source identity and laterality; SCA proximal midline crossing; PICA/MCA fragmentation, completeness and nearby structure relationships; introductory notes and parent links. Clinical/pathology/imaging tabs remain pending rather than being filled with unsupported generic claims.
- Required device review: selection of thin surfaces, labels in different camera orientations, both side filters, separation reset, context visibility, Undo/Redo and mobile touch. CPU/SSR tests do not establish visual or clinical acceptance.

## Commercial provenance and tests

Source: [BodyParts3D official archive and licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), checked 12 September 2026. Preserve **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International** and the derivative notices. Original application code/brief teaching remains MIT; this does not relicense source geometry. [TTUHSC El Paso's head/neck artery table](https://anatomy.ttuhscep.edu/anatomytables/arteries_head_neck.html) is a factual reference only: no article text, table dataset, illustration or scan is imported. No paid API, inference weight, package, font or texture is added.

Run `npm run cranial-arteries:test` and `npm run cerebral-arterial:test`. The asset test checks every ordered source triangle corner after the exact scene transform/Float32 encoding, all retained source hashes, source-admission rejection cases, old-record preservation, side-aware study links and draft/pending lesson states. Wider arterial/history/review tests and a production build remain part of the release check.

Private CT-head correction is separate: no patient files or accepted masks change here. Follow [the local CT review workflow](LOCAL_IMAGING_STUDY.md) for source-bound correction marks and separate-draft editing. The generic cranial model is not registered to that study.
