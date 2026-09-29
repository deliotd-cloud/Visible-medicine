# On-demand teaching loading — 29 September 2026

Regional and whole-body initial JavaScript falls from **7,631,095 to 3,897,572
bytes (48.9% less)**. The complete synchronous `body-content` API, teaching,
citations, identities and models remain unchanged. The 3,652,345-byte teaching
module loads only when needed. No dependency or external service added.

## Behaviour

- Shared pending/successful import; current structure/tab resolves at render.
- Hidden workspace modes, mobile sheets, inline studies and closed quiz notes
  do not request teaching. Tour notes wait for an active step/open explanation.
- The viewer/camera remains usable when notes fail. Retry ignores unmounted
  subscribers and restores keyboard focus without stealing it from other controls.
- Chromium can cache a failed module download. A second failure offers an
  explicit **Reload atlas** with an unsaved-view reset warning. Never automatic.
- Rendering fingerprints/shoulder fixture regenerated; this is not clinical approval.

## Evidence and limits

Chrome DevTools, verified compiled local module, no-store HTTP, whole-body default
skeleton, 375×812 touch viewport, Fast 4G/4× CPU. One exploratory before/after pair:

| Measurement | Before | Deferred implementation |
| --- | ---: | ---: |
| Loading-screen LCP | 13,445 ms | 9,152 ms |
| Scene JavaScript request starts | 11,851 ms | 7,576 ms |
| First completed-list skeleton request starts | 13,459 ms | 9,174 ms |
| CLS | 0.00 | 0.00 |

These are not model-ready times, field/live-site metrics or a multi-run statistical
claim. The timed after-build precedes the 251-byte manual reload fallback; the
final byte measurement and browser checks include it. Initial earlier website
measurement used mixed cache and is not used in this table. Raw trace saving was
denied by the tool's workspace scope; no bypass attempted. Local trace summaries
and resource timings are retained in coordination `work/atlas-loading-*.json`.

Final actual-browser checks: desktop and phone, 30 exact source-derived section
comparisons across two structures/five tabs/three scenarios; no eager teaching
request; one successful request shared; deliberately failed request, cached retry,
warned manual reload and successful recovery. Mobile guided tour: notes/MRI,
next-step notes, Play/Pause and Exit. See
[browser evidence](lazy-teaching-browser-validation.json). An injected failure and
cancelled asset requests remain recorded; they are not silently discarded.

Seven deferred-loader/boundary tests; 36 tour/camera tests; content contract
33,460 assertions; body review 1,104 selections/9,936 topics/308 reasoning packets;
372 tour-imaging lessons; renderer, source notes, practice navigation and search
focus; TypeScript and regional/shoulder builds pass. Two pre-existing stale test
totals were replaced with exact registry-derived coverage plus stronger source,
answer and choice assertions, not by deleting cases.

## Reproduce

```
node --import tsx --test scripts/test-body-teaching-loader.mjs
node --test scripts/test-regional-tour-player.mjs scripts/test-tour-reference-pause.mjs
node scripts/validate-content-contract.mjs
node scripts/validate-body-review.mjs
node scripts/test-tour-imaging-notes.mjs
node node_modules/vite/bin/vite.js build --config integration/head-neck/vite.config.mjs
node scripts/validate-teaching-split.mjs
```

The split guard traverses emitted static imports/preloads, verifies a reachable
deferred teaching chunk and enforces a reviewed 5 MB initial-JS ceiling. Serve a
verified local compiled module, set `VM_PLAYWRIGHT_MODULE` if Playwright is outside
the checkout, and run `scripts/test-lazy-body-teaching-browser.mjs <local-url>
<report-path>`. The browser runner checks source-input hashes first.

Remaining: initial JS is still substantial; investigate remaining eager regional
tools before changing them, and measure actual scene readiness/device behaviour.
Region-specific teaching splitting is not implemented in this batch. Clinical,
privacy, release and licensed-asset gates remain unchanged. No publication.
