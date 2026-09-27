# Circle of Willis drafts in Clinical Review — 27 September 2026

Imported Atlas source: `f28c415f9b46137db744d4606bc425d1aea54550`.
Website integration: `8bd0347ce4e49b4e611c3d3c16b64edf61ba2f7d2ed750f7ece007bbcb342613`.
846 source files, 31 generated review-viewer artifacts, 22 bundled packages.

Seven existing ACom/ACA/PCA/PCom selections now expose fourteen original CT/CTA
and MRI/MRA orientation drafts in the protected worksheet and matching 3D viewer.
Exact source identities, laterality, retained geometry, factual references and
limits accompany the teaching. No scans, diagrams, datasets or new dependencies
are imported. Atlas source documentation records the factual-reference and reuse
audit; original model licences and notices remain in force.

The review model header no longer displays a hard-coded historical date.
Presentation bindings are refreshed; old decisions are not silently applied to
new material. No real decisions were submitted, migrated or approved. Endpoint
and route access remain server-authorized with independent Atlas/case/lecture
entitlements. Private records are not included in generated viewer artifacts.

## Evidence

- Eight focused website tests pass, covering 14 exact-source CT/MRI review
  placements and actual rendered evidence, the existing foot quiz/alias search,
  restoration handlers, learner quick checks, model link identity, and actual
  review endpoint authorization/account/institution/stale-decision behavior.
  Historical material fixtures and restoration-handler hashes are unchanged.
- TypeScript, review viewer and full website builds pass. Source/artifact
  verifier passes. Existing large-chunk build warnings remain.
- Model inventory verifies 136 models/143 paths/199,033,932 bytes. The learner
  runtime, independent modules and model inventory are byte-unchanged.
- Actual local worksheet: ACom CT and MRI disclosures show the new notes,
  source references and draft/no-patient-imaging limits. Its model link selects
  the same source artery; CT and MRI tabs show their corresponding new content
  and "No imaging study loaded".
- Actual 375px touch model: Details opens; CT and MRI tabs switch correctly.
  Parent and iframe widths are 375px without document overflow; canvas353x238.
  Returned to desktop and the ACom worksheet; no Save/approval action used.
- A stale development-server async-context error was observed during the
  import. Restarting the owned preview session restored HTTP200 and the
  working routes; no dependency or access-policy change was needed.

Generated hashed chunks were replaced by the normal builder; their prior
versions remain recoverable in Git. Learner export remains `0770fd3` and public
deployment is unchanged. This delivery proves software behavior, not anatomical
completeness, clinical correctness, registration or radiologist sign-off.
