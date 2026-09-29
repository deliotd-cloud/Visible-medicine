# Inferior collicular brachia

Head & neck or Whole body → select Brain → Dissect brain → Brainstem and cerebellum. The existing Study view menu offers **Inferior collicular brachia** and **Inferior brachia with midbrain**. Search also finds each side directly with source-bound nested links.

Two coarse original BodyParts3D v4 surfaces are now selectable: left FMA73464/FJ1761 and right FMA73463/FJ1809. All 568 source triangles, source positions and winding are retained; the separate bundle is 13,044 bytes before delivery compression. The four previous brainstem/cerebellar compounds and fourth-ventricle context are unchanged. Selection, side filtering, labels, focus, fade, hide/Undo/Redo, cutaway and separation reuse the shared viewer without a new permanent toolbar. These envelopes are not individual fibres, complete auditory pathways or registered patient imaging.

## Source findings

The official convention is X-left/Y-posterior/Z-superior. Four candidates were checked:

| Official label/file | Original X range (mm) | Disposition |
| --- | --- | --- |
| Left superior, FJ1735 | −18.3783 to −3.32827 | Held: source-right coordinates |
| Right superior, FJ1736 | 2.00987 to 17.0168 | Held: source-left coordinates |
| Left inferior, FJ1761 | 2.38239 to 14.1352 | Unvalidated source reference added |
| Right inferior, FJ1809 | −15.4428 to −3.66284 | Unvalidated source reference added |

No labels were swapped and no geometry was mirrored or fitted. Both superior originals remain outside runtime, with explicit holds in the comparative ledger. Further source/anatomical adjudication is required; a plausible counterpart is not proof.

The [source audit](collicular-brachia-source-audit.json) records pinned definitions/hashes, coordinate-side checks, topology and comparisons against 59 existing neural/context records. All four are single closed oriented combinatorial components without detected collapsed, degenerate, duplicate or nonmanifold faces/edges/vertices. No exact source triangle is shared with the screened nearby neural surfaces. These diagnostics are not proof of accurate shape, valid attachments, absent self-intersections or clinical suitability.

The inferior surfaces lie beside the retained midbrain in source coordinates. Sampled proximity to ipsilateral medial-geniculate references does not prove a valid continuous connection. No target nucleus or connecting geometry is added to this study. The original pons remnants/duplicate faces remain disclosed and untouched.

Four unchanged originals are retained in `content/sources/collicular-brachia`, protected from Git newline conversion. The exporter admits only the two explicit inferior candidates. Adaptations are the existing source-to-scene transform, exact-coordinate welding for normals and Float32 storage. Every ordered source face is preserved, without simplification, cropping, smoothing, filling, fitting or invented fibres.

## Teaching, integration and review

One source-bound concept provides Anatomy/Function drafts and an auditory-relay self-check for both sides. [UTHealth's auditory laboratory](https://oac22.hsc.uth.tmc.edu/courses/neuroanatomy/L06P12.html) is a factual reading reference; no university illustration, passage, scan or teaching file is redistributed. MRI, Clinical and Pathology drafts were added on 29 September; see [teaching scope and references](COLLICULAR_TEACHING_20260929.md). CT, X-ray and Ultrasound remain pending. No diagnostic performance or actual scan correspondence is inferred. Counts below describe the original geometry milestone; use CURRENT_STATUS.md for the current inventory.

There are now 71 reachable nested selections across 42 teaching concepts. All 69 prior teaching bindings and parent records are preserved exactly; the main display remains 1,042 selections. The 532-piece comparative difference now comprises 24 nested-covered pieces, 45 direct holds, one display exclusion, one related cross-tree hold and 461 further candidates. Source pieces are not counts of complete missing structures.

The user is the radiologist reviewer. Clinical sign-off must address the specific geometry/content revision, laterality, coarse shape, spatial relationships and teaching scope. No approval is pre-populated. Source hashes and software tests are not clinical validation.

## Verification and reproduction

Run from the project root; neighbouring-source comparisons require the established original BodyParts3D source cache:

```sh
node scripts/audit-collicular-brachia.mjs --check
node scripts/export-collicular-brachia.mjs --check
node scripts/validate-collicular-brachia.mjs
node scripts/pin-nested-teaching.mjs --check
node scripts/validate-brainstem.mjs
node scripts/validate-nested-teaching.mjs
node scripts/validate-nested-navigation.mjs
node scripts/validate-nested-history.mjs
node scripts/validate-nested-cutaway.mjs
node scripts/validate-nested-learning.mjs
node scripts/audit-reference-coverage.mjs --check
```

The addition test independently compares every decoded GLB face corner with transformed original vertices, then checks source/side rejection, parent identity, teaching, held candidates and six-layer hide/Undo/presets. The four-compound original geometry regression remains intact. Navigation tests exercise actual search/launcher closures and server markup; they are not browser/GPU/mobile, clinical or acquired-image acceptance. Existing teaching pins cannot silently migrate: extensions must preserve every old binding.

## Rights

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. [Official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). Original source and derived geometry/metadata remain CC BY 4.0; preserve attribution and modification notices. Original app/audit code and brief teaching use the project's MIT grant. No dependency, font, texture, paid service, proprietary illustration or patient scan is added. See [third-party notices](../LICENSES/THIRD_PARTY_NOTICES.md).
