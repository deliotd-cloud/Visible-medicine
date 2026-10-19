# Didanix Education fracture workbook integration

Implemented on the existing owner-only website release baseline `f96af253`.
Route: `/learn/fracture-review`. This replaces the route's temporary iframe with
an Education runtime mode. The older network-free reader remains available as
an offline review utility, but is no longer the website workflow.

## Delivered behaviour

- A private workbook catalog, local package preview and explicit import action.
  Opening a file only previews it. Import requires the uploader to attest pixel
  privacy review and educational reuse/storage authority for that exact package.
- Immutable stored images in the existing R2 binding, workbook ownership and
  upload attestation in D1. A copied workbook URL reopens its selected workbook.
- Left case list, source-labelled image views, a real raster viewport with pan,
  keyboard pan, zoom, fit, brightness, contrast, invert and reset, and questions
  beside the viewer. Phone layouts stack the same panels without overflow.
- Automatic answer saving, retained answers across case changes and reloads,
  independent save queues, optimistic revisions, idempotent lost-response retries
  and explicit conflict resolution that preserves the unsaved response.
- Draft answer guidance is restricted to the owner's private review surface.
  Proposed marks remain draft; this route does not create learner attempts,
  confer exam/course access or publish an approved answer key.

## Reuse and boundaries

The entry is `EducationRuntime` with `accessMode="fracture-review"`. It shares
the existing Education stylesheet, branding and case-question grouping. The
existing exam's actual response field was extracted to
`EducationQuestionResponse` and is used by both modes. A separate raster adapter
handles PNG pixels without inventing DICOM UIDs, patient geometry or CT values.
Existing exam delivery, timing, manifests and learner rights are unchanged.

The API calls the existing active administrator + institution owner/admin
authorization on every request. Catalogs, manifests, answers and images are
scoped to both that user and institution. Writes require loaded account context.
Responses are private/no-store; media have no static or unprotected public URL.
Stored image size and SHA-256 are rechecked before delivery, then checked again
in the client. Package imports are bounded to 24 MiB; images to 8 MiB compressed,
8192 pixels on either axis and 16 million pixels per image. Original images and
patient/source paths are never written to the website source or static assets.

Migration `0009_complex_bloodscream.sql` adds only private-review workbook and
answer tables. It is schema-only, with no seed data or patient records. Clinical
PACS, CT masks, Atlas sources, paid lectures and entitlement policies are untouched.

## Owner's explicit upload hold

On 28 September the owner selected: **"Keep the images local until I finish that
review"** for the six-case / twelve-PNG pilot. No pilot images, package, private
identifiers or source evidence were uploaded. The local package passes the new
parser. Website publication includes generic code only and does not imply
case-level privacy, reuse, clinical or learner-release approval.

## Verification and release checkpoint

- 244 website tests pass, including seven new import/storage/answer/access tests.
  Actual Worker-route checks exercise authentication, denied roles, private R2
  delivery and immediate denial after membership revocation.
- 25 offline/package tests pass; TypeScript and production build pass.
- Synthetic-only browser checks cover local preview, import, image decoding,
  reopening, durable answers, case/view navigation, zoom/inversion/fit and
  conflicting tabs. Widths 1400/800/375/320 have no horizontal overflow.
- A read-only review prompted bounded, checksum-verified image retrieval.
- The source and website checkpoint is recorded after publication in
  `CHECKPOINT-INTEGRATED-WORKSPACE-20260928.md`; local verification artifacts live
  in ignored `.local/fracture-site/`. No test patient images enter the release.

The coordinating website checkout has newer unpublicised Atlas exports. This
release intentionally preserves version158's Atlas content. Synchronize only
fracture-owned files and the small shared runtime/schema/test changes; do not
replace newer generated Atlas files, test pins or the shared delivery history.
