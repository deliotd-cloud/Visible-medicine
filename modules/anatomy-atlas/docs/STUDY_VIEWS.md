# Saved study views and anatomy-load recovery

## Using saved views

Open **Saved study views**, configure the model, choose **Save current view** and give the view a short name. Up to 20 views are stored across the atlas in this browser. Restore one in its matching region; the other-region list provides navigation. Removal requires confirmation and deletes only the selected local view.

Saved state includes selection, body side, explicit removed structures (or shoulder layer), system visibility, isolation/focus, explode amount and skeleton anchoring, original-position references, labels, illustration mode, cutaway plane and opacity. The actual camera direction, pan and relative framing are captured, including free orbit and wheel/pinch zoom. Restoration adapts framing to the current viewport aspect, not a screenshot's pixels. A restored regional dissection is labelled as a customised view, using explicit hidden IDs rather than re-running a stage recipe that could change later. Dissection undo restores the preceding visibility state; it is not a full camera/settings undo.

Bookmarks are **device-local UI preferences**, not account-backed records, medical images or clinical review evidence. They are not included in the GitHub source backup. Clearing browser storage removes them; private browsing, browser quotas or blocked storage can prevent saving. Names must not contain patient information. The atlas does not request a login or send these preferences to the review API.

The current model's exact bundle hashes are checked before restoring. Source changes or missing IDs disable incompatible views instead of silently adapting them. An older incompatible view can still be removed. Source compatibility is not clinical validation.

## Data and failure handling

`lib/study-views.ts` defines a versioned, bounded display-only schema. It rejects invalid numeric values, unsupported versions, malformed IDs/cameras, duplicate IDs and oversized data; it reconstructs allowlisted state and discards unknown fields. Corrupt data is left untouched and saving is disabled, not silently reset. No imported URL, patient frame UID or executable content is accepted into restored state.

Each edit reads the latest store before modifying it and writes successfully before the UI reports success. Web Locks serialise edits across same-origin tabs where supported; storage events refresh other open viewers. Older browsers without Web Locks use a fresh-read best-effort fallback and cannot guarantee concurrent cross-tab edits are atomic. No automatic eviction occurs at the 20-view limit.

The camera helpers in `lib/study-camera.ts` capture and restore normalized direction/up vectors, model-space pan offset and viewport-relative scale. `app/fitted-camera.tsx` consumes a restoration once, retains pan through ordinary framing updates and clears pan for explicit direction/reset actions. Control limits still apply at extreme zoom distances. Bookmarks do not change or store source mesh vertices.

## Loading recovery

- The body catalogue request has a 30-second timeout and an explicit **Retry anatomy library** action. An aborted/unmounted request cannot overwrite a later attempt.
- **Retry missing anatomy** clears only failed, currently requested GLB cache entries and remounts only those error boundaries. Healthy bundles, dissection/inspection settings and the camera remain in place. Hidden failures are retried when their scope is requested again.
- The shoulder's error panel offers **Retry shoulder anatomy**, clearing the failed cached load without refreshing the page or resetting the chosen view.
- Cached source geometries are explicitly excluded from automatic scene disposal; renderer-owned materials retain their own cleanup.

These controls recover from reported asset failures. They do not guarantee availability during an outage or recover every JavaScript-chunk/WebGL-context failure. The retry mechanism uses the installed Drei `useGLTF.clear` implementation and its underlying cached loader. See the official [useGLTF documentation](https://drei.docs.pmnd.rs/loaders/gltf-use-gltf) and [controls documentation](https://drei.docs.pmnd.rs/controls/introduction).

## Evidence and remaining gates

`npm run study:test` executes the runtime validation, persistence, retry-planning, dissection and camera helpers: **16,916 assertions** pass, spanning all 12 body profiles and shoulder view/layer combinations. Tests cover malformed/oversized state, no automatic deletion, write failure, fresh-read preservation, stage-visibility round trips, dissection undo, source mismatch, perspective/orthographic framing and exact retry scope. Existing inspection, dissection, explode and review tests remain separate checks.

Shared bookmark and camera display code is included in shoulder review fingerprints. A build expires prior geometry-display reviews while preserving the immutable review records. There are no new assets, libraries, fonts, paid services, source anatomy or database changes in this milestone.

Browser interaction, physical touch devices, keyboard/screen-reader use, real interrupted network requests and WebGL context loss still require hands-on acceptance testing. The automated helper tests do not prove those behaviours or confer anatomical/clinical approval.
