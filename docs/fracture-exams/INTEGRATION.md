# Integration requirements for the main Website & Atlas chat

**Implementation update:** the private stored-workbook integration is now built;
see `WORKSPACE-INTEGRATION-20260928.md` for the actual code reuse, private storage,
saved answers and verification. The owner explicitly retains the six-case image
upload hold pending review. The earlier discovery notes below are historical;
candidate exam/learner publication remains a separate future release.

## Owner clarification — 28 September 2026

The intended product is a fracture workbook inside the website's Didanix
Education workspace: select a case, open its stored images in the viewer, and
answer its questions beside the images. Reuse the Didanix Education chat's
implementation and workflow. The version-158 browser-local file reader is a
temporary private review tool and does **not** complete that integration.

Read-only source comparison confirmed the reuse path:

- Education source: `C:/Users/delio/Documents/Codex/2026-08-20/didanix-education/outputs/Didanix-Education`.
- Website `components/EducationRuntime.tsx` derives from Education
  `web/app/DidanixEducationApp.tsx`; retain the website's later changes rather
  than overwriting it with the older Education file.
- `lib/education-case-grouping.ts`, `lib/attempt-policy.ts`, and
  `lib/workbook-access.ts` match Education source after newline normalization.
  Reuse these for grouped questions, attempts and workbook admission.
- The existing web image stage is illustrative. The real desktop renderer is
  `desktop/src/cornerstone.ts`, with DICOM admission in `desktop/src/dicom.ts`.
  Its browser rendering code is a reuse candidate; Electron packaging, local
  file admission and desktop session assumptions are not hosted media storage.
- Pilot originals are PNG. Add a truthful raster-media adapter to the existing
  Education case/viewer flow, not fake DICOM metadata or another parallel exam
  engine. The existing DICOM ingestion endpoint does not accept this format.
- Persistent protected media delivery and case/question mapping remain to be
  implemented. Hosting the images still requires the previously requested
  exact-case privacy/reuse clearance; this architectural direction is not a
  clinical or media-release decision. Clinical PACS and original masks stay
  outside the integration.

This clarification changes the implementation direction only. No new viewer,
stored cases, upload, publication or approval is claimed by this note.

Owner: `01a07332-8768-7c20-a9ef-15e3acced95b`. This increment deliberately owns
only `scripts/fracture-exams/` and `docs/fracture-exams/`, plus ignored private
outputs. The active main chat was read without waking it; it was implementing
the chest-wall guided tour. No Atlas source/runtime/review files, clinical PACS,
CT masks, entitlement policies, website routes or database records were edited.

## Reuse the existing platform

Inspection found reusable question/rubric/version fields in
`lib/assessment-manifest.ts`, course/workbook assignment checks in
`lib/workbook-access.ts`, staff roles in `lib/workbook-access-policy.ts`,
server deadline/preflight enforcement in `lib/attempt-policy.ts`, and
case/question grouping in `lib/education-case-grouping.ts`.

The existing assessment manifest media union is DICOM/WSI/mixed; it has no
explicit raster X-ray series contract. **Do not fabricate DICOM UIDs or pretend
PNG files are DICOM.** A future integration must add a reviewed, versioned
raster media type to the separate Didanix Education/light pipeline, with
immutable image hashes and approved original-resolution display. Reuse its
assessment workflow rather than building a parallel clinical viewer.

No existing endpoint was exercised and no server adapter was activated here.
The private contract is an import/review staging format, not an accepted
production AssessmentManifest. Logical `assets/` refs need a cleared resolver
at that boundary. Source locators, patient keys, original filenames, annotations,
answers and draft explanations must never be copied into learner bundles.

## Reusable examination structure

| Concern | Proposed behaviour / integration gate |
| --- | --- |
| Banks and exams | Immutable case revisions tagged with reviewed region, age domain, difficulty and learning objectives; assemble versioned region/difficulty blueprints only from cleared cases. Current pilot is wrist only; difficulty stays null. |
| Images | Keep complete studies and associated views together. Reserve all known studies for each patient to one teaching/assessment partition; compare image hashes across banks. Unknown or cross-dataset linkage requires review before use. |
| Questions | Long-text interpretation first; add single-choice only after reviewed distractors exist. Keep diagnosis, localisation, supporting findings and view/laterality items source-grounded. Never treat missing annotation as absence. |
| Timed mode | Existing server-owned deadline, preflight, attempt states, autosave/reconnect and expiry checks. Withhold source labels, annotation overlays, answers and explanations from delivered payloads. Proposed pilot duration is 18 minutes, not calibrated. |
| Revision mode | Separate permissioned teaching presentation; submit an answer before revealing the approved key, supporting findings and explanation. Timed questions exposed here count as compromised for future assessment. |
| Marking | Use existing versioned rubric/criterion structure and examiner moderation. Pilot suggests 1 classification + 2 evidence + 1 side/views per case. Null keys cannot auto-score. No pass standard is set. |
| Review | Independent clinical, privacy and reuse evidence for the exact content/source revision; later edits invalidate records. A review event never grants publication authority. |
| Authoring | Reuse Studio case/question authoring after schema mapping, with one case review panel and progressive answer/evidence disclosure. Use existing Visible Medicine typography, paper/teal/ink tokens. Offline packet already follows these tokens. |

## Independent access and release work still required

- Authenticate staff/learners with the existing website identity and recheck
  separate exam/course assignment and case access at each media/key delivery.
  Atlas membership must not grant an exam, case or paid lecture.
- Keep approved answer keys and marking material server-side. Hiding them with
  `<details>` is appropriate only for the private reviewer packet, never learner
  exam security. Do not serve this reviewer HTML as a candidate exam.
- Add explicit commercial/privacy/media release records and audience gates;
  per-case hashes must bind clearance to the exact delivered rendition. Any
  approved redaction creates a new derivative hash and a fresh review revision.
- Prevent browser caching and unprotected range/download routes from bypassing
  revocation; test access expiry, independent paid-lecture rights and assignment
  revocation using real authorized test accounts at integration time.
- Validate raster transport, view labels, annotation geometry, mobile zoom,
  keyboard use, timeout/recovery, result release and rollback end to end.
  The current static packet has no authenticated server or timing engine.

Publication, learner use, entitlement changes and clinical approval were not
authorized by this task and have not occurred.
