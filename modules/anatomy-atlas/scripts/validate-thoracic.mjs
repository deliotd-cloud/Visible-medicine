import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { Box3, Vector3, Matrix4 } from 'three';
import {
  thoracicDefinitions,
  thoracicAdmissions,
  thoracicHeldIds,
  thoracicSelections,
} from './thoracic-selections.mjs';
import { inventoryHolds, geometryFingerprint } from './anatomy-inventory.mjs';
import { cache } from './bodyparts-archive.mjs';
const rawSourceCheck = process.argv.includes('--raw-source');
let checks = 0;
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(a, b, m);
};
const check = (a, m) => {
  checks++;
  assert(a, m);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const read = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
const root = 'public/models/bodyparts3d/full-body/';
const catalog = await read(root + 'catalog.json'),
  baseline = await read('content/thoracic-baseline.json'),
  audit = await read('content/thoracic-source-audit.json'),
  inventory = await read('content/source-inventory.json');
same(baseline.sourceCommit, '84a6adbf3814b2d28bd4a3a053622a0da0ad3a9a');
same(
  baseline.catalogSha256,
  'e253e9ec0c1a1567b3ac614501c6511338d44234a28696501733679f377821c9',
);
same(audit.sourceCommit, baseline.sourceCommit);
same(baseline.structures.length, 954);
same(baseline.bundles.length, 78);
same(catalog.structures.length, 1022);
same(catalog.bundles.length, 86);
same(catalog.coordinateSystem, baseline.coordinateSystem);
same(catalog.excluded, baseline.excluded);
for (const old of baseline.structures)
  same(
    hash(JSON.stringify(catalog.structures.find((s) => s.id === old.id))),
    old.sha256,
    'Every previous field remains exact',
  );
for (const old of baseline.bundles) {
  same(
    catalog.bundles.find((b) => b.id === old.id),
    old,
  );
  same(hash(await fs.readFile(root + old.id + '.glb')), old.sha256);
}
const additions = catalog.structures.filter((s) =>
  s.bundle.endsWith('-thoracic-detail'),
);
same(
  additions.map((s) => s.fmaId).sort(compare),
  [...thoracicAdmissions].sort(compare),
);
same(
  thoracicSelections(
    new Map(
      inventory.records.filter((r) => r.tree === 'isa').map((r) => [r.id, r]),
    ),
  )
    .map((s) => s.fma)
    .sort(compare),
  [...thoracicAdmissions].sort(compare),
);
same(additions.length, 4);
same(additions.filter((s) => s.system === 'vessels').length, 4);
same(additions.filter((s) => s.system === 'organs').length, 0);
same(
  additions.reduce((n, s) => n + s.sources.length, 0),
  4,
);
same(audit.results.length, 4);
same(audit.comparisons.length, 123);
same(audit.license, 'CC-BY-4.0');
check(audit.distanceMethod.includes('segment/point fallback'));
for (const row of audit.comparisons) {
  same(row.exactTriangles, 0);
  for (const d of [row.aToB, row.bToA]) {
    check(d.samples > 0 && d.samples <= 128);
    check(Number.isFinite(d.medianMm) && d.medianMm >= 0);
    check(Number.isFinite(d.maxMm) && d.maxMm >= d.medianMm);
    check(d.withinQuarterMm <= d.withinOneMm && d.withinOneMm <= d.samples);
    same(d.closePointBounds !== null, d.withinQuarterMm > 0);
    if (d.closePointBounds)
      for (const end of ['min', 'max'])
        check(d.closePointBounds[end].every(Number.isFinite));
  }
}
same(
  audit.comparisons.filter((r) => r.flagged),
  [],
);
const variant = audit.results.find((r) => r.fmaId === 'FMA10704');
same(
  variant.exactDefinitions.map((r) => r.id).sort(compare),
  ['FMA10704', 'FMA14177', 'FMA3714', 'FMA66267'].sort(compare),
);
for (const alias of ['FMA14177', 'FMA3714', 'FMA66267'])
  check(!catalog.structures.some((s) => s.fmaId === alias));
for (const id of thoracicHeldIds) {
  check(inventoryHolds[id]);
  check(!catalog.structures.some((s) => s.fmaId === id));
  for (const row of inventory.records.filter((r) => r.id === id))
    same(row.status, 'held-source-review');
}
for (const id of ['FMA46622', 'FMA46633', 'FMA46634'])
  check(!catalog.structures.some((s) => s.fmaId === id));
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
for (const [
  id,
  name,
  files,
  region = 'thorax',
  system = 'vessels',
  category = 'vessel',
] of thoracicDefinitions) {
  const a = audit.results.find((r) => r.fmaId === id);
  same(a.name, name);
  same(a.region, region);
  same(a.system, system);
  same(
    a.files.map((f) => f.file),
    files,
  );
  check(a.grossPositionPass);
  same(a.clinicalValidation, false);
  same(a.admitted, false, 'Audit alone never admits');
  for (const f of a.files) same(f.canonicalDuplicateOwners, []);
  const s = additions.find((s) => s.fmaId === id);
  if (!s) {
    check(thoracicHeldIds.includes(id));
    continue;
  }
  same(a.degenerateTriangles, 0);
  same(s.sourceName, name);
  same(s.region, region);
  same(s.regions, [region]);
  same(s.system, system);
  same(s.category, category);
  same(s.sourceTree, 'isa');
  same(
    s.sources,
    a.files.map(({ file, sha256 }) => ({ file, sha256 })),
  );
  same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  same(s.provenance, {
    method: 'licensed-source-mesh',
    license: 'CC-BY-4.0',
    sourceVersion: '4.0',
    recovered: true,
  });
  check(s.coverageNote.includes('Unvalidated'));
  const bounds = new Box3(
    new Vector3(...a.bounds.min),
    new Vector3(...a.bounds.max),
  ).applyMatrix4(matrix);
  const rawBounds = new Box3();
  for (const f of a.files) {
    if (rawSourceCheck) {
      const bytes = await fs.readFile(`${cache}/isa/${f.file}.obj`);
      same(hash(bytes), f.sha256);
      same(geometryFingerprint(bytes), f.geometrySha256);
      for (const line of bytes.toString().split(/\r?\n/))
        if (line.startsWith('v '))
          rawBounds.expandByPoint(
            new Vector3(
              ...line.trim().split(/\s+/).slice(1).map(Number),
            ).applyMatrix4(matrix),
          );
    }
    const asset = inventory.assets.find(
      (x) => x.tree === 'isa' && x.file === f.file,
    );
    same(asset.sha256, f.sha256);
    same(asset.geometrySha256, f.geometrySha256);
    same(asset.crc32, f.crc32);
    same(asset.representedBy, [s.id]);
    check(
      !inventory.assets.some(
        (x) =>
          x.geometrySha256 === f.geometrySha256 &&
          x.representedBy.some((id) => id !== s.id),
      ),
    );
  }
  if (rawSourceCheck)
    for (const end of ['min', 'max'])
      for (let k = 0; k < 3; k++)
        check(
          Math.abs(
            rawBounds[end].getComponent(k) - bounds[end].getComponent(k),
          ) < 1e-9,
          'Raw vertices agree with pinned source bounds',
        );
  for (const end of ['min', 'max'])
    for (let k = 0; k < 3; k++)
      check(
        Math.abs(bounds[end].getComponent(k) - s.bounds[end][k]) < 0.000002,
        'Original common transform',
      );
}
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/thoracic-anatomy'; export * from './app/dissection-data'; export * from './app/body-content'; export * from './lib/anatomy-practice'; export * from './lib/anatomy-link-registry'; export * from './lib/study-links';",
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
// The later, source-bound CT authoring supersedes the original pending copy.
// Preserve exact current teaching hashes rather than asserting obsolete text.
const imagingPins = await read('content/thoracic-branch-imaging-pins.json');
const imagingTransition = await read('content/thoracic-branch-imaging.transition.json');
same(hash(JSON.stringify(imagingPins)), '0f63534f228382dbf196f4dd2c732f9824bd0727752da8a198fb27ab764234ad');
same(hash(JSON.stringify(imagingTransition)), 'e44a7a602db8b26ba1ae4081280a5647715fe106d6a117d0068ab8e6dbc1abd6');
same(
  api.thoracicGroups.flatMap((g) => g.fmaIds).sort(compare),
  [...thoracicAdmissions].sort(compare),
);
for (const s of additions) {
  const group = api.thoracicGroupFor(s.fmaId);
  check(group);
  for (const tab of ['anatomy', 'function']) {
    const c = api.bodyContent(s, tab);
    check(c.title.includes('draft'));
    same(c.body, group[tab]);
    same(c.citations, group.references);
    check(c.bullets.includes(group.caution));
  }
  for (const tab of ['ct', 'mri', 'ultrasound']) {
    const pin = imagingPins.entries.find(e => e.identity.id === s.id && e.topics.includes(tab));
    if (pin) {
      same(s, pin.identity);
      same(hash(JSON.stringify(api.bodyLesson(s, tab))), imagingTransition.entries.find(e => e.id === s.id).sections[tab]);
    } else check(api.bodyContent(s, tab).body.includes('No imaging study'));
  }
  const e = api.bodyLinkEntries(catalog).find((e) => e.id === s.id);
  check(e);
  same(e.sources, s.sources);
  same(e.reference.kind, 'surface-bounds-centre');
}
same(api.thoracicStudySets.length, 3);
const counts = {
  'bronchial-arterial-window': 7,
  'oesophageal-arterial-window': 4,
  'thoracic-small-arteries-exposed': 6,
};
const loaded = catalog.bundles.map((b) => b.id);
let serial = 0;
for (const study of api.thoracicStudySets)
  for (const region of study.regions) {
    const profile = api.dissectionProfiles[region],
      focus = profile.focuses.find((f) => f.id === study.id),
      stage = profile.stages.find((s) => s.id === study.id);
    check(focus && stage);
    same(focus.includeSkeleton, false);
    same(focus.rule.fmaIds, study.targetFmaIds);
    same(focus.context, study.context);
    for (const side of ['both', 'left', 'right']) {
      const scope = api.bodyStudyScope(catalog, region, side),
        expected = scope.filter(
          (s) =>
            study.targetFmaIds.includes(s.fmaId) ||
            study.context.some((r) => api.matchesRule(s, r)),
        ),
        visible = api.stageStructures(scope, profile, study.id);
      same(visible, expected);
      same(api.stageStructures(scope, profile, 'free', study.id), expected);
      same(
        visible.length,
        counts[study.id] -
          (study.id === 'bronchial-arterial-window' && side !== 'both' ? 1 : 0),
      );
      for (const landmark of study.landmarks)
        check(
          visible.some((s) => new RegExp(landmark, 'i').test(s.sourceName)),
        );
      const state = api.dissectionReducer(api.initialDissection, {
        type: 'stage',
        id: study.id,
      });
      for (const s of visible) {
        const removed = api.dissectionReducer(state, {
          type: 'remove',
          id: s.id,
        });
        same(
          api.resolveDissection(scope, profile, removed).visible,
          visible.filter((v) => v.id !== s.id),
        );
        const undone = api.dissectionReducer(removed, { type: 'undo' });
        same({ ...undone, future: [] }, state);
        same(undone.future.length, 1, 'Undo retains one redo snapshot');
        same(api.dissectionReducer(undone, { type: 'redo' }), removed);
        same(
          api.resolveDissection(
            scope,
            profile,
            api.dissectionReducer(removed, { type: 'restore', id: s.id }),
          ).visible,
          visible,
        );
        const href = api.makeStudyLink(catalog, region, s.id, side, study.id);
        check(href);
        const linked = api.resolveStudyLink(
          catalog,
          region,
          api.parseStudyLink(
            Object.fromEntries(
              new URL(href, 'https://atlas.invalid').searchParams,
            ),
          ),
        );
        same(linked.status, 'ready');
        same(linked.selected.id, s.id);
        same(
          linked.visibleIds,
          visible.map((v) => v.id),
        );
      }
      const targets = visible.filter((s) =>
        study.targetFmaIds.includes(s.fmaId),
      );
      for (const mode of ['find', 'name']) {
        const session = api.createPracticeSession(
          visible,
          loaded,
          {
            id: ++serial,
            mode,
            count: 20,
            sampling: 'focus',
            focusIds: targets.map((s) => s.id),
          },
          () => 0.37,
        );
        if (mode === 'name' && targets.length < 2) {
          same(session, null);
          continue;
        }
        check(session);
        same(session.questions.length, targets.length);
        for (const q of session.questions)
          check(targets.some((s) => s.id === q.target));
      }
    }
  }
// Reconstruct only from records already checked byte-for-byte against the pinned
// baseline, so this regression also runs in the GitHub snapshot without Site history.
const previous = {
  ...catalog,
  bundles: baseline.bundles,
  structures: baseline.structures.map((old) =>
    catalog.structures.find((s) => s.id === old.id),
  ),
};
for (const s of previous.structures)
  for (const region of ['whole-body', ...s.regions]) {
    const href = api.makeStudyLink(previous, region, s.id, 'both');
    check(href);
    const result = api.resolveStudyLink(
      catalog,
      region,
      api.parseStudyLink(
        Object.fromEntries(new URL(href, 'https://atlas.invalid').searchParams),
      ),
    );
    same(result.status, 'ready');
    same(result.selected.id, s.id);
  }
const result = {
  passed: true,
  checks,
  rawSourceCheck,
  newEntries: 4,
  vesselEntries: 4,
  variantEntries: 1,
  sourceComponents: 4,
  newBundles: 1,
  newAssetBytes: catalog.bundles
    .filter((b) => b.id.endsWith('-thoracic-detail'))
    .reduce((n, b) => n + b.bytes, 0),
  preservedRecords: 954,
  preservedBundles: 78,
  sourceHolds: thoracicHeldIds,
  studyWindows: 3,
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await fs.writeFile(
  'docs/thoracic-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
