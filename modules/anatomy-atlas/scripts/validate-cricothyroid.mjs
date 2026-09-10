import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  cricothyroidCatalog as catalog,
  cricothyroidFor,
  cricothyroidViewCatalog,
  cricothyroidPresets,
  cricothyroidColour,
  cricothyroidNotes,
} from '../lib/cricothyroid.ts';
import {
  nestedStudyTargets,
  resolveNestedTarget,
} from '../lib/nested-anatomy.ts';
import {
  nestedTeachingFor,
  nestedTopicLesson,
} from '../lib/nested-teaching.ts';
import { bodyDisplayCatalog } from '../lib/body-display-catalog.ts';
let checks = 0;
const same = (a, b, why) => {
  checks++;
  assert.deepEqual(a, b, why);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const raw = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
same(
  hash(raw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const root = bodyDisplayCatalog(JSON.parse(raw));
const source = JSON.parse(
  await readFile('public/models/bodyparts3d/cricothyroid/catalog.json'),
);
const parent = root.structures.find((s) => s.fmaId === 'FMA55099');
same(parent, catalog.parent);
same(source.parentRelationship, 'navigation-landmark-not-tissue-parent');
same(source.clinicalApproval, false);
same(catalog.license, 'CC-BY-4.0');
same(catalog.credit, root.credit);
same(catalog.coordinateSystem, root.coordinateSystem);
const layers = cricothyroidFor(parent);
same(layers.length, 4);
same(
  layers.map((s) => s.fmaId),
  ['FMA46611', 'FMA46612', 'FMA46613', 'FMA46614'],
);
same(
  layers.map((s) => s.triangles),
  [3222, 3268, 5566, 5580],
);
const view = cricothyroidViewCatalog(parent, true);
same(view.structures.length, 6);
same(view.contextIds.length, 2);
same(
  catalog.contextRecords.map((s) => s.fmaId),
  ['FMA55099', 'FMA9615'],
);
same(
  view.contextIds.some((id) => view.selectableIds.includes(id)),
  false,
);
same(cricothyroidViewCatalog(parent).structures, layers);
same(new Set(view.structures.map((s) => s.id)).size, 6);
same(new Set(view.structures.map(cricothyroidColour)).size, 4);
for (const context of catalog.contextRecords)
  same(
    context,
    root.structures.find((s) => s.id === context.id),
  );
for (const bundle of view.bundles) {
  const bytes = await readFile(
    'public' + new URL(bundle.url, 'https://atlas.invalid').pathname,
  );
  same(bytes.length, bundle.bytes);
  same(hash(bytes), bundle.sha256);
}
const presets = cricothyroidPresets(layers);
same(presets, {
  all: layers.map((s) => s.id),
  straight: [layers[0].id, layers[1].id],
  oblique: [layers[2].id, layers[3].id],
  right: [layers[0].id, layers[2].id],
  left: [layers[1].id, layers[3].id],
});
same(cricothyroidFor(null), []);
same(
  cricothyroidFor({
    id: 'foreign',
    get sources() {
      throw Error('Unrelated anatomy must be rejected before serialization');
    },
  }),
  [],
);
for (const mutate of [
  (p) => p.sources.pop(),
  (p) => (p.sources[0].sha256 = '0'.repeat(64)),
  (p) => p.bounds.min[0]++,
  (p) => p.anchor[0]++,
  (p) => (p.name += 'changed'),
  (p) => (p.laterality = 'left'),
  (p) => (p.sourceTree = 'partof'),
]) {
  const wrong = structuredClone(parent);
  mutate(wrong);
  same(cricothyroidFor(wrong), []);
  same(cricothyroidViewCatalog(wrong, true).structures, []);
  same(cricothyroidViewCatalog(wrong, true).bundles, []);
}
const targets = nestedStudyTargets(root).filter(
  (t) => t.study === 'cricothyroid',
);
same(targets.length, 4);
for (const t of targets) {
  const part = t.structure;
  same(t.parentId, parent.id);
  same(part.validation, { status: 'unvalidated', anatomicalReview: false });
  same(part.regions, ['head-neck']);
  same(part.system, 'muscles');
  same(Boolean(cricothyroidNotes[part.fmaId]), true);
  same(
    resolveNestedTarget(root, parent.id, t, part.laterality)?.structureId,
    part.id,
  );
  same(
    resolveNestedTarget(
      root,
      parent.id,
      t,
      part.laterality === 'right' ? 'left' : 'right',
    ),
    null,
  );
  const concept = nestedTeachingFor(parent, 'cricothyroid', part);
  same(concept?.id, 'cricothyroid-source-parts');
  for (const topic of [
    'anatomy',
    'function',
    'clinical',
    'pathology',
    'quiz',
  ])
    same(nestedTopicLesson(concept, topic).readiness, 'draft');
  for (const topic of ['ct', 'mri', 'ultrasound']) {
    const lesson = nestedTopicLesson(concept, topic);
    same(lesson.readiness, 'pending');
    same(lesson.citations, undefined);
  }
}
// Runtime admission changes metadata only, not positions, normals, transforms or winding.
const parse = async (path) => {
  const b = await readFile(path);
  const g = await new GLTFLoader().parseAsync(
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    '',
  );
  g.scene.updateMatrixWorld(true);
  const meshes = new Map();
  g.scene.traverse((m) => {
    if (m.isMesh) {
      assert(!meshes.has(m.name));
      meshes.set(m.name, m);
    }
  });
  return meshes;
};
const originals = await parse(
  'content/prototypes/cricothyroid/cricothyroid-prototype.glb',
);
const runtime = await parse(
  'public/models/bodyparts3d/cricothyroid/cricothyroid.glb',
);
same(runtime.size, 4);
for (const [name, mesh] of runtime) {
  const previous = originals.get(name),
    part = layers.find((s) => s.fmaId === name);
  same(mesh.matrixWorld.toArray(), previous.matrixWorld.toArray());
  for (const field of ['position', 'normal'])
    same(
      Array.from(mesh.geometry.attributes[field].array),
      Array.from(previous.geometry.attributes[field].array),
    );
  same(
    Array.from(mesh.geometry.index.array),
    Array.from(previous.geometry.index.array),
  );
  same(mesh.userData.structureId, part.id);
  same(mesh.userData.sourceSha256, part.sources[0].sha256);
  same(mesh.userData.prototypeOnly, undefined);
  same(mesh.userData.anatomicalReview, false);
  same(mesh.userData.derivative, part.derivative);
}
console.log(
  JSON.stringify({
    checks,
    selectableParts: 4,
    nonselectableLandmarks: 2,
    rootUnchanged: true,
    runtimeGeometryMatchesPrototype: true,
    clinicalApproval: false,
    imagingOrPaidAccessAdded: false,
  }),
);
