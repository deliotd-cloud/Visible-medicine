# Whole-body and regional study continuation

17 September 2026. The shared website module supports all twelve scopes, but
the contained StudyLinks panel previously filtered out every other region.
Its regional link adapter also navigated only the iframe; the host heading and
region bar could describe the previous anatomy. The host's generic 3D route
redirected dedicated regions without preserving the source-bound study query.

The existing collapsed Continue this dissection section now exposes the actual
available whole-body/regional destinations in the shared module. Its link adapter
uses the top-level `/atlas/3d` route with the destination region and original study
fields. The matching website source retains study-bearing requests in that route;
plain region navigation still uses established dedicated pages. The host filters
transport fields and the module still validates structure, side, scope, focus and
source revision. No URL input grants access or emits an imaging-selection event.

Older single-region containers stay restricted. Canonical standalone links and
the explicit full-screen/copy-current-view fallback remain unchanged. No new
control, geometry, clinical text, patient data or entitlement is introduced.

The contained navigation validator renders actual StudyLinks/Link source for all
twelve scopes and checks destination identity and top-level navigation. Existing
study-link validation covers source/side/focus rejection. Website tests execute
the real page function to check all twelve headings/iframe queries and retained
plain redirects. Build/browser/publication and backup outcomes are recorded in
the dated coordination checkpoint; source tests alone do not prove live behavior.

The updated shared module is not activated ahead of its two new model uploads.
Use this newer export after staging, rather than the older prepared runtime.
