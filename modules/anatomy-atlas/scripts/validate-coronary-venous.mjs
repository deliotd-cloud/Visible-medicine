import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Matrix4, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape } from './source-surface-audit.mjs';
import { coronaryVenousCatalog, coronaryVenousFor, coronaryVenousPresets } from '../lib/coronary-venous.ts';
import { cardiacCatalog, cardiacFor } from '../lib/cardiac.ts';
import { bodyDisplayCatalog } from '../lib/body-display-catalog.ts';
import { nestedStudyTargets, resolveNestedTarget } from '../lib/nested-anatomy.ts';
import { initialVentricles, reduceVentricles } from '../lib/ventricles.ts';
import { makeStudyLink, parseStudyLink, resolveStudyLink } from '../lib/study-links.ts';
import { nestedTeachingFor, nestedTopicLesson, nestedTeachingReferences } from '../lib/nested-teaching.ts';
import { nestedLearningAnatomyRepresentations, nestedLearningSelection } from '../lib/nested-learning-anatomy.ts';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const root = bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const parent = root.structures.find((s) => s.fmaId === 'FMA7088');
assert(parent);
assert.deepEqual(coronaryVenousCatalog.parent, parent);
assert.deepEqual(cardiacCatalog.parent, parent);
assert.equal(cardiacFor(parent).length, 4, 'Historical chamber catalog changed');
const children = coronaryVenousFor(parent);
assert.deepEqual(children.map((s) => s.fmaId), ['FMA4706', 'FMA4714']);
assert.deepEqual(children.map((s) => s.sources.map((f) => f.file)), [['FJ2655'], ['FJ2724', 'FJ2731']]);
for (const mutate of [
  (p) => { p.sources[0].sha256 = '0'.repeat(64); },
  (p) => { p.sources.pop(); },
  (p) => { p.name += ' changed'; },
  (p) => { p.bounds.min[0] += 0.1; },
  (p) => { p.validation.anatomicalReview = true; },
]) {
  const stale = structuredClone(parent); mutate(stale);
  assert.deepEqual(coronaryVenousFor(stale), [], 'Stale parent must close the study');
}
assert.deepEqual(coronaryVenousFor(null), []);
assert.equal(coronaryVenousCatalog.contextIds.length, 0);
assert.equal(coronaryVenousCatalog.structures.length, 2);
assert(!coronaryVenousCatalog.structures.some((s) => s.id === parent.id));
assert(!coronaryVenousCatalog.bundles.some((b) => b.id === parent.bundle));

const bundle = coronaryVenousCatalog.bundles[0];
const bytes = await readFile('public' + new URL(bundle.url, 'https://atlas.invalid').pathname);
assert.equal(bytes.length, bundle.bytes); assert.equal(hash(bytes), bundle.sha256);
const loaded = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const meshes = [];
loaded.scene.traverse((object) => { if (object.isMesh) meshes.push(object); });
assert.equal(meshes.length, 2);
const matrix = new Matrix4().fromArray(root.coordinateSystem.sourceToSceneColumnMajor);
let triangles = 0;
for (const child of children) {
  const mesh = meshes.find((m) => m.name === child.nodeName);
  assert(mesh && mesh.userData.structureId === child.id);
  const positions = [], indices = [];
  for (const source of child.sources) {
    const raw = await readFile(`../work/bodyparts3d/partof/${source.file}.obj`);
    assert.equal(hash(raw), source.sha256);
    const shape = sourceObjShape(raw), offset = positions.length / 3;
    positions.push(...shape.vertices.flatMap((v) => new Vector3(...v).applyMatrix4(matrix).toArray()));
    indices.push(...shape.faces.flatMap((face) => face.map((i) => i + offset)));
  }
  assert.deepEqual(Array.from(mesh.geometry.attributes.position.array), Array.from(new Float32Array(positions)));
  assert.deepEqual(Array.from(mesh.geometry.index.array), indices);
  mesh.geometry.computeBoundingBox();
  assert.deepEqual(mesh.geometry.boundingBox.min.toArray(), child.bounds.min);
  assert.deepEqual(mesh.geometry.boundingBox.max.toArray(), child.bounds.max);
  triangles += indices.length / 3;
}
assert.equal(triangles, 2086);

const presets = coronaryVenousPresets(children);
assert.deepEqual(presets, { all: children.map((s) => s.id), sinus: [children[0].id], small: [children[1].id] });
let state = initialVentricles(children);
const history = [state];
for (const action of [
  { type: 'visibility', id: children[0].id, visible: false },
  { type: 'select', id: children[1].id },
  { type: 'undo' },
  { type: 'redo' },
  { type: 'preset', value: 'small' },
  { type: 'preset', value: 'all' },
  { type: 'undo' },
  { type: 'redo' },
]) { state = reduceVentricles(children, state, action, presets); history.push(state); }
for (const snapshot of history) {
  const visible = coronaryVenousCatalog.structures.filter((s) => !snapshot.hidden.includes(s.id));
  assert(!visible.some((s) => s.id === parent.id));
  const files = visible.flatMap((s) => s.sources.map((f) => f.file));
  assert.equal(new Set(files).size, files.length, 'One visible owner per source file');
}
assert.deepEqual(state.hidden, []);

const targets = nestedStudyTargets(root).filter((t) => t.study === 'coronary-venous');
assert.equal(targets.length, 2);
const learning = nestedLearningAnatomyRepresentations(root).filter((item) => item.nested.study === 'coronary-venous');
assert.equal(learning.length, 2);
for (const target of targets) {
  assert.equal(target.parentId, parent.id);
  assert.deepEqual(resolveNestedTarget(root, parent.id, target, 'both'), target);
  const href = makeStudyLink(root, 'thorax', parent.id, 'both', null, target);
  assert(href);
  const params = Object.fromEntries(new URL(href, 'https://atlas.invalid').searchParams);
  const request = parseStudyLink(params);
  const resolved = resolveStudyLink(root, 'thorax', request);
  assert.equal(resolved.status, 'ready');
  assert.equal(resolved.nested.structureId, target.structureId);
  const representation = learning.find((item) => item.structureId === target.structureId);
  assert(representation);
  assert.equal(nestedLearningSelection(root, representation)?.structureId, target.structureId);
  const staleRepresentation = structuredClone(representation);
  staleRepresentation.nested.bundleSha256 = '0'.repeat(64);
  assert.equal(nestedLearningSelection(root, staleRepresentation), null);
  for (const key of ['source', 'partSource']) {
    const stale = { ...params, [key]: '0'.repeat(64) };
    assert.notEqual(resolveStudyLink(root, 'thorax', parseStudyLink(stale)).status, 'ready');
  }
  const lesson = nestedTeachingFor(parent, target.study, target.structure);
  assert(lesson);
  for (const tab of ['anatomy', 'function', 'clinical', 'pathology', 'ct', 'mri']) {
    const topic = nestedTopicLesson(lesson, tab);
    assert.equal(topic.readiness, 'draft');
    assert(topic.body.length > 80 && topic.citations?.length, `${target.structureId} ${tab} needs cited teaching`);
  }
  for (const tab of ['xray', 'ultrasound']) assert.equal(nestedTopicLesson(lesson, tab).readiness, 'pending');
  for (const tab of ['clinical', 'pathology', 'ct', 'mri']) {
    const topic = nestedTopicLesson(lesson, tab);
    assert(topic.citations.some((url) => url === 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4195839/' || url === 'https://pubmed.ncbi.nlm.nih.gov/15232770/'));
    assert(!/dose|injection rate|catheter path|safe access|can diagnose|this model shows (?:a )?(?:shunt|disease)/i.test(topic.body), 'Keep drafts non-prescriptive and non-diagnostic');
  }
}
for (const key of ['coronarySinusImaging', 'smallCardiacVariation']) assert(nestedTeachingReferences[key]?.url);
assert.deepEqual(children.map((s) => s.validation.anatomicalReview), [false, false]);
console.log(JSON.stringify({ passed: true, selections: 2, originalSourceFiles: 3, triangles, visibilityStates: history.length, oneVisibleOwner: true, staleLinksRejected: true, priorCavities: 4, draftTopics: ['anatomy', 'function', 'clinical', 'pathology', 'ct', 'mri'], pendingTopics: ['xray', 'ultrasound'], clinicalApproval: false }));
