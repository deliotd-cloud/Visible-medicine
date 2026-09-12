# Visible Medicine — shared delivery plan

Last consolidated: 12 September 2026. This is the shared roadmap and decision log for the website and anatomy atlas, not a replacement for specialist evidence or complete chat transcripts.

## Coordination

The owner has designated **Visible Medicine — Website & Atlas** (task `01a07332-8768-7c20-a9ef-15e3acced95b`, formerly **Build 3D anatomy MVP**) as the main working chat. Website, atlas and cross-product requests can be made there together. Preserve **Visible medicine** (`01a02c32-4729-7501-9215-b0dc59355c13`) as a historical reference. Neither history was merged, deleted, archived or restarted.

Keep website and atlas code independently versioned for now. Use one shared roadmap here, not separate competing integration plans. The local workspace map in the main task identifies both existing folders. A Codex sidebar project has not been created or attached by this change: no project-edit tool was available. Both checkouts are already accessible from the coordinating task. Optional manual setup is documented in that workspace map.

Before changing a component, inspect its current worktree and applicable instructions. Check the owning task's current state when an overlapping edit is possible. Do not simultaneously edit the same files from two chats. Specialist tasks retain their boundaries; a user can explicitly reassign work. Do not wake tasks, change their goals, or write their data merely to collect status.

## Ownership and retained references

| Area | Working owner / reference | Integration boundary |
| --- | --- | --- |
| Website, Atlas, navigation, branding, shared roadmap | Main coordinating task above | Coordinate both source checkouts; preserve each release and recovery path. |
| CT-head segmentation | **Visible medicine— CT Head Atlas**, `01a03a21-5304-7a92-8cf1-df633cd11050` | Original masks, accepted edges, slice annotations and review workbook remain there. |
| Imaging core and educational viewer | **Didanix Education - Architecture and Scope**, `01a01c68-c95a-70b2-b998-e42e8e26f357` | Separate education product/core; no access to clinical archives or assessment mutations from the Atlas. |
| Clinical PACS | **PACS RIS PATH EHR**, `019f7809-c59b-7193-93d4-a5ee30e8b16d` | Out of scope for this website/Atlas integration. |
| Clinical sign-off | User, a radiologist | Explicit approval of the specified content and source revision; never infer whole-atlas approval. |

The six X-ray course references are retained below. Their latest chat reports are discovery pointers, not independently verified publication or clinical-clearance evidence:

| Exact task title | ID | Current reported work |
| --- | --- | --- |
| Visible Medicine — Bone Anatomy on X-ray | `01a05a34-f021-79c0-b58c-06e0f88001fb` | Human narration manuscript; non-narrated decks preserved. Do not recreate the rejected/deleted AI narration. |
| Visible Medicine – X-ray fracture basics… | `01a059a3-114a-74d1-99d0-e9db775a1b56` | Fracture course; dedicated spine material continues in its separate course task. |
| Visible Medicine — Joint Alignment and… | `01a05a35-4bc4-7a90-ba50-fafd9151ec6c` | Reported 60-slide polished/animated copy, original preserved. |
| Visible Medicine — Bone Healing and… | `01a05a36-0594-7433-b789-0fa13e966e2c` | Reported 55-slide reviewed teaching package. |
| Visible Medicine — Paediatric MSK X-ray… | `01a05a35-a526-7401-bf92-538ec1b759db` | Reported 60-slide polished package, clinical warnings retained. |
| Visible Medicine — X-ray of the Spine… | `01a05f25-4a05-7eb0-b169-45d6011d4de8` | Reported 82-slide package with manuscript, assessment and workbook-integration plan. |

Inspect actual final assets, notes, licences, clinical status and immutable versions before linking or publishing any course. No course media, recordings or lecture text has been copied into the Atlas by this consolidation.

## Decisions that govern both products

1. **One learner-facing product:** Visible Medicine. Reuse the current website's layout/tokens and approved logo assets; do not redraw rejected approximations or treat review artwork as a new approved production master. See [brand decisions](visible-medicine-logo-system.md).
2. **Atlas remains detailed and uncluttered:** regional and whole-body anatomy, selectable systems, dissection, isolate/fade, selectable explode mechanisms, search, screen-side labels, mobile controls and contextual teaching. Prefer compact side controls and progressive disclosure, with the model visible without excessive scrolling. Do not add empty toolbars to advertise future capabilities. Oral-cavity work has lower priority than the rest of the body.
3. **Didanix Education/light supplies imaging:** Visible Medicine branding can sit over the separate education viewer/core. This does not mean embedding the clinical PACS. Existing CT/MRI local QA tools are internal review utilities, not a competing learner PACS.
4. **Concept links are not registration:** stable anatomy ID → versioned resource → annotation/frame/slide anchor. CT/MRI/X-ray/US and lectures can refer to the same concept without sharing a patient or coordinate space. Spatial crosshairs require reviewed segmentation, DICOM frame identity and validated registration. Never position a generic donor mesh by matching a name alone.
5. **Independent access rights:** Atlas, imaging case, individual lecture/course and Studio access are separate server-enforced decisions. An Atlas subscription does not implicitly include paid lectures. Bundles may grant multiple rights only when explicitly defined. Check authorization again at protected media delivery, including expiry/revocation; client flags and an iframe are not paywalls. Keep a locked lecture's protected slides/media/answers inaccessible.
6. **Privacy and original-data preservation:** approved local research/teaching use is not public-release clearance. Source scans, masks, patient identifiers and unapproved derivatives stay local. Do not upload them to GitHub, Sites or external services. No clinical/educational storage, identity or release coupling.
7. **Clinical evidence:** comprehensive teaching remains draft until revision-bound radiologist sign-off. A passing test, AI image or licence audit is not anatomical or clinical validation. Do not invent missing nerves, continuity, image findings or approvals to complete a catalogue.
8. **Commercial compatibility:** preserve the licence/provenance audit for every dependency, model, texture, font and dataset. Use no-fee, commercial-compatible assets with retained compatible notices; reject non-commercial, unknown-rights or mandatory-fee material. Original demo geometry must be labelled when validated assets are unavailable. This is not a guarantee of free domains, infrastructure or third-party services. No new paid provider, contract, billing or public audience is authorized by consolidation.
9. **Durable progress:** save source, exact source/asset hashes and checkpoints; maintain GitHub and verified D-drive recovery. A local commit, remote source push and successful deployed version are three different states. Never describe one as all three.

### Superseded wording

The earlier production-plan suggestion that an Individual tier might include official courses is provisional, not a blanket paid-course grant. Decision 5 controls. Earlier wording reserving the word Didanix for clinical use does not override the user's selection of the separate **Education/light** technology; clinical separation remains mandatory. The standalone atlas is no longer the only integration deliverable: a contained shoulder pilot now exists in the website.

## Verified checkpoint before this documentation change

| Deliverable | Evidence | What it does not prove |
| --- | --- | --- |
| Atlas source with optional Education selection adapter | Commit `4585339be44aa819bc407090c109183255861653`; actual synthetic adapter/bridge checks: 94 pass | No real-DICOM, browser/device, clinical or complete server-auth acceptance. |
| Website shoulder module | Commit `873b1b7f74adbc7b8c70e0e95eda7c810792794a`; exported manifest binds source/assets; website suite 39/39 passes | No study connected by default; no production-cleared case/lecture anchors. |
| Website publication | Private version 38, successful deployment `appgdep_6aa590fbcc8c8191845ce54401824e31`; URL returned: `https://visible-medicine.deliotd.chatgpt.site` | Does not authorize anonymous access, public registration or charging. |
| GitHub | `deliotd-cloud/Visible-medicine`: website `main` at `873b1b7…`; Atlas backup branch `backup/anatomy-atlas-2026-09-06` at `bb695ae…` | These are pre-documentation checkpoint hashes, not a claim about future HEAD. |
| D-drive recovery | Atlas and website incremental bundles imported into the existing recovery verifier; full Git object check passed; archive hashes recorded | Incremental bundles require their preserved base chain. |
| Standalone atlas publication | Still version 171; latest large upload timed out and version history was reconciled | Source and recovery are newer than that hosted standalone version. Do not silently claim it updated. |

Details: [shoulder pilot](shoulder-atlas-pilot.md), Atlas `docs/DIDANIX_SELECTION_ADAPTER.md` and local `work/DIDANIX-LINK-CHECKPOINT-20260912.md`. Documentation-only commits after this checkpoint do not rebuild or redeploy the product.

## CT-head handover: preserve, do not redo here

Latest specialist-chat review reports both anterior cerebellar edges accepted and preserved. Its most recent user request identifies axial midbrain overcoverage and insufficient superior extent on sagittal/coronal views. Progress was saved without further mask changes. Resume that correction through the CT-head task, inspect its latest saved state, and protect accepted cerebellar boundaries. Partial boundary acceptance is not full structure or release approval. No scan/mask review or modification was performed during this consolidation.

## Ordered delivery roadmap

| Step | Work | Completion evidence / gate |
| --- | --- | --- |
| 1 — Coordinate | Use this chat; maintain this plan, decision log, workspace map and recovery checkpoint. Keep specialist histories. | Files saved and GitHub/D recovery verified. Optional sidebar project setup remains manual. |
| 2 — Imaging correctness | Audit the actual education frame/localizer code, including multi-frame SOP selection, row/column spacing, oblique axes, finite dimensions, acquisition gaps and registration validation. Add focused synthetic regressions; fix within the owning code scope. | Known-coordinate tests, correct unavailable/ambiguous handling and no false synchronization. Follow with real Education acceptance, not synthetic checks alone. |
| 3 — One end-to-end learning journey | Bind the existing Atlas selection port to the actual Education annotation/reveal events after its readiness gates. Use one explicitly cleared CT study, then MRI; add X-ray and US anchors as cleared. Include one approved lecture section. | Both directions, correct frame/anchor, stale revision, case change, deny/revoke, independent lecture rights, exam locks and return navigation tested. No fabricated case/URL/approval. |
| 4 — Regional and full-body parity | Continue source/coverage-led additions and dissection for the major remaining body regions, nerves and organs. Review explode distance, label sides, occlusion, restore/reset and small-screen operation. | Per-region anatomy/source ledger and visual/device evidence; respect held assets. Do not mistake source-piece counts for complete anatomy. |
| 5 — Teaching and courses | Complete structure-specific Anatomy, Function, CT, MRI, Ultrasound, Pathology, Clinical and Quiz content; connect the X-ray course packages using immutable IDs. | Cited original drafts, explicit unknown/absent content, licence clearance and revision-bound radiologist review. Validate lecture entitlement separately. |
| 6 — Controlled integrated pilot | Harden identity/tenancy, media delivery, review/export, course launch and accessibility. Complete real-browser, mobile, keyboard, performance and restore checks. | End-to-end evidence against [pilot readiness](pilot-readiness.md); no broad acceptance inferred from unit tests. |
| 7 — Public/commercial launch | Approve intended use, privacy/legal details, institution support, domain and hosting, monitoring and any billing providers. | Owner-approved audience, cleared medical content, security/privacy/operations sign-offs and tested rollback. No external commitments without authority. |

Steps 4–5 can continue while external gates in 2–3 wait. Ask the radiologist for bounded reviews throughout, not one huge final sign-off. Keep technical readiness, clinical acceptance, media-release clearance and commercial activation separate. The full atlas goal remains active; these milestones do not redefine completion as a software demo.

## Decision log

- **2026-09-12 — owner:** This task becomes the main Visible Medicine website/Atlas chat; preserve the other histories and specialist work.
- **2026-09-12 — carried forward owner decisions:** Didanix light/education for imaging; independent paid-lecture entitlement; user is the radiologist sign-off owner; local datasets remain private pending release evidence; detailed atlas with compact navigation; lower priority for oral cavity.
- **2026-09-12 — implementation:** Optional same-origin two-way selection port saved, backed up and included in website private version 38; no real study attached. Standalone deployment remains older after upload timeout.
- **2026-09-12 — consolidation boundary:** No new project folders attached in the Codex sidebar, no histories physically merged, no specialist task awakened, no repository moved and no new service activated.
- **2026-09-12 — imaging correctness:** [Website geometry safeguards](education-geometry.md) correct reproduced multi-frame selection, invalid-dimension and outside-slab mapping defects. Focused synthetic regression coverage adds orientation, acquisition gaps, ambiguity and affine-registration checks. This advances roadmap step 2; real Didanix ingestion, browser/device and clinical acceptance remain open. No separate Education/clinical source or mask was modified.

- **2026-09-12 — stale-view safeguards:** [Request lifecycle](education-request-lifecycle.md) binds localizer/restore, saved-list and save-feedback responses to the current case/workbook/view and request. Scene restoration waits for spatial mapping; obsolete results/errors/completion cannot overwrite the newer view. Synthetic request tests extend roadmap step 2, with no new interface controls or clinical acceptance. Actual browser/Didanix delay, revocation and device acceptance remain open; exact backup/publication evidence is kept in the coordinating task checkpoint.

- **2026-09-12 — regional teaching:** Atlas `66f87a5c0d23b2fe4d4277183e3d583ce0fc2722` adds eight female-pelvic support concepts across 14 previously untaught selections, with 56 extended draft placements and self-checks in the existing panel. All prior 17 lessons and 41 pelvic meshes remain unchanged; 31/41 selections now have introductory teaching. Source/React-render/practice/review/TypeScript/build checks passed, with no clinical/device/real-imaging approval. GitHub Atlas backup branch is verified at `a1d1cca19dfe4f4547333aeb9c3aca259c627fc7`; D incremental recovery was verified. Standalone publication remains version 171 after the native 125 MB archive upload timed out and version history was reconciled. Website runtime remains private version 40; this plan update is documentation only. See the main task's `work/PELVIC-SUPPORT-CHECKPOINT-20260912.md`. Do not mistake repeated publication failure for loss of the source or approval to upload private scans.

For each substantive milestone append: user decision or requirement; affected source/artifact revision; verification scope; clinical/privacy/rights status; local/GitHub/D/deployment state; remaining next action. Record uncertainty rather than marking a gate complete from a chat report alone.

- **2026-09-12 — regional website integration:** The [female-pelvis pilot](female-pelvis-atlas-pilot.md) adds the actual HRA dissection beside the shoulder in the main website, compiled from Atlas `76dec1969b4952a7009e232599172f3145dc3096`. All 41 meshes, eight study views, 31 taught selections and six held source groups retain their identities and limitations. Strict same-origin delivery applies consistently to initial loading, retry and practice without changing standalone paths. Full notices and export hashes are included; no new package/font/texture/payment service or private case/review payload is added. Atlas source/teaching/SSR/review/TypeScript/build and website 62-test/TypeScript/build checks pass. Clinical, real-image and device acceptance remain open. See the main task's `work/PELVIC-MODULE-CHECKPOINT-20260912.md` for verified GitHub, D-drive and private website publication; do not infer a standalone Atlas deployment from this website export. Continue other regional parity and teaching work while protected imaging/lecture gates wait.

- **2026-09-12 — actual pelvic browser QA:** Restored the local preview without killing a process and reproduced/fixed versioned-model URL rejection that the earlier WebGL-stubbed test missed. Atlas `101dc73234f7a8a503e95f53053cc43c66264d69` also provides readable study/camera names and a vertical-only compact panel. Actual browser geometry, eight studies, all separation mechanisms, source-position restoration, search, undo/redo, practice return and a 390×844 viewport were exercised. Geometry, licences, private scans/masks and clinical status are unchanged. Physical touch devices, 200% text, full accessibility, anatomical review and an unattributed browser MutationObserver error remain open. The [pilot evidence](female-pelvis-atlas-pilot.md) states the sample's limits; use the main task's newer `work/PELVIC-BROWSER-CHECKPOINT-20260912.md` for exact GitHub/D/private-publication state.

- **2026-09-12 — compact spatial labels:** The shared label renderer now adapts density to the actual canvas, prioritizes selected names and preserves projected left/right placement without shrinking text or adding controls. Both website modules are regenerated from Atlas `3e1c297abae999015f18c286847dd070d2fe86f6`; source models, teaching and private imaging data are unchanged. Actual phone-sized pelvis/shoulder, desktop resize, search/keyboard label selection, posterior side changes, explode/reset and exam label suppression were checked. See [responsive label evidence and remaining gates](responsive-atlas-labels.md) and the main task's `work/RESPONSIVE-LABEL-CHECKPOINT-20260912.md` for verified recovery/publication. Continue broader regional anatomy and teaching; do not interpret this UI milestone as full Atlas completion.
