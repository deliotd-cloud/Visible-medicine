# Component imaging teaching navigation

From a supported parent organ, select **Imaging → CT, MRI or Ultrasound**, expand **Component notes**, choose a named source component and select **Open notes in dissection**. The existing eye/organ workbench selects and fades around that exact component and opens Learn more at the requested imaging topic. Closing returns focus to the launching button and retains the existing root-camera recovery behaviour.

The picker is collapsed initially and absent when the chosen modality has no component drafts. It appears only in the information panel, not the global toolbar. Controls wrap within the narrow rail and retain keyboard-accessible existing Select/Button primitives. Normal dissection entry remains collapsed; the requested imaging topic applies only to the initial selected child and study. Choosing another child does not transfer that launch topic; ordinary teaching-topic persistence and the per-child collapsed quiz answer are retained.

## Source and access boundaries

- `lib/component-imaging-navigation.ts` examines only the selected parent in the current display catalogue. It reuses canonical nested study targets, side checks and exact editorial teaching bindings; only explicitly authored `draft` modality sections are offered.
- The main atlas launcher re-resolves the child/study/source hash and parent hash, current regional eligibility and exam status before changing selection or camera. A stale selection, changed hash, unsupported topic, wrong parent or unavailable lesson is rejected. It never substitutes the whole parent for a requested child in imaging events.
- The launch topic is ephemeral local UI state. No study-link schema, URL parser, registry, postMessage interface, patient coordinate frame or resource authorization is extended.
- Parent bundle digests retain the existing catalogue-based navigation contract; editorial parent/child metadata and child hashes are source-checked. Runtime navigation is not independent verification of downloaded GLB bytes or clinical registration.
- Component drafts remain separate from whole-organ coverage. The root's pending modality notes are not populated by copying child prose. There are still no connected scans, production learning resources or registered correspondences.
- Atlas, CT, MRI, X-ray, US and separately paid lecture entitlements remain independent. Opening local draft notes grants no access to those products, media, lecture chapters or subscription endpoints.

## Evidence and remaining acceptance

`node scripts/validate-component-imaging-navigation.mjs` exercises the actual menu events, actual BodyExplorer launcher and 195 server-rendered child/modality combinations with only the GPU scene stubbed. It checks exact source selection, initial imaging tab/disclosure, unsupported/pending rejection, exam isolation, focus handover and immutable source data. There are 98 currently offered child/modality routes (CT 35, MRI 35, US 28), with 97 pending combinations not offered. These are routes to existing shared drafts, not 98 new lessons or newly completed anatomy structures.

Also run `npm run nested-navigation:test`, `npm run nested-teaching:test`, TypeScript, generated requirement freshness and the production build. No new medical text, geometry, font, image, external dataset, dependency, fee or license is introduced. Existing source notices apply unchanged. Clinical validation and browser keyboard/focus, narrow-screen layout, mobile/touch and GPU acceptance are still outstanding; server-rendered tests are not browser acceptance.
