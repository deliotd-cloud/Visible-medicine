# Shoulder soft-tissue X-ray delivery

Atlas `beaa104c53e6aa62bb485febd1c47517b346de01` imported locally into learner
modules and protected Clinical Review. Six previously pending dedicated-shoulder
topics now contain original referenced drafts: deltoid, supraspinatus,
infraspinatus, subscapularis, long-head biceps and teres minor. All nine shoulder
selections have introductory X-ray teaching, not a complete radiographic course.

The import preserves all136 models/143 paths, independent specimens and existing
panel layout. Source changes affect only six teaching revisions; website renderer
adaptations are conservatively rebound to the new integration fingerprint.
No saved clinical decisions are migrated, no scans are connected and no access
policy changes. Third-party reading links do not authorize copying their images.

## Evidence

- Review verifier:880 source files,31 viewer files,22 packages. Integration hash
  `4847995850dd1e47ea549de7e66d70c46f2fa812e1edb314086723d81f4d5c4e`.
- All250 local website tests, TypeScript and production build pass. The local
  workspace includes separate unstaged fracture work, excluded from this commit.
  A new delivery test binds the learner lesson source to the imported review
  source and checks draft status, independent access, and absent imaging revisions.
- Source validation additionally covers all six lessons at375/1280px (12cases),
  exact-parent preservation and33,460 content-contract assertions.
- Actual website375×812 check: Supraspinatus selected through learner search and
  the protected review URL. Imaging → X-ray displays identical title, body,
  bullets and three references in both views, with draft/no-study warnings,
  no X-ray reference-plane button and no outer/iframe horizontal overflow.
- No clinical approvals submitted or patient data uploaded. Physical-device,
  screen-reader and clinical acceptance remain separate requirements.

Logs and recovery receipt are in the coordination workspace under
`work/shoulder-soft-xray-*20260928.*`. Existing large-chunk build warnings remain.
Initial delivery-test failure assumed a regional-only manifest field existed on
the shoulder export; corrected to verify its actual standalone-review field and
all nine imaging fingerprints. No product code or safety check was weakened.

No website publication this checkpoint. Clinical drafts await the radiologist's
revision-bound review. Native MRI remains done.
