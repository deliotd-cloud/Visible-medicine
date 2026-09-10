import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';
import { renderRequirementSummary } from './requirement-summary.mjs';

// This inventory executes the real content resolver. It measures displayed copy,
// not medical correctness, complete lessons, browser acceptance or approval.
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root));
const json = async (path) => JSON.parse(await read(path));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const bundled = await build({
  stdin: {
    contents: `export { bodyContent, bodyLesson } from './app/body-content.ts';
export { structures } from './app/anatomy-data.ts';
export { dissectionProfiles } from './app/dissection-data.ts';
export { reasoningConcepts, reasoningConceptFor } from './lib/reasoning-questions.ts';
export { createLearningRegistry, parseLearningDocument, learningResourceKinds } from './lib/learning-resources.ts';
export { allLearningAnatomyRepresentations } from './lib/nested-learning-anatomy.ts';
export { bodyDisplayCatalog } from './lib/body-display-catalog.ts';
export { nestedStudyTargets } from './lib/nested-anatomy.ts';
export { nestedTeachingFor, nestedTopicLesson } from './lib/nested-teaching.ts';
export { nestedConcepts, nestedTeachingReferences } from './content/nested-teaching.ts';
export { ventricularRelationshipsFor } from './lib/ventricular-relationships.ts';
export { visualRelationshipsFor, visualSellarSource } from './lib/visual-pathway-context.ts';
export { renalRelationshipsFor } from './lib/renal-relationships.ts';
export { hepaticBiliaryRelationshipsFor, hepaticBiliarySource } from './lib/hepatic-biliary-context.ts';
export { cardiacRelationshipsFor, cardiacVesselSource } from './lib/cardiac-context.ts';`,
    resolveDir: fileURLToPath(root),
    sourcefile: 'requirements-audit-entry.ts',
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const {
  bodyContent,
  bodyLesson,
  structures: shoulder,
  dissectionProfiles,
  reasoningConcepts,
  reasoningConceptFor,
  createLearningRegistry,
  parseLearningDocument,
  learningResourceKinds,
  allLearningAnatomyRepresentations,
  bodyDisplayCatalog,
  nestedStudyTargets,
  nestedTeachingFor,
  nestedTopicLesson,
  nestedConcepts,
  nestedTeachingReferences,
  ventricularRelationshipsFor,
  visualRelationshipsFor,
  visualSellarSource,
  renalRelationshipsFor,
  hepaticBiliaryRelationshipsFor,
  hepaticBiliarySource,
  cardiacRelationshipsFor,
  cardiacVesselSource,
} = await import(
  'data:text/javascript;base64,' +
    Buffer.from(bundled.outputFiles[0].text).toString('base64')
);
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const catalog = await json(catalogPath);
const manifest = await json('public/models/bodyparts3d/manifest.json');
const eyeLayers = await json(
  'public/models/bodyparts3d/eye-layers/catalog.json',
);
const ventricular = await json(
  'public/models/bodyparts3d/ventricles/catalog.json',
);
const brainstem = await json(
  'public/models/bodyparts3d/brainstem/catalog.json',
);
const cerebral = await json('public/models/bodyparts3d/cerebral/catalog.json');
const cardiac = await json('public/models/bodyparts3d/cardiac/catalog.json');
const hepatic = await json('public/models/bodyparts3d/hepatic/catalog.json');
const renal = await json('public/models/bodyparts3d/renal/catalog.json');
const pancreatic = await json('public/models/bodyparts3d/pancreatic/catalog.json');
const visualPathway = await json(
  'public/models/bodyparts3d/visual-pathway/catalog.json',
);
const pulmonary = await json(
  'public/models/bodyparts3d/pulmonary/catalog.json',
);
const pulmonaryContext = await json(
  'public/models/bodyparts3d/pulmonary/airway-context.json',
);
const learning = parseLearningDocument(
  await json('content/learning-resources.v1.json'),
);
assert(learning, 'Invalid learning-resource contract');
const learningTargets = allLearningAnatomyRepresentations(
  catalog,
  manifest,
  shoulder,
);
createLearningRegistry(learning, learningTargets);
const revisions = await json('content/review-revisions.json');
const licenses = await json('LICENSES/dependency-license-audit.json');
const lock = await json('package-lock.json');
const lockedPackages = Object.entries(lock.packages).filter(([path]) => path);
assert.equal(
  licenses.packageCount,
  lockedPackages.length,
  'Run licenses:audit for the current lockfile.',
);
for (const [path, metadata] of lockedPackages) {
  const name = metadata.name ?? path.replace(/^.*node_modules\//, '');
  assert(
    licenses.packages.some(
      (entry) =>
        entry.name === name &&
        entry.version === metadata.version &&
        (!metadata.license || entry.license === metadata.license) &&
        entry.developmentOnly === (metadata.dev === true) &&
        entry.optional === (metadata.optional === true),
    ),
    'Licence inventory does not describe current package: ' + path,
  );
}
const tabs = [
  'anatomy',
  'function',
  'ct',
  'mri',
  'ultrasound',
  'pathology',
  'clinical',
  'quiz',
];
const statusNames = [
  'specificDraft',
  'identityOnly',
  'pending',
  'generatedIdentification',
];
const readinessCategories = {
  draft: 'specificDraft',
  'identity-only': 'identityOnly',
  pending: 'pending',
  'generated-identification': 'generatedIdentification',
};
function classify(section, readiness) {
  assert.equal(typeof section.body, 'string');
  assert(section.body.trim(), 'Empty displayed section');
  assert(
    Object.hasOwn(readinessCategories, readiness),
    'Missing explicit topic readiness',
  );
  return readinessCategories[readiness];
}
const contentRows = catalog.structures.map((entry) => ({
  entry,
  sections: Object.fromEntries(
    tabs.map((tab) => [tab, bodyContent(entry, tab)]),
  ),
  readiness: Object.fromEntries(
    tabs.map((tab) => [tab, bodyLesson(entry, tab).readiness]),
  ),
}));
function summarize(rows) {
  return Object.fromEntries(
    tabs.map((tab) => {
      const counts = Object.fromEntries(statusNames.map((name) => [name, 0]));
      for (const row of rows)
        counts[classify(row.sections[tab], row.readiness[tab])]++;
      assert.equal(
        Object.values(counts).reduce((a, b) => a + b, 0),
        rows.length,
      );
      return [tab, counts];
    }),
  );
}
const displayCatalog = bodyDisplayCatalog(catalog);
const nestedRows = nestedStudyTargets(displayCatalog).map((target) => {
  const parent = displayCatalog.structures.find(
    (s) => s.id === target.parentId,
  );
  const concept = nestedTeachingFor(parent, target.study, target.structure);
  assert(
    concept,
    'Missing source-bound nested teaching: ' + target.structureId,
  );
  const sections = Object.fromEntries(
    tabs.map((tab) => [tab, nestedTopicLesson(concept, tab)]),
  );
  return {
    sections,
    readiness: Object.fromEntries(
      tabs.map((tab) => [tab, sections[tab].readiness]),
    ),
  };
});
const countsBySystem = Object.fromEntries(
  ['skeleton', 'muscles', 'nerves', 'organs', 'vessels', 'connective'].map(
    (system) => [
      system,
      catalog.structures.filter((entry) => entry.system === system).length,
    ],
  ),
);
const profiles = Object.values(dissectionProfiles);
const sourceHashes = {};
for (const path of [
  catalogPath,
  'public/models/bodyparts3d/manifest.json',
  'public/models/bodyparts3d/eye-layers/catalog.json',
  'public/models/bodyparts3d/eye-layers/display-correction.json',
  'public/models/bodyparts3d/pancreas/display-correction.json',
  'lib/body-display-catalog.ts',
  'docs/pancreatic-source-audit.json',
  'lib/eye-layer-state.ts',
  'lib/ventricles.ts',
  'app/eye-layers.tsx',
  'public/models/bodyparts3d/ventricles/catalog.json',
  'public/models/bodyparts3d/brainstem/catalog.json',
  'public/models/bodyparts3d/cerebral/catalog.json',
  'public/models/bodyparts3d/cardiac/catalog.json',
  'lib/cardiac.ts',
  'lib/hepatic.ts',
  'lib/renal.ts',
  'lib/pancreatic.ts',
  'content/pancreatic-teaching.ts',
  'public/models/bodyparts3d/pancreatic/catalog.json',
  'lib/renal-relationships.ts',
  'content/renal-teaching.ts',
  'public/models/bodyparts3d/renal/catalog.json',
  'docs/renal-vascular-source-audit.json',
  'lib/visual-pathway.ts',
  'lib/visual-pathway-context.ts',
  'public/models/bodyparts3d/visual-pathway/sellar-context.json',
  'content/visual-pathway-teaching.ts',
  'content/brain-imaging-teaching.ts',
  'content/eye-imaging-teaching.ts',
  'public/models/bodyparts3d/visual-pathway/catalog.json',
  'docs/visual-pathway-source-audit.json',
  'public/models/bodyparts3d/hepatic/catalog.json',
  'docs/hepatic-source-audit.json',
  'lib/pulmonary.ts',
  'lib/pulmonary-context.ts',
  'public/models/bodyparts3d/pulmonary/airway-context.json',
  'public/models/bodyparts3d/pulmonary/catalog.json',
  'docs/pulmonary-source-audit.json',
  'content/cerebral-supplement-audit.json',
  'content/nested-teaching.ts',
  'content/cardiac-teaching.ts',
  'content/hepatic-teaching.ts',
  'content/pulmonary-teaching.ts',
  'content/cerebral-teaching.ts',
  'content/nested-teaching-bindings.v1.json',
  'lib/nested-anatomy.ts',
  'lib/nested-teaching.ts',
  'app/nested-teaching.tsx',
  'app/nested-teaching.css',
  'package-lock.json',
  'content/schema/anatomy-structure.schema.json',
  'content/review-revisions.json',
  'content/learning-resources.v1.json',
  'lib/learning-resource-types.ts',
  'lib/learning-resources.ts',
  'lib/learning-anatomy.ts',
  'lib/nested-learning-anatomy.ts',
  'lib/ventricular-relationships.ts',
  'lib/cardiac-context.ts',
  'public/models/bodyparts3d/cardiac/great-vessel-context.json',
  'app/ventricles.tsx',
  'app/ventricular-relationships.css',
  'app/body-scene.tsx',
  'lib/origin-guides.ts',
  'lib/learning-entitlements.ts',
  'public/brand/visible-medicine-lockup-dark.png',
  'public/brand/visible-medicine-lockup-light.png',
])
  sourceHashes[path] = hash(await read(path));
// Hash resolved data, not generated module comments that contain checkout paths.
// This remains portable and binds the result to actual displayed copy/recipes.
sourceHashes.resolvedContentAndRecipeData = hash(
  JSON.stringify({
    body: contentRows.map(({ entry, sections }) => ({
      id: entry.id,
      sections,
    })),
    shoulder,
    dissectionProfiles,
  }),
);
sourceHashes.explicitTopicReadiness = hash(
  JSON.stringify(
    contentRows.map(({ entry, readiness }) => ({
      id: entry.id,
      readiness,
    })),
  ),
);
sourceHashes.reasoningQuestionData = hash(JSON.stringify(reasoningConcepts));
// Include resolved nested text and references, including separately imported
// organ modules. Coverage counts alone do not detect an altered paragraph.
sourceHashes.nestedTeachingData = hash(
  JSON.stringify({
    concepts: nestedConcepts,
    references: nestedTeachingReferences,
  }),
);
const publicFiles = [];
async function inventory(directory) {
  for (const entry of await readdir(new URL(directory, root), {
    withFileTypes: true,
  })) {
    const path = directory + '/' + entry.name;
    if (entry.isDirectory()) await inventory(path);
    else if (entry.isFile()) publicFiles.push(path);
    else throw Error('Unexpected non-file public asset: ' + path);
  }
}
await inventory('public');
publicFiles.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const extensions = {};
for (const path of publicFiles) {
  const extension = path.split('.').at(-1).toLowerCase();
  extensions[extension] = (extensions[extension] ?? 0) + 1;
}
const report = {
  schemaVersion: 1,
  method:
    'Offline source and displayed-copy inventory; no clinical or browser certification.',
  sourceHashes,
  anatomy: {
    displayCorrections: displayCatalog.structures
      .filter(
        (s, i) => JSON.stringify(s) !== JSON.stringify(catalog.structures[i]),
      )
      .map((s) => ({
        fmaId: s.fmaId,
        bundle: s.bundle,
        retainedSources: s.sources.length,
      })),
    bodyRepresentations: catalog.structures.length,
    bodyBundles: catalog.bundles.length,
    bodyBundleBytes: catalog.bundles.reduce(
      (total, bundle) => total + bundle.bytes,
      0,
    ),
    systems: countsBySystem,
    regions: catalog.regions.map(({ id, name }) => ({
      id,
      name,
      entries: catalog.structures.filter((entry) => entry.regions.includes(id))
        .length,
    })),
    shoulderRepresentations: shoulder.length,
    shoulderSourceParts: manifest.parts.length,
    nestedDissections: {
      eyeComponents: eyeLayers.structures.length,
      ventricularSpaces: ventricular.ventricularIds.length,
      ventricularContext: ventricular.contextIds.length,
      brainstemCompounds: brainstem.selectableIds.length,
      brainstemContext: brainstem.contextIds.length,
      cerebralSelections: cerebral.selectableIds.length,
      cerebralParentSubdivisions:
        cerebral.selectableIds.length - cerebral.supplementalIds.length,
      cerebralAdditionalSourceParts: cerebral.supplementalIds.length,
      cerebralContext: cerebral.contextIds.length,
      cardiacCavities: cardiac.selectableIds.length,
      cardiacContextWalls: cardiac.contextIds.length,
      hepaticBranchGroups: hepatic.selectableIds.length,
      hepaticSourceFiles: hepatic.structures.reduce(
        (n, s) => n + s.sources.length,
        0,
      ),
      hepaticValidatedSegments: 0,
      pulmonaryBranchGroups: pulmonary.selectableIds.length,
      pulmonarySourceFiles: pulmonary.structures.reduce(
        (n, s) => n + s.sources.length,
        0,
      ),
      pulmonaryLobeSurfaces: 0,
      renalVascularGroups: renal.selectableIds.length,
      renalParentViews: renal.parents.length,
      renalSourceFiles: renal.structures.reduce(
        (n, s) => n + s.sources.length,
        0,
      ),
      renalInternalTissueParts: 0,
      pancreaticDuctSelections: pancreatic.selectableIds.length,
      pancreaticReferenceSurfaces: pancreatic.contextIds.length,
      pancreaticSourceFiles: pancreatic.structures.reduce((n, s) => n + s.sources.length, 0),
      pancreaticValidatedLumens: 0,
      visualPathwayGroups: visualPathway.selectableIds.length,
      visualPathwaySourceFiles: visualPathway.structures.reduce(
        (n, s) => n + s.sources.length,
        0,
      ),
      visualPathwayContextLandmarks: new Set(
        [...visualPathway.contextRecords, ...visualSellarSource.structures].map(
          (s) => s.id,
        ),
      ).size,
      additionalUniqueWholeBodyAnatomy:
        cerebral.supplementalIds.length +
        renal.structures.length +
        visualPathway.structures.length,
      limitation:
        'Nested selections generally subdivide existing parents. Four superior temporal source parts, seven renal/suprarenal vascular groups and three optic-chiasm/tract surfaces are additional anatomy in nested studies; context reuses existing structures. Kidney association is navigation, not tissue membership. Visual surfaces do not depict continuous fibres. Nested teaching is counted separately from the root-body inventory. The unchanged archival catalogue excludes these alternate display assets and additions.',
    },
    regionalMembershipsOverlap: true,
    shoulderAndBodyRepresentationsOverlap: true,
    anatomicalCompletenessMeasured: false,
  },
  study: {
    hepaticBiliaryLandmarks: hepaticBiliarySource.structures.length,
    hepaticBiliaryRelationshipPresets: hepaticBiliaryRelationshipsFor(hepaticBiliarySource.parent).length,
    renalRelationshipPresets: renal.parents.reduce(
      (total, parent) => total + renalRelationshipsFor(parent).length,
      0,
    ),
    visualPathwayRelationshipPresets: visualRelationshipsFor(
      visualPathway.parent,
    ).length,
    cardiacVesselLandmarks: cardiacVesselSource.structures.length,
    cardiacRelationshipPresets: cardiacRelationshipsFor(cardiac.parent).length,
    pulmonaryAirwayLandmarks: pulmonaryContext.structures.length,
    pulmonaryAirwayContexts: pulmonaryContext.bindings.length,
    ventricularRelationshipPresets: ventricularRelationshipsFor(
      ventricular.parent,
    ).length,
    stages: profiles.reduce(
      (total, profile) => total + profile.stages.length,
      0,
    ),
    focuses: profiles.reduce(
      (total, profile) => total + profile.focuses.length,
      0,
    ),
  },
  practice: {
    identificationModes: ['find', 'name'],
    reasoning: {
      concepts: reasoningConcepts.length,
      exactRepresentations:
        catalog.structures.filter(reasoningConceptFor).length,
      regions: [
        ...new Set(
          catalog.structures
            .filter(reasoningConceptFor)
            .flatMap((s) => s.regions),
        ),
      ],
      readiness: 'draft',
      limitation:
        'Separate from Quiz-tab notes. Authored anatomical-reasoning pilot, not educator-approved or a validated assessment.',
    },
  },
  learningIntegration: {
    contractVersion: learning.schemaVersion,
    supportedDocumentVersions: [1, 2],
    availableRepresentations: learningTargets.length,
    nestedRepresentations: learningTargets.filter((t) => t.scope === 'nested')
      .length,
    supportedKinds: learningResourceKinds,
    configuredResources: learning.resources.length,
    configuredCorrespondences: learning.links.length,
    liveViewerIntegration: false,
    limitation:
      'Strict read-only transport and source/anchor registry with host-policy gates. Configured records are not approvals. No external resources are configured at this milestone.',
  },
  teaching: {
    classification: {
      specificDraft:
        'Explicitly draft authored copy, possibly shared across a source group. Not necessarily complete, cited or clinically reviewed.',
      identityOnly:
        'Generic source identity or vascular-segment disclaimer, not a structure-specific anatomy/function lesson.',
      pending: 'Explicit pending-content fallback.',
      generatedIdentification:
        'Generated find-this-structure prompt, not an authored clinical question.',
    },
    classificationLimit:
      'Explicit readiness from authoring branches; not inferred from titles and not clinical approval. Existing shoulder authoring is explicitly draft.',
    body: summarize(contentRows),
    nested: {
      representations: nestedRows.length,
      concepts: nestedConcepts.length,
      references: Object.keys(nestedTeachingReferences).length,
      topics: summarize(nestedRows),
      limitation:
        'Original, source-pinned introductory drafts and unscored recall questions. Not complete disease teaching, specialist approval, a scored exam, an imaging connection or paid-lecture entitlement. Counts overlap existing parent anatomy.',
    },
    shoulder: summarize(
      shoulder.map((entry) => ({
        sections: entry.sections,
        readiness: Object.fromEntries(tabs.map((tab) => [tab, 'draft'])),
      })),
    ),
    byRegion: Object.fromEntries(
      catalog.regions.map(({ id }) => [
        id,
        summarize(
          contentRows.filter(({ entry }) => entry.regions.includes(id)),
        ),
      ]),
    ),
    clinicallyApproved:
      'Not determined: no private review database is read by this script.',
  },
  assetsAndRights: {
    publicFileExtensions: extensions,
    publicFontFiles: publicFiles.filter((path) =>
      /\.(woff2?|ttf|otf)$/i.test(path),
    ),
    dependencyEntries: licenses.packageCount,
    dependencyClassification: licenses.result,
    unclassifiedDependencies: licenses.flagged.length,
    limitation:
      'Lockfile declarations and existing notices, not legal clearance of every distributed binary or a fee guarantee. GLB/source rights remain separate from code; brand rights remain reserved.',
  },
  review: {
    revisionIdentities: Object.keys(revisions.revisions).length,
    hasPrivateReviews: false,
    status:
      'Revision fingerprints are not approvals; persisted review UI currently targets the shoulder pilot only.',
  },
  boundaries: {
    importedNewAnatomy: false,
    importedScans: false,
    clinicalValidation: false,
    browserInteractionTesting: false,
    remoteDeliveryVerified: false,
  },
};
const destination = new URL('docs/requirement-audit.json', root);
const output = JSON.stringify(report, null, 2) + '\n';
const summaryPath = new URL('docs/CURRENT_STATUS.md', root);
const summary = renderRequirementSummary(report);
if (process.argv.includes('--check')) {
  assert.equal(
    await readFile(destination, 'utf8'),
    output,
    'Requirement inventory is stale; rerun requirements:audit and review its conclusions.',
  );
  assert.equal(
    await readFile(summaryPath, 'utf8'),
    summary,
    'Current status summary is stale; run requirements:audit.',
  );
  console.log(
    'Requirement inventory matches current source and displayed content.',
  );
} else {
  await writeFile(destination, output);
  await writeFile(summaryPath, summary);
  console.log(
    JSON.stringify(
      {
        anatomy: report.anatomy,
        teaching: report.teaching.body,
        study: report.study,
        review: report.review,
      },
      null,
      2,
    ),
  );
}
