# Regional restoration delivery — 27 September 2026

The local regional/whole-body viewer now exports Atlas
`0770fd3e49eb02b0430a80769744c88027c591e5`, replacing `36c53fb`.
The existing compact interface is unchanged. Restore reveals returned tissue,
clears Fade others and selected-only framing, and refits the camera; restoring a
group remains one dissection Undo. Selection, separation, layout and cutaway
remain intact. This is reference dissection, not physiological tissue movement.

The export also carries the previously authored eight foot vascular quiz drafts
and two Achilles CT notes, already available in Clinical Review. No teaching is
clinically approved by this import. Reference citations and limits remain visible.
No new asset, dependency, licence, patient image or imaging connection is added.

## Exact scope

- Twelve shared views: eleven regions and whole body, with 1,104 whole-body
  source selections. Counts are not claims of complete human anatomy.
- All 136 registered model objects / 143 paths / 199,033,932 bytes unchanged.
  Only the regional source/manifest binding changes in the inventory.
- Dedicated shoulder, pelvis, lower-limb exports and all Clinical Review files
  are unchanged. Review stays `eecf73c`, fingerprint
  `c7426019c4e602d17e32f91a843980a87bfe4102d0f8fa153b5c18dc30ea7bbb`.
- Delivery remains `administrator-review`. No approvals, decisions, entitlements,
  database state, specialist masks or desktop PACS are modified.
- New manifest SHA256 `ce3f3bc59f598baaa64f9acaf864d249fe5009fdc1eb5cc0666b7ae417d1944d`;
  inventory SHA256 `6ee229063fbf495d5f4490e9bb600d035ace26dc61779af9ffef2a3b981bedd1`.

## Verification

The existing 95 Atlas/review integration tests pass (94 initially; one stale
learner-revision assertion corrected and its test rerun). One new exact delivery
test also passes: restoration source, draft source hashes, 12 scopes, all exported
file hashes and no clinical/patient/imaging flags. Historical review fixtures,
independent-module pins and behavioral assertions were preserved. TypeScript,
source build/export, website build, inventory and review verifier pass. Existing
chunk-size warnings remain; passing tests are not clinical acceptance.

Actual embedded website foot viewer: Dissect stage2, select Right talus, enable
Fade others and Frame selected, Restore these6. Removed6→0, both controls clear,
selection retained; one Undo returns6removed. Whole body opens through the site's
region navigation with 1,104 selections and interactive canvas. Desktop screenshot
inspected: skeleton fitted inside canvas, compact systems, region navigation and
review warning visible. Device-specific anatomical/clinical acceptance is separate.

Old generated chunks replaced by export remain in Git and a hash-verified copy
at `D:/VisibleMedicine-Atlas-Recovery/restore-regional-prior-generated-20260927`.
No models deleted. Staged full export remains local on C. Public website unchanged.
Recovery and log locations are recorded in the main coordination checkpoint.
