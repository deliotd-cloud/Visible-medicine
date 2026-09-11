# SPARC nerve source review — 11 September 2026

Status: **originals retained and structurally audited; no live admission**. This is a useful new source lead, not closure of the peripheral-nerve gap. No application, catalogue, teaching record, source mesh, clinical decision or imaging frame changed.

## Source and scope

[Pennsieve dataset 307, version 8](https://discover.pennsieve.io/datasets/307), [DOI 10.26275/bbvg-gj86](https://doi.org/10.26275/bbvg-gj86), credits Elias Soltani, Liam K Fisher, David P Nickerson, Peter Hunter and Nat Castaneda Ruan. It supplies a generic whole-body scaffold with estimated nerve landmarks, not a subject-specific scanned dissection. Its public overview identifies Anatomography-derived vasculature. Dataset licence: CC BY 4.0. That statement alone does not resolve every upstream component's terms.

Five original files (14,568,863 bytes) were obtained through Pennsieve's public, version-specific download manifest and checked against its file-level SHA-256 metadata. Only the two nerve EXF files, their two annotation JSON files and software provenance were retrieved. No whole-body archive, vessels, organs, images, patient scans, trained weights or software dependencies were downloaded. No AWS account, requester-pays flag, API key or paid service was used.

Originals remain outside the website at `D:/VisibleMedicine-Atlas-Recovery/source-candidates/sparc-307-v8/`; their exact pins and reproducible results are in [the audit report](sparc-nerve-candidate-audit.json). They are research material, not redistributed atlas assets.

## Actual structural findings

The hash-pinned `nervesWithVagus.exf` uses one-dimensional linear elements. The audit distinguishes 1,949 coordinate nodes from 1,949 separate marker nodes; markers must not be doubled into the anatomy. There are 1,917 elements and 964 named path groups. All 964 annotation names match those groups; the extra `marker` group is not a nerve. Each element belongs to exactly one path group.

The 964 annotations use **956 distinct ontology IDs**, not 964 validated nerve identities. Eight IDs appear under two names each. These include:

- Left/right hypogastric nerve versus anterior cutaneous branch of the corresponding iliohypogastric nerve.
- Sympathetic-sounding superior cervical cardiac nerve versus a superior cervical cardiac branch of the vagus.
- Greater occipital versus C2 posterior-ramus medial-branch terms, and recurrent versus inferior laryngeal terms, which need extent/synonym review rather than automatic rejection or merging.

These are source-label findings, not corrected ontology assignments. Preserve original names and IDs, use source-local keys for any future candidate view, and do not invent FMA mappings or collapse rows by ontology ID.

Seven elements have exactly zero geometric length. They affect left/right C1 spinal nerve, right sciatic nerve, left medial plantar nerve, lateral portion of left median nerve, right T7 posterior-ramus lateral branch and the lateral cutaneous branch of the right seventh intercostal nerve. Three reference the same endpoint twice; four use distinct nodes at identical coordinates. The report retains their exact IDs. No segment was repaired, welded, removed, bridged or replaced by a tube.

There are 80 connected components **by source node identity**. This is not proof of 80 anatomically disconnected nerves: distinct nodes can occupy shared locations. Do not automatically join coincident points or infer functional continuity from graph adjacency. Coordinate bounds are recorded in native numeric units without assuming millimetres, anatomical axis directions or a BodyParts3D transform.

The second file, `spinal_nerves.exf`, is a generated Hermite scaffold. Its settings identify `3D Spinal Nerve 1` / `Human whole spine 1`. All 43 annotation names match groups; `core`, `shell`, `left` and `right` have empty ontology IDs, and `.scene_selection`/`marker` are extra technical groups. This pass did not tessellate it or validate its surfaces. A parameter named spinal-cord diameter is not a supplied spinal-cord model.

## Rights and clinical gates

The retained provenance lists scaffoldmaker 0.19.1 and cmlibs.zinc 4.2.1. The [current scaffoldmaker licence](https://github.com/ABI-Software/scaffoldmaker/blob/main/LICENSE) is Apache 2.0, University of Auckland; no code was imported or installed. A current software licence is not retrospective evidence for every dataset asset. Confirm nerve-component provenance and preserve any applicable upstream terms before redistribution; avoid bulk importing the Anatomography-derived context under a blanket CC BY assumption.

A possible next step is a **separate, explicitly schematic nerve-path prototype**, with original coordinates, source-local identities and disputed/degenerate groups held out. First establish the specific component rights and inspect source marker/branch relationships. Line thickness would be display styling, not measured calibre. Keep this source separate from the main body and independent UM specimen; no automatic frame matching, mirroring, invented gaps, inferred dermatomes or patient registration. Qualified anatomical review remains necessary before presenting it as spatial teaching, particularly for plexus, root, autonomic and distal branch relationships. No new controls should be added to the main viewer for this audit.

The [vagus micro-CT dataset 521](https://discover.pennsieve.io/datasets/521) was also screened at metadata level. It concerns excised nerve fascicles/epineurium and segmentation outputs, not a whole-body vagus course. No files were downloaded; it is not a substitute for the missing gross nerve anatomy.

## Reproduce without repeating the search

Run `node scripts/audit-sparc-nerve-candidate.mjs` with the retained directory present; `--source=ABSOLUTE_DIRECTORY` selects another retained copy. The script verifies all five original hashes before parsing and compares its result with the checked-in report. `--write` regenerates only that report. It is a source-specific structural checker, not a general EXF parser or clinical approval test. The bounded retrieval helper and source receipt are retained in the local recovery checkpoint. Do not repeat this download/audit during goal continuation unless the files or evidence change. Proceed to component provenance and a separate prototype, or another substantive anatomy gap if this candidate cannot safely progress. Routine oral detail stays deferred.
