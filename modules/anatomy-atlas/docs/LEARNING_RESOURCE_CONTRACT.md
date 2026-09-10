# Learning-resource linking contract v1/v2

Implemented infrastructure, not a connected radiology viewer or publication approval. The current source-controlled `content/learning-resources.v1.json` deliberately contains zero resources and zero correspondences. The user's provisional CT/MRI images and existing course packages are not copied, fabricated or promoted into published learning resources.

## One strict transport format

`lib/learning-resource-types.ts` defines the contract; `lib/learning-resources.ts` is its runtime parser/index. A document has exactly `schemaVersion`, `resources` and `links`. Version 1 retains body/shoulder representations; version 2 additionally supports [explicit nested parent/child bindings](NESTED_LEARNING_LINKS.md). Version 1 rejects nested records; existing locator version 1 is unchanged. The configured production document remains version 1 and empty. Unknown fields, unsupported versions, duplicate IDs/anchors, incomplete bindings, invalid hashes and malformed locators are rejected. `parseLearningJson` limits UTF-8 transport to 2 MB; callers still need request/file body limits. This is a pure same-process library, not an upload API, database, authentication service or browser messaging boundary.

Each resource has an opaque product resource ID, positive revision, kind, title, age group, laterality, regional membership, material digest/origin and its typed anchors. Names/titles are display metadata, not identity. Acquired images, synthetic images and authored lessons remain explicitly distinguished. These labels do not prove rights or medical correctness.

| Kind | Stable anchor fields |
| --- | --- |
| CT / MRI | Series ID, educational frame ID, annotation ID and representation type: mask, partial-mask, curve, point or region. A CT frame is not assumed to be an MRI frame. |
| X-ray | Image ID, reviewed annotation ID and projection ID. No invented depth coordinate. |
| Ultrasound | Clip/image ID, annotation ID, view ID and either a nonnegative frame index or millisecond time anchor, not both. A still can use frame zero. |
| Lecture | Course, lesson, stable slide ID and optional build/animation-step ID. Reordering slide numbers must not silently redirect the anchor. |
| Quiz | Question and learning-objective IDs within a versioned resource. This is separate from validated assessment status. |

All anchor IDs must come from the owning resource's actual manifest. The format can identify a destination but cannot validate whether a frame, slide build or annotation really exists in an external viewer. That must be checked by the host adapter/owner before admitting the record. Source frames use educational identifiers, not patient records; no coordinates or transformations are accepted here.

## Exact anatomical binding and explicit correspondence

The anatomy key is `(scope, structureId)`: `body`, `shoulder-pilot` and `nested` are not interchangeable. `learningAnatomyRepresentations` retains the existing 1,031 body/shoulder entries and complete source filename/hash sets. The opt-in `allLearningAnatomyRepresentations` adds 37 nested children with exact parent sources, study and parent/child bundle digests. These are overlapping scope-specific representations, not unique anatomy counts. No display centre becomes a patient coordinate. Array/key ordering does not change the meaning of a source set. A grouped structure must retain all its source components.

A correspondence has its own ID/revision, anatomy key/source set, resource ID/revision/material digest, anchor ID and relation. Its direction is **resource annotation/topic relative to selected anatomy**:

- `exact`: the same anatomical concept, not proof of geometrically complete segmentation or patient registration.
- `component`: the resource depicts/teaches a component of the selected anatomy.
- `broader`: the resource includes a broader anatomical scope.
- `related`: contextual teaching or comparison, not anatomical equivalence.

The registry rejects unknown/stale assets, missing anchors and conflicting duplicate correspondence rows. It never infers aliases, mirrored sides, paediatric correspondence, nerve paths or component anatomy from names. Both body and shoulder correspondences need explicit rows; reverse lookup may return several reviewed candidates and must not silently choose one.

Resource-level age/laterality/region tags describe overall content. They cannot establish an individual annotation's correctness, particularly in a mixed/bilateral course. Exact side, age, source-subject, partial/full geometry and clinical relevance need annotation-level owner review recorded against the complete resource and correspondence. A source-hash check is not that review.

## Host-controlled eligibility, not imported approvals

There are no `approved`, `reviewer`, credential or patient-data fields to import. All lookups deny access by default. The caller supplies five synchronous, current, trusted callbacks:

1. `canNavigate`: whether this learning action is enabled now; disable during assessment, paused/failed display states or other unsuitable contexts.
2. `canAccessAnatomy(anatomy)`: enforce current access to this Atlas representation, independently of lecture access.
3. `canAccess(resource)`: separately enforce access to this particular lecture, imaging or quiz resource. An Atlas subscription does not imply this permission. Do not rely on hidden buttons or a client-provided `true`.
4. `resourceCleared(resource)`: check current rights, privacy, editorial/clinical and publication eligibility against the **exact complete record and actual destination manifest**.
5. `correspondenceCleared(link)`: independently check the source-to-anchor relation and its scope/revision.

These gates are rerun for every related, reverse and locator lookup. False, exceptions and Promise results deny navigation. Neither data presence, source hash nor a prior successful lookup implies continued access. Returned objects and policy inputs are detached copies. The host must authorize the destination again when actually loading its media/lesson; this library does not provide revocation of bytes already delivered.

`learningReviewPayload` produces canonical JSON of a complete valid resource/correspondence for comparison or hashing by the owner's review system. It includes anchor/frame/build metadata and relation, not just the underlying media digest. A changed anchor, partial-mask scope, side/age tag or relation must not inherit approval because an image/PPTX hash or revision number was left unchanged. Arrays retain authored order, object keys are canonicalized. The payload is not a cryptographic signature or an approval. No private approval record is created by these functions.

Free-text titles and opaque IDs can still contain inappropriate information. Schema validation is not de-identification, a patient-data detector, legal clearance or medical review. Production ingestion must add authorization, rate/body limits, quarantine, resource-manifest verification, privacy review and audited storage before accepting user input.

## Separate Atlas and lecture subscriptions

The user's commercial model permits an Atlas-only subscriber, a lecture-only purchaser, or someone with both. Neither product automatically grants the other. These linking lookups require both sides' access; a denied related lecture must not remove the learner's existing access to the Atlas itself. The standalone Atlas/lecture hosts retain their own access checks.

`lib/learning-entitlements.ts` supplies a pure, default-deny policy evaluator for future **server-side** integration. A server-owned rule is explicitly public or names the exact eligible product IDs. A bundle grants access only when that bundle is explicitly named in the relevant rule; titles, prefixes, modality and course membership do not infer access. Rules can be assigned to a resource representing an individual restricted lesson/section, rather than granting a whole course implicitly.

Pass the authenticated server subject, a current server-owned grant snapshot and server UTC epoch milliseconds. Each subject/product has exactly one current row, not a history of billing events. Revoked, expired, not-yet-valid, duplicate, foreign-subject and malformed grants deny access. Start is inclusive and expiry exclusive; a null expiry represents a deliberately non-expiring grant, not missing data. Reconcile billing changes in the authoritative host and read current decisions for each protected request. No session, cookie, browser payload, URL or imported content file can grant an entitlement through this helper.

Locked-resource promotion, if added later, must come from a separate **publicly approved catalogue** containing only permitted course summaries and purchase destinations. Do not expose restricted slide titles, anchor IDs, thumbnails, notes, transcripts or media through a locked preview. This registry deliberately returns generic `unavailable` or no matches when denied. Keep the protected registry and media on the server; sending everything to the browser and hiding it is not a paywall. Authorize deep links, media requests and downloads at the destination as well; use per-user/no-store caching where appropriate, never shared caching of protected responses.

There are no real product IDs, prices, payment services, checkout, authentication or billing integration configured here. Existing private Sites access is unchanged and is not proof of a Visible Medicine purchase. The evaluator and callbacks are tested integration infrastructure, **not an operational subscription system**. Expiry/revocation cannot reclaim already downloaded content.

## Using the library

```ts
const targets = learningAnatomyRepresentations(catalog, shoulderManifest, shoulderNames);
const registry = createLearningRegistry(document, targets, trustedHostPolicy);
const related = registry.related('body', selectedStructureId);
const anatomyChoices = registry.anatomyFor(resourceId, anchorId);
const destination = registry.resolve(locator); // ready or deliberately generic unavailable
```

`encodeLearningLocator` / `decodeLearningLocator` round-trip only six owned query fields: learning version, correspondence ID/revision, resource ID/revision and anchor ID. Duplicate/extra fields, URLs, malformed revisions, coordinates and stale locators cannot be forwarded through this format. No route or external URL is invented. The owning website/player chooses its actual allowlisted route and processes the locator with current policy and destination validation.

The existing eight-topic content schema and same-document imaging selection bridge remain unchanged. X-ray is supported by this new resource contract, not newly advertised as a connected imaging-bridge adapter. There is no `postMessage` listener, scan transfer, registration, D1 migration, external fetch or visible UI control in this milestone.

## Verification and next integration

Run `npm run learning-resources:test`. [The report](learning-resources-validation.json) covers actual current anatomy registries plus clearly synthetic transport-only fixtures for all six resource kinds, source/anchor/revision rejection, full-record review invalidation, reverse/forward lookup, key ordering, permission revocation, malformed input and stable query round trips. No test fixture is a real image, course anchor, clinical approval or production record.

The requirement inventory validates the committed empty registry against current source anatomy and reports its actual counts in [CURRENT_STATUS.md](CURRENT_STATUS.md). Existing geometry, content, imaging and review safeguards remain separate from clinical, external-manifest and browser acceptance.

Next: obtain owner-approved stable manifests/anchors from the existing CT/MRI head and course projects described in [the integration plan](MULTIMODAL_LEARNING_PLAN.md), then implement a bounded owner-only adapter and a compact Related learning group. Until those inputs exist, keep the production registry empty and the current interface uncluttered. No new dependency, font, texture, model or paid service is used; existing notices remain in force.
