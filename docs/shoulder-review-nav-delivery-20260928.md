# Shoulder review and bookmark navigation

Completed 29 September 2026; log filenames retain the28September start date.
Imports Atlas `46fde2b6fa76af9349bd582f5ed328305bb26291`.

The embedded shoulder's Review workspace link now opens the website's protected
shoulder review page in the host window, preserving the selected canonical ID.
It no longer opens the old standalone Atlas. The host shoulder page now forwards
a known structure bookmark into both its iframe and Open full screen link.
Duplicate/unknown/foreign identity values fall back to the default model; other
query parameters are not transported. Module source validation remains in place.
Review authentication, personal decisions and imaging/lecture access are unchanged.

## Verification

- Three source tests cover nine known IDs, malformed/foreign/duplicate input,
  discarded redirect/hash data and actual framework host-window binding.
- 252 website tests, source/website TypeScript and production/module builds pass.
  All136models/143paths and independent sources unchanged. Existing large-chunk
  warnings remain; no dependency or licence changes.
- Review import:880source files/31viewer files/22packages. Integration hash:
  `ef60a2220806918c2c880cd55a46570913586fb20b514dd7c09ca741adcdd30e`.
  Source teaching/geometry revisions unchanged; website adaptations rebound
  conservatively without migrating decisions.
- Actual375×812 browser: valid Teres minor bookmark selects that model structure;
  iframe and full-screen link preserve its ID. Clicking Review workspace navigates
  the top-level website to `/workspace/atlas-review/shoulder` with the same ID.
  Page headings are Shoulder teaching pilot / Teres minor, with no nested iframe.
- An actual duplicate structure query with unrelated redirect input yields the
  default iframe/full-screen URL; it does not forward the query or change origin.
- No review submitted. Current local-workspace tests/build include separately
  unstaged fracture work, excluded from this Atlas commit. No Atlas publication,
  patient upload or clinical acceptance claim.

Coordination logs use `work/shoulder-review-nav-*20260928.*`. GitHub/D recovery
details are retained in the coordination checkpoint. Old generated bundles are
preserved there, not irrecoverably discarded. Native MRI remains done.
