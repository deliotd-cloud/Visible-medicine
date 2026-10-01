import assert from 'node:assert/strict';

const topics = { anatomy: 'Anatomy', function: 'Function', ct: 'CT', mri: 'MRI', xray: 'X-ray', ultrasound: 'Ultrasound', pathology: 'Pathology', clinical: 'Clinical', quiz: 'Quiz notes' };
const categories = ['specificDraft', 'identityOnly', 'pending', 'generatedIdentification'];
function readinessTable(counts, representations) {
  const rows = Object.entries(topics).map(([topic, label]) => {
    const values = categories.map(category => counts[topic][category]);
    assert(values.every(value => Number.isSafeInteger(value) && value >= 0), `Invalid ${topic} readiness count`);
    assert.equal(values.reduce((sum, value) => sum + value, 0), representations, `${topic} readiness must cover its scope`);
    return `| ${label} | ${values.join(' | ')} |`;
  });
  return `| Topic | Specific/source-group draft | Identity only | Pending | Generated identification |
| --- | ---: | ---: | ---: | ---: |
${rows.join('\n')}`;
}

// Current inventory only. Historical milestone narratives remain in dated docs/Git.
export function renderRequirementSummary(report) {
  const { anatomy, study, teaching, practice, assetsAndRights, learningIntegration } = report;
  const body = readinessTable(teaching.body, anatomy.bodyRepresentations);
  const nested = readinessTable(teaching.nested.topics, teaching.nested.representations);
  const shoulder = readinessTable(teaching.shoulder, anatomy.shoulderRepresentations);
  const nestedGuides=study.guidedLearning.nestedStudies??[];
  for(const guide of nestedGuides){
    assert(Number.isSafeInteger(guide.steps)&&guide.steps>0,'Invalid nested guide stop count');
    assert.equal(guide.representations,guide.children.length,'Nested guide representation count must match source children');
    assert.equal(new Set(guide.children.map(child=>child.id)).size,guide.children.length,'Nested guide children must be distinct');
  }
  const distinctGuidedChildren=new Set(nestedGuides.flatMap(guide=>guide.children.map(child=>child.id))).size;
  const independent = [
    ['Lower limb', anatomy.independentSpecimens[0].representations, 'UM_LIMB_DISSECTION.md'],
    ['Kidneys', anatomy.renalSpecimen.representations, 'HRA_KIDNEY_SPECIMEN.md'],
    ['Female pelvis', anatomy.femalePelvicSpecimen.representations, 'HRA_FEMALE_PELVIS.md'],
    ['Abdominal wall', anatomy.abdominalWallSpecimen.representations, 'ABDOMINAL_WALL_SPECIMEN.md'],
    ['Back layers', anatomy.backLayersSpecimen.representations, 'BACK_LAYERS_SPECIMEN.md'],
  ].map(([name, count, link]) => `| [${name}](${link}) | ${count} |`).join('\n');
  return `# Current atlas status

Generated from the current displayed catalogue, teaching resolver, dissection profiles and question definitions. Reproduce with \`npm run requirements:audit\`; verify with \`npm run requirements:audit -- --check\`. [JSON inventory](requirement-audit.json) contains source fingerprints and detailed counts. Historical milestone totals are not current coverage.

## Current source scope

- ${anatomy.bodyRepresentations} displayed root-body representations, ${anatomy.bodyBundles} body GLBs (${anatomy.bodyBundleBytes} canonical bytes), ${anatomy.regions.length} regions plus whole body; ${anatomy.archivalBodyRepresentations} retained archival records.
- Dedicated shoulder: ${anatomy.shoulderRepresentations} representations / ${anatomy.shoulderSourceParts} source parts, overlapping the body catalogue.
- Nested dissections: ${teaching.nested.representations} selectable parts, ${teaching.nested.concepts} teaching concepts / ${teaching.nested.references} references; ${teaching.nested.geometryOnlyRepresentations.length} geometry-only selections retain pending teaching.
- ${study.stages} dissection stages / ${study.focuses} focuses. These operate on supplied surfaces, not complete anatomy.
- Guided learning: ${study.guidedLearning.regionalTours} regional tours / ${study.guidedLearning.regionalStops} stops; dedicated shoulder ${study.guidedLearning.shoulderTours} tour / ${study.guidedLearning.shoulderStops} stops. These source-bound drafts reuse existing anatomy, not additional unique structures or clinical approvals.
${nestedGuides.length ? `- Nested eye guided learning: ${nestedGuides.length} source-bound draft guides / ${nestedGuides.reduce((n, guide) => n + guide.steps, 0)} stops across ${distinctGuidedChildren} existing distinct eye children. [Eye-layer guidance](EYE_LAYER_GUIDED_LEARNING.md) overlaps the nested anatomy above; it adds no root-body anatomy, regional tours, geometry or clinical approval.\n` : ''}\
${study.guidedLearning.independentSpecimens?.length ? `- Independent source-guided dissection: ${study.guidedLearning.independentSpecimens.length} draft sequences / ${study.guidedLearning.independentSpecimens.reduce((n, guide) => n + guide.steps, 0)} steps. [Female pelvis](HRA_PELVIC_GUIDED_DISSECTION.md), [abdominal wall and back](WALL_BACK_GUIDED_DISSECTION.md), [kidneys](RENAL_GUIDED_ABDOMINAL_BONES.md) and [lower-limb regions](UM_LIMB_GUIDED_DISSECTION.md) reuse admitted surfaces in separate source frames; no new anatomy or validated surgical planes.\n` : ''}\
- Find/name identification; ${practice.reasoning.concepts} draft reasoning concepts bound to ${practice.reasoning.exactRepresentations} root-body representations in ${practice.reasoning.regions.join(', ')}. [Reasoning practice](REASONING_PRACTICE.md) is separate from Quiz-tab notes.

Independent specimens retain separate source frames and teaching inventories. These counts are not added to root-body or nested coverage; lower-limb regional scopes overlap the same specimen.

| Independent specimen | Representations |
| --- | ---: |
${independent}

## Root-body teaching readiness

${Object.keys(topics).length * anatomy.bodyRepresentations} topic placements across nine displayed topics. Counts describe displayed copy per representation, including shared source-group text, not unique lessons, medical correctness or approvals. The original eight topics remain; X-ray is additional. See [content contract](CONTENT_CONTRACT.md).

${body}

## Nested teaching readiness

Separate from root-body coverage and overlapping parent anatomy. Unnamed cranial pieces receive no inherited parent teaching. Brief drafts and model-scope self-checks are not full curricula or complete organ interiors. See [nested teaching](NESTED_ANATOMY_TEACHING.md) and [nested reviews](NESTED_REVIEWS.md).

${nested}

## Dedicated shoulder teaching readiness

These representations overlap root-body anatomy. Shared text and introductory questions require independent review. See [shoulder review](REVIEW_WORKSPACE.md).

${shoulder}

## Imaging implementation and configured resources

Atlas static registry: version ${learningIntegration.contractVersion}; ${learningIntegration.configuredResources} configured resources / ${learningIntegration.configuredCorrespondences} correspondences in \`content/learning-resources.v1.json\`. Its scope is the Atlas document, not the separate website host configuration. Supported versions ${learningIntegration.supportedDocumentVersions.join(' and ')} cover ${learningIntegration.availableRepresentations} scope-specific destinations, including ${learningIntegration.nestedRepresentations} nested destinations; kinds: ${learningIntegration.supportedKinds.join(', ')}. See [resource contract](LEARNING_RESOURCE_CONTRACT.md) and [nested linking](NESTED_LEARNING_LINKS.md).

Implemented capabilities are distinct from registry counts: the [Didanix Education selection port](DIDANIX_SELECTION_ADAPTER.md), [optional decoded CT/MRI viewer](VOLUME_VIEWER.md), and [private native MRI import checker](NATIVE_MRI_VIEWER.md) exist in Atlas source. The separate website's canonical \`docs/master-plan.md\`, mapped in the coordination \`WORKSPACE_MAP.md\`, records Education integration and completed native MRI synthetic QA. This inventory does not inspect that website's runtime or certify deployment. Empty Atlas resource configuration is not evidence that image viewers or website integration are absent.

Didanix Education/light remains the learner imaging target. Local QA and optional decoded-volume rendering do not establish cleared cases, DICOM ingestion, generic-atlas registration or clinical acceptance. Anatomy, case and separately paid lecture access remain independent. Actual acquired-image mapping requires exact source/resource revisions, privacy/rights clearance, server entitlements and validated correspondence. Completed synthetic MRI QA is distinct from these remaining gates; teaching text and plausible mesh positions cannot supply scan registration.

## Scope limits and remaining gates

- Teaching and reasoning remain drafts. This inventory reads no private review records and determines no clinical approvals. Anatomy and teaching require separate revision-bound radiologist sign-off; approvals never transfer between scopes. See [specimen reviews](SPECIMEN_REVIEWS.md).
- Teaching identities FMA45097/FMA45098, FMA19728 and FMA61970 remain held; source/geometry holds such as FJ3211 remain separate. Peripheral nerves/plexuses, complete joint layers, finer organ interiors and female-body gaps remain. Independent female pelvis is not a complete female body. See [source inventory](SOURCE_INVENTORY.md), [gap decisions](GAP_FILLING.md) and [brachial-plexus source review](BRACHIAL_PLEXUS_SOURCE_REVIEW_20260928.md).
- Dated browser samples accept only tested revisions/flows. Full physical-device, accessibility, dense-label, free-orbit separation and performance acceptance remain separate; software/SSR tests do not complete that matrix.
- ${assetsAndRights.publicFileExtensions.glb} public/archive GLBs; ${assetsAndRights.dependencyEntries} classified lockfile entries / ${assetsAndRights.unclassifiedDependencies} unclassified. Asset totals include alternate/reference files. Preserve source credit/licences and reserved brand rights; classification is not exhaustive legal clearance or a perpetual free-hosting guarantee.
- This audit imports no patient scans, identifiers, CT-head masks or accepted boundaries. Clinical PACS and the separate desktop application remain outside this work.
- Recovery and publication require dated exact-source checkpoints and verified readbacks/restores. These counts do not verify deployment, GitHub/D recovery, private-review or conversation recovery.

Use [requirement/acceptance audit](REQUIREMENT_AUDIT.md), [multimodal plan](MULTIMODAL_LEARNING_PLAN.md), and [ordered improvement plan](CONTINUOUS_IMPROVEMENT.md). The full Atlas goal remains active; this source inventory is not clinical, visual, deployment or legal certification.
`;
}
