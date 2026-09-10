# Find individual brain and eye parts

The shared registry now includes ten study families and 65 selectable nested representations, including [two pancreatic duct sources](PANCREATIC_DISSECTION.md). Search a source name/FMA ID from any region; links resolve the applicable regional route, not always Head & neck. Context is excluded and exam guards remain. Earlier brain/eye-only counts and examples below describe the original milestone.

Use **Search atlas** in any regional or whole-body explorer. Search a source name or FMA ID, for example `left lens`, `pons`, `third ventricle` or `left insula`. The canonical source label remains visible; the result names its dissection study and marks the anatomy as draft. There is no new permanent panel or toolbar.

The index includes 15 eye layers, 4 ventricular spaces, 4 brainstem/cerebellar compounds and 14 cerebral selections: 37 existing selectable representations, not 37 newly created anatomical structures. Context meshes and excluded source parts are not promoted into nested selections. Main-catalogue entries remain separate, including the brain and eyeball parents.

## Opening and returning

- A result in the current region and side opens the appropriate dissection and selects its exact child. It starts isolated at zero separation so outer layers cannot obscure it. Turn off **Isolate** to inspect its surroundings; eye search begins with all supplied layers available rather than hiding a wall component under the anterior preset.
- A result outside the current region or side opens a source-bound Head & neck link on the appropriate side. This starts a fresh regional view, as other cross-region results do; save custom work before leaving.
- **Back to atlas** closes the child view. In local navigation the selected parent and captured main-scene camera are retained. Keyboard focus is directed to **Search atlas** when that launched the view, otherwise to the existing parent launcher. Search closing suppresses its own focus restoration while handing over to the dissection dialog.
- Existing parent launchers retain their defaults: anterior eye layers, or the brainstem/cerebellar study. A search-selected child does not replace those defaults after the view closes. Switching brain studies resets the inner workspace; returning to the search's initial study starts that selected child afresh, not an old custom dissection.
- Search and child launching are guarded during an active exam. No study answer or child-imaging event is published through the parent's selection channel.

Browser focus/Escape, mobile, zoom, Back/Forward and GPU acceptance still require hands-on testing; injected callback and server-render tests do not claim that acceptance.

## Source-bound route contract

Root version-1 links are unchanged. Version-2 links contain:

| Field | Meaning |
| --- | --- |
| `study=2` | Nested-navigation format |
| `structure`, `source` | Exact parent identity and displayed parent GLB SHA-256 |
| `side` | `both`, `left` or `right` |
| `detail` | `eye`, `ventricles`, `brainstem` or `cerebral` |
| `part`, `partSource` | Exact selectable child identity and its GLB SHA-256 |

Repeated, oversized, malformed, partial or wrong-version nested fields are rejected. Version 2 does not accept a regional focus recipe. The resolver checks the current region/side, both source bindings and the exact child-to-study-to-parent association. A right-sided child is not silently opened in a left-only view, even when its brain parent is midline. Changed parent source metadata, changed child assets, context-only IDs and cross-study substitutions cannot open a child. Invalid links show the existing standard-view notice without substituting anatomy.

Initialization commits the parent, child and study with the loaded display catalogue before mounting the scene. URL input emits no imaging event and is applied once, not replayed after subsequent manual changes. No historical bundle, arbitrary model URL, patient frame or remote resource is loaded from query input.

This is navigation, **not** a clinical correspondence registry. Child selection is not yet persisted by the root Saved study views controls or indexed into the eight-topic root curriculum. Nested local search does not rewrite the browser URL; source-pinned cross-region results supply version-2 routes. Source names/FMA IDs alone are not sufficient evidence for linking a specific scan slice, segmentation, lecture slide or timed player segment. Existing atlas and separately paid lecture entitlements remain independent and unchanged.

## Verification and rights

Run `npm run nested-navigation:test`, `npm run atlas-navigation:test`, `npm run study-links:test` and the four nested-dissection suites. The new suite covers every nested target over 36 region/side combinations, 160 direct actions, 1,172 linked results, 74 actual loaded-catalogue initialization cases, 111 child-selection server-render cases, malformed/stale/wrong-side requests, exam rejection, copied camera state and focus-return handlers. Only GPU rendering is replaced in the child server-render cases. See `nested-navigation-validation.json` for the exact current assertions and limitations.

No geometry, anatomy prose, external datasets, dependencies, fonts, textures or paid services were added. Existing BodyParts3D v4 CC BY 4.0 attribution and modification notices remain required. The two shared search-display files change the nine shoulder display revision fingerprints conservatively; teaching fingerprints and geometry assets do not change. Historical comparisons verify both exact transitions, but no stored approval is migrated to the new display revision. Private access, source/geometry holds, review records, provisional scan publication gates and clinical-validation requirements remain unchanged.
