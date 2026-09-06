# Whole-body and regional dissection links

## Use

Select a structure and expand **Continue this dissection**. Choose a region to open assembled regional anatomy with that exact structure and side retained, or expand its focused-study list to open an existing target/context recipe. From a regional explorer, **Whole body · keep selection** returns the same source identity to whole-body orientation. Only catalogue-declared regions are offered; structures spanning regions can have several destinations.

**Copy this study link** creates an absolute URL on the current atlas origin. Copy failure leaves an ordinary **Open linked view** link as a fallback; that link performs a new page load so reopening the same URL reliably reapplies the recipe. Creating or copying a URL does not grant access or alter private sharing. Region/focus links use the existing client router with prefetch disabled; the page key includes the parsed request, so changing the requested structure/focus in the same region initializes a new study view.

Links preserve the current region, selected public anatomy ID, side and an available named focus. An unsupported custom focus/selection combination falls back to an assembled link; no altered recipe is silently encoded. Custom removals, system switches, cutaways, explode/tray layout, camera positions, opacity, quiz answers and personal reviews are not URL state. Save full display/camera context using the existing device-local Saved study views. Links are not a substitute for those bookmarks or a frozen historical teaching version.

## Contract

The allowlisted route is `/` or `/regions/{known-region}`. The query contains only `study=1`, `structure`, `side`, `source` and optional `focus`. `source` pins the selected structure's model-bundle SHA-256. No user-supplied URL, model path, script, camera matrix, patient ID or remote resource is fetched from the query.

`lib/study-links.ts` parses bounded scalar values and rejects repeated fields, incomplete requests, unsupported format versions, malformed IDs, invalid sides and hashes. Unknown unrelated parameters are ignored and not copied into generated links. Profile lookups require an own property and a known catalogue region; prototype names and path traversal do not select a profile.

After the catalogue loads, the resolver checks exact structure membership in that region/side, selected-bundle hash, focus existence and selection membership in the actual focused recipe. An invalid or stale request opens the standard view with a notice, without substituting another structure. No stale bundle is downloaded to satisfy a link. A valid request is committed alongside the loaded catalogue before the scene mounts, avoiding an interim wrong-side/default scene. The application does not keep reapplying the URL after subsequent manual selections, removals or exams.

URL initialization never emits an imaging event, starts/resumes a quiz, changes review records or imports a camera/patient frame. Copy/destination controls are not rendered during practice. Explicit navigation to another atlas page starts a fresh study session; it is not a mechanism for revealing answers inside the active exam.

Existing focus recipes remain authored, unvalidated study groups, not proven attachments or innervation. The link points to the current recipe bearing that ID, while the selected mesh bundle is hash-bound. An unrelated new bundle does not invalidate the link; a changed selected bundle does. IDs, clinical validation status and source registration are not altered by navigation. No new package, font, texture, model or paid service is introduced.

## Automated evidence

Run `npm run study-links:test`. The 198,160 assertions cover 11,035 valid assembled/focused links (6,490 focused), 4,651 whole-body/regional destinations and 36 region/side combinations. Tests use actual source catalogue IDs and the dissection resolver, verify round trips and retained selection, reject malformed/duplicate/out-of-scope/stale inputs, and check route/initialization wiring. Duplicate-field tests exercise the installed Vinext runtime's actual search-parameter collector. See `study-links-validation.json`.

All 942 source representations, 76 body GLBs, 108 dissection recipes and 90 focused views remain unchanged. Existing anatomy, inspection, arrangement/explode, dissection, study, practice, imaging and review regression suites are required alongside type checking, focused lint, build and the licence audit. These tests are software evidence, not browser/device or clinical approval.

Hands-on acceptance remains: direct entry/reload, client navigation within a region, browser Back/Forward, clipboard denial and fallback, authentication of copied private URLs, narrow-screen long labels, bundle-load failure/retry, and absence of study hints in practice. Clinical validation and the user-supplied US/CT/MRI adapter/registration gates remain outstanding.

## Source queue evidence

`npm run inventory:triage` records a bounded 24-definition source queue in `content/unused-study-candidates.json`. It checks held component aliases before prioritization. The apparently unused middle-pharyngeal-constrictor aggregate FMA46622 contains FJ2742/FJ2754, already held as FMA46633/FMA46634: aggregation cannot bypass the laterality/position hold. FMA55077 pharyngeal raphe and FMA55130 epiglottis need source-alias interpretation before any mesh admission. Selected pancreatic/pancreaticoduodenal vessels remain candidates for exact/sampled overlap checking against the existing abdominal vessels. No source is admitted or hold lifted by this lexical inventory pass.
