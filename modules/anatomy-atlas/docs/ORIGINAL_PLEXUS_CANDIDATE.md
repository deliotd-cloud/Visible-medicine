# Original brachial plexus candidate — 4 October 2026

## Scope and creation record

Source-only local route: `/review/candidates/plexus`. This is an independently
authored **diagrammatic educational schematic**, not an acquired nerve mesh,
validated spatial reconstruction, anatomical millimetre frame or registered
patient study. It does not close the full-body/peripheral-nerve mesh gap.

The canonical typical right-sided graph has 35 separately addressable parts:
five anterior rami, three trunks, six divisions, three cords, two cord
contributions to the median nerve, five terminal nerves and eleven collateral
nerves. Its 38 edges describe usual named continuity, not fascicle tracing or
complete root contributions to each terminal nerve. Median roots are not the
C5–T1 anterior rami. Internal `vm:schematic:brachial-plexus:right:*` identities
are explicit; no guessed FMA codes or imaging-series identities are assigned.

All drawing coordinates, smooth cubic curves and thickness choices were
authored in project code without importing or tracing a source visual layout,
mesh, figure, photograph, texture, scan or coordinate table. They use arbitrary
diagram units. Illustrative depth separates paths for readability; crossing
curves without a named junction are not joins. Diagram spacing is a reversible
layout separation, **not a physical dissection or nerve stretch**. The cord names
are anatomical names; no axillary artery geometry is implied by this diagram.

MIT applies to the original project code, topology expression and wording.
No new dependency/font/service or mandatory fee is introduced. Existing
React/Three/Fiber/Drei and brand assets retain their recorded terms. The held
Open3DModel, Z-Anatomy and other donor candidates are not creation inputs.
BlueLink figures/content and private scans or accepted CT-head boundaries are
not used. Article consultation is factual reading, not a grant to reuse media.

## Fact references

- [Emamhadi et al., adult-cadaver variation study](https://pmc.ncbi.nlm.nih.gov/articles/PMC4969373/): typical trunk/division/cord assembly and observed variants; no figures, lengths or frequency tables copied.
- [Brachial plexus overview, NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK500016/): fact check of typical organisation; no prose or figures copied.
- [Head/neck brachial plexus, NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK531473/): usual collateral origins; no prose or figures copied. The direct page returned a browser check during the root audit; its indexed NCBI text and worker reading supported this bounded fact check.
- [Clinically relevant anatomical variations](https://pmc.ncbi.nlm.nih.gov/articles/PMC10001373/): variation boundary; article media not reused.

Only short original origin/connectivity notes are included. Clinical syndromes,
terminal root-value assignments, dermatomes/myotomes, distal courses, muscle
targets, vascular relations and variants are deliberately not invented.

## Implementation and local checks

- `lib/original-plexus.ts`: exact typical graph, stable sided identities,
  provenance/registration/admission constraints and cycle-safe named traversal.
- `lib/original-plexus-presentation.ts`: original dimensionless segment layout,
  bounded spacing and curve connectors. No body/source-to-scene transform.
- `app/review/candidates/plexus/`: local selectable 3D study, searchable grouped
  keyboard-accessible list, selected origin/continuation notes, faded context,
  optional collateral branches, labels and smooth interruptible camera presets.
  Reduced-motion preference bypasses animated camera movement.
- `scripts/test-original-plexus.mjs`: independent exact topology fixture,
  malformed/release-boundary mutations, geometric coverage/endpoints/finite
  sampling, spacing clamps and production/export quarantine checks.

Run from the Atlas source:

```text
node --import tsx --test scripts/test-original-plexus.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/vinext/dist/cli.js dev --hostname 127.0.0.1 --port 56945
```

Then inspect `http://127.0.0.1:56945/review/candidates/plexus`. No clinical review
decision is saved on this local page. No database migration, Review approval,
website-runtime import, hosted deployment or learner catalog admission occurs.
Normal production export files remain allowlisted and do not include this route.

Evidence and exact revision-input hashes are saved under
`E:/VisibleMedicine-LocalStaging/20261004-original-plexus`. A passing topology
fixture establishes code consistency, not independent clinical correctness.

## Required next gates

1. Radiologist review of the graph/individual branch identity, clear crossings,
   selected labels, limits and teaching wording at the exact candidate revision.
2. Correct any findings, then bind a new schematic-specific checklist and exact
   source/content/renderer revision into authenticated Clinical Review. This
   prototype does not substitute an unsaved button for clinical acceptance.
3. Separately obtain commercially cleared nerve meshes or validate an original
   spatial reconstruction against multiple anatomical references/landmarks.
   No eye-fitting this arbitrary diagram into the body model.
4. Only after explicit admission add the original schematic to generation/import
   allowlists, with its own nonregistered frame and retained provenance notices.
   Preserve scan rights/privacy, independent access and revision-bound sign-off.
