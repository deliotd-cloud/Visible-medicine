# Private whole-body review decisions

`/review/body` combines read-only worksheets with a separate private review record for 1,022 root-body selections. Tracks: **3D anatomy**, **Teaching copy**, **Imaging**. The learner toolbar is unchanged. This records personal reviews, not verified credentials, institutional sign-off, clinical certification or atlas completeness. No reviewer/approval is seeded.

## Use

1. Sign in, filter the queue and select one structure. Read its source, limitations and topics; inspect the actual model on relevant devices before confirming geometry checks.
2. Choose a track; enter reviewer name, role, exact scope, notes, HTTPS evidence and corrections. Switching tracks retains working drafts. Checklist/evidence/issues/history are collapsed.
3. Save a draft or changes-required record. Approval requires all checks, evidence, scope, reviewer details, resolved issues and personal attestation. Geometry excludes nested/independent specimens; identity-only anatomy cannot be approved. Teaching covers available drafts, requires authored Anatomy/Function/Clinical/Pathology, and excludes pending/generated topics and the separate interactive question bank.
4. Imaging notes can be saved, but **imaging approval is blocked** without validated acquired images/registration. Radiology text is not an acquired-image approval. No separately subscribed scan atlas or lecture is unlocked.
5. Conflicts and uncertain saves block retry until saved records are refreshed. Compare history, then explicitly use saved records or keep edits against them. Keeping edits retains saved issues and resets checks/attestation. Changed worksheet material requires exporting edits before page reload. There is no silent overwrite or automatic retry.
6. History loads twenty versions at a time. Its export contains exactly the loaded records, not an account-wide backup. Working-copy export contains unsaved drafts and cannot be imported as approval. Keep exports private. Navigation/filter/reselection prompts before discarding edits; close/reload warning depends on browser policy. No browser persistence/autosave.

## Data and revisions

- New append-only `body_review_events` table in the existing logical `DB` binding. Ship generated `drizzle/0001_body_review_events.sql` and metadata with this release; applied migration 0000 is unchanged. No shoulder rows are migrated, updated or deleted. Apply both generated migrations for local testing through the existing setup.
- Key: authenticated user + root structure ID + track + version. Catalogue scope `body-display-catalog`; event schema `vm-body-review-event-1`. Some pilot IDs overlap root IDs but refer to different sources/scopes: separate tables prevent collisions. No update/delete/import endpoint.
- `GET /api/body-review/decisions` returns current context, latest target records and paginated history. `POST` checks trusted Sites identity, same-origin/CSRF headers, JSON, streamed 32 KB limit, exact target/current material/checklist/revision and expected version. Responses are private/no-store. No private data or request state in module globals/error logs.
- Bound prepared SQL conditionally appends only when the current maximum version matches the expected version. A competing writer receives a conflict. Saved issues remain in later records; resolutions require explanations. Historical payloads are validated against their recorded checklist.
- Geometry revision includes exact source and a conservative build-generated dependency closure covering root renderer, layout/CSS, lockfile and model-delivery code. Teaching revision includes source/current topics. Both include scoped checklist/version. Renderer changes can invalidate more geometry reviews than strictly necessary. Imaging has no approvable revision.
- Build runs shoulder revisions then `content/body-renderer-revision.json` generation. `npm run body-decisions:test` verifies freshness. Dynamic local imports must be statically traceable or generation fails. GLB hashes come from the existing audited catalogue; source fidelity is not clinical validation.
- Hashes identify snapshots, not reviewer signatures. Changed revisions display **Re-review required**; historical approvals remain but are not current or copied to learner badges. Reopening a stale record clears checks/attestation.

## Hosting and limits

Existing owner-only Sites access and D1 binding remain. A future Visible Medicine host must replace the trusted Sites identity adapter and enforce reviewer/atlas authorization server-side. Never trust a browser-supplied identity header or infer reviewer/lecture permissions from an Atlas subscription. Authentication here is not professional credential or organizational role verification.

No new dependency, asset, paid AI API or licence is added. Original code is MIT; source credits remain. Hosted capacity/service terms still apply. Source backups do **not** contain private D1 data or conversation history. A separate authorized database export/restore is needed before claiming off-device data recovery.

## Verification and remaining gates

Run `npm run body-decisions:test`, `npm run body-review:test`, `npm run reviews:test`, `npx tsc --noEmit` and production build. New checks cover all 1,022 contexts/3,066 tracks; malformed requests/data; approval/stale gates; actual SQLite execution of both generated migrations; preserved shoulder sentinel; user/track/catalogue isolation; competing atomic appends; 24-version history; client parsing/reconciliation; and actual React field/editor renders. Synthetic approval fixtures stay in memory; tests never write production reviews.

Browser/mobile/keyboard/focus and multi-tab network-interruption acceptance remain required. Human anatomy/teaching/assessment review, credential verification, nested/specimen scopes, acquired-image rights/de-identification/registration and independently entitled resources remain open. This is review infrastructure, not new anatomy or clinical completion. Routine oral expansion remains lower priority.
