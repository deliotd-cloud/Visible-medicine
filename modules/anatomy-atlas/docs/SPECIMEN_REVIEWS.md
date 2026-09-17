# Independent-specimen review records

Open **Review → Specimen reviews**, or `/review/specimens`. Nine explicit adapters cover **354 scoped selection records / 267 distinct source IDs**. UM regions overlap; these are not 354 new structures or distinct anatomical concepts. All records remain separate from the nine-structure shoulder pilot, root-body records and nested organs. Matching names, source surfaces or a shared original donor/frame do not transfer approval.

| Review scope | Selections | Core teaching drafts present (not approved) |
| --- | ---: | ---: |
| HRA kidneys | 82 | 82 |
| HRA female pelvis | 41 | 17 |
| Version-3 abdominal wall | 29 | 8 |
| Version-3 back layers | 48 | 38 |
| UM knee | 15 | 15 |
| UM hip & thigh | 34 | 33 |
| UM calf | 15 | 15 |
| UM ankle & foot | 23 | 22 |
| UM whole source limb | 67 | 65 |

## Reviewer workflow

1. Choose a specimen and search a source selection. **Open this exact structure in 3D** opens the source-checked selection, study and camera view in another tab. A stale, malformed or different-source link shows a warning without substituting another structure. See [direct navigation](INDEPENDENT_STUDY_LINKS.md).
2. Inspect the actual geometry, surrounding surfaces and dissection on intended devices. Expand the source/teaching worksheet to inspect the exact draft copy, references, self-check and pending topics.
3. Choose **3D anatomy**, **Teaching & self-check**, or **Acquired imaging**. Private records load only for the current signed-in account.
4. Record checklist decisions, reviewer name/qualification, precise educational scope, supporting HTTPS references and corrections. Saved issues cannot be removed; resolve them with explanations. No patient identifiers should be entered.
5. Save progress, changes required, or an explicitly attested approval. Geometry and teaching decisions are separate. All core teaching topics must exist before teaching approval: currently 295 scoped records meet that editorial prerequisite, **not** clinical approval. Unsupported modality topics remain outside completed coverage. Muscle attachments and motor-supply copy are displayed for review; interactive identification practice is excluded from this sign-off.
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

Run `npm run specimen-review:test` and `npm run independent-navigation:test`. They test all 354 scoped contexts, source GLB hashes, invalid scopes, approval gates, account isolation, migrations, append-only history, races, stale review resets, response validation and real server-rendered components against synthetic in-memory SQLite data. The navigation suite additionally verifies every review link and retained geometry/teaching/migrations. No production review records are read. Browser interactions, GPU/device behaviour, hosted migration execution and radiologist sign-off are separate acceptance requirements.

Persistence uses the existing D1 binding with prepared, bound statements following [Cloudflare's documented API](https://developers.cloudflare.com/d1/worker-api/prepared-statements/). No paid service or increased plan is provisioned by this change; existing hosting limits still apply.

## Remaining rollout

Nested organ dissections now have separate explicit adapters (NESTED_REVIEWS.md), isolated tables and parent/study/child identities. Never bulk-migrate root-body or independent-specimen approval records into these scopes. Cross-specimen pending/re-review queues and reviewer-role enforcement on a future public website remain separate work. Existing source rights remain CC BY 4.0 (HRA), CC0 (UM) and CC BY-SA 2.1 Japan (version-3 assets/adaptations); review exports retain source credit/licence metadata and do not relicense these assets.
