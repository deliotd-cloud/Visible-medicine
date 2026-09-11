# Whole-body review worksheets

Open **Review workspace → Whole-body worksheets**, or `/review/body`. This read-only workspace exposes all **1,022 current root-body selections** outside the learner's model view. Region/system filters, name/ID search and a paginated queue keep the review manageable. Select a structure, inspect its current teaching and source, open its exact model, or download a JSON worksheet for an external reviewer.

The existing nine-structure shoulder review dashboard, authenticated saved decisions and append-only history are unchanged. **Body worksheets cannot save, import or approve a review.** They are preparation for qualified review, not a replacement for a future version-bound whole-body decision store. No private reviews or reviewer identity are read into them. Nested organ components and independent lower-limb/abdominal specimens remain outside this root-body scope; numbers are overlapping source representations, not unique anatomical concepts.

## Source and teaching continuity

`lib/body-review-material.ts` uses the same display-corrected catalogue as the body viewer, including the source-bound eye and pancreas corrections. Every selection includes its entire displayed structure record, source file hashes, canonical GLB metadata, coordinate frame, licence and credit. All **9,198 topic snapshots** are returned by the existing `bodyLesson` resolver: Anatomy, Function, CT, MRI, X-ray, Ultrasound, Pathology, Clinical and Quiz notes. No teaching is written, changed or relabelled as approved. Draft, pending, identity-only and generated-identification readiness remain distinct; Quiz notes do not include the interactive question bank.

Three deterministic SHA-256 fingerprints cover the scoped source, current teaching and checklist; a combined material fingerprint identifies their snapshot. They are **not digital signatures, tamper-proof files or renderer-revision approvals**. Do not accept an edited worksheet as sign-off or transfer a conclusion to changed material. Some original shoulder IDs occur in both the root catalogue and pilot: worksheet scope and full source/bundle binding, not an ID string alone, distinguish them.

All 1,022 model links use the existing source-pinned study-link resolver with the actual region and bundle hash. Unsupported or ambiguous IDs fail closed; no guessed nested/independent fallback is used. No displayed centre becomes a patient coordinate, and no CT/MRI/US/X-ray or separately paid lecture is unlocked.

## Controls and delivery

The separate page adds nothing to the learner toolbar. Twenty results per queue page, a bounded queue, collapsed topic/source/checklist sections and narrow-screen stacking reuse the established Visible Medicine identity and installed controls. Selection clears old material; aborted/late requests cannot replace a later selection. Reselect and Retry reload the requested worksheet. Errors show a sign-in link and no false saved state. Actual browser/device and keyboard/focus acceptance remain outstanding.

The authenticated `GET /api/body-review?structure=…` returns current read-only material. `download=1` adds a safe FMA-based filename. Missing identity is rejected, targets must match one root record and responses are private/no-store. There is no POST/import endpoint, D1 access, external request or browser persistence. The server generates material on demand; source/curriculum code is not imported into this page's client module. The page itself exposes only the existing catalogue summaries, subject to the site's existing access policy.

## Validation and remaining work

Run `npm run body-review:test`. Checks cover all1,022 source-bound model destinations and9,198 unchanged topic snapshots, unique deterministic snapshot hashes, detached data, display-corrected pancreatic binding, shared pilot-ID separation, regional filters, malformed/foreign response rejection, authenticated API failures/downloads and six renders of the actual React controls using installed Vinext link/image shims. `npm run reviews:test` retains the235 existing shoulder validation, history, isolation, concurrency, revision and request-security checks. TypeScript and production build remain separate gates. These are not browser/GPU or clinical acceptance tests.

Next review workflow work must include a separately designed revision-bound body decision store, qualified reviewer identity/scope, append-only corrections and stale-review invalidation before any accepted whole-body approvals are presented. Nested/independent specimens and interactive assessment require their own exact scope. A clinician must review anatomy and clinical copy; a radiologist must separately validate acquired resources and registration. Nothing in this feature closes missing anatomy or proves clinical completion.

No new mesh, dependency, font, texture, external content, fee-bearing service or entitlement was introduced. Existing MIT application/teaching terms and per-source notices remain; exported source metadata includes BodyParts3D CC BY4.0 credit. An initial bounded upper-limb-source search did not establish a cleared additional soft-tissue mesh; no candidate files were downloaded. Routine oral work remains deferred.
