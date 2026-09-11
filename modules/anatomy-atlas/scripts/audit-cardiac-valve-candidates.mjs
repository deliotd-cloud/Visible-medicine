import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { cache } from './bodyparts-archive.mjs';

// Offline evidence only. This script cannot export, repair or admit a surface.
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const path = 'docs/cardiac-valve-candidates.json';
const { catalog, records, policy, evidence } = await loadSourceHolds();
const parents = catalog.structures.filter((s) => s.fmaId === 'FMA7088');
assert.equal(parents.length, 1);
const parent = parents[0];
assert.equal(parent.sourceTree, 'partof');
assert.equal(parent.sources.length, 56);
const groups = [
  ['FMA7234', 'tricuspid valve'],
  ['FMA7235', 'mitral valve'],
  ['FMA7236', 'aortic valve'],
  ['FMA7246', 'pulmonary valve'],
  ['FMA7259', 'papillary muscle of right ventricle'],
  ['FMA9352', 'papillary muscle of left ventricle'],
].map(([id, name]) => {
  const matches = records.filter((r) => r.tree === 'partof' && r.id === id);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].name, name);
  return matches[0];
});
const files = [...new Set(groups.flatMap((r) => r.files))].sort();
assert.equal(files.length, 16);
const sources = [];
for (const file of files) {
  const bindings = parent.sources.filter((s) => s.file === file);
  assert.equal(bindings.length, 1, `Ambiguous or absent heart source: ${file}`);
  const bytes = await readFile(`${cache}/partof/${file}.obj`);
  assert.equal(hash(bytes), bindings[0].sha256, `Changed original: ${file}`);
  const shape = sourceObjShape(bytes);
  const singletonDefinitions = records.filter(
    (r) => r.files.length === 1 && r.files[0] === file,
  );
  const holdScreens = singletonDefinitions.map((r) => ({
    tree: r.tree,
    id: r.id,
    screen: policy.inspect(r),
  }));
  let otherTree;
  try {
    const other = await readFile(`${cache}/isa/${file}.obj`);
    otherTree = {
      status: 'compared',
      bytes: other.length,
      sha256: hash(other),
      byteIdentical: other.equals(bytes),
      geometrySha256: geometryFingerprint(other),
      geometryIdentical: geometryFingerprint(other) === geometryFingerprint(bytes),
    };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    otherTree = { status: 'not-cached-not-compared' };
  }
  sources.push({
    file,
    sha256: bindings[0].sha256,
    bytes: bytes.length,
    sourceBounds: { min: shape.min, max: shape.max },
    topology: sourceTopology(shape),
    singletonDefinitions,
    holdScreens,
    otherTree,
    admitted: false,
  });
}
const conflicts = [
  ['FMA7235', 'FMA7236', 'Mitral/aortic compounds overlap.'],
  ['FMA7243', 'FMA9561', 'Posterior mitral leaflet/inferior LV wall alias.'],
  ['FMA7259', 'FMA9533', 'RV papillary/ventricular-wall compounds coincide.'],
  ['FMA7260', 'FMA9553', 'Anterior RV papillary/anterior RV wall alias.'],
  ['FMA7261', 'FMA9555', 'Posterior RV papillary/inferior RV wall alias.'],
  ['FMA7265', 'FMA86064', 'LV papillary head/myocardial-zone alias.'],
  ['FMA9498', 'FMA7236', 'Mitral fibrous-ring/aortic-cusp membership overlap.'],
].map(([a, b, explanation]) => {
  const definition = (id) => {
    const rows = records.filter((r) => r.tree === 'partof' && r.id === id);
    assert.equal(rows.length, 1);
    return rows[0];
  };
  const first = definition(a), second = definition(b);
  const sharedFiles = first.files.filter((f) => second.files.includes(f));
  assert(sharedFiles.length > 0);
  return { first, second, sharedFiles, explanation };
});
const relevantDefinitions = records.filter((r) =>
  /((tricuspid|mitral|aortic|pulmonary) valve|papillary muscle|chordae tendineae)/i.test(r.name),
);
const report = {
  schemaVersion: 1,
  reviewedOn: '2026-09-11',
  purpose: 'Bounded cardiac valve/subvalvar source screen, not clinical validation.',
  admitted: false,
  frame: catalog.coordinateSystem,
  parent,
  evidence,
  licence: {
    id: 'CC-BY-4.0',
    url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
    credit: 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
    checkedOn: '2026-09-11',
  },
  groups,
  sources,
  conflicts,
  relevantDefinitions,
  chordaeDefinitionMatches: records.filter((r) => /chordae tendineae/i.test(r.name)),
  summary: {
    sourceFiles: sources.length,
    sourceBytes: sources.reduce((n, s) => n + s.bytes, 0),
    sourceTriangles: sources.reduce((n, s) => n + s.topology.triangles, 0),
    multipleComponentFiles: sources.filter((s) => s.topology.components.length > 1).map((s) => s.file),
    duplicateFaceFiles: sources.filter((s) => s.topology.duplicateFaces > 0).map((s) => s.file),
    negativeComponentVolumeFiles: sources.filter((s) => s.topology.components.some((c) => c.algebraicVolumeMm3 < 0)).map((s) => s.file),
    conflictingSingletonRoleFiles: sources.filter((s) => s.singletonDefinitions.filter((r) => r.tree === 'partof').length > 1).map((s) => s.file),
  },
  limits: [
    'All measurements are source-coordinate diagnostics, not clinical measurements.',
    'Closed topology does not establish anatomical identity, fidelity, nonintersection, leaflet coaptation or physiological motion.',
    'A same-filename IS-A definition does not resolve PART-OF conflicts; original bytes are compared only when already cached.',
    'No separately labelled chordae tendineae row was found in these two retained English tables; this does not prove absence of chord-like geometry within compounds.',
    'No vertices/faces were repaired, omitted, relabelled, repositioned or admitted. Existing whole-heart aggregate and cavity study remain unchanged.',
    'Source conflicts need component-level anatomical adjudication; microcomponents need a documented, separately reviewed derivative before any repair is used.',
  ],
};
assert.equal(report.chordaeDefinitionMatches.length, 0);
assert(sources.every((s) => s.admitted === false));
if (process.argv.includes('--check')) {
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), report, 'Candidate evidence changed; investigate, do not recapture the baseline.');
} else {
  await writeFile(path, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify({ mode: process.argv.includes('--check') ? 'verified' : 'recorded', ...report.summary, admitted: false }));
