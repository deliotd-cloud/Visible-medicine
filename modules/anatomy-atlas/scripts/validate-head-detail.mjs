import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { headDetailDefinitions } from './head-detail-selections.mjs';
import { inventoryHolds } from './anatomy-inventory.mjs';
import { applyJunctionTransition } from './junction-transition.mjs';
let checks = 0;
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(a, b, m);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const read = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
const catalog = await read('public/models/bodyparts3d/full-body/catalog.json');
const baseline = await read('content/head-detail-baseline.json');
const evidence = await read('content/head-detail-source-audit.json');
const inventory = await read('content/source-inventory.json');
same(baseline.sourceCommit, '6bdd559680d318cf22b3a0ce390f072863032924');
same(
  baseline.catalogSha256,
  'a1c6e33bea4c228558d7fc79b8537c9a83fe03fcb296a3f22ee8b2ab688af1f7',
);
same(evidence.sourceCommit, baseline.sourceCommit);
same(baseline.structures.length, 892);
same(baseline.bundles.length, 71);
same(catalog.structures.length, 998);
same(catalog.bundles.length, 81);
same(catalog.coordinateSystem, baseline.coordinateSystem);
same(catalog.excluded, baseline.excluded);
await applyJunctionTransition(baseline, catalog);
for (const old of baseline.structures) {
  const now = catalog.structures.find((s) => s.id === old.id);
  check(now);
  same(
    hash(JSON.stringify(now)),
    old.sha256,
    'Entire previous record preserved',
  );
}
for (const old of baseline.bundles) {
  same(
    catalog.bundles.find((b) => b.id === old.id),
    old,
  );
  same(
    hash(
      await fs.readFile(
        'public/models/bodyparts3d/full-body/' + old.id + '.glb',
      ),
    ),
    old.sha256,
  );
}
const additions = catalog.structures.filter(
  (s) =>
    !baseline.structures.some((b) => b.id === s.id) &&
    s.bundle.endsWith('-head-detail'),
);
same(additions.length, 32);
same(evidence.results.length, 32);
same(new Set(additions.map((s) => s.bundle)).size, 2);
const newHashes = new Set();
for (const [fma, name, file] of headDetailDefinitions) {
  const s = additions.find((s) => s.fmaId === fma),
    a = evidence.results.find((r) => r.fmaId === fma);
  check(s && a);
  same(s.sourceName, name);
  same(s.sourceTree, 'isa');
  same(s.regions, ['head-neck']);
  same(s.region, 'head-neck');
  same(s.system, name.endsWith('tooth') ? 'organs' : 'connective');
  same(
    s.category,
    name.endsWith('tooth')
      ? 'organ'
      : /ring/.test(name)
        ? 'tendon'
        : 'cartilage',
  );
  same(
    s.sources.map((f) => f.file),
    [file],
  );
  check(s.bundle.endsWith('-head-detail'));
  same(s.provenance, {
    method: 'licensed-source-mesh',
    license: 'CC-BY-4.0',
    sourceVersion: '4.0',
    recovered: true,
  });
  same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  check(s.coverageNote.includes('Unvalidated'));
  same(a.clinicalValidation, false);
  same(a.sourceName, name);
  same(a.category, s.category);
  same(a.system, s.system);
  same(a.sources.length, 1);
  const f = a.sources[0],
    asset = inventory.assets.find((r) => r.tree === 'isa' && r.file === file);
  same(f.file, file);
  same(f.sha256, s.sources[0].sha256);
  same(asset.sha256, f.sha256);
  same(asset.geometrySha256, f.geometrySha256);
  same(asset.representedBy, [s.id]);
  check(!newHashes.has(f.geometrySha256));
  newHashes.add(f.geometrySha256);
  check(
    !inventory.assets.some(
      (r) =>
        r.geometrySha256 === f.geometrySha256 &&
        r.representedBy.some((id) => id !== s.id),
    ),
    'No existing exact geometry aliases',
  );
  check(
    !inventory.records.some(
      (r) => r.files.includes(file) && inventoryHolds[r.id],
    ),
  );
  check([...f.bounds.min, ...f.bounds.max].every(Number.isFinite));
  for (let k = 0; k < 3; k++) {
    check(f.bounds.min[k] >= a.grossEnvelope.min[k]);
    check(f.bounds.max[k] <= a.grossEnvelope.max[k]);
    check(f.bounds.min[k] < f.bounds.max[k]);
  }
  const cx = (f.bounds.min[0] + f.bounds.max[0]) / 2;
  same(s.laterality, /\bright\b/.test(name) ? 'right' : 'left');
  check(s.laterality === 'right' ? cx < 0 : cx > 0);
  same(f.sceneBounds, {
    min: [
      f.bounds.min[0] * 0.01,
      (f.bounds.min[2] - 800) * 0.01,
      -(f.bounds.max[1] + 50) * 0.01,
    ],
    max: [
      f.bounds.max[0] * 0.01,
      (f.bounds.max[2] - 800) * 0.01,
      -(f.bounds.min[1] + 50) * 0.01,
    ],
  });
  for (const end of ['min', 'max'])
    for (let k = 0; k < 3; k++)
      check(
        Math.abs(f.sceneBounds[end][k] - s.bounds[end][k]) < 0.000002,
        'Common unchanged transform',
      );
}
same(evidence.dentalOrderChecks.length, 4);
for (const row of evidence.dentalOrderChecks) {
  same(row.centresMm.length, 7);
  check(Number.isFinite(row.incisorCenterDeltaYmm));
  for (const c of row.centresMm) {
    const s = additions.find((s) => s.fmaId === c.fmaId);
    check(s.sourceName.startsWith(row.side + ' ' + row.jaw + ' '));
    const b = evidence.results.find((r) => r.fmaId === c.fmaId).sources[0]
      .bounds;
    same(
      c.centre,
      b.min.map((v, k) => (v + b.max[k]) / 2),
    );
  }
}
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/head-detail'; export * from './app/dissection-data'; export * from './app/body-content'; export * from './lib/anatomy-practice';",
    resolveDir: fileURLToPath(new URL('../', import.meta.url)),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
same(
  api.headDetailGroups.flatMap((g) => g.fmaIds).sort(),
  additions.map((s) => s.fmaId).sort(),
);
same(api.dentalIds.length, 28);
same(api.upperDentalIds.length, 14);
same(api.lowerDentalIds.length, 14);
for (const [jaw, ids] of [
  ['upper', api.upperDentalIds],
  ['lower', api.lowerDentalIds],
])
  for (const id of ids)
    check(
      additions
        .find((s) => s.fmaId === id)
        .sourceName.includes(' ' + jaw + ' '),
    );
for (const s of additions) {
  const g = api.headDetailGroupFor(s.fmaId);
  check(g);
  for (const tab of ['anatomy', 'function']) {
    const lesson = api.bodyContent(s, tab);
    check(lesson.title.includes('draft'));
    same(lesson.body, g[tab]);
    check(lesson.bullets.includes(g.caution));
    check(lesson.note.includes('Unvalidated'));
    same(lesson.citations, g.references);
  }
  for (const tab of ['ct', 'mri', 'ultrasound'])
    check(api.bodyContent(s, tab).body.includes('No imaging study'));
}
same(api.headDetailStudySets.length, 5);
const profile = api.dissectionProfiles['head-neck'],
  allLoaded = catalog.bundles.map((b) => b.id);
let serial = 0;
const counts = {
  'dental-arches': 31,
  'upper-dental-arch': 14,
  'lower-dental-arch': 14,
  'orbital-tendinous-rings': 12,
  'superior-oblique-pulleys': 6,
};
for (const study of api.headDetailStudySets) {
  const focus = profile.focuses.find((f) => f.id === study.id),
    stage = profile.stages.find((s) => s.id === study.id);
  check(focus && stage);
  same(focus.includeSkeleton, false);
  same(focus.context, study.context);
  same(focus.rule.fmaIds, study.targetFmaIds);
  same(stage.view, study.view);
  for (const side of ['both', 'right', 'left']) {
    const scope = catalog.structures.filter(
      (s) =>
        s.regions.includes('head-neck') &&
        (side === 'both' ||
          s.laterality === side ||
          ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
    );
    const expected = scope.filter(
      (s) =>
        study.targetFmaIds.includes(s.fmaId) ||
        study.context.some((r) => api.matchesRule(s, r)),
    );
    const visible = api.stageStructures(scope, profile, 'free', study.id);
    same(visible, expected);
    same(api.stageStructures(scope, profile, study.id), expected);
    if (side === 'both') same(visible.length, counts[study.id]);
    check(
      visible.every((s) => !/brain|vertebra|frontal bone/.test(s.sourceName)),
    );
    for (const landmark of study.landmarks)
      check(visible.some((s) => new RegExp(landmark, 'i').test(s.sourceName)));
    const targets = visible.filter((s) => study.targetFmaIds.includes(s.fmaId));
    same(targets.length, study.targetFmaIds.length / (side === 'both' ? 1 : 2));
    for (const mode of ['find', 'name']) {
      const session = api.createPracticeSession(
        visible,
        allLoaded,
        {
          id: ++serial,
          mode,
          count: 20,
          sampling: 'focus',
          focusIds: targets.map((s) => s.id),
        },
        () => 0.37,
      );
      // Focus-only policy excludes context as both targets and distractors.
      // A one-sided ring/trochlea focus has one candidate: naming must stay disabled.
      if (mode === 'name' && targets.length === 1) {
        same(session, null);
        continue;
      }
      check(session);
      same(session.questions.length, Math.min(20, targets.length));
      for (const q of session.questions)
        check(targets.some((s) => s.id === q.target));
    }
  }
}
check(!catalog.structures.some((s) => inventoryHolds[s.fmaId]));
console.log({
  passed: true,
  checks,
  additions: 32,
  teeth: 28,
  orbitalConnective: 4,
  studyWindows: 5,
  priorRecordsPreserved: 890,
  priorBundlesPreserved: 70,
  documentedJunctionChanges: { records: 2, bundles: 1 },
  clinicalValidation: false,
  browserInteractionTesting: false,
});
