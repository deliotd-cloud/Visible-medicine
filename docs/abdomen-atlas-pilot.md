# Abdominal anatomy — private live pilot

The website now contains `/atlas/abdomen-3d`, using the shared regional runtime
exported from Atlas `031fa555b6f3e48825353de115f6aa5d8e275d6c`. The complete module
is privately live in website version 58, deployed from
`95d39ec18136ea5ad98a9a50bd8de8767fbcce27` on 13 September 2026. Its unchanged
administrator-review restriction is not a clinical or learner-release approval.

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

Both source builds and TypeScript pass. The website's 90 tests pass, including
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

## Completed staged publication and live evidence

1. Version 57 preserved the working 59-model runtime and registered the 80-model
   candidate independently. The real administrator browser staged all 21 added
   GLBs, verified complete downloads for all 80, and then passed all 59 active
   URL checks. Source: `fef7471b07892645b1899fcd51e9e9d8a61f7179`.
2. The installed Three.js 0.185.1 GLTFLoader parsed all 80 original files locally:
   163,132,412 bytes, 908 meshes and 8,372,713 triangles. All SHA/length/header,
   finite position and triangle-index checks passed; no model was rewritten.
   This is parser evidence, not live-device or anatomical validation.
3. Version 58 activated the complete abdomen inventory after those checks. The
   real live administrator batch then passed **80/80** original URLs: complete
   byte/hash, HEAD, range and conditional responses through protected storage.
4. Actual live desktop browser samples: regional dissection/Undo restored
   106 → 104 → 106; wall Expose transversus displayed 25/29 and its source-bound
   link restored the selected right transversus/study in another document;
   Back returned to abdomen. The kidney internal study restored 34 → 33 → 34
   after selected-pelvis removal/Undo. Hila, pelves & vessels supported name-hidden
   identification practice and returned to the same 7/82 study. Both live
   interaction tabs had no recorded error-level console logs.

Limits: direct browser inspection of a pending model during version 57 was
blocked by the browser client before an application response, so it is **not**
evidence of a live application denial. All 21 pending denials pass local real
Workers/R2 tests. The current live mobile override attempt remained at 1280 px;
it is not new phone-width acceptance. Retain the preceding genuine local 390 px
samples and unresolved console-error/device gates above. Hepatic/pancreatic
journeys were locally sampled, not repeated in this live sample. Overview framing
is still small. Other-account, failure, rollback and clinical acceptance remain.

Version 57's 30,982,535-byte and version 58's 31,055,595-byte archives retain
exact runtime companions/notices and omit only build-output duplicate GLBs.
Original source files and immutable storage objects remain. The main task's
`work/ABDOMEN-LIVE-CHECKPOINT-20260913.md` records exact deployment, GitHub and
D-recovery evidence. Do not return to the 44-static-model bootstrap.

Patient scans/masks, clinical decisions, source holds, other module source assets,
lecture/case rights, paid services, audience and splash settings are unchanged.
Continue the full shared anatomy/teaching/Education roadmap after this milestone.
