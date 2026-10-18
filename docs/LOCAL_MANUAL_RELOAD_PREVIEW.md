# Local manual-reload preview

Optional development mode for reviewing the website between large Atlas imports:

```powershell
cd F:/VisibleMedicine/website
node scripts/start-stable-preview.mjs
```

Stop the identified existing preview first; never launch on an occupied port or
stop another application. The launcher accepts no overrides, uses loopback port
3000, and keeps Vinext's normal process lock. An occupied port is an error, not
permission to silently open another port. The standard `npm run dev` remains
unchanged.

This opt-in uses Vite's documented `server.watch: null` and disables HMR. A fresh
process loads current source, but subsequent edits do not invalidate loaded
modules. **This is not an immutable snapshot.** Public assets and explicitly read
files can still change on disk. Stop preview before generated-module imports or
other broad source replacements; run the normal import/build/verification gates;
then start a fresh preview and check the source revision and anonymous routes.
Do not review or approve against a partially imported source tree. For ordinary
small UI edits, use normal development mode if live updates are needed.

The policy applies only to Vite's `serve` command when the process-local
`VM_LOCAL_PREVIEW_STABLE=1` flag is present. Builds ignore it. The launcher prints
the manual-reload limitation. No `.env` files, machine-wide variables, secrets,
bindings, authentication, access rules or clinical decisions are modified.

## Evidence and limitations — 15 October 2026

The retained local failures showed repeated `als-registry.js` scope-exit frames
in Vinext 1.0.0-beta.8. An isolated process re-evaluating the installed work-unit
shim reproduced a stack overflow at 9,200 evaluations / 9,201 registered stores
on Node 24.18.0. Request scope exit and restoration passed before the stress.
This demonstrates a possible mechanism, **not the actual live registry size or
a proven complete cause of the Vite/Cloudflare failure**. Vinext's
[scope-exit source](https://github.com/cloudflare/vinext/blob/main/packages/vinext/src/shims/internal/als-registry.ts)
still composes nested exits; no dependency file or request context was patched.

The mitigation uses the supported
[Vite watcher option](https://vite.dev/config/server-options#server-watch), not
registry clearing, skipped scope exits, increased stack limits, authentication
bypass or automatic retries that hide failed verification. The actual installed
Vite test confirms repeated synthetic requests retain a loaded module after an
edit and load its new version only after restart. Unlimited uptime and full
Cloudflare HMR behavior are not established by this finite test.

Focused checks:

```powershell
node --test tests/local-preview-policy.test.mjs tests/local-preview-watch.test.mjs tests/atlas-current-source-notes.test.mjs
node scripts/verify-clinical-review.mjs
```

Evidence lives under `F:/VisibleMedicine/staging/20261015-stable-preview`.
Clinical, signed-in browser/GPU and publication acceptance remain separate.
No public deployment, new dependencies, model/mask changes or desktop PACS work.
