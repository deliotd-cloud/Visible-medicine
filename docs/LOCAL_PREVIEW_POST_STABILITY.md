# Local preview POST stability — 9 October 2026

The mesenteric import's failed local-runtime acceptance gate is resolved using an
isolated preview runtime, without changing authentication or application code.
The previously failed logs remain intact; GET-only checks were not substituted.

## Evidence and limits

- Website source baseline: `7f67a5b05698f4d75f4ea121ce684bcd11eb386a`.
- Atlas source: `f12348a11c0e8e0b642ec43c9285107259ca7ea5`.
- A synthetic Worker with no application imports reproduced the failure on
  Wrangler 4.125.0: cancelling an unread POST body returned 401, then the next
  GET returned 500 and the process exited. Reading the tiny body did not reproduce
  it. This does not justify draining arbitrary application bodies or bypassing auth.
- Isolated Wrangler 4.149.0 passed all nine synthetic cancel/ignore/read POST/GET
  pairs. The unchanged website build then passed the original 46 HTTP/access
  checks and 19 exact learner-asset readbacks on both 3196 and 3000.
- The runtime is an E-drive development-only installation, not a website
  dependency upgrade or deployed artifact. Its package lock is retained.
- The restored shared launcher also passed twenty consecutive denied POST/page
  recovery cycles (41 checks including the anonymous preflight). This is finite
  regression evidence, not a guarantee of unlimited uptime.
- Runtime package licence metadata is retained in `runtime-license-inventory.json`.
  Wrangler is MIT OR Apache-2.0. The toolchain includes LGPL-3.0-or-later components;
  it is used locally, unmodified, and is not bundled or distributed with the site.
  This is not a claim that every transitive tool is MIT or attribution-free.
- A related [upstream report](https://github.com/cloudflare/workers-sdk/issues/15203)
  describes a similar failure; our local experiments, not that report, establish
  this remedy for this build. No claim about every upstream cause or production
  environment is made.

Signed-in browser/GPU, clinical review, publication and backup acceptance remain
separate. No masks, meshes, review decisions, permissions, case/lecture/Atlas
entitlements or Didanix desktop files changed.

## Restart and regression

The existing E-drive `20261007-imaging-layout/launch-preview.mjs` now pins the
verified isolated runtime and refuses an unexpected version. It preserves the
same loopback address, local bindings, empty env file and local preview state.
Do not start a second process on the occupied port. Stop only the identified
preview process when an intentional restart is required.

```powershell
node E:/VisibleMedicine-LocalStaging/20261007-imaging-layout/launch-preview.mjs preview-UNIQUE-LOWERCASE-NAME
node scripts/check-local-preview-post-stability.mjs 3000
```

Use a new lowercase receipt name each launch. The check first verifies anonymous
401, then sends twenty synthetic `{}` requests, each followed by an Atlas page.
It never supplies cookies, credentials, decisions or patient data; redirects and
unexpected statuses fail. A successful run does not test authenticated writes.

Evidence and exact source-only recovery:
`E:/VisibleMedicine-LocalStaging/20261009-post-runtime/saved-state.json`.
The initial build is unchanged, so no rebuild was performed for this tooling fix.
The previous runtime launcher is retained for diagnosis, not recommended reuse.
Nothing was published or uploaded, and same-machine E recovery is not an
off-device or GitHub backup.
