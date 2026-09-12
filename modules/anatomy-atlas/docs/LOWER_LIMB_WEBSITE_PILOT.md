# Lower-limb website pilot

The main website contains the existing independent Universiti Malaya right-limb
workbench at /atlas/lower-limb-3d. This is regional integration, not 67 new
anatomical additions or complete lower-limb coverage.

Five scopes share one compact selector: hip/thigh, knee, calf, foot and an optional
heavier whole source limb. All 26 original study recipes, 67 source selections,
42 muscle attachment/motor lessons, 65 extended clinical/pathology drafts and
partial CT/MRI/X-ray/ultrasound text retain their existing source bindings.
Native component controls retain search, fade, set-aside, history, separation
styles, cameras, labels, display options, motor-group teaching and practice.
No nerve course is rendered by motor teaching.

## Rebuild and export

1. Build from the Atlas checkout using its installed lockfile:
   `node node_modules/vite/bin/vite.js build --config integration/lower-limb/vite.config.mjs`.
2. Run the existing UM limb geometry, teaching, navigation and TypeScript checks.
3. Commit the clean Atlas source. Export to a fresh explicit destination:
   `node scripts/export-lower-limb-module.mjs <website>/public/atlas-runtime/lower-limb`.
   An existing destination is rejected: preserve it before replacing an export.
4. Website runtime files are generated, with exact byte hashes and source commit.
   Do not hand-edit them. Verify inventory, licences, actual browser loading and
   website build before publication.

The browser dependency graph generates full permissive notices. No new package,
font, texture, commercial service or model is acquired. MODEL_NOTICE.md includes
CC0 source credit, adaptations and boundaries; the retained source README and
Dataverse evidence accompany the two catalogues and five GLBs. Raw STL archives,
scans, masks and private review records are excluded.

## Links and safety

Links retain the existing strict source/recipe/topic hashes and canonical query
keys, but target the contained module instead of absent website specimen routes.
Duplicate or stale source fields fail closed, with an explicit action to open
the current knee view. Changing region deliberately clears the incoming query
and starts that region's default study. Custom dissection links preserve the
selected structure/source context, not hidden tissue or separation state.

The source study component's optional host callback changes links only; default
standalone behaviour remains. The website has no standalone specimen-review
database connection, no scan/Didanix connection, no new persistent assessment
store and no paid-lecture access. Existing other website module exports remain
on their recorded revisions unless separately regenerated.

## Validation boundaries

Model fidelity and existing original teaching are checked by their established
source/hash/markup tests. These are not anatomy sign-off. Confirm source and
clinical correctness with the user radiologist per revision. Real touch devices,
200% text enlargement, accessibility and whole-limb performance need acceptance.
No private dataset is an input. Exact browser, backup and private publication
results are recorded in the coordinating task's dated checkpoint.
