# Enlarged anatomical label delivery

Atlas `bc948b52e8f63c12305bda6eb3e902c5d74e18dc` is imported locally into
learner modules and protected Clinical Review. Label columns grow with text
within their screen-side bounds; short drawing areas also grow to give the
packer room around anatomical anchors. No smaller fonts, abbreviated names,
new anatomy or teaching changes. Existing access and saved decisions unchanged.

An actual review check found the shoulder iframe still used standalone mode.
The website adapter now explicitly uses `presentation="panel"`, as the regional
review viewer already did. This removes duplicate navigation/branding inside the
iframe and applies its intended responsive layout. Initial structure selection
and protected model asset paths remain unchanged. A JSX binding regression test
guards both explorers' presentation and shoulder identity/asset bindings.

## Verified scope

- All136 registered models/143 paths and independent specimen pins unchanged;
  generated module bytes/source manifests verified. Prior bundles recoverable.
- Review verifier:879 source files,31 viewer files,22 packages; integration hash
  `433bbf8cadf0f23f71f5c9decf00a49925fd385d051de43422123bf29b4879db`.
  Renderer/review revisions rebound conservatively, with no approval migration.
- Current local workspace249 tests, TypeScript and production build pass. This
  includes separately unstaged fracture work; that implementation is excluded
  from the Atlas delivery commit.
- Actual website375x812: learner shoulder normal drawing200px, enlarged400px.
  At200%root font, Scapula, Proximal, humerus, Clavicle, Teres and minor each stay
  unbroken in the sampled labels. Labels remain on their respective screen sides.
- Protected shoulder review uses panel mode, no duplicate brand,400px enlarged
  drawing, matching readable side-bound labels. Clicking Proximal humerus updates
  the selected label. No review submitted.
- Regional Thorax normal drawing206px, enlarged412px, all412px scroll-reachable;
  no horizontal overflow. Root-font preferences restored after browser checks.
- Source acceptance additionally covers six shoulder and fifteen regional cases,
  measured word ranges/own-anchor clearance and label/projection/focus/depth tests.

The long-lived dev process encountered a Vinext ALS recursion during reload.
Its known process was stopped and restarted once; the unchanged application then
served HTTP200 and the browser checks above passed. No dependency workaround or
suppression was applied. This is not a claim that the upstream HMR issue is fixed.

Final logs in coordination work/:enlarged-labels-panel-website-tests-20260928.log,
enlarged-labels-panel-website-types-20260928.log,
enlarged-labels-panel-website-build-20260928.log,
enlarged-labels-panel-review-build-20260928.log. The earlier pre-panel build/tests
are retained separately. Recovery details are in the coordination checkpoint.

No Atlas publication, image upload or clinical approval. Not universal long-name
fit, whole-tissue occlusion proof, native zoom, physical-device or screen-reader
acceptance. Enlarged text intentionally requires more scrolling than normal text.
