# Nested brain and eye teaching

## Delivered scope

Select a part inside **Explore eye layers** or **Dissect brain**, then expand **Learn more · anatomy, clinical & quiz** beneath its existing brief notes. Anatomy, Clinical and Imaging groups contain seven topics; a separate unscored self-check has a collapsed answer. The existing 260px control rail, canvas, short notes, dissection history, search and separation controls remain in place. No permanent additional panel is introduced.

There are **22 conceptual drafts bound to 37 source representations**: 15 eye components, four ventricular spaces, four brainstem/cerebellar compounds and 14 cerebral selections. Counts overlap existing parent anatomy, not 37 new unique whole-body structures. All have introductory Anatomy, Function and Clinical drafts. Pathology has 33 draft / four pending representations (both insulae and both anterior superior temporal parts remain pending). CT, MRI and ultrasound each have 37 explicitly pending entries. These are not comprehensive clinical chapters.

There are 22 unique recall questions, shared by their explicitly bound sided representations: 17 cite medical references and five check documented model limitations. Questions are unscored and outside the regional exam/practice engine. Changing the selected part resets the revealed answer; it need not collapse the entire teaching section or reset the reader's topic. No accredited-assessment or clinical-approval claim is made.

## Source and authoring contract

- `content/nested-teaching.ts`: original concise copy, per-topic readiness, reference keys, model limitations, question/answer and explicit medical-reference/model-scope basis.
- `content/nested-teaching-bindings.v1.json`: immutable editorial snapshots of three parents and 37 children, study and concept IDs, FMA identities, source file hashes and child/parent bundle digests. Pins are teaching provenance, not review approvals.
- `lib/nested-teaching.ts`: matches the full parent and child snapshots against the guarded current study, verifies the child bundle digest and explicit concept/FMA binding, then returns detached lesson data. An altered identity, side, source membership or geometry metadata fails closed. The stored parent bundle digest is provenance checked by the pin validator; the component resolver receives parent metadata, not the full parent-bundle manifest, and does not separately validate that digest at runtime.
- `app/nested-teaching.tsx`: compact existing-brand UI, persistent topic grouping, source links, clear pending states, model limits and per-selection answer disclosure.

Run `npm run nested-teaching:test`. This checks exact pins, source/side/study mutations, changed runtime bundle hashes, all topic readiness, detached results and 37 actual component server renders. It also conservatively budgets authored words per reference, counted once per unique concept rather than repeating left/right copy. `node scripts/pin-nested-teaching.mjs` refuses to overwrite differing existing pins; source changes require deliberate editorial review. No automatic approval or pin migration is provided.

The generated requirement inventory executes the actual resolver and reports these counts separately from the 1,022-record body inventory. Run `npm run requirements:audit` and `npm run requirements:audit -- --check` after changes. These checks do not establish factual correctness or device usability.

## References and commercial-use boundary

The 23 precise URLs and per-paragraph bindings are in the [reference registry](../content/nested-teaching.ts). Primary factual references were consulted on 10 September 2026: UTHealth Neuroscience Online/Neuroanatomy Online, National Eye Institute, NIAMS, NINDS and NLM MeSH. The NLM anterior-chamber link is a previous-edition descriptor. NINDS Hydrocephalus and Cerebellar Degeneration supplied substantive primary indexed text but their direct fetches returned access errors; this milestone does not claim a successful live fetch of every reference page. Reference availability and clinical currency must be checked during editorial review.

Only original concise factual paraphrases and source links are included. No third-party diagrams, photographs, chapters, tabular dataset, question bank, scan or generated pathology image is imported. Citations are not redistribution licences or institutional endorsements. Restricted EyeWiki/A.D.A.M. material is not admitted as an asset. Existing MIT authored-code/text and BodyParts3D v4 CC BY 4.0 attribution obligations remain separate. No model, texture, font, package, paid API or reference-fetching service is added. This is not exhaustive legal clearance or a perpetual free-hosting guarantee.

## Acceptance and next steps

1. Independent anatomist/ophthalmologist/neurologist and educator review of each draft, question, sided source identity and limitations. Resolve the four pending Pathology representations only with appropriately scoped references.
2. Explicitly requested browser/device acceptance: keyboard tab flow and disclosure behaviour, screen reader, enlarged text, mobile rail scrolling and all selected-part changes. SSR tests do not measure readability, GPU rendering or interactive accessibility.
3. Add useful inner-brain/organ relationships only where source membership and commercial rights are established. Do not invent absent tissue, functional territories or complete coverage from partial surfaces.
4. Extend the external learning representation registry separately. These teaching pins do not create CT/MRI/X-ray/US registration, scan annotations, an entitlement or a lecture-player connection. Provisional CT/MRI projects retain their distinct subjects and review/privacy restrictions. An Atlas subscription must never unlock a separately paid lecture.

No root-body teaching, patient data, private review record, billing rule, learning-resource manifest or anatomy geometry is changed by this milestone. Publishing and recovery evidence belongs in the dated release checkpoint, not this coverage document.
