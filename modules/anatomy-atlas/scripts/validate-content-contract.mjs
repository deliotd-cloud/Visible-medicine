import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyBeforeShoulderArmCurriculum } from './curriculum-transition.mjs';
import { reviewDocumentBeforeSearch } from './review-history.mjs';
import { build } from './workspace-test-build.mjs';
import {
  contentContext,
  contentRoot,
  contentValidator,
  readContentJson,
  recordKey,
} from './content-contract-tools.mjs';

let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const check = (value, message) => {
  checks++;
  assert(value, message);
};
const rejects = (action, message) => {
  checks++;
  assert.throws(action, undefined, message);
};
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const context = await contentContext();
const { api, catalog, manifest, revisions, shoulder, body, registry } = context;
const validate = await contentValidator(registry);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
same(
  baseline.sourceCommit,
  '71b27369829e1cc0351d8926886fecb7057b165f',
  'Recorded original content source commit',
);
const clone = (value) => structuredClone(value);
for (const [path, expected] of [
  [
    'content/schema/anatomy-structure.v1.schema.json',
    baseline.legacySchemaHash,
  ],
  ['public/models/bodyparts3d/full-body/catalog.json', baseline.catalogHash],
  ['public/models/bodyparts3d/manifest.json', baseline.manifestHash],
])
  same(
    sha(await readFile(new URL(path, contentRoot))),
    expected,
    'Original source/legacy/review bytes: ' + path,
  );
const originalReviewDocument = await reviewDocumentBeforeSearch(
  revisions,
  manifest,
  api.structures,
);
same(
  sha(JSON.stringify(originalReviewDocument, null, 2) + '\n'),
  baseline.reviewRevisionsHash,
  'Original review baseline retained through the exact search-display revision transition',
);
// The baseline predates later authored lessons. Replay its exact recorded source
// tree for the whole-curriculum proof; the current replay below still checks
// the individually pinned shoulder/arm and forearm transitions.
const root = fileURLToPath(contentRoot);
const historical = await build({
  stdin: {
    contents: `export { bodyContent } from './app/body-content';
export { structures } from './app/anatomy-data';
export { dissectionProfiles } from './app/dissection-data';`,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  plugins: [
    {
      name: 'exact-content-contract-baseline',
      setup(builder) {
        builder.onLoad({ filter: /.*/, namespace: 'workspace-test' }, (args) => {
          const path = relative(root, args.path).replaceAll('\\', '/');
          assert(!path.startsWith('../') && path !== '..');
          if (path.startsWith('node_modules/')) return;
          return {
            contents: execFileSync(
              'git',
              ['show', `${baseline.sourceCommit}:${path}`],
              { cwd: root, encoding: 'utf8', maxBuffer: 16e6 },
            ),
            loader:
              { '.ts': 'ts', '.tsx': 'tsx', '.json': 'json' }[extname(path)] ||
              'js',
            resolveDir: dirname(args.path),
          };
        });
      },
    },
  ],
});
const original = await import(
  'data:text/javascript;base64,' +
    Buffer.from(historical.outputFiles[0].text).toString('base64')
);
const originalTabs = [
  'anatomy',
  'function',
  'ct',
  'mri',
  'ultrasound',
  'pathology',
  'clinical',
  'quiz',
];
const originalCopy = {
  body: catalog.structures.map((entry) => ({
    id: entry.id,
    sections: Object.fromEntries(
      originalTabs.map((tab) => [tab, original.bodyContent(entry, tab)]),
    ),
  })),
  shoulder: original.structures,
  dissectionProfiles: original.dissectionProfiles,
};
same(
  sha(JSON.stringify(originalCopy)),
  baseline.copyAndRecipeHash,
  'Original copy and recipes from the exact recorded Git tree',
);
await copyBeforeShoulderArmCurriculum(context);
same(shoulder.length, 9);
same(body.length, 1022);
same(registry.size, 1031, 'Keys are scope plus identity, not identity alone');
same(
  shoulder.reduce((sum, record) => sum + record.meshBindings.length, 0),
  manifest.parts.length,
);
const assets = new Map();
async function asset(path) {
  if (!assets.has(path)) {
    const bytes = await readFile(new URL('public' + path, contentRoot));
    same(bytes.toString('utf8', 0, 4), 'glTF');
    same(bytes.readUInt32LE(4), 2);
    same(bytes.readUInt32LE(8), bytes.length);
    same(bytes.toString('utf8', 16, 20), 'JSON');
    const data = JSON.parse(
      bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)),
    );
    assets.set(path, { sha256: sha(bytes), data });
  }
  return assets.get(path);
}
const nodes = new Set();
const statuses = new Set();
for (const record of [...shoulder, ...body]) {
  check(validate(record), 'Schema plus registry validation');
  const stable = JSON.stringify(record);
  check(validate(JSON.parse(stable)), 'JSON round trip');
  same(JSON.stringify(record), stable, 'Validator does not modify records');
  same(record.validation.status, 'draft');
  same(record.validation.clinicalApproval, 'not-included');
  same(record.validation.materialRevisions.imaging, null);
  if (record.representationScope === 'shoulder-pilot') {
    same(record.validation.materialRevisions, revisions.revisions[record.id]);
    const parts = manifest.parts.filter(
      (part) => part.structureId === record.id,
    );
    same(
      record.meshBindings.map((binding) => binding.nodeName),
      parts.map((part) => part.nodeName),
    );
    same(
      record.meshBindings.flatMap((binding) =>
        binding.sources.map((source) => source.sha256),
      ),
      parts.map((part) => part.sourceSha256),
    );
  } else {
    const entry = catalog.structures.find((item) => item.id === record.id);
    same(record.meshBindings.length, 1);
    same(
      record.meshBindings[0].sources.map((source) => [
        source.file,
        source.sha256,
      ]),
      entry.sources.map((source) => [
        source.file.endsWith('.obj') ? source.file : source.file + '.obj',
        source.sha256,
      ]),
    );
    same(record.validation.materialRevisions, {
      geometry: null,
      teaching: null,
      imaging: null,
    });
  }
  for (const tab of api.contentTabs) {
    const { readiness, ...section } = record.content[tab];
    statuses.add(readiness);
    check(
      [
        'draft',
        'identity-only',
        'pending',
        'generated-identification',
      ].includes(readiness),
    );
    const expected =
      record.representationScope === 'body'
        ? api.bodyContent(
            catalog.structures.find((entry) => entry.id === record.id),
            tab,
          )
        : api.structures.find((entry) => entry.id === record.id).sections[tab];
    const { readiness: authoredReadiness, ...expectedDisplay } = expected;
    if (authoredReadiness) same(readiness, authoredReadiness);
    // Serialization deliberately drops optional undefined properties.
    same(
      JSON.parse(JSON.stringify(section)),
      JSON.parse(JSON.stringify(expectedDisplay)),
    );
  }
  for (const binding of record.meshBindings) {
    const loaded = await asset(binding.assetPath);
    same(loaded.sha256, binding.assetSha256);
    const matching = loaded.data.nodes.filter(
      (node) => node.name === binding.nodeName,
    );
    same(matching.length, 1, 'Exactly one bound GLB node');
    check(
      Number.isInteger(matching[0].mesh),
      'Binding addresses a mesh, not a grouping node',
    );
    if (record.representationScope === 'body') {
      same(matching[0].extras.structureId, record.id);
    } else {
      const part = manifest.parts.find(
        (item) => item.nodeName === binding.nodeName,
      );
      same(matching[0].extras.sourceFile, part.sourceFile);
      same(matching[0].extras.fmaId, part.fmaId);
      // The immutable GLB retains this older descriptive slug. Product binding
      // comes from the exact manifest node + FMA/source hash, never from a slug.
      same(
        matching[0].extras.anatomySlug,
        record.id.endsWith(':biceps-long-head')
          ? 'biceps-long-head-muscle'
          : part.slug,
      );
      same(part.structureId, record.id);
    }
    const key =
      record.representationScope +
      '|' +
      binding.assetId +
      '|' +
      binding.nodeName;
    check(!nodes.has(key), 'Single identity owns this rendered node');
    nodes.add(key);
  }
}
same(
  [...statuses].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
  ['draft', 'generated-identification', 'identity-only', 'pending'],
);
same(assets.size, 87);
const deltoid = shoulder.find((entry) => entry.id.endsWith(':deltoid'));
same(deltoid.meshBindings.length, 3);
const reordered = clone(deltoid);
reordered.meshBindings.reverse();
reordered.externalTerminology.fma.reverse();
check(validate(reordered), 'Binding order is not a new identity');
const negative = [
  (r) => {
    delete r.schemaVersion;
  },
  (r) => {
    r.schemaVersion = 1;
  },
  (r) => {
    r.schemaVersion = 3;
  },
  (r) => {
    r.meshBinding = r.meshBindings[0];
    delete r.meshBindings;
  },
  (r) => {
    r.meshBindings.pop();
  },
  (r) => {
    r.meshBindings[1] = clone(r.meshBindings[0]);
  },
  (r) => {
    r.meshBindings[0].assetSha256 = '0'.repeat(64);
  },
  (r) => {
    r.meshBindings[0].sources[0].sha256 = '0'.repeat(64);
  },
  (r) => {
    r.meshBindings[0].sources[0].fmaId = 'FMA1';
  },
  (r) => {
    r.meshBindings[0].sources[0].file = '../FJ3384.obj';
  },
  (r) => {
    r.meshBindings[0].sourceVersion = '3.0';
  },
  (r) => {
    r.meshBindings[0].nodeName = shoulder[0].meshBindings[0].nodeName;
  },
  (r) => {
    r.coordinateSystem.sourceToSceneColumnMajor[12] += 1;
  },
  (r) => {
    r.coordinateSystem.unitsPerMillimetre *= 2;
  },
  (r) => {
    r.coordinateSystem.referenceFrame = 'patient:lps-mm';
  },
  (r) => {
    r.coordinateSystem.FrameOfReferenceUID = 'not-a-study';
  },
  (r) => {
    r.coordinateSystem.sourceToSceneColumnMajor[0] = NaN;
  },
  (r) => {
    r.validation.status = 'validated';
  },
  (r) => {
    r.validation.clinicalApproval = 'approved';
  },
  (r) => {
    r.validation.reviewer = 'Synthetic test reviewer';
  },
  (r) => {
    r.validation.materialRevisions.imaging = '0'.repeat(64);
  },
  (r) => {
    r.validation.materialRevisions.teaching = '0'.repeat(64);
  },
  (r) => {
    r.content.function.body += ' altered';
  },
  (r) => {
    r.content.anatomy.readiness = 'clinically-reviewed';
  },
  (r) => {
    delete r.content.ct.readiness;
  },
  (r) => {
    delete r.content.ultrasound;
  },
  (r) => {
    r.provenance.licence = 'MIT';
  },
  (r) => {
    r.provenance.citation = '';
  },
  (r) => {
    delete r.externalTerminology;
  },
  (r) => {
    r.externalTerminology.fma = ['FMA1'];
  },
  (r) => {
    r.id = r.id.replace(':right:', ':left:');
  },
  (r) => {
    r.representationScope = 'body';
  },
  (r) => {
    r.patientId = 'synthetic-fixture';
  },
];
for (const mutate of negative) {
  const changed = clone(deltoid);
  mutate(changed);
  rejects(
    () => validate(changed),
    'Reject malformed, stale or unsupported imports',
  );
}
const legacy = {
  ...clone(deltoid),
  meshBinding: { assetId: 'legacy', nodeName: 'one-part' },
};
delete legacy.schemaVersion;
legacy.validation = { status: 'validated', reviewers: ['Synthetic fixture'] };
rejects(
  () => validate(legacy),
  'Legacy approvals/one-part records are not silently upgraded',
);
const before = JSON.stringify({
  catalog,
  manifest,
  structures: api.structures,
  revisions,
});
const detached = api.shoulderContentRecords(
  api.structures,
  manifest,
  revisions.revisions,
);
detached[0].content.anatomy.body = 'mutated fixture';
detached[0].meshBindings[0].sources[0].sha256 = 'bad';
detached[0].coordinateSystem.sourceToSceneColumnMajor[0] = 0;
const detachedBody = api.bodyContentRecords(catalog);
detachedBody[0].content.anatomy.citations?.push('mutated fixture');
detachedBody[0].meshBindings[0].sources[0].file = 'changed';
same(
  JSON.stringify({ catalog, manifest, structures: api.structures, revisions }),
  before,
  'Returned records cannot mutate source/teaching/revisions',
);
const wrongVersion = clone(catalog);
wrongVersion.sourceVersion = '3.0';
rejects(() => api.bodyContentRecords(wrongVersion));
const wrongFrame = clone(manifest);
wrongFrame.coordinateSystem.unitsPerMillimetre = 0;
rejects(() =>
  api.shoulderContentRecords(api.structures, wrongFrame, revisions.revisions),
);
const expectedFixture = JSON.stringify(shoulder, null, 2) + '\n';
// Use a body-scope record without a shoulder teaching digest so malformed keys
// must fail the quiz contract itself, not merely a different revision hash.
const keyedBody = body.find(record => Object.hasOwn(record.content.quiz, 'correctAnswer'));
check(keyedBody, 'A body alias exports the formative quiz key');
same(keyedBody.validation.materialRevisions.teaching, null);
const quizNegatives = [
  r => { r.content.quiz.correctAnswer = 'not a choice'; },
  r => { r.content.quiz.correctAnswer = ' '; },
  r => { delete r.content.quiz.correctAnswer; },
  r => { delete r.content.quiz.explanation; },
  r => { r.content.quiz.explanation = ' '; },
  r => { r.content.quiz.bullets.push(r.content.quiz.correctAnswer); },
  r => { r.content.quiz.bullets.push(' ' + r.content.quiz.bullets[0] + ' '); },
  r => { r.content.quiz.bullets[0] = ''; },
  r => { r.content.quiz.bullets = [r.content.quiz.correctAnswer]; },
  r => { r.content.quiz.readiness = 'pending'; },
  r => { r.content.anatomy.correctAnswer = 'not a quiz'; },
  r => { r.content.quiz.score = 100; },
];
for (const mutate of quizNegatives) {
  const malformed = clone(keyedBody); mutate(malformed);
  rejects(() => validate(malformed), 'Reject malformed formative answer keys');
}
const unkeyed = clone(keyedBody);
delete unkeyed.content.quiz.correctAnswer; delete unkeyed.content.quiz.explanation;
check(validate(unkeyed), 'Existing informational quizzes remain valid v2 records');
same(
  (
    await readFile(
      new URL('content/exports/shoulder.v2.json', contentRoot),
      'utf8',
    )
  ).replace(/\r\n/g, '\n'),
  expectedFixture,
  'Committed shoulder fixture is current',
);
same(registry.get(recordKey(deltoid)), deltoid);
const report = {
  passed: true,
  checks,
  bodyRecords: body.length,
  shoulderRecords: shoulder.length,
  boundNodes: nodes.size,
  glbAssetsVerified: assets.size,
  rejectionCases: negative.length + quizNegatives.length + 3,
  originalCopyAndRecipesVerifiedFromRecordedGitTree: true,
  currentPinnedCurriculumTransitionsChecked: true,
  explicitlyUpdatedBodySections: 3634,
  additionalSpinalImagingSections: catalog.structures.reduce(
    (n, s) =>
      n + api.contentTabs.filter((t) => api.spineImagingLesson(s, t)).length,
    0,
  ),
  sourceGeometryChanged: false,
  clinicalApprovalsImported: false,
  displayReviewTransitionVerified: true,
  patientDataImported: false,
  databaseWrites: false,
  browserInteractionTesting: false,
  limitations:
    'Actual source/content/schema/export checks, not clinical correctness, editorial completeness, database deployment or imaging registration. Unknown fields are rejected; free text is not a patient-data detector.',
};
await writeFile(
  new URL('docs/content-contract-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
