# Nested brain and eye teaching

The [pancreatic/biliary imaging extension](DUCT_IMAGING_TEACHING.md) adds four shared sections across four existing selections, without changing 40 concepts / 65 source representations / ten parents. References now total 78. CT readiness is 35 draft / 30 pending; MRI 35 / 30; ultrasound 28 / 37. Core content and source pins are unchanged. Earlier totals below are historical.

Current extension: [pancreatic duct teaching](PANCREATIC_DISSECTION.md) adds one source-pinned concept for two selections, with four brief factual topics and unscored recall. Totals are 40 concepts / 65 representations / ten parents / 74 references. Previous bindings are preserved; CT/MRI/US remain pending for the two new selections. See [generated current status](CURRENT_STATUS.md); milestone counts below are historical.

## Current extension

The [pulmonary teaching extension](PULMONARY_TEACHING.md) adds nine shared Clinical/Pathology/CT drafts across five existing groups, bringing the reference total to 48. Current Clinical coverage is 53 draft / zero pending; Pathology 49 / four; CT ten / 43; MRI seven / 46; Ultrasound 11 / 42. Anatomy, Function and Quiz remain draft for all 53 representations. Concepts, source pins and geometry are unchanged. The earlier totals below describe historical milestones, not current coverage.

The [hepatic teaching extension](HEPATIC_TEACHING.md) subsequently brings the reference total to 43 without changing the 33 concepts, 53 representations or seven parents. Clinical now has 48 draft / five pending; Pathology 44 / nine; CT five / 48; MRI seven / 46; Ultrasound 11 / 42. All Anatomy, Function and Quiz entries remain draft. The earlier milestone counts below are historical. Optional imaging now includes partial organ coverage; an absent modality remains pending even when another modality exists for the same part.

The original brain/eye milestone below is retained as history. Subsequent heart, lung and liver studies bring the registry to 33 concepts / 53 source representations / seven parents. [Cardiac clinical and imaging teaching](CARDIAC_TEACHING.md) adds 20 draft sections and seven reference links, bringing the total to 37. Clinical coverage is 41 draft / 12 pending; Pathology is 37 draft / 16 pending. CT, MRI and Ultrasound each have four draft / 49 pending representations. All 53 still have draft Anatomy, Function and Quiz. Consult [generated current status](CURRENT_STATUS.md) for current totals.

Optional `NestedConcept.imaging` sections now resolve only when explicitly authored; an absent topic keeps its original pending response. No root-body paragraph is borrowed. The same source-identity guards and detached-data boundary apply, and no source pin is regenerated for a prose-only change. Imaging citations render within the existing three-group, seven-topic disclosure, with an explicit no-scan/no-synchronization note.

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
