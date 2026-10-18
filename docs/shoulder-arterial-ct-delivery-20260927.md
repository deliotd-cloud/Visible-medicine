# Shoulder arterial CT/CTA delivery — 27 September 2026

Learner and protected Clinical Review now import Atlas
`0ff5e51a5fb9e6b660a16d1531da5c92a74317c2` through their normal generated
pipelines. Eight existing right/left anterior and posterior circumflex humeral,
circumflex scapular and thoracodorsal selections now have CT orientation drafts.
No added scans, patient data, meshes, licences, dependencies or paid services.
The earlier shoulder-detail module is unchanged; the new material belongs to
the main regional/whole-body atlas.

The source documents references, exact full source identities, unchanged
geometry and 9,928 unaffected topics. The website import retains all 136 models,
twelve regional scopes and separate case/lecture entitlements. There is no
patient registration, clinical approval, privacy clearance or public deployment.
Teaching and presentation fingerprints refresh; old decisions are not migrated
into approvals for the new material. No real decisions were submitted.

## Verification

- Atlas/Clinical Review suite: 101 existing tests passed. New eight-selection
  integration test passes after correcting its raw-byte equality assumption:
  working-checkout dispatch text has mixed CRLF/LF, Git stores LF. Independently
  verified the difference is newline-only and pinned both exact hashes; no source
  or runtime behavior was changed to accommodate the test. Original failure log
  retained in the coordination workspace.
- All eight review packets match their source CT lesson, reject a foreign side,
  remain draft, and have no imaging revision. Learner scope membership and shared
  source-input identity are checked in regional and whole-body views.
- Inventory, review binding, TypeScript, review-viewer and website build passed.
  Existing large-chunk and route-classification build warnings remain.
- Actual website at 375px: search-selected right circumflex scapular artery;
  Imaging/CT displays the new draft and source references in the embedded model.
  Outer page and iframe both have scrollWidth 375.
- Clinical Review at 320px: left thoracodorsal worksheet CT disclosure contains
  matching text/references; MRI remains pending, no unsaved edits, scrollWidth320.

## Revision evidence

- Review integration: `a13993fbc9ded6bfa66720b581883c4127b4b91f399afd3132daad20dadb16e3`.
- Review body presentation: `5684dc64d99f01a9ad7c7016bf6e6369767e9fa15160164cbb3180cbbd9e7f00`.
- Learner manifest SHA256: `cd0153780348320b65287d48618d1281bcdad8e68c03fc418231ce605d708467`.
- Model inventory SHA256: `28f5da5d5481a1583df3057ec6f883d6c6b9273d8a86ddb4c55edc43bbabb765`.

Prior generated learner bundles were hash-copied to
`D:/VisibleMedicine-Atlas-Recovery/shoulder-arterial-ct-learner-prior-generated-20260927`
before replacement. Git history also preserves generated review bundles.
Source/website GitHub and independent D recovery receipts are maintained in the
main coordination workspace. Sites workflow used the existing checkout/preview,
retained the established UI and skipped publication under the local-first plan.
