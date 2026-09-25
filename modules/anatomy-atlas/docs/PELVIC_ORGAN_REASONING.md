# Pelvic organ reasoning — 25 September 2026

Eight original draft questions are added to the existing Practice → Apply
anatomy · draft mode, using twelve existing source identities. No controls, models,
textures, fonts, dependencies, scans, masks or access rights are added or changed.
The earlier 132 concepts remain byte-equivalent in their original order.

## Scope

| Concept | Exact FMA / source files | Source scope |
| --- | --- | --- |
| Bladder | FMA15900 / FJ3149 | pelvis, unpaired, partof |
| Prostate | FMA9600 / FJ3139 | pelvis, unpaired, partof |
| Rectum | FMA14544 / FJ2571 | pelvis, unpaired, isa |
| Urethra | FMA19667 / FJ3148 | pelvis, unpaired, isa |
| Testis | FMA7211 / FJ3142; FMA7212 / FJ3138 | pelvis, right/left, isa |
| Epididymis | FMA18256 / FJ3141; FMA18257 / FJ3136 | pelvis, right/left, isa |
| Seminal vesicle | FMA19387 / FJ3143; FMA19388 / FJ3137 | pelvis, right/left, isa |
| Ureter | FMA15571 / FJ3146; FMA15572 / FJ3144 | abdomen + pelvis, right/left, partof |

The original catalogue and official isa/partof index hashes are preserved.
The binder uses exact FMA, side, tissue, source tree, ordered file membership and
ordered regional membership. It does not independently authenticate mesh bytes;
existing catalogue/export integrity checks remain necessary. Ureters retain their
abdominal primary region and cross-region membership, without fabricated splits.

The pelvis gains eight questions on top of its eight existing muscle concepts.
Left/right versions do not repeat within a session. Alternatives must be curated,
same-side, visible and loaded. Ureter questions are intentionally unavailable in
abdomen-only scope because their curated alternatives are not present there.
Single-target focus cannot reveal an answer by offering no alternatives.

## References and reuse

Original short factual prompts and explanations refer to:

- [UAMS pelvic/perineal viscera](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/viscera-tables/visceral-structures-of-the-pelvis-and-perineum/).
- [NIDDK urinary tract](https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works).

References were read on 25 September 2026; no publisher question bank, figure,
table, prose, image, scan or dataset is imported. Public access is not permission
to reuse assets. Existing BodyParts3D attribution and licensing remain intact.
The validator limits the combined new prompt/explanation words per source.

## Verification and limits

`npm run reasoning-practice:test` checks exact official bindings, preserved prior
concept hashes, all twelve actual display identities, wrong-surface substitutions,
whole-body/pelvis and laterality scopes, loaded/focus/retry restrictions, hidden
feedback, answer-once behaviour and real React feedback rendering after every
answer/skip. The existing real-handler fixture was brought up to date with saved
Practice-return behaviour: completed sessions restore study state, and blocked
starts cannot overwrite it. Production handler code was not changed.

The saved report is `docs/reasoning-practice-validation.json`. Broad content,
review, renderer and Practice-return checks, TypeScript and the shared module
build also pass. The unsigned review packet is refreshed, not approved.

This is male-reference teaching, not female pelvic coverage, a validated exam,
microscopic anatomy, proof of patent lumens or patient-specific imaging.
All eight concepts remain draft revision 1 pending radiologist/educator review
of wording, distractors and spatial relationships. Browser acceptance and generated
website integration of this new batch remain separate next steps; a source build
alone does not prove that it is live. Clinical/imaging/device/privacy gates stay open.
