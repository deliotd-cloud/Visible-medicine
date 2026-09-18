# Celiac artery: exact duplicate-render correction

18 September 2026; source baseline `6b96e836942a7c124e6caf947e3920dc898687fd`.

The existing FMA50737 selection contained two identical rendered surfaces.
The new standalone display asset retains **238 rather than 476 triangles**,
with exactly the same positions, normals, triangle winding, bounds, centre and
label anchor. It is not a newly modelled artery, shape repair or extra anatomy.
Both FJ1846 and FJ2013 provenance records remain attached to the same stable ID.
The archived full-body catalogue and original GLB are unchanged.

## Generation and evidence

`scripts/build-celiac-display-correction.mjs` verifies both source hashes and
full parsed OBJ vertices/normals/faces, then verifies both halves of the original
GLB against each other and independently reconstructed standard source geometry.
Only after exact equality does it retain the first half. There is no tolerance
threshold, automatic repair, mirroring, smoothing or broad deduplication rule.
Current source-hold policy is checked before output. Wrong-source bytes, changed
vertices and reversed winding have explicit negative cases.

New asset: `public/models/bodyparts3d/celiac-display/celiac-display.glb`,
5,604 bytes, SHA256
`4f431242839c255ae2320b4004c537a4c2defb7d0cd7b51fdea60f7ba3c09e8f`.
The correction JSON retains original/replacement records, coordinate frame,
old/new bundle bindings, source evidence and adaptation details. The replacement
record differs only in its bundle; every other field remains exact.

The earlier [source audit](CELIAC_TRUNK_SOURCE_REVIEW.md) remains historical,
unchanged evidence at its recorded baseline. Its strict computation-input check
must run from that saved baseline, not against this deliberately changed viewer.
It remains a reason not to import FMA14812 as another celiac structure.

## Integration safeguards

- Existing atomic display-correction logic rejects altered original records,
  source frames and bundle hashes. Reapplying the correction is idempotent.
- Only exact corrected identity receives continuity of the three existing
  CT/MRI/ultrasound teaching drafts. Mutated records cannot use that exception.
- Exact Git replay proves all **9,936 teaching topics**, all 1,104 stable root
  IDs, other structures/bundles, shoulder teaching and dissection recipes remain
  unchanged. Historical reconstruction is offline only and binds to the recorded
  before/after catalogues; it never migrates approval or imaging registration.
- New saved/study links use the new bundle hash. Old source-bound celiac links
  are rejected as `source-changed`, not silently reassigned. Both source records
  remain in teaching/resource metadata; no lecture/case entitlement is changed.
- Loading, practice eligibility, removal/undo and review worksheets consume the
  corrected bundle. Review remains unsubmitted, and renderer revision changes
  invalidate prior geometry-dependent acceptance.
- Abdominal arterial relationships retain their existing concepts and routes.
  Their exact binding is adapted to the corrected bundle for raw/display callers;
  changed or missing bundle hashes still reject the relationship map. The
  requirement-inventory comparison exposed this otherwise silent feature loss,
  and the abdominal-arterial suite plus dedicated negative tests now cover it.
- No patient data, scans, masks, new dependencies, fonts or textures are used.
  Existing CC BY 4.0 attribution is retained with explicit adaptation notices.

## Checks and remaining gates

`npm run celiac-display:test` reproduces the asset, tests geometry, replays the
saved source, checks runtime identity/links/loading/practice and rejects mixed
historical states. The 13-suite focused run covered celiac, lower-neck and hand
studies, source holds/geometry, renderer, selection visibility, review, content
and study navigation/links. Its content-history adapter issue was corrected;
the content suite then passed without changing any historical fixtures.
TypeScript, production build and regional preview build passed.
The additional abdominal-arterial regression suite passed after the binding update.

Local browser checks opened the new source-bound selection, isolated it, displayed
CT/MRI drafts and exercised removal/undo (106→105→106 visible). A genuine
390×844 iframe opened the compact information sheet and returned to the isolated
model, with document/viewport widths both390px. Screenshot capture timed out;
visual approval and physical-device acceptance are **not** claimed. Browser
listener-channel errors were observed during the failed screenshot, so this is
not a claim of a clean browser console.

The final regenerated runtime also passed a browser check of the corrected
arterial relationship panel: abdominal aorta upstream, common hepatic/splenic/
left gastric downstream. Show-connections retained 10 structures; Undo restored
all 106. The source inventory retains 157 artery selections, 93 concepts and
175 relationships. All 713 regional build inputs were hash-checked before this
local test. The temporary QA server and tab were closed afterward.

This is a saved source improvement, **not a hosted release**. Before website
activation, stage and byte-verify the new immutable model, regenerate the regional
module, preserve all prior models and independent entitlements, then perform
hosted regression checks. Clinical sign-off remains the owner's separate,
revision-bound decision.
