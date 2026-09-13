# Abdominal anatomy — source integration, publication pending

The website now contains `/atlas/abdomen-3d`, using the shared regional runtime
exported from Atlas `031fa555b6f3e48825353de115f6aa5d8e275d6c`. This is source and
local-browser progress, not a claim that the new route is hosted. Private website
version 56 remains the working 59-model release until the rollout below completes.

## Scope and boundaries

- All 106 existing regional selections and 16 nested hepatic/biliary, renal and
  pancreatic selections, including their context and relationship model closure.
- Separate BodyParts3D v3 abdominal-wall specimen: 29 surfaces, seven studies,
  CC BY-SA 2.1 Japan. Full notice, legal code, source README, evidence and exact
  specimen-data adaptation (`.ts.txt`, not executable website source) are included.
- Separate HRA kidney specimen: 82 retained surfaces, nine studies, CC BY 4.0.
  All three source-defect holds remain. Neither specimen is registered to the
  version-4 body, the other specimen, or patient imaging.
- Same compact host layout and existing tools; no added permanent toolbar.
  Direct specimen links retain their source/frame/revision and return to abdomen.
  Standalone clinical-review links are not connected inside the website module.

The shared runtime has 73 unchanged GLBs (110,546,620 bytes). Across all four
runtime directories, the candidate inventory contains 80 GLBs / 163,132,412 bytes:
the prior 59 plus 21 new-to-website bundles. It binds inventory SHA-256
`d64267746511da4c2052827c06fe98cdd82edbf1c82bc66e35d05c56584c210e` and retains
administrator-review policy, not clinical or learner-release approval.

## Verification

Both source builds and TypeScript pass. The website's 87 tests pass, including
all generated files/notices, original-model integrity and authorization/storage
checks. Atlas tests cover 653 regional root/nested links, 543 independent specimen
links, 5,973 specimen rejections, 18 abdominal context combinations and 16 actual
React study renders. Original abdominal-wall face corners and HRA accessor values
are checked, with unchanged models, source catalogues and teaching definitions.
Current body, specimen and shoulder review safeguards pass. Historical preservation
checks now compare their exact original before/after commits rather than freezing
subsequently developed UI forever; no historical approval has been migrated.

Local browser samples on 13 September 2026:

- Abdominal body renders; layer removal/Undo restores 106 → 104 → 106 selections.
- Abdominal-wall dialog renders with source positions and screen-side labels;
  Expose transversus shows 25/29 surfaces. Its generated link opens the same
  selection and study in a new module document; Back returns to abdomen.
- Kidney internal study renders 34/82 supplied surfaces. Set aside/Undo restores
  the selected renal pelvis on desktop and at a confirmed 390-pixel width.
- At 390×844, the website and embedded document both have width/scrollWidth 390.
  The mobile tools drawer launches kidneys; Hila, pelves & vessels enables
  identification practice with names hidden. Back restores the chosen study.
- Hepatic branch and pancreatic duct studies render at phone width. Hepatic
  layer Undo restores the hidden arterial group; the pancreatic envelope is
  visible as context, not an additional validated tissue plane.

One unattributed `MutationObserver.observe` console error was recorded in the
mobile tab during the viewport/launch sequence. The tested interactions continued
working. No application-authored MutationObserver was found, but its origin is
not established; investigate/reproduce before broad device acceptance. Other
sampled tabs had no error-level logs. No claim of complete browser/device acceptance.
Initial overview framing remains visibly small and needs the planned polish.

## Required staged publication

Do not deploy this candidate directly while the live staging registry only knows
the previous 59 models. First publish a source-bound staging-only registry update
that preserves version 56's active runtime/delivery inventory and working routes.
Upload/check the 21 additional licensed models through existing administrator
storage; verify their full bytes, hashes, ranges and actual loader behaviour.
Then publish this complete candidate with its matching delivery policy and verify
all 80 original model URLs and the new region/specimen journeys on the live host.
Do not roll back to the old 44-static-model bootstrap or weaken authentication.

Patient scans/masks, clinical decisions, source holds, other module source assets,
lecture/case rights, paid services, audience and splash settings are unchanged.
Continue the full shared anatomy/teaching/Education roadmap after this milestone.
