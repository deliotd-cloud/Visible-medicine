import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  originalPlexusStudy,
  plexusConnectivity,
  validateOriginalPlexusStudy,
} from '../lib/original-plexus.ts';
import {
  connectionCurve,
  diagramFit,
  isCollateral,
  plexusDiagram,
  segmentCurve,
  spreadPoint,
  stageNames,
  terminalKeys,
} from '../lib/original-plexus-presentation.ts';

const idPrefix = 'vm:schematic:brachial-plexus:right:';
const rami = ['C5', 'C6', 'C7', 'C8', 'T1'].map(x => `ramus.${x}`);
const trunks = ['upper', 'middle', 'lower'].map(x => `trunk.${x}`);
const divisions = ['upper', 'middle', 'lower'].flatMap(t =>
  ['anterior', 'posterior'].map(d => `division.${t}.${d}`));
const cords = ['lateral', 'medial', 'posterior'].map(x => `cord.${x}`);
const medianRoots = ['lateral', 'medial'].map(x => `median_root.${x}`);
const terminals = ['musculocutaneous', 'ulnar', 'median', 'axillary', 'radial'].map(x => `nerve.${x}`);
const collaterals = [
  'dorsal_scapular', 'long_thoracic', 'suprascapular', 'to_subclavius',
  'lateral_pectoral', 'medial_pectoral', 'medial_cutaneous_arm',
  'medial_cutaneous_forearm', 'upper_subscapular', 'thoracodorsal',
  'lower_subscapular',
].map(x => `nerve.${x}`);
const keys = [...rami, ...trunks, ...divisions, ...cords, ...medianRoots, ...terminals, ...collaterals];
const pairs = [
  ['ramus.C5', 'trunk.upper'], ['ramus.C6', 'trunk.upper'],
  ['ramus.C7', 'trunk.middle'], ['ramus.C8', 'trunk.lower'], ['ramus.T1', 'trunk.lower'],
  ...['upper', 'middle', 'lower'].flatMap(t => [
    [`trunk.${t}`, `division.${t}.anterior`],
    [`trunk.${t}`, `division.${t}.posterior`],
  ]),
  ['division.upper.anterior', 'cord.lateral'],
  ['division.middle.anterior', 'cord.lateral'],
  ['division.lower.anterior', 'cord.medial'],
  ...['upper', 'middle', 'lower'].map(t => [`division.${t}.posterior`, 'cord.posterior']),
  ['cord.lateral', 'nerve.musculocutaneous'],
  ['cord.lateral', 'median_root.lateral'],
  ['cord.medial', 'nerve.ulnar'],
  ['cord.medial', 'median_root.medial'],
  ['median_root.lateral', 'nerve.median'],
  ['median_root.medial', 'nerve.median'],
  ['cord.posterior', 'nerve.axillary'],
  ['cord.posterior', 'nerve.radial'],
  ['ramus.C5', 'nerve.dorsal_scapular'],
  ...['C5', 'C6', 'C7'].map(x => [`ramus.${x}`, 'nerve.long_thoracic']),
  ['trunk.upper', 'nerve.suprascapular'],
  ['trunk.upper', 'nerve.to_subclavius'],
  ['cord.lateral', 'nerve.lateral_pectoral'],
  ...['medial_pectoral', 'medial_cutaneous_arm', 'medial_cutaneous_forearm']
    .map(x => ['cord.medial', `nerve.${x}`]),
  ...['upper_subscapular', 'thoracodorsal', 'lower_subscapular']
    .map(x => ['cord.posterior', `nerve.${x}`]),
];
const edge = (from, to) => `${from}>${to}`;
const clone = () => structuredClone(originalPlexusStudy);
const reject = (label, mutate) => {
  const study = clone();
  mutate(study);
  assert.ok(validateOriginalPlexusStudy(study).length > 0, label);
};

test('canonical original study has exact identities, topology and review boundaries', () => {
  const study = originalPlexusStudy;
  assert.equal(study.schemaVersion, 1);
  assert.equal(study.side, 'right');
  assert.deepEqual(study.frame, {kind: 'diagrammatic', units: 'arbitrary', patientRegistration: false});
  assert.equal(study.geometryKind, 'original-procedural-schematic');
  assert.equal(study.license, 'MIT');
  assert.equal(study.clinicalApproved, false);
  assert.equal(study.learnerCatalogAdmission, false);
  assert.deepEqual(validateOriginalPlexusStudy(study), []);
  assert.equal(study.parts.length, 35);
  assert.equal(study.connections.length, 38);
  assert.deepEqual(new Set(study.parts.map(p => p.key)), new Set(keys));
  assert.deepEqual(new Set(study.parts.map(p => p.id)), new Set(keys.map(k => idPrefix + k)));
  assert.deepEqual(new Set(study.connections.map(c => edge(c.from, c.to))),
    new Set(pairs.map(([a, b]) => edge(a, b))));
  assert.equal(new Set(study.connections.map(c => edge(c.from, c.to))).size, 38);
  assert.deepEqual(new Set(study.parts.filter(p => p.stage === 'median-root').map(p => p.key)), new Set(medianRoots));
  assert.deepEqual(new Set(study.parts.filter(p => p.stage === 'ramus').map(p => p.key)), new Set(rami));
  assert.ok(study.parts.every(p => p.name && p.summary && Array.isArray(p.referenceIds) && p.referenceIds.length));
  assert.ok(study.references.length > 0 && study.references.every(r => /^https:\/\//.test(r.url)));
  assert.ok(study.limitations.length > 0);
});

test('connectivity queries are useful and bounded for absent or cyclic nodes', () => {
  const study = clone();
  const median = plexusConnectivity(study, 'nerve.median');
  assert.ok(median.ancestors.includes('median_root.lateral'));
  assert.ok(median.ancestors.includes('median_root.medial'));
  assert.ok(median.ancestors.includes('ramus.C5'));
  assert.ok(median.ancestors.includes('ramus.T1'));
  assert.deepEqual(median.descendants, []);
  const c5 = plexusConnectivity(study, 'ramus.C5');
  assert.ok(c5.descendants.includes('nerve.dorsal_scapular'));
  assert.ok(c5.descendants.includes('nerve.long_thoracic'));
  assert.ok(c5.descendants.includes('nerve.median'));
  const missing = plexusConnectivity(study, 'not-a-node');
  assert.deepEqual(missing, {ancestors: [], descendants: []});
  study.connections.push({from: 'nerve.median', to: 'ramus.C5'});
  const cyclic = plexusConnectivity(study, 'nerve.median');
  assert.ok(cyclic.ancestors.length <= study.parts.length);
  assert.ok(cyclic.descendants.length <= study.parts.length);
});

test('validator rejects structural and release-boundary mutations', () => {
  reject('duplicate part', s => s.parts.push(structuredClone(s.parts[0])));
  reject('orphaned required part', s => s.parts.pop());
  reject('missing connection', s => s.connections.pop());
  reject('unexpected connection', s => s.connections.push({from: 'ramus.T1', to: 'nerve.axillary'}));
  reject('cyclic connection', s => s.connections.push({from: 'nerve.median', to: 'ramus.C5'}));
  reject('wrong laterality', s => { s.side = 'left'; });
  reject('wrong ID laterality', s => { s.parts[0].id = s.parts[0].id.replace(':right:', ':left:'); });
  reject('clinical admission', s => { s.clinicalApproved = true; });
  reject('learner catalog admission', s => { s.learnerCatalogAdmission = true; });
  reject('patient registration', s => { s.frame.patientRegistration = true; });
  reject('measured coordinates', s => { s.frame.units = 'mm'; });
  reject('asset provenance drift', s => { s.geometryKind = 'licensed-source-mesh'; });
  reject('broken reference', s => { s.parts[0].referenceIds = ['unknown']; });
});

test('candidate remains outside production export and contains no acquired assets', async () => {
  for (const path of [
    'integration/head-neck/companions.mjs',
    'scripts/export-head-neck-module.mjs',
    'lib/model-delivery.ts',
    'lib/independent-study-links.ts',
  ]) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /original-plexus|brachial-plexus|candidates\/plexus/i, path);
  }
  const source = await readFile(new URL('../lib/original-plexus.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /(?:\.glb|\.fbx|\.obj|\.dcm|dicom|pacs|open3dmodel|z-anatomy|bluelink)/i);
  const presentation = await readFile(new URL('../lib/original-plexus-presentation.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(presentation, /(?:\.glb|\.fbx|\.obj|\.dcm|dicom|pacs|open3dmodel|z-anatomy|bluelink|sourceToScene|unitsPerMillimetre)/i);
  assert.ok(originalPlexusStudy.parts.every(p => p.id.startsWith(idPrefix)));
});

const coords = point => point.toArray();
const finiteCurve = (curve, label) => {
  for (const t of [0, .2, .5, .8, 1])
    assert.ok(coords(curve.getPoint(t)).every(Number.isFinite), `${label} at ${t}`);
};
const closePoint = (actual, expected, label) => {
  assert.equal(actual.length, 3, label);
  for (let i = 0; i < 3; i++)
    assert.ok(Math.abs(actual[i] - expected[i]) < 1e-9, `${label} coordinate ${i}: ${actual[i]} vs ${expected[i]}`);
};

test('original presentation covers exactly the authored parts and six stages', () => {
  assert.deepEqual(new Set(Object.keys(plexusDiagram)), new Set(keys));
  assert.deepEqual(new Set(Object.keys(stageNames)),
    new Set(['ramus', 'trunk', 'division', 'cord', 'median-root', 'nerve']));
  for (const part of originalPlexusStudy.parts) {
    const diagram = plexusDiagram[part.key];
    assert.equal(diagram.stage, part.stage, part.key);
    assert.ok(diagram.start.every(Number.isFinite), part.key);
    assert.ok(diagram.end.every(Number.isFinite), part.key);
    assert.ok(Math.hypot(...diagram.end.map((v, i) => v - diagram.start[i])) > .01, part.key);
  }
  assert.deepEqual(terminalKeys, new Set(terminals));
  assert.deepEqual(new Set(originalPlexusStudy.parts.filter(isCollateral).map(p => p.key)), new Set(collaterals));
});

test('diagram curves remain finite and endpoint-bound across spacing and clamped inputs', () => {
  for (const spacing of [0, .5, 1, NaN, -1, 2]) {
    const clamped = Number.isFinite(spacing) ? Math.max(0, Math.min(1, spacing)) : 0;
    for (const part of originalPlexusStudy.parts) {
      const item = plexusDiagram[part.key];
      const curve = segmentCurve(part.key, spacing);
      finiteCurve(curve, `${part.key} spacing ${spacing}`);
      closePoint(coords(curve.getPoint(0)), spreadPoint(item.start, item.stage, clamped), `${part.key} start`);
      closePoint(coords(curve.getPoint(1)), spreadPoint(item.end, item.stage, clamped), `${part.key} end`);
    }
  }
  closePoint(spreadPoint([1, 2, 3], 'ramus', 1), [-1, 2, 9], 'stage separation is arbitrary');
  closePoint(spreadPoint([1, 2, 3], 'nerve', 1), [3, 2, 9], 'distal stage separation');
  assert.throws(() => segmentCurve('unknown'));
});

test('every nonzero named connection joins the transformed endpoints', () => {
  let nonzero = 0, coincident = 0;
  for (const spacing of [0, .5, 1, NaN, -1, 2]) {
    const clamped = Number.isFinite(spacing) ? Math.max(0, Math.min(1, spacing)) : 0;
    for (const {from, to} of originalPlexusStudy.connections) {
      const a = plexusDiagram[from], b = plexusDiagram[to];
      const start = spreadPoint(a.end, a.stage, clamped);
      const end = spreadPoint(b.start, b.stage, clamped);
      const distance = Math.hypot(...end.map((v, i) => v - start[i]));
      const curve = connectionCurve(from, to, spacing);
      if (distance < .001) {
        assert.equal(curve, null, `${from}>${to} coincident junction`);
        coincident++;
      } else {
        assert.ok(curve, `${from}>${to} needs visible joining curve at ${spacing}`);
        finiteCurve(curve, `${from}>${to} spacing ${spacing}`);
        closePoint(coords(curve.getPoint(0)), start, `${from}>${to} start`);
        closePoint(coords(curve.getPoint(1)), end, `${from}>${to} end`);
        nonzero++;
      }
    }
  }
  assert.ok(nonzero > 0 && coincident > 0);
  assert.throws(() => connectionCurve('unknown', 'nerve.median'));
  assert.throws(() => connectionCurve('ramus.C5', 'unknown'));
});

test('overview rig fits core and full schematic endpoints in a perspective frustum', () => {
  const core = keys.filter(key => !collaterals.includes(key));
  assert.equal(core.length, 24);
  for (const visible of [core, keys]) for (const spacing of [0, .5, 1])
    for (const aspect of [.75, 1.5, 2.6]) {
      const fit = diagramFit(visible, spacing, aspect);
      assert.ok(Number.isFinite(fit.distance) && fit.distance > 0);
      assert.equal(fit.target.length, 3);
      assert.ok(fit.target.every(Number.isFinite));
      const endpoints = visible.flatMap(key => {
        const item = plexusDiagram[key];
        return [spreadPoint(item.start, item.stage, spacing), spreadPoint(item.end, item.stage, spacing)];
      });
      const mins = [0, 1, 2].map(axis => Math.min(...endpoints.map(p => p[axis])));
      const maxs = [0, 1, 2].map(axis => Math.max(...endpoints.map(p => p[axis])));
      closePoint(fit.target, mins.map((v, i) => (v + maxs[i]) / 2), 'camera targets bounding centre');
      const tanV = Math.tan(42 * Math.PI / 360);
      for (const point of endpoints) {
        const depth = fit.distance + fit.target[2] - point[2];
        assert.ok(depth > 0, `point behind camera at ${aspect}/${spacing}`);
        const x = Math.abs(point[0] - fit.target[0]) / depth;
        const y = Math.abs(point[1] - fit.target[1]) / depth;
        assert.ok(x <= tanV * aspect + 1e-9, `horizontal fit ${visible.length}/${aspect}/${spacing}`);
        assert.ok(y <= tanV + 1e-9, `vertical fit ${visible.length}/${aspect}/${spacing}`);
      }
    }
  assert.deepEqual(diagramFit([], 0, 1), {target: [0, 0, 0], distance: 14});
  for (const bad of [0, -1, NaN, Infinity])
    assert.deepEqual(diagramFit(keys, .5, bad), diagramFit(keys, .5, 1), `invalid aspect ${bad} clamps`);
});

const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = v => v.map(x => x / Math.hypot(...v));

test('oblique and posterior rigs fit all schematic endpoints and 3D bounds corners', () => {
  const core = keys.filter(key => !collaterals.includes(key));
  const directions = {oblique: [.55, .28, 1], posterior: [0, 0, -1]};
  const tanV = Math.tan(42 * Math.PI / 360);
  for (const [view, direction] of Object.entries(directions)) {
    const back = unit(direction);
    const right = unit(cross([0, 1, 0], back));
    const up = unit(cross(back, right));
    for (const visible of [core, keys]) for (const spacing of [0, .5, 1])
      for (const aspect of [.75, 1.5, 2.6]) {
        const fit = diagramFit(visible, spacing, aspect, 42, direction);
        assert.ok(Number.isFinite(fit.distance) && fit.distance > 0, `${view} distance`);
        assert.ok(fit.target.every(Number.isFinite), `${view} target`);
        const endpoints = visible.flatMap(key => {
          const item = plexusDiagram[key];
          return [spreadPoint(item.start, item.stage, spacing), spreadPoint(item.end, item.stage, spacing)];
        });
        const mins = [0, 1, 2].map(axis => Math.min(...endpoints.map(p => p[axis])));
        const maxs = [0, 1, 2].map(axis => Math.max(...endpoints.map(p => p[axis])));
        const corners = [mins[0], maxs[0]].flatMap(x =>
          [mins[1], maxs[1]].flatMap(y => [mins[2], maxs[2]].map(z => [x, y, z])));
        for (const point of [...endpoints, ...corners]) {
          const relative = point.map((value, i) => value - fit.target[i]);
          const depth = fit.distance - dot(relative, back);
          assert.ok(depth > 0, `${view} ${visible.length}/${spacing}/${aspect}: behind camera`);
          const horizontal = Math.abs(dot(relative, right)) / depth;
          const vertical = Math.abs(dot(relative, up)) / depth;
          assert.ok(horizontal <= tanV * aspect + 1e-9,
            `${view} ${visible.length}/${spacing}/${aspect}: horizontal ${horizontal}`);
          assert.ok(vertical <= tanV + 1e-9,
            `${view} ${visible.length}/${spacing}/${aspect}: vertical ${vertical}`);
        }
      }
  }
});
