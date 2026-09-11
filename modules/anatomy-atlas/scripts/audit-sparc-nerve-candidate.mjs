// Research-only structural audit, not a Zinc reader or a clinical admission test.
// Original files stay outside the application. No runtime imports or generated meshes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const source =
  process.argv.find((arg) => arg.startsWith('--source='))?.slice(9) ??
  'D:/VisibleMedicine-Atlas-Recovery/source-candidates/sparc-307-v8';
const pins = {
  'nervesWithVagus_annotations.json': [
    132758,
    '577cde996b4ec050192870340262b441c13b68cd5fed82fc9531c7282783c7b5',
  ],
  'spinal_nerves_annotations.json': [
    7807,
    'e9564d1f894c69e774c63883906d2d9ee95ccf734ecc20de4def54adb03ffd73',
  ],
  'human_body_provenance.json': [
    18531,
    '1bf1267ac7812a018c5b7bd04cd0de1f0a9a30bd12e54963b30cdc4b6684a2d0',
  ],
  'nervesWithVagus.exf': [
    797853,
    '248b2da5638bbd684894d6ba8a175b1ee6454fc3dfc7b921bc5af2721e5b5b19',
  ],
  'spinal_nerves.exf': [
    13611914,
    '5bcb4f5a6558e9963137b530a2e54a906e41ec7db4883510873b63bfcbf8730d',
  ],
};
const originals = new Map();
for (const [name, [size, hash]] of Object.entries(pins)) {
  const bytes = await readFile(resolve(source, name));
  assert.equal(bytes.length, size, `${name}: bytes`);
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    hash,
    `${name}: source hash`,
  );
  originals.set(name, bytes.toString('utf8').replaceAll('\r\n', '\n'));
}
const annotations = (name) =>
  JSON.parse(originals.get(name)).metadata.annotations;
const nerveAnnotations = annotations('nervesWithVagus_annotations.json');
const spinalAnnotations = annotations('spinal_nerves_annotations.json');
const text = originals.get('nervesWithVagus.exf');
const definition = text.slice(0, text.indexOf('Group name:'));
assert.equal([...definition.matchAll(/^Region: /gm)].length, 1);
assert.match(definition, /^!#mesh mesh1d, dimension=1, nodeset=nodes$/m);
assert.equal([...definition.matchAll(/^Define element template:/gm)].length, 1);
assert.equal(
  [...definition.matchAll(/l\.Lagrange, no modify, standard node based\./g)]
    .length,
  3,
);
const rawNodes = definition.slice(
  0,
  definition.indexOf('Define node template: node2'),
);
const nodes = new Map();
for (const match of rawNodes.matchAll(
  /^Node: (\d+)\n([^\n]+)\n([^\n]+)\n([^\n]+)/gm,
)) {
  const id = Number(match[1]);
  const point = match.slice(2).map(Number);
  assert.ok(point.every(Number.isFinite));
  assert.ok(!nodes.has(id));
  nodes.set(id, point);
}
const elements = new Map();
const adjacency = new Map([...nodes.keys()].map((id) => [id, new Set()]));
const zeroLengthElements = [];
for (const match of definition.matchAll(
  /^Element: (\d+)\n Nodes:\n (\d+) (\d+)$/gm,
)) {
  const [id, a, b] = match.slice(1).map(Number);
  assert.ok(!elements.has(id) && nodes.has(a) && nodes.has(b));
  elements.set(id, [a, b]);
  adjacency.get(a).add(b);
  adjacency.get(b).add(a);
  if (Math.hypot(...nodes.get(a).map((v, i) => v - nodes.get(b)[i])) === 0)
    zeroLengthElements.push(id);
}
assert.equal(elements.size, [...definition.matchAll(/^Element: /gm)].length);
const ranges = (value) => {
  const clean = value.replace(/\s/g, '');
  if (!clean) return [];
  assert.match(clean, /^\d+(?:\.\.\d+)?(?:,\d+(?:\.\.\d+)?)*$/);
  const ids = [];
  for (const entry of clean.split(',')) {
    const [first, last = first] = entry.split('..').map(Number);
    assert.ok(last >= first && last - first < 100000);
    for (let id = first; id <= last; id++) ids.push(id);
  }
  assert.equal(ids.length, new Set(ids).size);
  return ids;
};
const groups = text
  .split(/^Group name: /m)
  .slice(1)
  .map((block) => {
    const name = block.slice(0, block.indexOf('\n'));
    const ids = ranges(
      block.match(/\nElement group:\n([\d., \n]+)/)?.[1] ?? '',
    );
    assert.ok(
      ids.every((id) => elements.has(id)),
      `${name}: missing element`,
    );
    return { name, elements: ids };
  });
assert.equal(new Set(groups.map((g) => g.name)).size, groups.length);
assert.equal(
  new Set(nerveAnnotations.map((a) => a.name)).size,
  nerveAnnotations.length,
);
const groupNames = new Set(groups.map((g) => g.name));
const annotationNames = new Set(nerveAnnotations.map((a) => a.name));
const idGroups = new Map();
for (const annotation of nerveAnnotations) {
  const list = idGroups.get(annotation.id) ?? [];
  list.push(annotation.name);
  idGroups.set(annotation.id, list);
}
const seen = new Set();
const connectedComponentSizes = [];
for (const start of nodes.keys()) {
  if (seen.has(start)) continue;
  const pending = [start];
  seen.add(start);
  let size = 0;
  while (pending.length) {
    const id = pending.pop();
    size++;
    for (const neighbour of adjacency.get(id))
      if (!seen.has(neighbour)) {
        seen.add(neighbour);
        pending.push(neighbour);
      }
  }
  connectedComponentSizes.push(size);
}
const membership = new Map([...elements.keys()].map((id) => [id, []]));
for (const group of groups)
  for (const id of group.elements) membership.get(id).push(group.name);
const spinalText = originals.get('spinal_nerves.exf');
const spinalGroupNames = [...spinalText.matchAll(/^Group name: (.+)$/gm)].map(
  (match) => match[1],
);
const result = {
  dataset: 307,
  version: 8,
  doi: '10.26275/bbvg-gj86',
  admitted: false,
  frame:
    'Independent generic SPARC scaffold; no BodyParts3D or patient registration established',
  files: Object.entries(pins).map(([name, [bytes, sha256]]) => ({
    name,
    bytes,
    sha256,
  })),
  nervePaths: {
    representation:
      'Source linear 1D elements; not nerve surfaces or measured nerve calibres',
    coordinateNodes: nodes.size,
    separateMarkerNodes:
      [...definition.matchAll(/^Node: /gm)].length - nodes.size,
    elements: elements.size,
    coordinateBounds: [0, 1, 2].map((axis) => [
      Math.min(...[...nodes.values()].map((p) => p[axis])),
      Math.max(...[...nodes.values()].map((p) => p[axis])),
    ]),
    annotations: nerveAnnotations.length,
    uniqueOntologyIds: idGroups.size,
    exfGroups: groups.length,
    annotationsWithoutGroup: nerveAnnotations.filter(
      (a) => !groupNames.has(a.name),
    ),
    groupsWithoutAnnotation: groups
      .filter((g) => !annotationNames.has(g.name))
      .map((g) => g.name),
    emptyPathGroups: groups
      .filter((g) => !g.elements.length)
      .map((g) => g.name),
    repeatedOntologyIds: [...idGroups]
      .filter(([, names]) => names.length > 1)
      .map(([id, names]) => ({ id, names })),
    unassignedElements: [...membership]
      .filter(([, names]) => !names.length)
      .map(([id]) => id),
    multiGroupElements: [...membership].filter(([, names]) => names.length > 1)
      .length,
    zeroLengthElements: zeroLengthElements.map((id) => ({
      id,
      nodes: elements.get(id),
      groups: membership.get(id),
    })),
    connectedComponents: connectedComponentSizes.length,
    connectedComponentSizes: connectedComponentSizes.sort((a, b) => b - a),
    caveat:
      'Group counts and ontology IDs are not counts of unique validated human nerves. Graph components use original node identity, not a spatial weld; disconnected graph components alone do not establish missing anatomical continuity. Repeated IDs need individual adjudication.',
  },
  spinalScaffold: {
    representation:
      'Generated Hermite scaffold; 3D Spinal Nerve 1 / Human whole spine 1',
    annotations: spinalAnnotations.length,
    annotationsWithoutId: spinalAnnotations
      .filter((a) => !a.id)
      .map((a) => a.name),
    groups: spinalGroupNames.length,
    annotationsWithoutGroup: spinalAnnotations.filter(
      (a) => !spinalGroupNames.includes(a.name),
    ),
    groupsWithoutAnnotation: spinalGroupNames.filter(
      (name) => !spinalAnnotations.some((a) => a.name === name),
    ),
    caveat:
      'No tessellation, nerve-surface validity, spinal-cord surface or registration inferred from parameter names.',
  },
};
const report = resolve(root, 'docs/sparc-nerve-candidate-audit.json');
const json = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--write')) await writeFile(report, json);
else
  assert.equal(
    await readFile(report, 'utf8'),
    json,
    'Candidate report is stale',
  );
console.log(JSON.stringify(result));
