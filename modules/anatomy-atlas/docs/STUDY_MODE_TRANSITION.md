# Search-to-dissection continuity

25 September 2026. Scope: existing regional study windows/focuses opened through
Atlas Search. No new UI, models, anatomy, teaching or entitlement changes.

## Reproduced failure and correction

From Whole body in Explore, search `popliteal`, choose **Knee: popliteal artery
and vein**, then confirm **Open study view**. Before this correction the workspace
entered Dissect but displayed Custom view / Free exploration, 203 enabled and an
anterior skeleton. Repeating from Dissect succeeded with 14 enabled and posterior
knee framing. The destination session restore ran after the requested recipe and
overwrote it.

Search now supplies a preparation callback to the existing parent stage/focus
handler. That handler checks exam, recipe and applicable source guards first;
only accepted requests restore the destination workspace before applying the
study. Rejected requests do not switch modes or alter the view. Existing callers
without preparation retain their prior behavior; legacy Search callbacks remain
supported. Session storage semantics and source holds are unchanged.

## Verification

`npm run study-mode-transition:test` composes actual Search activation, extracted
parent handlers, the dissection reducer and persistent workspace-session hook.
Its 16 scenarios cover cold/saved destination state, already-Dissect, inactive
Practice, rejected/stale/exam requests, absent/mutated source bindings and return
to Explore. The optional `--pre-fix-probe` compiles the pinned prior Search and
handlers in memory and proves they lose the requested study under the same test.
The controlled React/DOM harness is not a GPU,
physical-device or clinical acceptance test. The model-first validator projects
away only the new callback parameter/statement to retain the exact historical
handler fingerprints; original history is not rebaselined.

Actual local browser samples on 25 September:

- Desktop 1280×720: Explore → confirmed Search study retains the knee recipe,
  posterior view and 14 enabled structures. Remove reduces this to 13; Undo
  restores it. Explore restores its anterior skeleton; returning to Dissect
  retains the knee study.
- Responsive viewport 390×844: Left side filters the visible labels; no horizontal
  document overflow (390 px). The knee caption and attribution are visible, with
  attribution bottom at 829 px. Structure info → Remove → Undo → Return to model
  restores the artery and returns focus to Structure info. No captured console
  errors during this sample. Temporary viewport override reset afterwards.

These are bounded desktop/browser viewport observations, not touchscreen,
assistive-technology, anatomical or clinical sign-off. Source-only verification
does not prove the hosted website has this correction; publication is recorded
separately in the main task's recovery checkpoint.

## Validation repair resolved

`limb-vascular-studies:test` initially stopped in the older popliteal recipe rollback
at `scripts/popliteal-vessel-study-history.mjs:10`: supplied hash
`2c8cf675b38d3d81e6ce7bd89c192fcd748c200e2207d9bb99d3c171bc39b94b`
does not match recorded `afterHash`
`bd67a7cb92160f3fe2f4339309874c2a368ffd68bc8c4d39272e3cd97523e0c0`.
The relevant tracked recipe, transition and rollback inputs are unchanged from
the pre-fix commit `d732f0b519f5e9a61fca4460cd6e57dc918d9755`. Further diagnosis
proved this was the validator's deliberate `hand.title = 'changed'` clone, not a
missing anatomy transition. Canonical profiles already match the recorded
`afterHash` and replay to the original limb baseline. Popliteal commit
`13b7342273789a3ad100571dd46bcb8b71b9bd00` added strict rejection deeper in that
replay chain; the negative test still expected an unequal returned snapshot.

The validator now requires the specific assertion rejection and checks that the
rejected input and catalog are not rewritten. No rollback guard, record, expected
hash, recipe, geometry or clinical gate is changed. The full suite is rerun before
integration; publication evidence is recorded separately.
