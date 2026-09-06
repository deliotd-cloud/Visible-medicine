# Visible Medicine anatomy — step-by-step delivery goal

## Goal and release boundary

Deliver a branded, well-tested anatomy module for the Visible Medicine website, beginning with a coherent shoulder teaching pilot and reusing the same architecture across the body. Software delivery is separate from clinical approval. Keep the current source meshes, anatomical IDs and licensing trail intact. No paid APIs, commissioned assets or additional subscriptions are authorised.

## Ordered milestones

| Step | Deliverable | Acceptance gate | Status |
| --- | --- | --- | --- |
| 1 | Official brand alignment | Exact approved lockups, documented palette and diagram conventions; no new webfont dependency | Implemented; hashes verified |
| 2 | Predictable dissection and explode | Stable origin, greater relative spacing, exact zero reassembly, automatic framing without snapping orbit, optional fixed skeleton and original-position reference | Implemented; numerical and sampled browser checks pass |
| 3 | Browser verification | Shoulder, small region, spine and whole body; desktop/tablet/mobile widths; selection, controls, restore and practice; record limitations | Sampled checks completed; physical-device/accessibility gates remain |
| 4 | Coordinated shoulder illustrations | Anterior, posterior, lateral and deep/skeletal plates rendered from the same licensed meshes, shared selection; not independently invented anatomy | Implemented and browser checked |
| 5 | Review tracking | Separate geometry, teaching-content and imaging status for each selected structure; reviewer, evidence and version fields; no implied sign-off | Working private shoulder dashboard, central persistence, evidence/issues and immutable version history implemented; actual specialist sign-offs pending |
| 6 | Shoulder teaching pilot | Specialist checks all nine structures, attachments, relationships, clinical notes and question answers; missing capsule/labrum/bursa explicit | Specialist review required |
| 7 | Priority anatomy completion | Rights-cleared, spatially registered capsule/labrum/bursa, then peripheral nerves, abdominal wall/back and pelvic floor; no relabelled or mismatched meshes | Validated source input required |
| 8 | Licensed imaging and synchronisation | De-identified CT/MRI/US with explicit reuse rights; measured transforms and landmark registration; review by radiologist; no simulated scan presented as real | Source and review required |
| 9 | Visible Medicine integration | Private release passes tests; host chooses route/embed, access and deployment; public/clinical launch gated on review | Software prepared for private review; main-website integration and public approval pending |

## Completed software milestone — 6 September 2026

The approved identity and first four software steps are implemented. Review tracking has a conservative, clearly labelled foundation, not a fictional clinical sign-off. See [browser QA](BROWSER_QA.md), [brand provenance](BRAND_ALIGNMENT.md), [explode evidence](EXPLODE_REVIEW.md), [review/imaging checklist](REVIEW_AND_IMAGING.md) and [website integration guide](WEBSITE_INTEGRATION.md). No new anatomy meshes or medical images were imported in this milestone.

The subsequent review-workspace milestone replaces the status-only foundation for the shoulder with a working private review store; see [review workspace](REVIEW_WORKSPACE.md). Next executable sequence: perform the shoulder review (step 6), accept rights-cleared and spatially validated additions (step 7), add reviewed scans and registration (step 8), and perform host-site integration plus release approval (step 9). Verified team roles and shared approval workflow are still future work. Do not mark clinical steps complete merely because the software can record them.

## How to carry out the clinical/source-dependent work

### Additional completed software milestone — deep inspection

The shoulder, all regional viewers and whole body now share three-plane surface cutaways, tissue transparency, clipped-surface picking and selection recovery. Regional orthographic illustration and 5/10/20-question identification sessions extend the existing interaction model. [Deep inspection](DEEP_INSPECTION.md) records 984,199 automated assertions and the remaining new-control visual/device checks. Source geometry and coverage are unchanged. This advances the software under steps 2–4; it does **not** complete clinical/source-dependent steps 6–8 or main-website integration.

### Clinical/source sequence

1. For each missing structure, record its stable ID, side, parent region, relationships and required level of detail. Distinguish a whole structure from its component surfaces.
2. Accept only evidence-backed commercial reuse rights and archive the exact licence, creator, source URL, file hash and adaptation notes. Being viewable online does not grant permission to copy, trace or train on a diagram.
3. Preserve source coordinates. Evaluate new meshes against registered bones and attachment landmarks; reject visually plausible geometry that fails correspondence. Do not mix source body versions using a guessed translation.
4. Use AI only for draft assistance within documented rights. Generated appearance is not anatomical evidence, and another view of a generated drawing is not a registered 3D model.
5. Have an anatomist and relevant clinical specialist review geometry/relationships. Have a radiologist review imaging and correlates. Record reviewer identity, date, evidence, asset/content hashes and scope independently.
6. Run the same import, ID, source-hash, dissection, camera and browser checks after every accepted addition. Publish only the reviewed scope; disclose remaining omissions.

## Cost boundary

The module adds no paid runtime service. Existing permissive software and attributed CC BY 4.0 models remain in use. Hosting, specialist review, future scans and commissioned modelling may have costs; perpetual free hosting or free professional validation cannot be guaranteed. Keep an exportable self-hosting path.
