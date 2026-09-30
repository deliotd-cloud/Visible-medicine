# Renal guided learning — 30 September 2026

Four source-bound stops compare right kidney, right renal artery, left kidney
and left renal artery. The abdominal aorta is faded upstream context. Available
under Abdomen and Whole body in the existing compact Guided learning selector;
the coeliac tour remains the abdominal default. No new toolbar or pop-out.

The four selected targets share stable assembled camera bounds throughout.
Posterior/anterior turns reuse the existing 1,800ms quintic orbit, explicit Start,
pause/step/Finish, imaging-reading pause and reduced-motion controls. Separation
remains zero: this is orientation, not tissue-plane or physiological simulation.

| Selection | Exact concept | Existing bundle |
| --- | --- | --- |
| Right kidney | FMA7204 | abdomen-organs |
| Right renal artery | FMA14752 | abdomen-vessels-recovery |
| Left kidney | FMA7205 | abdomen-organs |
| Left renal artery | FMA14753 | abdomen-vessels-recovery |
| Abdominal aorta, context | FMA3789 | abdomen-vessels-recovery |

No new mesh is introduced and no independent HRA kidney specimen is placed in
this body-source frame. Source-labelled exterior surfaces omit collecting-tree,
renal veins, interiors and fascia. The model does not establish a patent lumen,
flow, variants, vessel continuity or patient-specific alignment.

Short original captions use the [TTUHSC El Paso kidney/retroperitoneum table](https://anatomy.ttuhscep.edu/gastrointestinal_system/kidney_tables.html)
as a factual reference only. No source table, diagram, image or prose passage is
copied. Existing BodyParts3D4.0 CC BY4.0 geometry credit remains unchanged;
no new dependency, font, texture, service or mandatory fee is introduced.

Existing CT/MRI/ultrasound/X-ray notes remain draft orientation lessons, not
linked scans. No case or lecture access is granted. A future cleared resource
mapping must independently authorize Atlas, case and paid lecture access;
spatial synchronization needs actual coordinate/registration evidence.

The tour remains draft. Its full captions, original geometry identities, fixed
step frames, source bundle and camera transition are included in revision-bound
Clinical Review evidence for all five structures. The aorta keeps its unchanged
coeliac-tour evidence and gains a separate renal sequence; stale or omitted
evidence must be rejected. No clinical approval or publication is performed.

```sh
npm run renal-tour:test
node scripts/test-tour-imaging-notes.mjs
```

Runtime/browser and website import results belong in the dated delivery
checkpoint, not inferred from these tests or a source commit.
