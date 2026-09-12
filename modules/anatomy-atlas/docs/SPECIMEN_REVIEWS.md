# Independent-specimen review records

Open **Review → Specimen reviews**, or `/review/specimens`. The first explicit adapters cover 82 HRA kidney and 41 HRA female-pelvis source selections. These are separate from the nine-structure shoulder pilot, root-body records, UM specimens, back/abdominal wall and nested organs. Matching names or a shared original donor/frame do not transfer approval.

## Reviewer workflow

1. Choose a specimen and search a source selection. Open its separate 3D viewer in another tab and search the displayed exact ID; the link opens the specimen, not an automatically focused selection.
2. Inspect the actual geometry, surrounding surfaces and dissection on intended devices. Expand the source/teaching worksheet to inspect the exact draft copy, references, self-check and pending topics.
3. Choose **3D anatomy**, **Teaching & self-check**, or **Acquired imaging**. Private records load only for the current signed-in account.
4. Record checklist decisions, reviewer name/qualification, precise educational scope, supporting HTTPS references and corrections. Saved issues cannot be removed; resolve them with explanations. No patient identifiers should be entered.
5. Save progress, changes required, or an explicitly attested approval. Geometry and teaching decisions are separate. All core teaching topics must exist before teaching approval: currently 99 selections meet that editorial prerequisite, **not** clinical approval. Unsupported modality topics remain outside completed coverage. Interactive identification practice is excluded from this sign-off.
6. Review/export prior versions. After a conflicting or uncertain save, export retained edits, refresh history, compare and explicitly load the saved draft before reapplying corrections. No retry silently overwrites another saved version.

## Identity and persistence

- `specimen_review_events` is an append-only table keyed by account, specimen key, structure ID, track and version. Migration `0002_specimen_review_events.sql` is additive; the shoulder/body migrations and records are unchanged.
- Server-resolved identity includes exact source frame, original source/subset and display-bundle hashes, catalogue, neighbouring geometry, study recipes and limitations. Teaching fingerprints cover original topic text, references, cautions and self-checks. The existing conservative renderer dependency digest binds geometry review to the application revision.
- A changed source/frame, applicable teaching/renderer revision or checklist requires re-review. Prior records remain readable; stale drafts retain notes/evidence/issues but reset checks and attestation. Even an unchanged saved approval is not pre-attested for the next save.
- Saves require platform-forwarded account identity, same-origin JSON, bounded input, server-computed fingerprints and an atomic expected-version condition. Account keys are never accepted from the submitted draft. History is private/no-store, indexed and paged in groups of 20. Exported records contain private reviewer material; store them appropriately.
- This relies on the existing trusted Sites dispatcher/account headers. A future public Visible Medicine deployment must supply trusted authentication and explicit reviewer/release authority, not expose a raw Worker that accepts user-forged headers. Entered professional qualifications are self-declared, not verified credentials. Current records are personal decisions, not an atlas-wide publication gate or organisation-wide certification.
- No browser storage, new dependency, third-party asset, patient image, paid lecture entitlement or automatic sign-off was introduced. Geometry and teaching source assets are unchanged.

## Imaging boundary and validation

Acquired-imaging approval is rejected server-side until licensed/de-identified image series, exact frame identities, reviewed mappings and measured registration error are actually connected. CT/MRI/X-ray/US teaching text belongs to the **teaching** track; it does not provide these imaging guarantees.

Run `npm run specimen-review:test`. It tests all 123 source contexts, actual GLB hashes, invalid scopes, approval gates, account isolation, migrations, append-only history, races, stale review resets, response validation and real server-rendered components against synthetic in-memory SQLite data. No production review records are read. Browser interactions, GPU/device behaviour, hosted migration execution and radiologist sign-off are separate acceptance requirements.

Persistence uses the existing D1 binding with prepared, bound statements following [Cloudflare's documented API](https://developers.cloudflare.com/d1/worker-api/prepared-statements/). No paid service or increased plan is provisioned by this change; existing hosting limits still apply.

## Remaining rollout

Add explicit source/frame/teaching adapters for UM lower-limb, back layers, abdominal wall and nested organs; verify each independently. Never bulk-migrate root-body or HRA approval records into these scopes. Next review improvements should make exact-selection navigation and cross-specimen pending/re-review queues simpler without adding permanent atlas controls.
