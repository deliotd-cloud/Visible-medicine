# Compact Atlas controls delivery — 27 September 2026

Learner and protected review source: `0c319d5ed92cfae5eb95a5486bfe312a3a63fed6`.
Review integration: `e68d8508c4be49f3d120cd64d15cf3d9229d7264a39717cd3f08979f85353196`.
Body presentation: `53819e4fbd9bd49990faff7a50424cb37453a241b7258e0732a741aeca122c4b`.

The existing Structure info launcher now serves compact/focused regional
Explore and Dissect layouts without an additional Details shortcut wrapping
the camera controls. Practice, ordinary desktop and shoulder retain their
distinct shortcuts. The source implementation and its behavioral test are
documented in Atlas `docs/COMPACT_STRUCTURE_DETAILS.md`.

## Delivery and checks

- Generated learner export: all twelve scopes, 199 files, 211,493,402 bytes.
  Manifest SHA256 `1020309637ec505685734efd07c8d77ec39a3df86faf4ca4abdcd6804b9f5590`.
- Review import: 846 files, 31 viewer artifacts, 22 bundled packages. Review
  presentation bindings refreshed; saved decisions are not migrated or approved.
- All 98 Atlas/review integration tests pass, including actual endpoint access,
  independent account/institution decisions and stale-revision rejection.
- TypeScript, full website build, model inventory and source/artifact checks pass.
- Actual website `/atlas/3d`, 375 × 812: selecting Right posterior communicating
  artery leaves a 353 × 191.4375 canvas and 38px camera row, versus the previous
  147.4375 canvas and 82px row. Structure info closes/reopens to the correct notes.
- Actual protected ACom worksheet opens the correct model. Desktop Details
  remains visible; at 375px it is hidden and Structure info opens that artery.
  The iframe document has matching 375px client and scroll widths.

All 136 models/143 paths/199,033,932 model bytes are unchanged. Independent
shoulder/female-pelvis/lower-limb modules, anatomy/teaching content, licensing,
administrator-review access and independent case/lecture entitlements remain
unchanged. No source scans, masks, new assets/dependencies or desktop PACS work.

Normal builders replaced generated JS/CSS; prior versions remain recoverable
in Git and learner differences were hash-verified into D recovery before import.
Historical fixtures remain unchanged; active delivery pins reflect this tested
source. Local-only delivery, not public release or clinical certification.
