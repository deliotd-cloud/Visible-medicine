# Cardiac chamber clinical and imaging drafts

## Use and scope

Select **Heart → Explore heart chambers**, choose one of the four cavities and expand **Learn more · anatomy, clinical & quiz**. The existing Clinical and Imaging groups now contain 20 new short paragraphs: Clinical context, Pathology, CT, MRI and Ultrasound for each chamber. No new toolbar, panel, route, scan viewer or payment flow is added. The disclosure remains collapsed by default.

This is an introductory educational layer, not a comprehensive cardiology curriculum. Every new paragraph is a draft requiring specialist review. The current model is a static cavity representation: no measured cardiac phase, volume, wall thickness, valve motion, pathological geometry or patient correspondence. MRI teaching planes must not be confused with the atlas's arbitrary clipping planes. CT/MRI/US teaching does not provide scans, synchronize viewers, authorize investigations or diagnose disease.

## Contract and provenance

- `content/cardiac-teaching.ts` holds four explicit chamber entries and seven primary-reference links. Existing Anatomy, Function, Quiz and model-limit text are unchanged.
- `NestedConcept.imaging` is optional and topic-specific. `nestedTopicLesson` returns only explicitly authored content; all other imaging topics keep the original pending fallback. The component renders the appropriate reference links within existing topic sections.
- All 53 nested source bindings and seven parent snapshots remain byte-unchanged. No new FMA identity or mesh is admitted and no geometry is edited. The runtime still rejects altered child/parent identity or bundle hashes and returns detached lesson data.
- Nested totals: 33 concepts, 53 representations, 37 references. Clinical 41 draft / 12 pending; Pathology 37 draft / 16 pending; CT, MRI and Ultrasound each four draft / 49 pending. Anatomy, Function and Quiz each remain 53 draft / zero pending. Counts overlap existing parent anatomy.

## Sources and reuse

Primary references checked 10 September 2026 are linked beside each paragraph and listed in the [reference file](../content/cardiac-teaching.ts): AHA tricuspid regurgitation; NHLBI pulmonary hypertension, atrial fibrillation and heart-failure diagnosis; ACR/RSNA RadiologyInfo coronary CTA; Kramer et al./SCMR CMR protocols (2020, pp. 5–7); Mitchell et al./ASE comprehensive adult TTE (2019, apical views and chamber assessment). The existing University of Minnesota heart-flow reference supports the CT orientation exercises.

The ASE document supplied parsed/indexed text; some subsequent page requests failed. The SCMR publisher PDF supplied the imaging-plane text after the PMC page presented a browser check. No browser check was bypassed. Dates identify the consulted editions, not a claim that either guideline is the newest. Clinical publication requires rechecking currency, context and all reference availability.

Only concise original factual paraphrases and links are included. No third-party media, protocol table, scanned page or question bank is bundled. Per-source authored-word checks remain capped at 200 across unique concepts, including the new imaging sections; duplicate URLs cannot be used as separate reference keys. See [third-party notices](../LICENSES/THIRD_PARTY_NOTICES.md) for SCMR credit/CC BY 4.0 and existing asset obligations. No new dependency or paid API is used.

## Validation and remaining acceptance

`npm run nested-teaching:test` checks all 53 guarded destinations, optional imaging resolution/fallback, references in actual component section renders, detached imaging data, exact readiness counts and source word budgets. Historical content digests protect all noncardiac concepts and the existing cardiac core from incidental changes. These are code/SSR checks, not browser, GPU, anatomical or clinical approval.

Before clinical publication:

1. Cardiology/radiology/echocardiography and educator review of every paragraph, its chamber binding, source support and intended learner level.
2. Review source cavity/valve boundaries and any future chamber measurements against validated geometry; do not infer missing myocardium or leaflets from these surfaces.
3. Explicit browser/device acceptance for topic navigation, citations, keyboard, enlarged text and mobile scrolling. The existing compact grouping has not gained new controls.
4. Patient data require consent/privacy, scan-normality, licence and segmentation/registration review independently. Provisional CT/MRI head studies remain different subjects with their existing holds; no pixels or anchors are imported.
5. Anatomy Atlas access and separately paid lecture access remain independent. The production learning-resource document is unchanged and empty; these notes neither bypass a paywall nor claim an external resource is available.

Next bounded content work: clinically useful lung/liver branch teaching compatible with the existing partial representations, without claiming absent tissue, fissures or a validated Couinaud map. Release and recovery evidence belongs in the dated checkpoint.
