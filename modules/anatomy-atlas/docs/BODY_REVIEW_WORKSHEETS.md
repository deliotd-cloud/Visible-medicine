# Whole-body review worksheets

Open **Review workspace → Whole-body reviews**, or `/review/body`. Its read-only material panels expose all **1,022 current root-body selections** outside the learner's model view. Region/system filters, name/ID search and a paginated queue keep review manageable. Select a structure, inspect teaching/source, open its model, or download a worksheet. A separate [private decision editor](BODY_REVIEW_DECISIONS.md) below these panels now supports saved records.

The existing nine-structure shoulder review dashboard, saved decisions and append-only history are unchanged. **Exported worksheets cannot save, import or approve a review.** They remain separate from the new version-bound body decision store. No private reviews or reviewer identity are read into worksheet exports. Nested organ components and independent specimens remain outside this root-body scope; counts describe source representations, not unique anatomical concepts.

## Source and teaching continuity

`lib/body-review-material.ts` uses the same display-corrected catalogue as the body viewer, including the source-bound eye and pancreas corrections. Every selection includes its entire displayed structure record, source file hashes, canonical GLB metadata, coordinate frame, licence and credit. All **9,198 topic snapshots** are returned by the existing `bodyLesson` resolver: Anatomy, Function, CT, MRI, X-ray, Ultrasound, Pathology, Clinical and Quiz notes. No teaching is written, changed or relabelled as approved. Draft, pending, identity-only and generated-identification readiness remain distinct; Quiz notes do not include the interactive question bank.

Three deterministic SHA-256 fingerprints cover the scoped source, current teaching and checklist; a combined material fingerprint identifies their snapshot. They are **not digital signatures, tamper-proof files or renderer-revision approvals**. Do not accept an edited worksheet as sign-off or transfer a conclusion to changed material. Some original shoulder IDs occur in both the root catalogue and pilot: worksheet scope and full source/bundle binding, not an ID string alone, distinguish them.

All 1,022 model links use the existing source-pinned study-link resolver with the actual region and bundle hash. Unsupported or ambiguous IDs fail closed; no guessed nested/independent fallback is used. No displayed centre becomes a patient coordinate, and no CT/MRI/US/X-ray or separately paid lecture is unlocked.

## Controls and delivery

The separate page adds nothing to the learner toolbar. Twenty results per queue page, a bounded queue, collapsed topic/source/checklist sections and narrow-screen stacking reuse the established Visible Medicine identity and installed controls. Selection clears old material; aborted/late requests cannot replace a later selection. Reselect and Retry reload the requested worksheet. Errors show a sign-in link and no false saved state. Actual browser/device and keyboard/focus acceptance remain outstanding.

The authenticated `GET /api/body-review?structure=…` returns read-only material; `download=1` adds a safe FMA filename. Targets match exactly one root record and responses are private/no-store. This worksheet endpoint has no POST/import, D1 access, external request or browser persistence. The decision editor uses the separate `/api/body-review/decisions` endpoint. Source/curriculum code is not imported into the client; catalogue summaries remain subject to existing Site access.

## Validation and remaining work

Run `npm run body-review:test`. Checks cover all1,022 source-bound model destinations and9,198 unchanged topic snapshots, unique deterministic snapshot hashes, detached data, display-corrected pancreatic binding, shared pilot-ID separation, regional filters, malformed/foreign response rejection, authenticated API failures/downloads and six renders of the actual React controls using installed Vinext link/image shims. `npm run reviews:test` retains the235 existing shoulder validation, history, isolation, concurrency, revision and request-security checks. TypeScript and production build remain separate gates. These are not browser/GPU or clinical acceptance tests.

The [body decision store](BODY_REVIEW_DECISIONS.md) now provides scoped revisions, declared reviewer details, append-only corrections and stale-review invalidation. Credentials are not verified; no decisions are pre-populated or propagated to learner approval badges. Nested/independent specimens and interactive assessment need separate scopes. Clinicians must review anatomy/copy; radiologists must separately validate acquired resources and registration. This feature does not close missing anatomy or prove clinical completion.

No new mesh, dependency, font, texture, external content, fee-bearing service or entitlement was introduced. Existing MIT application/teaching terms and per-source notices remain; exported source metadata includes BodyParts3D CC BY4.0 credit. An initial bounded upper-limb-source search did not establish a cleared additional soft-tissue mesh; no candidate files were downloaded. Routine oral work remains deferred.
