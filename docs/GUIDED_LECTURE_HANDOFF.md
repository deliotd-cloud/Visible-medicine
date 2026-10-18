# Guided anatomy and lecture handoff

Current CT/MRI Guided learning steps and the standalone anatomical3D tour wrapper
offer a closed **Related lectures** disclosure. Discovery opens in a separate tab,
preserving the scan/model tab. It is available for a mapped canonical authored
step even when its local mask is absent; this does not select a replacement mask
or claim a live model selection. Unknown/stale/unmapped steps offer no action.

## Exact return context

Five allowlisted query fields carry the authored tour ID, canonical zero-based
step, concept, head revision and origin view (`CT`, `MRI`, `3D`). The runtime
constructs these from the exact current sequence and mapping. It accepts no
arbitrary return URL, scan path, identifier, frame transform, quiz answer,
score or access token. Duplicate/array/partial/unknown/stale/unsupported metadata
is invalid, never repaired by substituting another step or a new source.

Related discovery preserves context through sign-in, groups/retry and verified
published slide links. Its CT/MRI/3D return links retain the same tour step.
The lecture page offers **Return to [tour] · step [n] · [view]**, including on an
unavailable lecture page. Next/Previous slide links and reload/sign-in retain
context without storing scans or learner progress. Invalid tour context shows
a quiet unavailable notice and a bounded invalid marker, not a fallback return.
Published slide identity/hash checks remain independent of the tour context.

The return action always names the starting authored tour, not the currently
displayed lecture slide's concept, a live model selection or a completed lesson.
Changing slides does not silently move the return destination. Existing return
navigation in the scan/model tab is unaffected. No automatic lecture opens,
autoplay change, score/completion record, browser storage or clinical decision.

## Independent access and review

Discovery still requires the real learner sign-in and filters through the existing
published lecture authority. Atlas access grants no paid lecture, course or case
access. The page appends return context only after a slide has passed the existing
publication/allocation/integrity checks; lecture playback checks access again.
No draft/locked titles or hidden answers are made available. There are no database,
schema, role, entitlement or permission changes in this milestone.

CT/MRI and the anatomical3D model remain separate, unregistered subjects. Context
is semantic navigation, not patient-space synchronization. Partial masks stay
partial. No existing mask, teaching packet, sequence order, model asset or accepted
boundary is changed. The normal protected Review renderer is rebound/rebuilt for
changed website presentation and helper inputs; old decisions are not migrated.

## Verification limits

Tests execute the production helpers and rendered components/route boundaries
with synthetic identity/publication seams. They cover all three origin views,
image-only and missing-mask steps, malformed/stale/forged metadata, hostile paths,
retained sign-in/pagination/slide context, publication access and stale callbacks.
Old harnesses bind the new helper imports; prior access/source assertions stay.
These checks, local types/build and HTTP readiness are not physical-browser,
clinical, hosted-D1 or release acceptance. Actual lecture playback with approved
content/real accounts and desktop assistive-technology checks remain separate.

No new dependency, font, image, mesh, fee or public deployment. All work remains
local; original private data and the desktop clinical PACS are out of scope.
