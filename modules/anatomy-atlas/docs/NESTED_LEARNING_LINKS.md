# Linking nested anatomy to learning resources

This is a tested integration foundation, **not a connected scan viewer, lecture player, paywall or registration system**. The production resource document remains unchanged and empty. No provisional head-atlas image, mask, patient identifier, lecture file or private review record is imported.

## Exact child destinations

`nestedLearningAnatomyRepresentations(catalog)` exposes the 37 selectable eye/ventricular/brainstem/cerebral children from the guarded current dissection catalogues. It applies the source-bound right-eye display correction, validates the supported source version and coordinate metadata, and excludes nonselectable context, unsupported parents, held anatomy and invented mirrored parts. It is independent of the teaching drafts and their editorial pins.

Each `scope: 'nested'` representation includes:

- Its existing structure ID and complete child source filename/SHA256 set.
- The exact nested study: eye, ventricles, brainstem or cerebral.
- Its actual parent ID and complete parent source filename/SHA256 set.
- The current parent and child GLB SHA256 digests.

`learningAnatomyBindingKey` validates and canonicalizes this complete binding. Source-set order does not change meaning; changing study, parent, source membership or either bundle digest does. No FMA-name similarity, aggregate/component equivalence, laterality mirror or patient correspondence is inferred. Context-only anatomy does not become a child destination merely because it is visible.

`allLearningAnatomyRepresentations(catalog, manifest, shoulderNames)` combines the unchanged 1,031 body/shoulder bindings with these 37 children, yielding 1,068 scope-specific representations. Counts overlap: this is not 1,068 unique anatomical structures or evidence of whole-body completeness. The legacy `learningAnatomyRepresentations` function continues to return its original entries unchanged.

## Transport compatibility

The [learning-resource contract](LEARNING_RESOURCE_CONTRACT.md) supports two document versions:

| Contract | Anatomical scopes | Behaviour |
| --- | --- | --- |
| Document v1 | body, shoulder-pilot | Original fields and bindings retained; nested records explicitly rejected. |
| Document v2 | body, shoulder-pilot, nested | Requires the full additional parent/study/bundle binding for every nested record. |
| Locator v1 | Stable correspondence/resource/anchor IDs and revisions | Unchanged: the destination is resolved from its trusted current document, not embedded in the URL. |

Version 2 does not change the six resource kinds or their anchor formats. CT/MRI keep separate series/frame IDs; X-ray remains a projection; ultrasound uses a frame or time anchor; lectures use course/lesson/slide/build IDs; quizzes use question/objective IDs. These transport fields do not establish that an external annotation exists or that its clinical scope is correct.

The configured `content/learning-resources.v1.json` is deliberately **not migrated**: zero resources and zero correspondences remain. Older clients must reject unsupported v2 documents, never strip the nested binding and treat the record as body anatomy. There is no automatic conversion or approval migration.

## Reuse existing dissection navigation

After the trusted host has authorized a current correspondence, `nestedLearningSelection(catalog, match.link.anatomy, side)` rechecks its complete binding and converts it to the existing `NestedRequest`. It rejects wrong-side children even when the parent is midline. It grants no permissions and accepts no external URL, camera, patient coordinates or scan transformation.

The same request can be passed to the existing guarded child launcher or used with the allowlisted study-link builder:

```ts
const targets = allLearningAnatomyRepresentations(catalog, manifest, shoulderNames);
const registry = createLearningRegistry(ownerApprovedDocument, targets, currentHostPolicy);
const result = registry.resolve(locator);
if (result.status === 'ready') {
  const selection = nestedLearningSelection(catalog, result.match.link.anatomy, side);
  if (selection) {
    const current = bodyDisplayCatalog(catalog);
    const href = makeStudyLink(current, 'head-neck', selection.parentId, side, null, selection);
    // The host uses this relative Atlas destination, with current access checks.
    // No external scan/lecture route is inferred here.
  }
}
```

Do not pass a resource ID to the anatomy launcher or a parent ID as the child. Source changes need a new current registry and re-reviewed correspondences; do not persist stale same-process registries across a source deployment. Incompatible catalogue metadata raises a source-review error rather than guessing coordinates. Unsupported/altered child bindings return no selection.

## Access and review remain separate

All existing current host-policy gates apply in both directions and to locator resolution: navigation state, Atlas access, resource access, resource clearance and correspondence clearance. Nested selection does not imply access to a separately paid lecture or restricted section. Denied lookup returns only generic unavailable/no matches, not titles, notes, slide anchors or preview media. The destination must authorize again when serving content; this helper is not authentication or a client-side paywall.

Complete nested bindings are included in `learningReviewPayload`. A changed parent, study, source set or bundle digest cannot be omitted from the owner's exact-record review comparison. No approval is generated by producing a binding, passing these tests or sharing a normal anatomy study link. Parent/child source provenance is not spatial registration between a generic 3D reference and a patient's scan.

## Evidence and remaining work

`npm run nested-learning:test` executes the real parser, registry, source resolver and existing study-link builder. The [generated report](nested-learning-validation.json) covers 37 nested bindings, 222 synthetic transport-only correspondences across all six resource kinds, 160 accepted sided regional/whole-body routes, legacy preservation, mutation rejection, exact-review invalidation and current entitlement/revocation checks. Fixtures are neither real scans nor publishable course records. Existing learning-resource tests retain the 1,031-entry v1 coverage and subscription tests.

No UI, model, source geometry, clinical teaching, review fingerprint, dependency, font, texture or paid service is changed. This milestone needs no imported anatomy or medical image licence; existing third-party notices remain in force. Software checks do not establish browser/device, clinical, privacy or legal acceptance.

Next obtain approved stable resource manifests and an actual host/player interface from the existing CT/MRI head and lecture projects. Keep distinct scan subjects and pending review/privacy restrictions intact. Then implement one bounded real adapter and a compact related-learning view, including destination-level authorization. Do not populate the registry with guessed frame/slide IDs, fabricate a duplicate head atlas, copy provisional images, or present a disabled sample as a live integration.
