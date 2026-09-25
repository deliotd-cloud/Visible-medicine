# First release: a dependable, reviewed educational atlas

Owner-approved milestone, 18 September 2026. This is a launch checkpoint within
the full existing Atlas/website goal, not a replacement or reduction of it.
The present private prototype is not a clinically approved learner release.

## Delivery sequence and exit gates

| Gate | Deliverable and evidence required | Responsibility |
| --- | --- | --- |
| 1. Scope | Whole-body overview and regional navigation; exact shipped structure/study allowlist, explicit limitations and draft/unavailable labels. Freeze an exact Atlas and website candidate revision. | Agent prepares; owner accepts scope |
| 2. Viewer | Explore and in-page regional Dissect work as described; rotate/zoom/select/search, compact systems, isolate/hide/undo/reset, label placement, explode/reassembly and failure recovery pass the regional acceptance matrix. | Agent; owner/device review |
| 3. Teaching | Each clinically approved shipped structure has correct identity/laterality, essential anatomy/function, relevant relationships/clinical text, traceable sources and exact-revision sign-off. Relevant imaging prose is reviewed separately. Empty tabs must not masquerade as finished content; quizzes remain formative. | Agent drafts; radiologist signs |
| 4. Imaging | One cleared CT-head case opens in Didanix Education/light at the intended location and returns to the Atlas. Exact IDs, case clearance, segmentation acceptance and correspondence scope are recorded. Approximate links are visibly distinguished from validated spatial registration. | CT-head owner + radiologist + agent |
| 5. Access | Consistent branded routes; Atlas/case/lecture permissions enforced independently server-side. Allowed, denied, expired and signed-out journeys tested with no asset or paid-content bypass. Locked lectures preserve the learner's atlas context. | Agent; owner verifies offers |
| 6. Assurance | Shipped-asset commercial provenance/notices, privacy inventory, no unresolved blocker/major defects, representative-device/accessibility review, known limitations/correction route, exact GitHub/D recovery and tested deployment rollback. Explicit owner release decision. | Shared |

All six gates are mandatory for this agreed first release. A historical test pass,
deployment, licence audit, clinical sample or complete gate record alone is not
release authority. Do not fill approval fields on the owner's behalf. A failure
must be corrected or the affected feature removed from the proposed release
scope with a documented owner decision; never silently waive an exit criterion.

### Delivery-record drift check

The recorded review candidate was refreshed to private website version 149,
website `2c651aa` and embedded Atlas `749a4d1` on 25 September. It is a dated
snapshot, not a frozen learner release or a claim to track live cloud changes.
All six gates and clinical approval remain pending. Later coordination-only
Atlas commits do not change the embedded runtime revision.

Before using the candidate for review, run the read-only check from the Atlas:

```sh
node scripts/check-release-delivery.mjs <website-checkout> content/release-delivery/specimen-reassembly-20260925.json
node --test scripts/test-release-delivery.mjs scripts/test-release-readiness.mjs
```

This compares the clean website Git checkout with exact viewer/inventory bytes,
embedded Atlas revision, protected model/path counts and the saved native
publication/version response. A stale or mismatched record fails; nothing is
automatically rebased and no approvals are copied. The response snapshot cannot
prove current cloud state, audience, payload integrity or reviewer authenticity.
Confirm those through their existing authoritative checks when preparing release.

## First work package (started)

1. Save this scope and a fail-closed readiness record. No gate is marked complete
   merely because a related feature already exists.
2. Prepare the [11-selection review pilot](FIRST_RELEASE_REVIEW_PILOT.md) using
   existing review contexts, not a parallel approval system. Catch systematic
   errors before requesting review of hundreds of structures.
3. Integrate the already tested nested cardiac/ventricular practice into the
   website through the generated export. Preserve all existing model objects,
   independent viewers, access rules and source hashes; no new assets are needed.
4. Execute the acceptance matrix on that exact candidate. Fix observed defects,
   then expand the structure-specific clinical review queue region by region.
5. Follow the [CT-head handoff](FIRST_RELEASE_CT_HANDOFF.md) and coordinate the
   one-case Education connection without modifying masks or accepted boundaries.
   The current midbrain correction remains with the specialist task; a first
   mapping must use an actually accepted and cleared structure revision.
6. Freeze the candidate, verify all gates and obtain the explicit release decision.

Continue safe implementation while clinical decisions are pending. Do not
restart completed native-MRI groundwork, recheck hourly automations, repeat held
asset research without new evidence, or extend routine oral detail ahead of
substantive regional work. No public-audience or paid-provider change is implied.

## Viewer acceptance matrix

Run the common journey in whole body and every included region: open from Atlas,
switch region without losing navigation, search/select, rotate/zoom, toggle a
system, isolate/fade, hide/undo, reset, and open/close teaching without page-jump.
For each offered dissection/explode mechanism, test minimum/intermediate/maximum
separation, visibility/history interaction and exact reassembly. Inspect labels
after anterior/posterior rotation and separation: screen-left structures should
not acquire misleading screen-right leaders merely because of anatomical side.

Include a paired bone/muscle, dense head/neck, a deep organ, a nested cavity and
an independent specimen. Test successful load, slow load, missing model and
WebGL/context recovery. Check that practice excludes hidden/unloaded/context
surfaces and preserves dissection state on return.

Record actual browser/device, viewport, input method, candidate revisions,
pass/fail and evidence. Cover desktop mouse/keyboard, real touch tablet/phone,
200% text zoom, keyboard focus/escape/return, readable contrast and a screen-reader
navigation sample. A narrow iframe is responsive-layout evidence, not physical
touch-device or nonvisual acceptance. Explain visual-only 3D task limitations.

## Teaching and imaging boundaries

The first sample is not a comprehensive anatomy review or a shipping allowlist.
Approved geometry, teaching and imaging are separate tracks. Approval of a root
organ does not approve its child structures or an independent specimen. Preserve
source/teaching/renderer revision checks and existing stale-review behavior.

Review the CT-head boundaries and cerebellar margins with the specialist task;
do not copy patient material into this repository. Before a real case is connected,
record dataset/series permission and anonymisation clearance, accepted segmentation
revision, intended educational scope, image orientation and the mapping method.
Do not derive registration claims from shared names or reference-model anatomy.
Other modality landing pages must honestly state what is available.

## Deferred from this milestone, retained in the full goal

Exhaustive whole-body tissues and organ interiors; every clinical topic; advanced
pathology simulations; comprehensive validated multimodal registration; formal
exam analytics. Major source-held tissues remain explicitly missing, not fabricated.

## Readiness record

`content/first-release-milestone.json` is a coordination record, not a clinical
approval store. `node scripts/release-readiness.mjs` reports it without writes.
`node scripts/release-readiness.mjs --check` must fail while any mandatory gate is
pending or its documented evidence does not match the candidate. Even a complete
record requires authoritative clinical/access/release evidence to be checked by
the responsible people; the checker does not authenticate reviewers or grant access.

The schema-v2 candidate records separately the exact website source/deployed
revision and private Sites version, the Atlas revision embedded in the shared
viewer export, and the Atlas revision used for source validation. It also pins
the viewer manifest and protected-model inventory fingerprints and states whether
any revision-bound clinical approval has actually been recorded. These are
cross-checkable identifiers, not proof that the source was clinically reviewed,
the deployment was independently audited, or a real device passed the matrix.
The earlier baseline remains in `historicalBaseline`; it is not the current
candidate. A source or deployment change requires a new candidate binding and
new evidence for every gate that depends on the changed bytes.
