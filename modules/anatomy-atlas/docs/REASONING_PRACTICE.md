# Source-bound anatomical reasoning pilot

Open **Shoulder & arm → Practice → Practice options → Apply anatomy · shoulder pilot**. Whole-body practice can also use these concepts when their muscles are in the loaded visible scope. Other regions show an honest unavailable state with a link to the pilot. No new top-level control or note tab was added.

Ten original draft concepts cover supraspinatus, infraspinatus, subscapularis, teres minor/major, serratus anterior, brachialis, coracobrachialis and the long heads of biceps/triceps. Each is bound to the two existing sided FMA/file identities (20 representations), checked against the retained official BodyParts3D element index. There is no label-based matching, inferred nerve geometry or new mesh.

Questions test distinctions in attachments, joint actions or motor supply. Alternatives are curated, same-side and actually loaded/visible; at least one alternative must remain. Each session asks a concept once, not again on its opposite side. Focus selection and retry respect current eligibility, including lost distractors. Landmark size preference is not applied to authored concepts; the setup note explains this.

Choose an answer button or a displayed alternative on the model. Both are graded by the same answer-once session reducer. Names are offered as answer choices; there is no correct-answer hint in labels, landmarks, selected-structure highlighting or an isolated-only target. Long stems remain in the Practice panel; the model overlay stays short. Skip counts as missed. Explanations and sources appear after answer/skip, and can be reviewed in completed results. Questions and results remain in memory, not a learner record/database.

`lib/atlas-practice.ts` wraps the unchanged identification engine, so the dedicated shoulder's existing practice and source/review fingerprints are preserved. `app/reasoning-feedback.tsx` gates explanation/citation rendering on an actual response. `lib/reasoning-questions.ts` contains original prompts/rationales, exact bindings, revisions and factual source references.

## Verification

Run `npm run reasoning-practice:test`, `npm run practice:test`, TypeScript and the affected component/content/review regressions. [Reasoning report](reasoning-practice-validation.json) records official source membership, 220 identity/scope/component mutation rejections, region/side/focus/loaded/retry cases, count/random edge cases, no contralateral repeats, detached session references, reducer guards and original identification-mode parity. The actual React component is server-rendered with real React/ReactDOM to check feedback gating; this is not browser/DOM, pointer/touch or visual acceptance.

The generated [current status](CURRENT_STATUS.md) counts interactive reasoning separately from Quiz-tab text. The questions do not promote any body topic readiness or create clinical approvals.

## Factual references, rights and review

References checked while authoring: [TTUHSC upper-limb anatomy](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html); NCBI-hosted references for [teres minor](https://www.ncbi.nlm.nih.gov/books/NBK513324/), [serratus anterior](https://www.ncbi.nlm.nih.gov/books/NBK531457/), [brachialis](https://www.ncbi.nlm.nih.gov/books/NBK551630/), [arm muscles](https://www.ncbi.nlm.nih.gov/books/NBK554420/) and [triceps](https://www.ncbi.nlm.nih.gov/books/NBK536996/). These are factual citations, not imported article text, publisher questions or media. In particular, the NCBI-hosted StatPearls material's non-commercial/no-derivatives terms are not a commercial asset grant; those articles/assets are not included or relicensed.

Original prompts/rationales retain the project's authored-code/content terms. Existing BodyParts3D CC BY 4.0 and dependency notices remain. No font, texture, model, patient image, paid API or dependency is added.

Independent anatomical/educator review is still required for every stem, distractor, rationale, scope and age/side representation. This small pilot is not comprehensive regional teaching, a diagnostic exercise or a validated competency examination. No review score, clinical diagnosis or learner tracking is inferred from a practice score.
