# Source-bound identification practice

The cardiac and brain-ventricle component studies, plus the named structure
studies below, offer a folded **Practice** entry. Find a named selection on the
model, or name an isolated selection using answer
buttons. The existing identification engine supplies randomized questions,
answer-once scoring, skip and results. These are formative source-identification
exercises, not validated examinations or measures of clinical competence.

## Bounded anatomical scope

- Cardiac: right atrial cavity FMA11359, left atrial cavity FMA9465, right
  ventricular cavity FMA9291, left ventricular cavity FMA9466.
- Brain: left lateral ventricle FMA78450, right lateral ventricle FMA78449,
  third ventricle FMA78454 and fourth ventricle FMA78469.
- Cerebral: 16 named selections, including paired lobes, insulae, superior
  temporal gyrus parts and hippocampi.
- Brainstem study: six named source selections, including the cerebellum and
  paired inferior cerebellar brachia.
- Pulmonary: five named lobar branch groups, scoped to the selected lung.
- Hepatic: seven named arterial, portal, biliary and venous branch selections.
- Renal: seven named vascular selections, scoped to the selected kidney.
- Visual pathway: three named source selections.
- Cricothyroid: four named muscle parts.
- Coronary venous: two named source selections.

The original eight spaces remain space surfaces, not chamber walls, myocardium,
ependyma, valves, flow or volumes. The 50 additional selections retain their
exact source names and boundaries; branch groups are not whole organs or newly
segmented anatomy. Source geometry, source notices
and teaching text are unchanged. Other nested studies are not automatically
eligible: an anatomical name or catalogue entry alone does not admit an answer.

The practice pool must match the exact current parent/child teaching and source
bindings as well as the explicit per-study identity allowlist. Only currently
visible, loaded primary selections enter the snapshot. Context walls and surrounding
structures never become answers. A clipped or isolated study cannot silently
widen to hidden anatomy. Pulmonary branch-type filtering also blocks launch until
all branch types are restored. At least two eligible selections are required;
each round uses at most five. Pancreatic aggregates, separate eye/femoral viewers
and unnamed cranial arterial partitions are not admitted by this expansion.

## Interaction and safety

Practice temporarily replaces the study workbench, without changing its layer,
selection or Undo/Redo state. Returning remounts the study scene: the selected
camera preset is retained, but a free orbit may reframe. This is not an exact
camera-history restoration claim.

During a question there are no source labels, selected-structure hints, teaching
panels or context surfaces. Naming uses two to four answer buttons; find-on-model
uses canvas picking and requires visual spatial recognition. Keyboard rotation
and answer-button access do not make a 3D visual task a nonvisual equivalent.
For the added structures, Find mode offers a label-free separated tray to expose
overlapping/deep targets, with an explicit non-anatomical-position warning and
a restore button. This uses existing translation-only, same-scale packing;
it does not alter source geometry or enable labels, colour hints or selection
highlighting. Existing root practice and named-space practice retain their layout.

Grading and progression require the current renderer to be ready and all required
practice bundles loaded without failure. Skips do not earn points. The shared
reducer rejects stale events and duplicate answers. Sessions remain in memory;
no learner record, review approval, scan mapping or entitlement is created.

## Verification and publication

`node scripts/test-nested-practice.mjs` exercises exact source admission,
hidden/unloaded/context rejection, altered parent/child identities, detached
records, session scoring and renderer readiness. The existing practice, cardiac,
ventricular and renderer suites remain applicable. Actual component/browser
checks and the saved revision are recorded in the coordinating checkpoint.
Renderer fingerprints must be regenerated before saving a release; old review
decisions cannot be treated as approval of the new display interaction.

This source change is not itself a website deployment. Radiologist and educator
review, physical-device acceptance, other nested practice scopes and the full
Atlas/imaging/lecture goals remain open. The callback suite exercises all 50
additional selections in ten parent-specific workbenches, both answer modes,
skip/retry scoring, visibility/loading/clipping/filter guards and return state.
This does not substitute for real browser or clinical acceptance.
