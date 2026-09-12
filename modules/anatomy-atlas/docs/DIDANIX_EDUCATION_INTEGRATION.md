# Decision: use Elivion Didanix light/education for imaging

Owner instruction, 12 September 2026: use the Elivion Didanix **light/education version** as the DICOM/PACS viewer. This supersedes any assumption that this atlas should grow its own learner-facing DICOM/PACS stack. Preserve the detailed 3D atlas and integrate it with that viewer.

## Checked evidence

The task **Didanix Education - Architecture and Scope** describes a separate educational product, with independent deployment, authentication, education storage, assessment state and release lifecycle; the clinical Didanix/Elivion product is not the integration target. The **PACS RIS PATH EHR** task describes sharing a versioned read-only viewer core rather than joining clinical and teaching environments.

Read-only inspection of the current Education checkout at commit `1ba4cbd6d07670f16db775bfbc2a3835a70c18b4` confirmed:

- `web/lib/education-viewer-adapter.ts`: DICOM image-point ↔ patient-LPS projection, stored localizers, and shared-frame-of-reference/validated-registration gates. Its series model includes study/series/SOP/frame identity and reports unavailable spatial links rather than silently accepting a mismatched frame of reference.
- `02-system-architecture.md`: educational case publication, separate course OIDC integration, instructor presentations and private learner bookmarks; no access to clinical archives as a fallback.
- `web/lib/production-readiness.ts`: real DICOM/WSI adapters, course OIDC adapter, independent de-identification assurance and production demo/schema shutdown remain false in the current capability declaration. Viewer-core evidence is a separate required gate. A task's earlier test success is not evidence of a production-ready real DICOM integration.

No Education/clinical file, assessment attempt, database, user session or deployment was changed from this atlas task. No other task was resumed or sent an implementation command.

## Ownership and launch contract

| Component | Responsibility |
| --- | --- |
| Visible Medicine atlas | Anatomical IDs and source revisions; 3D selection, regional dissection, teaching text and concept relationships. |
| Didanix light/education | Authorised teaching cases, DICOM image rendering, series/frame navigation, windowing, localizers, viewer presentations and learner evidence. |
| Course/entitlement services | Current access decisions for anatomy subscription, individual imaging resources and each separately paid lecture. Authentication alone grants none of these. |

Use the existing `LearningLocator` and resource registry (`lib/learning-resource-types.ts`, `lib/learning-resources.ts`) as the atlas side of the link. The host resolves immutable resource/anchor revisions against its reviewed Education case publication. Do not encode raw DICOM UIDs, patient coordinates, storage URLs, access tokens or claims of approval in atlas URLs. Do not invent an Education endpoint, iframe URL or message schema before the actual adapter contract is agreed and implemented.

1. Start with a structure's existing CT/MRI/X-ray/US tab and one contextual **Open in Didanix Education** action once a cleared, authorised mapping exists. No duplicate default viewer toolbar or empty launch button before integration is available.
2. Pass only the stable education resource/anchor locator through the trusted host; recheck resource revision, rights/privacy/clinical clearance, anatomy source binding, entitlement and exam navigation policy at launch and when returning to the atlas. Display an access message for a locked lecture without exposing its protected media or annotation payload.
3. Keep two-direction conceptual links distinct from spatial synchronization. A lesson or independent ultrasound illustration can reference an anatomical concept without being the same subject, side or coordinate frame.
4. Patient-space crosshairs belong to the Education adapter. Spatial 3D↔scan linking requires reviewed segmentation/registration and immutable source identities. Matching names, nearby slices or a generic atlas mesh do not establish alignment. Preserve native acquisition-gap limits and report unsupported spatial linkage.
5. Agree the actual transport with the Education owner: versioned shared core/host adapter first; if embedding across origins, add explicit origin/source checks, a minimal versioned protocol, session-bound authorization and lifecycle cleanup. Never use wildcard postMessage receivers or client-side entitlement flags as authority.
6. Validate a cleared representative CT and MRI journey, X-ray/US navigation, stale/missing mappings, denied/expired lecture access, examination locks, mobile reflow and return navigation before release. Keep instructor presentations separate from learner bookmarks and attempts.

## Existing private tools

The local CT workbench and MRI import checker are internal engineering/radiologist review aids. They do not add a learner PACS, clinical worklists, diagnostic workflow, AI marketplace or clinical archive access. Their `.vmatlas`, `.vmcompare` and `.vmmr` files are local QA/review formats, **not** a requirement for Didanix Education or permission to redistribute scans. MRI source preparation can help verify future ingestion, but must not develop into a competing DICOM implementation.

Continue atlas anatomy, teaching and dissection improvements while the Education production/adapter gates are completed in their own task. Do not broaden the atlas goal to silently implement or alter that separate product.
