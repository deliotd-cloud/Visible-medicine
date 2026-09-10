// The human summary and JSON inventory are generated and freshness-checked together.
export function renderRequirementSummary(report) {
  const {
    anatomy,
    study,
    teaching,
    practice,
    assetsAndRights,
    learningIntegration,
  } = report;
  const names = {
    anatomy: 'Anatomy',
    function: 'Function',
    ct: 'CT',
    mri: 'MRI',
    ultrasound: 'Ultrasound',
    pathology: 'Pathology',
    clinical: 'Clinical',
    quiz: 'Quiz notes',
  };
  const rows = Object.entries(names)
    .map(([tab, title]) => {
      const counts = teaching.body[tab];
      return `| ${title} | ${counts.specificDraft} | ${counts.identityOnly} | ${counts.pending} | ${counts.generatedIdentification} |`;
    })
    .join('\n');
  return `# Current atlas status

Generated from the actual catalogue, teaching resolver, dissection profiles and question definitions. Run \`npm run requirements:audit\`; \`npm run requirements:audit -- --check\` checks this page and [the JSON inventory](requirement-audit.json) together. Historical milestone totals elsewhere are not current coverage.

## Delivered source scope

- ${anatomy.bodyRepresentations} body representations, ${anatomy.bodyBundles} body GLBs, ${anatomy.regions.length} regions plus whole body.
- Dedicated shoulder: ${anatomy.shoulderRepresentations} representations / ${anatomy.shoulderSourceParts} source parts, overlapping the body catalogue.
- Nested dissections: ${anatomy.nestedDissections.eyeComponents} eye components, ${anatomy.nestedDissections.ventricularSpaces} ventricular spaces, ${anatomy.nestedDissections.brainstemCompounds} brainstem/cerebellar compounds and ${anatomy.nestedDissections.cerebralSelections} cerebral selections, ${anatomy.nestedDissections.cardiacCavities} cardiac cavity spaces and ${anatomy.nestedDissections.pulmonaryBranchGroups} partial lung branch groups. The cerebral study contains ${anatomy.nestedDissections.cerebralParentSubdivisions} existing-parent subdivisions plus ${anatomy.nestedDissections.cerebralAdditionalSourceParts} additional superior temporal source parts; only those four are new anatomical coverage. Context reuses ${anatomy.nestedDissections.ventricularContext} deep-brain structures in the ventricular view, ${anatomy.nestedDissections.brainstemContext} ventricular space in brainstem and ${anatomy.nestedDissections.cerebralContext} in cerebral. Brief drafts are separate from the eight-topic inventory below. ${assetsAndRights.publicFileExtensions.glb} GLBs are retained overall, including archived originals and alternate display assets. The original catalogue counts remain unchanged.
- ${study.stages} dissection stages and ${study.focuses} focuses. These operate on supplied surfaces; they do not establish complete anatomy.
- Find/name identification practice; ${practice.reasoning.concepts} draft reasoning concepts bound to ${practice.reasoning.exactRepresentations} representations in ${practice.reasoning.regions.join(', ')}. One concept per session, without contralateral repetition. See [practice scope and tests](REASONING_PRACTICE.md).
- [Learning-resource contract](LEARNING_RESOURCE_CONTRACT.md): version ${learningIntegration.contractVersion}, ${learningIntegration.supportedKinds.join('/')} anchors; ${learningIntegration.configuredResources} configured resources / ${learningIntegration.configuredCorrespondences} correspondences. Read-only linking infrastructure, not a connected external viewer or publication approval.

## Body teaching readiness

Counts are representations with displayed copy, not unique lessons, complete topic coverage or clinical approvals. Shared source-group copy is counted per representation. The dedicated shoulder has draft text in all eight topics; do not add overlapping representations to claim more unique anatomy.

| Topic | Specific/source-group draft | Identity only | Pending | Generated identification |
| --- | ---: | ---: | ---: | ---: |
${rows}

Quiz-tab notes are separate from interactive practice. X-ray has no authored topic/viewer yet. CT/MRI/US text is not a scan viewer, segmentation or validated spatial correspondence.

The opt-in [nested learning registry](NESTED_LEARNING_LINKS.md) exposes ${learningIntegration.nestedRepresentations} exact child destinations within ${learningIntegration.availableRepresentations} scope-specific representations. It supports document versions ${learningIntegration.supportedDocumentVersions.join(' and ')}, while the configured production document stays version ${learningIntegration.contractVersion} with no resources. Nested parent/child source and bundle bindings can resolve into the existing dissection routes; this is not a live viewer connection or entitlement.

The ventricular study also has ${study.ventricularRelationshipPresets} [guided relationship presets](VENTRICULAR_RELATIONSHIPS.md), using existing source spaces and context without adding unique anatomy or another panel. Context disappears during separation; pointer handlers do not block selectable structures beneath it. Device acceptance remains pending.

The [cardiac vessel guides](CARDIAC_VESSEL_RELATIONSHIPS.md) add ${study.cardiacRelationshipPresets} chamber–vessel comparisons using ${study.cardiacVesselLandmarks} existing source landmarks. Only the chosen view's vessel surfaces are displayed; one shared source bundle loads on demand. No new mesh files or selectable identities are added. Context is not a connected flow model, validated ostium or valve; clinical/device review remains pending.

The [lung branch study](PULMONARY_DISSECTION.md) separates ${anatomy.nestedDissections.pulmonaryBranchGroups} source-defined groups across two lungs. All ${anatomy.nestedDissections.pulmonarySourceFiles} source files already belonged to the parent lung compounds; none is a separately delineated lobe tissue envelope or fissure. The missing parenchymal surfaces remain a documented gap, not a completed lobe dissection.

## Nested anatomy teaching

Internal dissection includes [Undo/Redo layers](NESTED_HISTORY.md) across all seven study families. This bounded layer/selection history reuses the compact action row and does not rewind camera, cutaway or separation settings. Device acceptance remains pending.

The [pulmonary teaching extension](PULMONARY_TEACHING.md) supplies nine shared Clinical/Pathology/CT drafts for five partial branch groups in the existing collapsed panel. MRI/US remain pending for these groups. No tissue, fissure, disease geometry or scan correspondence is inferred.

The [liver internal-branch study](HEPATIC_DISSECTION.md) exposes ${anatomy.nestedDissections.hepaticBranchGroups} source groups from ${anatomy.nestedDissections.hepaticSourceFiles} existing liver files. Arteries, portal veins, bile ducts and a partial venous tributary have distinct colours and presets. Optional tissue context is nonselectable. Unresolved source VI/VII near-overlap and VIII grouping prevent individual segment labels; no validated Couinaud map or clinical volume is supplied.

Optional pulmonary airway context reuses ${study.pulmonaryAirwayLandmarks} existing trachea/main-bronchus landmarks across ${study.pulmonaryAirwayContexts} per-lung views. It is off by default and absent during separation, with no new model files or nested identities. Main-lung selection now discloses the missing tissue/fissure surfaces. Context is orientation, not validated airway continuity.

The collapsed [Learn more section](NESTED_ANATOMY_TEACHING.md) has ${teaching.nested.concepts} source-pinned concepts across ${teaching.nested.representations} selectable parts, with ${teaching.nested.references} primary-reference links. These counts are separate from the root-body table and overlap parent anatomy. Each part has draft Anatomy, Function and an unscored self-check. Clinical has ${teaching.nested.topics.clinical.specificDraft} draft / ${teaching.nested.topics.clinical.pending} pending; Pathology has ${teaching.nested.topics.pathology.specificDraft} draft / ${teaching.nested.topics.pathology.pending} pending representations. [Cardiac](CARDIAC_TEACHING.md) and [hepatic imaging teaching](HEPATIC_TEACHING.md) bring CT to ${teaching.nested.topics.ct.specificDraft} draft / ${teaching.nested.topics.ct.pending} pending, MRI to ${teaching.nested.topics.mri.specificDraft} draft / ${teaching.nested.topics.mri.pending} pending, and ultrasound to ${teaching.nested.topics.ultrasound.specificDraft} draft / ${teaching.nested.topics.ultrasound.pending} pending. These are notes, not scans or synchronized viewers. Model-scope self-checks test documented model limitations instead of medical recall. No clinical approvals or external resource access are implied.

The [cardiac chamber study](CARDIAC_CHAMBERS.md) exposes ${anatomy.nestedDissections.cardiacCavities} existing cavity shapes and ${anatomy.nestedDissections.cardiacContextWalls} atrial-wall references. These are spaces and context, not new unique anatomy or a complete dissectible heart. Ambiguous source labels are documented and not admitted to this study.

## Boundaries and next work

- All new teaching and reasoning questions remain drafts requiring independent anatomical, clinical and educator review. Private shoulder review records are not read by this inventory.
- Unresolved teaching identities remain held: FMA45097/FMA45098 (foot sesamoid groups), FMA19728 (pelvic muscle category), FMA61970 (fornical commissure). Source/geometry holds such as unassigned disc FJ3211 remain separate.
- Peripheral nerves/plexuses, complete joint layers, organ interiors, female anatomy and other source gaps remain. Numerical surface counts do not measure completeness.
- The compact interface, device usability, accessibility, label placement and free-orbit explode behaviour still require current browser/device acceptance. Software/SSR tests are not that acceptance.
- The [multimodal integration plan](MULTIMODAL_LEARNING_PLAN.md) distinguishes anatomy-to-resource links from spatial registration. No CT/MRI/X-ray/US viewer or lecture-player connection is implemented by this milestone.
- ${assetsAndRights.dependencyEntries} lockfile entries classified; ${assetsAndRights.unclassifiedDependencies} unclassified. This is not exhaustive legal clearance or a perpetual free-hosting guarantee. BodyParts3D credit/CC BY 4.0 and existing dependency obligations remain; brand rights are reserved. No bundled font binaries or new paid API.
- Saving/publishing is evidenced by dated release checkpoints, not these source counts. Sites source/version storage and the same-PC module snapshot do not establish a recent remote GitHub backup; GitHub work is deferred. Conversation history and private review data have separate recovery requirements.

Use [the requirement/acceptance audit](REQUIREMENT_AUDIT.md), [content contract](CONTENT_CONTRACT.md), and [ordered improvement plan](CONTINUOUS_IMPROVEMENT.md) for scope. This summary is not clinical, visual, deployment or legal certification.
`;
}
