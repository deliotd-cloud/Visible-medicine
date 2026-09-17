# Bowel component navigation

In **Dissect**, select Small intestine, Large intestine, Rectum or Ileocecal
junction and open **Bowel components**. Choose Show to compare the supplied
surfaces. Each listed structure is selectable without opening a separate viewer.
Other regions remain unchanged; Explore and Practice do not gain this panel.

## What the source audit found

The apparent gaps in the large-intestine aggregate are intentional ownership
partitions, not newly discovered missing meshes:

| Source definition | Existing display owners | Source files accounted for |
| --- | --- | --- |
| Small intestine, FMA7200 | Remaining aggregate + separate FMA11338 junction | 56 / 56 |
| Large intestine, FMA7201 | Remaining aggregate + FMA14544 rectum + FMA11338 junction | 8 / 8 |

FJ2571 belongs to the separate rectum and FJ2599 to the separate junction. The
archived PART-OF definitions, current catalogue ownership and cross-tree canonical
geometry fingerprints agree. Every source file has one root owner. Three existing
model bundles have verified exact bytes; no model, source ID, membership, shape,
transform, anatomical side or existing dissection recipe was changed.

This accounting is not complete anatomical coverage. The original source aliases
the junction to several cecal/ileal definitions; separate cecal regions, valve
leaflets, wall layers, sphincters and a validated lumen are not supplied. The
strict reasoning matcher still does not treat a reduced aggregate as the complete
official source group. The prior large-intestine reasoning question remains held.

## Compact navigation and safety

- A single collapsed section appears only for these four exact supplied selections.
- The junction offers both small- and large-bowel groups. Other selections offer
  their relevant group only. Listed structures remain in original source positions.
- Abdomen has the aggregates and junction, but not the separately scoped rectum.
  Pelvis has the rectum; whole body can show each complete supplied source set.
  Out-of-region components are labelled, not silently imported or substituted.
- A revision-bound whole-body link retains the selected structure. The existing
  embedded-module adapter updates the top-level host route; access rights are
  unchanged. Choosing Show after continuation remains explicit.
- Show restores the available group, enables Organs and resets camera, cutaway,
  separation and local focus. Undo restores the preceding dissection state, not
  camera/system preferences. Component selection uses the existing restore/select
  path. No new imaging event or registration is invented.
- Whole-record, coordinate-frame and bundle checks reject missing, modified,
  duplicated or aliased inputs. Unpaired surfaces remain whole in Left/Right views.
  Exam mode suppresses this teaching/navigation section and its action.

The regression run also found that generic Study together could advertise a
source-bound focus rejected by the recipe engine. It now checks that the selected
structure survives the actual recipe before offering the link. The validator now
uses the current corrected display catalogue rather than the archival catalogue,
and explicitly rejects stale, missing and duplicate required sources for the real
pelvic urethral context recipe. Existing source guards were not relaxed.

## Verification and reproduction

Run `node scripts/pin-bowel-components.mjs --check` and
`node scripts/validate-bowel-components.mjs`. The immutable pin records baseline
674f8bae, complete partitions, four source records and three bundles. It does not
scan case directories, change source anatomy or create approvals.

The focused validator exercises 30 visibility plans, 24 source-bound links,
76 rejected source mutations, eight actual React renders, 22 partner button
callbacks and eight actual parent Show handlers, plus reducer Undo and source
non-mutation. Generic navigation has 134,142 assertions across 36 region/side
scopes, including the new guarded-recipe negatives.

Browser QA covers abdomen, pelvis and whole-body at 1440px and 390px widths:
correct available components, preserved selection, Show, Undo, small-bowel
continuation from the junction, hidden Explore UI and no horizontal overflow.
See the [browser report](bowel-components-browser-20260917.json). Mobile Undo lives in Systems & tools; the first
test harness omitted opening that drawer. Final testing uses its actual controls.
Emulated widths do not constitute physical-device or screen-reader acceptance.

## Rights and release boundaries

This reuses BodyParts3D4.0 under the existing commercial-compatible CC BY4.0
grant and retained DBCLS attribution/change notices. No new asset, font, dependency,
publisher illustration or paid service is introduced. New prose describes the
audited source partition and viewer controls, not a copied teaching dataset.
See LICENSES/THIRD_PARTY_NOTICES.md and the earlier INTESTINAL_JUNCTION.md.

All anatomy remains subject to revision-bound owner radiologist sign-off. No
clinical validation, patient registration, surgical safety or luminal continuity
is claimed. Source-only until the existing legitimate two-model upload/full-byte
verification gate is cleared and the newer module is explicitly activated.
