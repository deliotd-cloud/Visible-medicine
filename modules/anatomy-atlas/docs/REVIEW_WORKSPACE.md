# Shoulder review workspace

## What is delivered

`/review` is the working review dashboard for the dedicated nine-structure shoulder pilot. It uses the approved Visible Medicine identity. Its structure links open the matching 3D selection in a new tab, preserving review drafts. The shoulder explorer links back to the selected structure's review.

Each structure has independent Geometry, Teaching and Imaging tracks, a checklist, reviewer name/role, scope, notes, HTTPS evidence links, and issues with severity and resolution. Queue filters surface open issues and outdated reviews. Refresh retrieves saved progress; export downloads the latest saved snapshots as JSON. History is paginated, 20 snapshots at a time.

The dashboard is a review-recording tool, **not credential verification, institutional sign-off, medical-device certification or completed clinical validation**. No specialist review was fabricated or pre-populated. No new anatomy or scans were imported. Acquired imaging is absent and cannot be approved. The teaching track includes review of the existing imaging descriptions, separately from approval of actual imaging assets.

## How to use it

1. Sign in to the private atlas and open **Review workspace** from the shoulder header.
2. Select a structure and review track. Open the corresponding anatomy, or expand **Current material & source provenance** to read the teaching content and configured exam answers.
3. Complete checks only after reviewing them. Enter evidence and notes. Record uncertainties as issues rather than checking them off.
4. **Save review draft** stores the current track centrally. Switching structure/track keeps unsaved drafts in the current page. They are not automatically saved or stored in the browser. Navigation inside the workspace is guarded and browser close/reload requests an unsaved-changes warning, subject to browser policy.
5. Mark issues resolved only with an explanation. Saved issues cannot be removed through the API; history retains previous versions.
6. **Record approval** requires every check, no open issues, a reviewer name and role, meaningful scope, evidence and a personal attestation. This is the signed-in user's recorded assertion, not a verified professional credential. Editing a review clears its unsaved approval/attestation state.
7. When content or the model/display changes, old approvals show **Re-review required**. Start a new review; previous checks are cleared, while notes/issues remain available. Earlier snapshots are never overwritten.

## Persistence, identity and privacy

- The existing Sites deployment now declares the logical D1 binding `DB`. There is no R2, paid AI endpoint, app-owned password database or new subscription.
- Each request uses the platform-provided authenticated user ID, and every query is scoped to that user. Reviews follow that account across devices **on this Site**. Separate reviewers do not yet share a team workspace. Sharing the Site does not automatically share review notes. Team permissions, verified reviewers, countersignatures and publication approval remain future work.
- GET and POST require identity. POST additionally requires same-origin JSON and enforces a streamed 32,000-byte limit. Evidence links are validated but never fetched by the server. Do not enter patient information or credentials in notes or links.
- Sites dispatch is the trust boundary for authentication headers. A direct/self-hosted deployment must install a trusted authentication adapter that strips untrusted incoming identity headers before using this API. Do not expose the Worker directly with caller-controlled identity headers.
- Responses are private/no-store. No review content appears in static assets or shared module-level state. The public/default anatomy resolver is not converted into an atlas-wide approval system.
- All saves append to `review_events`. The primary key `(user_id, structure_id, track, version)` supports the actual latest/history queries. One atomic conditional INSERT compares the expected version, preventing lost edits. A conflict preserves the page's unsaved draft; refresh and compare before discarding/restarting it.
- There is no delete endpoint. Account erasure, retention policy and administrative export must be designed before inviting external reviewers. This release remains owner-private.

## Schema and revision binding

`db/schema.ts` is the Drizzle schema; `drizzle/0000_shoulder_review_events.sql` and its generated journal/snapshot are the initial schema-only migration. Production migration files become immutable once applied. Add subsequent migrations instead of rewriting history. Prepared D1 statements in `lib/review-store.ts` never perform runtime schema creation.

`lib/review-workspace.ts` defines the expanded persisted snapshot and runtime field validation. The earlier `content/review-record.schema.json` documents the legacy minimal status contract; it is not the new dashboard save format. New snapshots include checklist answers, issues, evidence notes, self-declared qualification, attestation, version and save time in addition to review status, scope and material/checklist revision.

`npm run reviews:revisions` generates `content/review-revisions.json` from the actual shoulder GLB hash, manifest, relevant viewer/display source, each teaching record and exam definitions. `npm run build` runs it automatically. Geometry invalidation is deliberately conservative: a display-source or manifest change can expire all nine geometry reviews. Teaching changes also include the full identification question set. No imaging fingerprint is manufactured. Checklist version changes independently invalidate previous reviews.

The server compares the submitted fingerprint/checklist version with its deployed values; arbitrary client fingerprints and outdated pages cannot silently approve changed material. Stored history preserves the old fingerprint and timestamps. This detects version changes, not whether a human actually performed a checklist item.

## Setup and testing

After installing the locked dependencies, run:

```sh
npm run db:local
npm run dev -- --host 127.0.0.1 --port 3000
```

`wrangler.review-local.jsonc` is a local-only tooling config using the same placeholder binding identity as Vite. Never publish it directly or replace Sites-managed production resource IDs. Use the normal Sites build/package/publish lifecycle, which includes the generated migrations. `worker-configuration.d.ts` is generated from this config.

```sh
npm run reviews:revisions
npm run reviews:test
node scripts/validate-review.mjs --http
npx tsc --noEmit
npm run licenses:audit
npm run build
```

The optional HTTP checks target localhost only. They verify authenticated storage reads and rejection paths without adding test reviews. The 189 automated review checks use a fresh in-memory SQLite database and import the exact runtime SQL and API handlers. They cover write/read round trips, field validation, absent-imaging approval refusal, current/stale revisions, preserved issues/history, user/track isolation, compare-and-save conflicts, CSRF and body limits. Synthetic records exist only inside that discarded test database. Browser interaction testing of this new dashboard and physical-device accessibility checks have not been performed in this milestone; previous browser QA covers the anatomy viewer, not these new forms.

The production dependency security audit reports no known vulnerabilities as of this implementation. The complete development graph reports four moderate findings in the current Drizzle Kit → esbuild-kit → old esbuild chain (GHSA-67mh-4wv8-2f99). Only migration generation is used; no Drizzle Studio or esbuild development HTTP server is started or exposed. These packages are development-only and are not imported by the Worker. Review upstream fixes before exposing development tools; do not apply the audit's suggested incompatible downgrade blindly.

References: [D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/), [Drizzle D1 setup](https://orm.drizzle.team/docs/get-started/d1-new), [Workers bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/), [esbuild advisory](https://github.com/advisories/GHSA-67mh-4wv8-2f99).

## Remaining release decisions

Specialists still need to perform and substantiate the clinical reviews. The full-body display is outside this shoulder review scope. New source meshes, scans, patient-specific registration, team-wide approvals and main-website integration remain separate acceptance gates. The software adds no mandatory paid API or anatomy subscription; hosted storage, hosting quotas and professional review are not guaranteed free indefinitely.
