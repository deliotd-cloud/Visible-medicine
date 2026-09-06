# Source-bound regional dissection guidance

## Controls

Every regional explorer and whole-body scope now includes **Orient this dissection** in the existing study guide. It uses the current region, side and authored recipe—not a new anatomical model or operative sequence.

- **Camera preset / Recipe orientation:** explicit front, back, left, right, above or below descriptions. The preset is not represented as a measurement of the camera after free rotation.
- **Reorient to recipe / preset:** clears a pending saved-camera restore, selected-only framing, pan and zoom, then fits the existing scene in the stated direction. Tissue visibility, systems, selection, inspection, source geometry, arrangement mode and separation amount are retained. Tray display positions may recompute for the new projection; source coordinates do not change.
- **What is in this view?:** enabled source-entry counts, separately ready/loading/unavailable, plus removed/system-off counts. These are catalogue state, not visible pixels or occlusion measurements. Ghosting, fading, clipping and separation do not change the membership counts.
- **Recipe comparison:** exact omitted and additional identities relative to the clean recipe. Focus recipes distinguish rule-matched targets from retained context; context is not a claim of verified attachments, innervation or spatial continuity.
- **Find a recipe member:** multi-term name/source-ID search through exact scoped identities, with readiness/removal/system status and selectable rows. Uses the existing tested removed-structure search helper. Selecting removed/system-off members explicitly restores/enables them through the existing guarded selection path; a failed member can still be selected for its information but needs retry to display.
- **Reopen clean recipe:** uses the existing stage/focus transition. It resets manual tissue changes, system filters, cutaways and separation, as warned beside the action. Source failures may still require Retry missing anatomy.
- **Next layer:** appears only for an actual next item in the region's existing layer track, with exact hide/restore/retain counts and the existing clean-stage action. Independent windows/focuses are never numbered as subsequent layers. Final-layer and free-view guidance remain distinct.

Authored landmark patterns resolve against current source identities and show whether a matched landmark is removed, switched off or waiting. The 3D labels retain the exact prior visible-only, maximum-eight selection policy. No new clinical landmark, counterpart or connection is fabricated. Practice hides the guide and guarded recipe/reorientation handlers reject exam-mode actions.

## Architecture and verification

`lib/dissection-guidance.ts` derives expected/current membership, target/context roles, availability and valid next actions. `app/dissection-orientation.tsx` presents it inside the existing guide; it does not own anatomy, imaging or dissection state. `app/body-explorer.tsx` keeps the actions under the original scope, exam and reset guards. No changes to geometry, catalogue/profile hashes, saved-view format, review decisions or imaging contracts.

Run `npm run guidance:test`. The committed `dissection-guidance-validation.json` records **1,363,108 assertions**, 36 region/side scopes, 714 recipe scopes, 14,280 membership/loading variations and 16,440 valid clean-stage/focus transitions. It also executes the actual camera/action handlers with spies, verifies the previous 3D label policy and renders 72 real-component markup cases with installed controls. Empty/invalid scope, free exploration, focus context, failure precedence, exact counts and no mutation are covered. Existing anatomy/source, dissection/workbench, loading, practice, study/library, imaging/navigation, arrangement/inspection/explode and review checks pass.

These are engineering checks, **not browser interaction, pixel/occlusion, touch, assistive-technology or clinical acceptance**. Verify readable spacing and scrolling at mobile/200% text sizes; screen-reader announcements, keyboard focus, selected-member restoration, camera reorientation with saved views/tray mode and clean-recipe reset expectations on actual devices. Educators must review the authored recipes and landmarks before release. No complete anatomical coverage, operative guidance or patient registration is claimed.

No added package, font, texture, model or paid API. All **1,006 source entries, 82 body GLBs, 128 stages and 110 focuses** remain exact; the separate shoulder is unchanged. The concurrently prepared [ocular candidates](OCULAR_CANDIDATES.md) are not rendered anatomy.
