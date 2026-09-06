import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { neuroDefinitions } from './neuro-selections.mjs';
import { applyJunctionTransition } from './junction-transition.mjs';
let checks = 0;
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const read = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
const catalog = await read('public/models/bodyparts3d/full-body/catalog.json');
const baseline = await read('content/neuro-baseline.json');
const evidence = await read('content/neuro-source-audit.json');
const inventory = await read('content/source-inventory.json');
same(baseline.sourceCommit, 'b49c9172fbc443bcd2ee1faf58c171aa76424e20');
same(evidence.sourceCommit, baseline.sourceCommit);
same(baseline.structures.length, 859);
same(baseline.bundles.length, 66);
same(catalog.structures.length, 1018);
same(catalog.bundles.length, 85);
same(catalog.coordinateSystem, baseline.coordinateSystem);
same(catalog.excluded, baseline.excluded);
await applyJunctionTransition(baseline, catalog);
for (const old of baseline.structures) {
  const current = catalog.structures.find((s) => s.id === old.id);
  check(current, 'Prior identity preserved');
  same(
    hash(JSON.stringify(current)),
    old.sha256,
    'Every earlier structure field preserved',
  );
}
for (const old of baseline.bundles) {
  same(
    catalog.bundles.find((b) => b.id === old.id),
    old,
    'Previous bundle manifest preserved',
  );
  same(
    hash(
      await fs.readFile(
        'public/models/bodyparts3d/full-body/' + old.id + '.glb',
      ),
    ),
    old.sha256,
    'Previous GLB byte-for-byte unchanged',
  );
}
same(evidence.results.length, 22);
same(evidence.results.flatMap((r) => r.sources).length, 24);
const oldIds = new Set(baseline.structures.map((s) => s.id));
const additions = catalog.structures.filter(
  (s) => !oldIds.has(s.id) && s.bundle.endsWith('-deep-brain'),
);
same(additions.length, 22);
const sourceKeys = new Set();
for (const [fma, name, files] of neuroDefinitions) {
  const s = additions.find((s) => s.fmaId === fma);
  check(s);
  same(s.sourceName, name);
  same(
    s.sources.map((f) => f.file),
    files,
  );
  same(s.sourceTree, 'isa');
  same(s.bundle, 'head-neck-nerves-deep-brain');
  same(s.region, 'head-neck');
  same(s.system, 'nerves');
  same(s.provenance, {
    method: 'licensed-source-mesh',
    license: 'CC-BY-4.0',
    sourceVersion: '4.0',
    recovered: true,
  });
  same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  const audit = evidence.results.find((r) => r.fmaId === fma);
  same(audit.sourceName, name);
  same(audit.clinicalValidation, false);
  same(
    audit.sources.map((f) => f.file),
    files,
  );
  for (const f of audit.sources) {
    const a = inventory.assets.find(
      (a) => a.tree === 'isa' && a.file === f.file,
    );
    same(f.sha256, a.sha256);
    same(f.geometrySha256, a.geometrySha256);
    same(a.representedBy, [s.id], 'No duplicated source surface');
    same(s.sources.find((x) => x.file === f.file).sha256, f.sha256);
    check(!sourceKeys.has(f.geometrySha256));
    sourceKeys.add(f.geometrySha256);
    check([...f.bounds.min, ...f.bounds.max].every(Number.isFinite));
    if (s.laterality === 'left')
      check((f.bounds.min[0] + f.bounds.max[0]) / 2 > 0);
    if (s.laterality === 'right')
      check((f.bounds.min[0] + f.bounds.max[0]) / 2 < 0);
    const expected = {
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
    };
    same(f.sceneBounds, expected);
  }
  for (const end of ['min', 'max'])
    for (let k = 0; k < 3; k++) {
      const extremum = Math[end](
        ...audit.sources.map((f) => f.sceneBounds[end][k]),
      );
      check(
        Math.abs(extremum - s.bounds[end][k]) < 0.000002,
        'Uniform source frame retained after float32 export',
      );
    }
}
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/neuroanatomy'; export * from './lib/scene-labels'; export * from './app/dissection-data'; export * from './app/body-content';",
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
const compareIds = (a, b) => a.localeCompare(b);
same(
  [...api.deepBrainFmaIds].sort(compareIds),
  additions.map((s) => s.fmaId).sort(compareIds),
);
same(new Set(api.deepBrainFmaIds).size, 22);
same(
  api.neuroGroupFor('FMA50801'),
  undefined,
  'Brain aggregate not silently relabelled',
);
for (const s of additions) {
  const g = api.neuroGroupFor(s.fmaId);
  check(/^#[0-9a-f]{6}$/i.test(g.color));
  const anatomy = api.bodyContent(s, 'anatomy');
  check(anatomy.title.includes('draft'));
  check(anatomy.note.includes('Unvalidated'));
  check(anatomy.bullets.some((text) => text.includes(s.fmaId)));
  same(
    api.bodyContent(s, 'function').body,
    g.function ??
      'A structure-specific function lesson is awaiting specialist authorship and review.',
  );
  for (const tab of ['ct', 'mri', 'ultrasound'])
    check(api.bodyContent(s, tab).body.includes('No imaging study'));
}
const profile = api.dissectionProfiles['head-neck'];
for (const side of ['both', 'left', 'right']) {
  const scope = catalog.structures.filter(
    (s) =>
      s.regions.includes('head-neck') &&
      (side === 'both' ||
        s.laterality === side ||
        ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
  );
  for (const study of api.neuroStudySets) {
    const focus = profile.focuses.find((f) => f.id === study.id);
    same(focus.includeSkeleton, false);
    const list = api.stageStructures(scope, profile, 'free', study.id);
    const ids = api.neuroStudyIds(study.groups);
    same(
      list.map((s) => s.id),
      scope.filter((s) => ids.includes(s.fmaId)).map((s) => s.id),
    );
    check(list.length > 0);
    check(!list.some((s) => s.system === 'skeleton' || s.fmaId === 'FMA50801'));
    for (const pattern of focus.landmarks)
      check(
        list.some((s) => new RegExp(pattern, 'i').test(s.sourceName)),
        'Side-safe focus landmark',
      );
    const impostor = {
      ...list[0],
      fmaId: 'FMA999999',
      sourceName: list[0].sourceName,
    };
    same(
      api.matchesRule(impostor, focus.rule),
      false,
      'Name similarity never admits a different identity',
    );
    let state = api.dissectionReducer(api.initialDissection, {
      type: 'focus',
      id: study.id,
    });
    state = api.dissectionReducer(state, { type: 'remove', id: list[0].id });
    check(
      !api
        .resolveDissection(scope, profile, state)
        .visible.some((s) => s.id === list[0].id),
    );
    state = api.dissectionReducer(state, { type: 'undo' });
    same(
      api.resolveDissection(scope, profile, state).visible.map((s) => s.id),
      list.map((s) => s.id),
    );
  }
  const oldFocus = api.stageStructures(scope, profile, 'free', 'hyoid');
  check(
    scope
      .filter((s) => s.system === 'skeleton')
      .every((s) => oldFocus.includes(s)),
    'Existing skeletal context remains default',
  );
}
const known = additions.map((s) => s.id);
const labelFixture = { min: [-2, -3, -4], max: [2, 3, 4] };
for (const [view, horizontalAxis, sign] of [
  ['anterior', 0, 1],
  ['posterior', 0, -1],
  ['right', 2, 1],
  ['left', 2, -1],
  ['superior', 0, 1],
  ['inferior', 0, 1],
]) {
  const a = api.sceneLabelEndpoint(labelFixture, view, 0, 2);
  const b = api.sceneLabelEndpoint(labelFixture, view, 1, 2);
  check(
    a[horizontalAxis] * sign < 0 && b[horizontalAxis] * sign > 0,
    'Label columns follow the preset screen-right direction',
  );
}
for (const count of [0, -1, 1.5, 9, Infinity, NaN]) {
  checks++;
  assert.throws(() =>
    api.sceneLabelEndpoint(additions[0].bounds, 'anterior', 0, count),
  );
}
same(
  api.sceneLabelIds(known[0], [known[0], known[1], known[2]], known, false),
  known.slice(0, 3),
);
same(api.sceneLabelIds(known[0], known, known, true), [known[0]]);
same(api.sceneLabelIds('absent', known, known, false), known.slice(0, 8));
same(api.sceneLabelIds(known[0], known, [], false), []);
for (const s of catalog.structures)
  for (const view of [
    'anterior',
    'posterior',
    'left',
    'right',
    'superior',
    'inferior',
  ]) {
    for (const count of [1, 2, 5, 8]) {
      const endpoints = [];
      for (let index = 0; index < count; index++) {
        const point = api.sceneLabelEndpoint(s.bounds, view, index, count);
        check(point.every(Number.isFinite));
        const offset = [1.4, -2.7, 3.8];
        const local = api.sceneLabelEndpoint(
          s.bounds,
          view,
          index,
          count,
          offset,
        );
        check(
          local.every((v, k) => Math.abs(v + offset[k] - point[k]) < 1e-12),
          'Explode translation not applied twice to label columns',
        );
        endpoints.push(point);
      }
      same(
        new Set(endpoints.map((p) => p.join(','))).size,
        count,
        'Distinct column positions for every preset',
      );
    }
  }
const result = {
  passed: true,
  checks,
  preservedStructures: 857,
  preservedBundles: 65,
  documentedJunctionChanges: { records: 2, bundles: 1 },
  addedStructures: 22,
  addedSourceComponents: 24,
  studyWindows: 3,
  focusedViews: 5,
  labelViews: 6,
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await fs.writeFile(
  'docs/neuro-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result, null, 2));
