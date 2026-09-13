# Explore, Dissect and Practice

14 September 2026. These are modes of the same viewer, not separate models.

| Mode | Controls |
| --- | --- |
| Explore | Assembled anatomy, camera/zoom, system visibility, search, labels, selection/isolation, Anatomy/Clinical/Imaging notes and imaging-link status |
| Dissect | All basic navigation plus layer recipes, removal/restoration, undo/redo, separation styles, extraction, cutaway/transparency, relationship studies and saved dissection views |
| Practice | Existing formative identification/reasoning exercises; active exams retain their existing navigation and answer guards |

The dedicated shoulder and shared twelve-region/whole-body viewer use local,
independent Explore and Dissect display snapshots. Switching preserves selection
and note navigation; returning to Explore restores its assembled display, while
returning to Dissect restores its layers, removals/history, separation, camera,
cutaway and isolation. Explore starts with all available regional systems; the
whole body retains its existing initial system selection. The shoulder starts
at the superficial layer in Explore and the cuff layer in Dissect.

Practice captures the originating display before applying quiz settings and
cannot overwrite either learning snapshot. Starting a quiz retains the existing
quiz selection/reset behaviour. Snapshots last for this mounted viewer only;
use Saved dissection views for persistent device-local bookmarks before changing
regions or reloading. Bookmarks do not contain undo history. Direct nested-study
and focused-study links enter Dissect; ordinary structure searches stay in the
current learning mode. No new imaging connection, entitlement, anatomy, licence,
external dependency or clinical approval is introduced.

## Verification

- `node scripts/validate-workspace-session.mjs`: actual hook closure lifecycle,
  independent and cloned snapshots, latest captures, camera/history retention,
  Practice isolation and duplicate-event guards.
- `npm run shoulder-workspace:test`: 108 actual component renders, 288 handlers;
  layer/explode/advanced controls hidden outside Dissect; notes stay shared.
- `npm run atlas-navigation:test` and `npm run nested-navigation:test`: ordinary
  and nested search, valid/invalid links and correct entry into Dissect.
- `npm run dissection-history:test`, `npm run selection-visibility:test` and
  `node scripts/validate-study-views.mjs`: unchanged history, selection and
  bookmark contracts.
- Local browser: head/neck at desktop and 390 × 844, removed platysma, 60%
  separation, Explore/Dissect return, undo, selected Atlas, mobile drawers and
  practice entry/exit; shoulder superficial/cuff and 55% separation return.

Three older broad suites have pre-existing stale assumptions: model-first pins
old vessel/bookmark handler hashes; vessel-visibility expects 184 arteries
instead of the existing 198; explode-styles omits the existing model-delivery
import in its scene harness. They are not claimed passing. This change also
intentionally changes the bookmark handler to enter Dissect. Repair those
historical harnesses separately without discarding their evidence. The scoped
tests above cover this UI change; device-lab and radiologist acceptance remain
separate. Existing models/content and review decisions are not modified.
