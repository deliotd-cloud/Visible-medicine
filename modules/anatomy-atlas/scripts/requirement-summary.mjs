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
- ${study.stages} dissection stages and ${study.focuses} focuses. These operate on supplied surfaces; they do not establish complete anatomy.
- Find/name identification practice; ${practice.reasoning.concepts} draft reasoning concepts bound to ${practice.reasoning.exactRepresentations} representations in ${practice.reasoning.regions.join(', ')}. One concept per session, without contralateral repetition. See [practice scope and tests](REASONING_PRACTICE.md).
- [Learning-resource contract](LEARNING_RESOURCE_CONTRACT.md): version ${learningIntegration.contractVersion}, ${learningIntegration.supportedKinds.join('/')} anchors; ${learningIntegration.configuredResources} configured resources / ${learningIntegration.configuredCorrespondences} correspondences. Read-only linking infrastructure, not a connected external viewer or publication approval.

## Body teaching readiness

Counts are representations with displayed copy, not unique lessons, complete topic coverage or clinical approvals. Shared source-group copy is counted per representation. The dedicated shoulder has draft text in all eight topics; do not add overlapping representations to claim more unique anatomy.

| Topic | Specific/source-group draft | Identity only | Pending | Generated identification |
| --- | ---: | ---: | ---: | ---: |
${rows}

Quiz-tab notes are separate from interactive practice. X-ray has no authored topic/viewer yet. CT/MRI/US text is not a scan viewer, segmentation or validated spatial correspondence.

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
