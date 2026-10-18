# Shoulder and upper-arm muscle questions — local website integration

The regional learner and protected Clinical Review are generated together from Atlas `d5c55031e1e032392469288a205bc88d48013eb0`. Fourteen original question groups cover 32 retained selections. Deltoid portions, biceps heads and triceps heads use whole-muscle questions; rhomboid major/minor share a scapular-action question. Existing dedicated shoulder teaching remains unchanged.

Questions remain source- and revision-bound drafts for radiologist review. No geometry, accepted mask, clinical approval, independent entitlement or patient-space registration is inferred. Reference links and original wording are preserved; no new image, mesh, font, dependency, paid service or patient data is introduced.

## Verification

- The new integration test checks all 32 questions in generated learner JavaScript and exact Review packets, including rejection of prior content, altered answers and changed source identity.
- All 24 affected integration cases pass, including previous regional teaching, guided-learning and protected-delivery checks.
- Another 35 CT/MRI-to-3D, exact-source selection, tour-handoff and guided-step checks pass. The first run exposed a pre-existing blanket `useState` prohibition in the handoff test, contradicted by the already-committed question-style selector. The component and test were unchanged from parent `770ba9bd` before diagnosis. The assertion now explicitly allows only question-style state and checks parent-derived sequence/step; actual guided interaction tests also pass. The initial failure is retained in `head-links.log` and the corrected run in `head-links-corrected.log`.
- The combined Review verifier checks 1,137 imported source files and 35 viewer files; regional delivery records 1,104 source inputs.
- All 136 regional model files and 12 regional scopes are unchanged. The complete delivery inventory retains identical 137-model/144-path records.
- TypeScript, regional and local website builds pass. All 46 route/access/Review-asset HTTP checks and 19 exact learner-file readbacks pass. The existing local preview is replaced by session 10821 on port 3000; historical port 3001 and loaded scan tabs are untouched.
- Actual native-image interaction, signed-in review persistence, GPU rendering and clinical acceptance remain separate gates; component and HTTP checks do not establish them.

## Recovery and limits

Detailed build, access/readback and source-checkpoint receipts are saved under `E:/VisibleMedicine-LocalStaging/20261009-shoulder-arm-muscle-integration`. Exact replaced generated chunks are retained there before removal. `saved-state.json` records the final website commit, test/build outcomes and local preview handle. Recovery is scoped, source-only and on the same machine, not a verified GitHub/off-device backup.

This is local-only work following the existing Sites workflow. No public deployment, access-policy relaxation, scan upload or desktop PACS change. Fracture specialist files and the full pending shared-plan tail are preserved. The full website/Atlas roadmap remains active.
