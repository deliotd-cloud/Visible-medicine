# Fracture workspace — published checkpoint

Owner-requested website integration is live in **Sites version 158**.

- Route: https://visiblemedicine.com/learn/fracture-review
- Exact deployed source: `f96af25364fe1e856c063cbb9fc584298e0cd72f`.
- Source base: `c90670dc21b082d9d38fe79820f5958e5917f7c1`.
- Saved version: `appgprj_6a8b1e2c3d348191be844899e57ccbc6~appgver_d5ff53634570819185f96334cb63bec5`.
- Native deployment: `appgdep_6ababd3d83c4819190a50672817bd33d`, **succeeded**.
- Successful native URL: https://visible-medicine.deliotd.chatgpt.site;
  subsequent site inspection confirms the custom domain above and version 158.
- Audience remains custom, one owner, zero groups/external visitors. No access
  policy, role, enrolment, case entitlement or paid-lecture right was changed.

The website hosts only the generic sandboxed reader. Choose the locally prepared
`fracture-pilot.vm-fracture.json` in the original ignored pilot folder to open
the six cases. The browser cannot open a Windows path without this file-picker
step. No private package, original image, patient key or source locator was
uploaded. Clinical/privacy/reuse remain pending. Website notes are session-only;
the existing private worksheet is the durable review record.

## Evidence and recovery

- 237 website tests, 25 fracture Node tests, TypeScript and production build pass.
  The initial pilot's six Python grouping/import checks also passed.
- Local sandboxed browser: all twelve images decode, six cases navigate,
  responses survive case navigation, zoom/invert/fit/disclosure work, no overflow
  at 1280/375/320 pixels, zero network requests after import, Close clears images.
  A final Fit check confirms both image dimensions fit the viewport with contain.
  No actual source-image screenshots were captured/transmitted.
- Archive: 42,712,854 bytes, SHA256
  `acf6e361728d74aa03317a74424abddb30058a87ebdf5195372e701f6cdbcad5`.
  All 109 Atlas companion files retain exact hashes; all 143 static model paths
  are omitted through the existing verified protected-delivery script. Original
  public/source models remain intact. The generic reader is exact in the archive.
- Archive scan found zero inspected private identifier/image-hash matches, no
  private package or .local entries, and zero static GLBs.
- Source was pushed/read back by the Sites workflow. On Windows its build/package
  launch wrappers failed; the same package build and bundled packager completed
  through native npm and Git Bash with converted local paths. No source changes
  occurred between the final build, source push and verified packaging.
- Independent D source ZIP: `D:\CodexBackups\VisibleMedicine\fracture-exams\website-20260928\source.zip`,
  SHA256 `2c934a150a9ef0660a92b9ea3f205d75c9e4a79ad11bdac30475aa5ad8bea180`.
  Every archived changed-source file passed SHA256 readback. This contains generic
  source/docs only, not private images or notes. Adjacent verification.json and
  ignored pilot website-archive-verification.json contain the file manifest.
- Managed implementation checkout:
  `C:\Users\delio\.codex\worktrees\fracture-workspace\visible-medicine-site`.
  The development server has been stopped; this checkout remains for recovery.

## Main-chat synchronization — preserve the newer Atlas work

The main chat advanced Atlas integration to `d3d3a750` while this isolated
fracture release was prepared. Its generated files, delivery policy and current
`tests/head-neck-pilot.test.ts` pin were **not overwritten**. The fracture code,
route, reader, two navigation links, owned docs/scripts and a shared-plan entry
were copied into the shared website checkout with prior-content checks.

The isolated release used the earlier committed chest-wall Atlas baseline
`3f6f744`; it does not claim to publish the main chat's newer abdominal quiz.
The only Atlas-related test repair in that isolated release pins its already
committed export and keeps all byte/geometry assertions. That older test pin was
deliberately NOT copied to the main checkout.

Before the main chat's next Sites publication, reconcile its Git history with
Sites source commit `f96af253...`, retaining its newer Atlas files and the
fracture feature. Do not replace the shared checkout wholesale with this older
isolated baseline. No main-chat changes were staged or committed by this task.
This checkpoint is a documentation-only follow-up to the successful publication.
