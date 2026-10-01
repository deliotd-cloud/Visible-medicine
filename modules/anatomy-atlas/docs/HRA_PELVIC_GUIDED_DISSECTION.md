# Female-pelvis source-guided dissection

The independent workbench has an optional, collapsed **Guided learning** section.
This draft uses existing HRA surfaces, not a new model or surgical procedure.

## Six-stage sequence

1. Broad, cardinal and uterosacral source surfaces with cervix context.
2. Set the broad source surface aside; compare the paired cardinal regions.
3. Paired uterosacral source regions with cervix and sacrum.
4. Right ureter, right uterine vessels, cervix and bladder-base context.
5. Corresponding left-sided context.
6. Bilateral urinary comparison with the supplied bladder source regions.

The stages use 16 existing selections. All 43 surfaces, 11 original studies,
initial 18-surface overview, models and previous topic text remain unchanged.
The two ureters keep their renal-study IDs; pelvic review remains separate from
renal review. Held orifice, round-ligament, disputed uterine-end and wall surfaces
remain excluded. [Source, attribution and holds](HRA_FEMALE_PELVIS.md).

## Interaction

- Start requires the currently visible bundles and renderer to be ready. A newly
  needed bundle pauses progression until loaded. Exit works after rendering loss.
- Previous/Next atomically apply exact source-ID visibility and selection in
  source positions. Views are posterior, anterior, posterior, right, left and
  anterior. No source vertex, scale or inter-donor registration changes.
- Direction changes use existing 1.8-second quintic orientation interpolation.
  Reduced motion makes them immediate. A hidden document/unavailable renderer
  pauses the sweep; manual orbit interrupts it rather than competing with input.
- Labels, zoom, rotation, teaching tabs and source details stay accessible.
  Tissue-changing controls and identification practice pause during the guide.
  Exit/Finish restores selection, hidden IDs, full Undo/Redo history, search,
  display settings and the captured valid camera state.
- Ordinary independent specimens receive no guide or animation. Identification
  practice does not expose guided answers.

The optional `SpecimenSupplement.guidedDissection` adapter returns a fresh guide
only when the whole admitted HRA specimen matches its source pin. Step application
rejects foreign IDs, invisible selections, duplicate members and invalid indices.
Local restoration rejects malformed or foreign history snapshots.

## Clinical Review and remaining gates

The complete sequence (captions, order, IDs, selections, views, frame and limits)
participates in teaching fingerprints for its 16 pelvic selections. A mandatory
guided-dissection checklist item requires actual viewer inspection. Earlier
approvals are not transferred; stale/foreign submissions are rejected. The review
worksheet exposes all steps and exact source IDs. Source/geometry evidence stays
unchanged; updated renderer evidence separately requires current renderer review.

Existing CC BY 4.0 credit/notices are retained. No new asset, font, dataset,
dependency, subscription, acquired image or entitlement is introduced. Commercial
reuse still requires source attribution and existing rights/clinical gates.

Radiologist review must inspect actual laterality, surface extent/open boundaries,
occlusion, ureter/vessel context, captions and camera frames. Do not infer urinary
continuity, bladder insertion, operative crossings, surgical planes, pelvic floor
or scan registration. Desktop, phone, keyboard and enlarged-text visual acceptance
are separate from controlled Node/GPU-boundary tests. Generated website learner/
Clinical Review integration and publication remain separate; source changes alone
are not a live rollout.

Checks: `npm run pelvic-guided-dissection:test`, specimen-review, independent-
navigation, pelvic-urinary-context, camera/player suites, TypeScript, renderer
revision check and regional build.
