# Local preview: rejected-request crash recovery

## Verified resolution, 8 October 2026

The E-drive sanitized website preview now uses an isolated **Wrangler4.148.0 / workerd1.20261006.1** tool installation. The canonical website remains at its existing dependency versions; its package manifest, lockfile, authentication, request guards, Worker entrypoint and production configuration were not changed. Nothing was deployed.

The previous Wrangler4.125.0 process correctly returned401 to an unauthenticated POST, then its proxy crashed and the next page returned500. A minimal six-line Worker reproduced this with static assets configured and no website imports, database, framework or identities. The same Worker without assets survived. Worker-first routing did not fix it. Testing exactly the same isolated fixture/configuration against4.148.0 survived20 POST/GET pairs; the old tool failed again. This isolates the observed problem to the older local tooling/static-asset path, not MRI anatomy or tour links.

An upstream [similar assets/proxy issue](https://github.com/cloudflare/workers-sdk/issues/15203) informed the diagnosis; our local reproduction and version comparison establish this project's result. That issue is not proof of identical internals or a production defect. No dependency source was patched, body drained without limits, access rule weakened or request automatically retried.

## Exact local setup

- Tool checkout: `E:/VisibleMedicine-LocalStaging/20261008-preview-early-response/tool`
- Pinned installation: `wrangler@4.148.0`; exact transitive versions/integrities in that folder's `package-lock.json`.
- Launcher: `E:/VisibleMedicine-LocalStaging/20261008-preview-early-response/launch-website.mjs` with a new unique `preview-...` receipt name.
- Sanitized build: `E:/VisibleMedicine-LocalStaging/20261007-imaging-layout/website-preview-v3/dist`; current successful `build-practice-revisit-v1`. The original runtime-recovery result used `build-mri-review-complete-v1`; that complete848-file build is retained and hash-verified under `20261008-practice-revisit/previous-dist`.
- Configuration: existing `20261007-imaging-layout/local-preview.json`, local fake bindings and empty environment file. Explicit `--local`,127.0.0.1:3000; inherited Cloudflare credentials removed, telemetry disabled, outputs/persistence on E. No hosted resource access.

Use the saved launcher with Node only after confirming the prior owned3000 session is stopped; do not kill unrelated listeners. Use a unique receipt name because existing evidence is not overwritten. Current owned session33706, launch `preview-practice-revisit-v1`; prior68536 and15893 stopped. Historical3001 was not touched. This isolated tool is not the production build/deploy tool and is not automatically used by ordinary project commands.

Npm's pending install-script approvals were not granted or bypassed. Installed platform optional binaries were usable without doing so. Initial trial was stopped after broad module discovery included the tool directory; final fixture's entrypoint and assets are isolated under `fixture/` and its logs outside. No such diagnostic fixture is exposed by the website.

## Acceptance evidence

`E:/VisibleMedicine-LocalStaging/20261008-preview-early-response/saved-state.json` binds the exact fixture/configuration/launcher, installed package versions, lockfile and receipts.

-15 full HTTP checks now pass, including unauthorized MRI POST followed by all four MRI-only guided comparisons, private-page/API withholding and stale-link404.
-10 further unauthorized saves across both original25 and MRI endpoints each return401/private-no-store; each following MRI navigation returns200. Public client asset delivery still returns200.
-20 isolated minimal POST/GET pairs pass with the new tool; exact old-tool fixture still fails.
-At the runtime-recovery checkpoint,58 product tests/full canonical TypeScript and the prior sanitized build remained applicable because product code had not changed. Subsequent practice follow-up source and build verification are separately recorded under `20261008-practice-revisit`; do not apply the earlier unchanged-source statement to later edits.

This verifies rejected-request resilience, not signed-in persistence, clinical correctness or production deployment. Real owner-account acceptance remains separate. The earlier failing receipts remain retained; do not describe them as passing.

## Licensing and boundaries

Wrangler's declared license is `MIT OR Apache-2.0`; the isolated installed tool's dependency-license inventory is stored in `tool-licenses.json`. Some native image-tool binaries have LGPL terms. They are local diagnostic tooling only, not copied into the website, model assets, hosted artifacts or source-recovery bundle. Preserve their package notices with the installation. No paid service, image/model/data asset, website dependency or production license inventory was added or changed. E is same-machine recovery, not an off-device/GitHub backup.
