# Embedded shoulder review navigation

28 September 2026. The shoulder module's framework adapter now sends its
`/review?structure=…` link to the host website's
`/workspace/atlas-review/shoulder?structure=…`, targeting the top-level window.
The old adapter sent it to the separate historical Atlas website in a new tab.
Standalone Atlas routing and unrelated links are unchanged.

Only one exact canonical shoulder identity is forwarded. Unknown or repeated
identities fall back to the shoulder review landing page; arbitrary query keys,
fragments, redirect destinations and foreign source identities are not relayed.
The website remains responsible for authentication/authorization. This link
cannot grant review access, approve content or unlock cases/lectures.

Source test `npm run shoulder-website-review-link:test` covers all nine IDs,
malformed/duplicate/foreign inputs, dropping redirect-like fields, and the actual
framework binding/host-window target. TypeScript and both module builds pass.
Shoulder material revisions are unchanged: no model, teaching, renderer or
private decision is edited. Website adaptation fingerprints are independently
rebound when this module is imported. Actual host-navigation verification belongs
to the website integration checkpoint, not this source-only test.

No new dependency, asset, patient data or mandatory fee. Existing commercial
licences/notices, source holds, CT-head masks and clinical PACS remain untouched.
