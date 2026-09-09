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
export { learningAnatomyRepresentations } from './lib/learning-anatomy.ts';`,
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
  learningAnatomyRepresentations,
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
const learning = parseLearningDocument(
  await json('content/learning-resources.v1.json'),
);
assert(learning, 'Invalid learning-resource contract');
createLearningRegistry(
  learning,
  learningAnatomyRepresentations(catalog, manifest, shoulder),
);
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
  'public/models/bodyparts3d/ventricles/catalog.json',
  'public/models/bodyparts3d/brainstem/catalog.json',
  'public/models/bodyparts3d/cerebral/catalog.json',
  'content/cerebral-supplement-audit.json',
  'package-lock.json',
  'content/schema/anatomy-structure.schema.json',
  'content/review-revisions.json',
  'content/learning-resources.v1.json',
  'lib/learning-resource-types.ts',
  'lib/learning-resources.ts',
  'lib/learning-anatomy.ts',
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
    contentRows.map(({ entry, readiness }) => ({ id: entry.id, readiness })),
  ),
);
sourceHashes.reasoningQuestionData = hash(JSON.stringify(reasoningConcepts));
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
      additionalUniqueWholeBodyAnatomy: cerebral.supplementalIds.length,
      limitation:
        'Nested selections generally subdivide existing parents. Four superior temporal ISA source parts are additional anatomy, available only inside the cerebral study; context reuses existing structures. Short drafts are separate from the eight-topic body inventory. The unchanged archival catalogue excludes these alternate display assets and additions.',
    },
    regionalMembershipsOverlap: true,
    shoulderAndBodyRepresentationsOverlap: true,
    anatomicalCompletenessMeasured: false,
  },
  study: {
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
