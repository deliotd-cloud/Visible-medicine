# Visible Medicine: linked anatomy and learning

Status: integration proposal and related-project inventory, recorded 9 September 2026. No external project, patient image, presentation or clinical approval was changed/imported. This plan is not a deployed connection.

## Existing projects to reuse

The user's **Visible medicine— CT Head Atlas** task owns the provisional CT and MRI head atlas. Do not create a competing head atlas here. The latest accessible task preview lagged behind its saved project state, so the local `work/segmentation/LATEST_ATLAS_STATE.json` was also checked read-only. The following is a dated observation, not a permanent release status:

- CT: `CTH-B02-LOBES-EXTENT`; four revised frontal/temporal extent drafts within an eight-structure review batch. The checkpoint states `DRAFT_REVISIONS_FOR_CONSULTANT_REVIEW` and `NOT_FOR_PUBLICATION`. Some earlier boundaries have scoped acceptance; this is not approval of complete structures or every current revision. The tentorium remains without geometry in that checkpoint.
- MRI: the T1/T2 selection record states `LOCAL_WORKING_VOLUMES_PREPARED_PENDING_IMAGE_REVIEW`. MRI segmentation had not started, privacy review was pending, normality was not confirmed, pixels had been decoded locally but not transferred to chat, and the release state was `NOT_FOR_SHARING`.
- Preserve each sequence's native geometry. Check within-subject alignment and any registration; review transferred labels on the target sequence. CT subject masks must not be treated as the MRI subject's anatomy. Review points, curves, partial masks and complete masks require different representation types.
- No scans, identifiers, masks, local scene files or private reviewer records are copied into this repository. Future image/pixel sharing needs explicit authorized scope. Owner permission alone does not resolve the remaining privacy/normality/quality/publication gates.

The presentation tasks and local output listings establish these existing course topics:

| Existing course topic | Evidence observed | Useful atlas connection (proposed) |
| --- | --- | --- |
| Bone Anatomy on X-ray: From Structure to Image | **Visible Medicine — Bone Anatomy on X-ray** task: clean non-narrated decks and a human narration manuscript retained. The later task report supersedes older AI-audio delivery claims; do not link deleted AI recordings or private voice references. | Bones/landmarks → relevant radiographic projection and stable lecture slide/build. |
| Basics of Fractures on X-ray | **Visible Medicine – X-ray fracture basics…** task reports a revised 61-slide animated deck; clinician approval remains required. | Normal bone/joint → fracture teaching topic, clearly separate from normal anatomy. |
| Joint Alignment and Dislocations on X-ray | Local polished/animated deck exists. Completion report records a 60-slide draft, 24-item question bank and rights register; synthetic radiograph-style images are not patient radiographs. The report is not a fresh visual audit of every later deck revision. | Joint surfaces/relations → alignment views and dislocation lessons. |
| Bone Healing, Fixation and Complications on X-ray | Local deck exists; completion report records 55 slides, 25 questions and seven synthetic teaching visuals, with clinical/local-pathway review gates. | Bone region → healing/fixation lesson and source-mapped assessment. |
| Paediatric Musculoskeletal X-ray Essentials | Local PPTX and workbook/completion-report filenames confirmed. Task reading failed; slide content/rights/review were not independently inspected here. | Separate age-specific learning track; do not imply the adult 3D reference models paediatric ossification. |
| X-ray of the Spine and Sacrum | Dedicated task was requested after the introductory spine section in fracture basics. Local PPTX and completion report exist; full task content was unavailable. | Vertebral region/level → dedicated spine lesson, without guessing unresolved level assignments. |
| Comprehensive Abdominal Ultrasound | Creation request found in the fracture-course task; local course PPTX and completion report confirmed. The course's full task was unavailable. | Abdominal organ → reviewed scan window/probe orientation, clip and lecture. |
| Testicular Ultrasound | Creation request found in the fracture-course task; local course PPTX and clinical-signoff/completion report confirmed. The course's full task was unavailable. | Scrotal/testicular structures → reviewed ultrasound anatomy and examination lesson. |

These are course/project inventories, not proof that the presentations are uploaded, clinically approved or connected to a website player. Existing course manuscripts, objective/question IDs, source/rights logs and animation builds should be reused after checking their actual final revisions. No extra narration service, paid API or asset copying is introduced.

## One anatomical index, several resource types

Keep one stable anatomical identity, with explicit scope-specific representations. The current atlas already has product IDs, source FMA references, mesh hashes and a source-based shoulder/body mapping. A future shared resource index should link to those records instead of copying the same teaching into each viewer.

| Resource | Minimum proposed binding/anchor |
| --- | --- |
| 3D anatomy | Canonical structure ID plus representation scope, asset revision and exact mesh/node or aggregate/component mapping. |
| CT or MRI annotation | Approved educational resource ID, series/sequence revision, annotation/segment ID and the annotation's own frame/geometry metadata. Keep CT/MRI and different subjects distinct. |
| X-ray | Image revision, projection/laterality, reviewed 2D annotation/region ID; optional image coordinates are local to that image, not a 3D registration. |
| Ultrasound | Clip/image revision, frame or timestamp and reviewed annotation; probe orientation/window and calibration metadata where actually available. |
| Lecture/presentation | Course, lesson, immutable content revision and stable slide ID. Add build/animation-step ID and timecode only when a real player/recording supports them. Slide number alone is not stable after editing. |
| Practice | Question ID/revision, learning objective and explicit linked structure/resource IDs. Completion is separate from a clinically validated competency judgement. |

A resource record also needs title, modality/kind, region, age group, laterality, publication/review state, rights/provenance, accessibility text and access policy. A correspondence record needs relation (`exact`, `component`, `broader` or `related`), author/revision and its own review status. Never infer equivalence solely from a label/name or reuse one project's approval for another representation.

No concrete slide IDs, slice numbers, URLs, timestamps or registration matrices are invented in this proposal. Agree and verify them with the owning projects first. Unknown/missing correspondences should produce an honest unavailable state, not the nearest plausible structure.

## Simple learner navigation

Keep the 3D model and one compact selected-structure panel. Offer **Related learning** with available resources grouped as Images (CT/MRI/X-ray/US), Lessons and Practice. Show counts from real eligible records, not empty tabs promising assets. Keep the present eight-topic content contract unchanged until a deliberate migration is agreed.

Selecting a resource should open its exact annotation or lesson anchor while preserving the current anatomy selection and a return link. A lecture can offer **View in 3D**; the atlas can offer **Open this lesson**. Keep compare mode optional: at most two panes, one imaging modality at a time, with independent camera/view controls unless correspondence has been validated. On mobile, switch between views rather than force several tiny simultaneous panes.

Suggested first linking pilot: head/neck 3D selection ↔ an owner-reviewed annotation in the existing CT head project ↔ a reviewed MRI T1/T2 counterpart when available. In parallel, one bone/landmark ↔ the existing Bone Anatomy on X-ray lesson. These are bounded interoperability tests, not blanket auto-registration.

## Identity linking is not spatial synchronization

Existing `lib/imaging-sync.ts` is an opt-in, same-document selection bridge. Its adapter advertises CT/MRI/US/multimodal, not a dedicated X-ray adapter. It rejects unknown fields and duplicates and has disposal/loop guards. It does not embed a viewer, cross an origin boundary or accept patient coordinates. `lib/anatomy-link-registry.ts` handles source representation mapping, not a patient-space transform.

Deliver semantic selection/deep links first. Later crosshair or segmentation synchronization needs explicit correspondence and validated transforms in the correct image frame, including orientation, position and spacing. DICOM defines image-plane metadata; that metadata alone does not register a generic model to an individual scan. See [DICOM image-plane module](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.2.html).

X-ray is a projection and ultrasound may be a freehand plane/time sequence. Do not apply a generic CT-volume crosshair assumption to them. Exploded mesh positions, display centres and label anchors must never be exported as patient-space coordinates.

## Implementation order and release gates

1. Agree shared resource/correspondence schema and stable course/annotation anchors with the owning projects. Reuse their actual manifests and objective IDs; no duplicate head dataset or course production.
2. Add a small, tested read-only resource registry with only rights-cleared, eligible links. Test missing/stale/deleted anchors, side/age mismatch, unavailable resources and current review state.
3. Implement bidirectional deep links and return-to-context behaviour; verify authorization on every resource independently. No patient information or credentials in URL parameters; no analytics around private scans by default.
4. Connect one actual head-imaging example and one existing X-ray course lesson. Preserve synthetic/patient-image distinctions and partial/full geometry scope. Do not transfer MRI pixels under the authority of this planning request.
5. Add optional two-pane comparison and an explicitly authorized cross-origin bridge only if required; validate origins, source windows, message schemas and access policy. Do not broaden the current bridge silently.
6. Add spatial synchronization only after reviewed frame/registration/segmentation evidence and failure tests. Obtain device, accessibility, privacy, clinical, content-rights and deployment approval before a public launch.

The other projects were only inspected. Their latest changes, approved source manifests, hosted routes/player contracts and access requirements must be refreshed before implementation. The current atlas's private access and its deferred GitHub status remain unchanged.
