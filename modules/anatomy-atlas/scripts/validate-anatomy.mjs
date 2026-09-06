import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { structures, quizQuestions } from '../app/anatomy-data.ts';
import { initialPractice, practiceReducer, practiceScore } from '../lib/anatomy-practice.ts';

const bytes = await fs.readFile('public/models/bodyparts3d/shoulder-right.glb');
const manifest = JSON.parse(await fs.readFile('public/models/bodyparts3d/manifest.json', 'utf8'));
assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.sha256);
const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const nodes = new Map();
let triangles = 0;
scene.traverse(object => {
  if (!object.isMesh) return;
  nodes.set(object.name, object);
  const p = object.geometry.getAttribute('position'), n = object.geometry.getAttribute('normal');
  assert(p && n, `${object.name}: missing surface attributes`);
  for (const number of p.array) assert(Number.isFinite(number), 'Non-finite geometry');
  for (const number of n.array) assert(Number.isFinite(number), 'Non-finite normals');
  triangles += (object.geometry.index?.count ?? p.count) / 3;
});
assert.equal(nodes.size, 11);
assert.equal(structures.length, 9);
assert.equal(new Set(structures.map(s => s.id)).size, structures.length);
for (const part of manifest.parts) {
  assert(nodes.has(part.nodeName), `Missing GLB node ${part.nodeName}`);
  const record = structures.find(s => s.id === part.structureId);
  assert(record, `Unbound source ${part.sourceFile}`);
  assert(record.sourceFmaIds.includes(part.fmaId), 'FMA mapping mismatch');
}
for (const structure of structures) {
  assert(manifest.parts.some(p => p.structureId === structure.id), `No surface for ${structure.name}`);
  assert.equal(Object.keys(structure.sections).length, 8);
}
for (const question of quizQuestions) assert(structures.some(s => s.id === question.answer));
const matrix = new THREE.Matrix4().fromArray(manifest.coordinateSystem.sourceToSceneColumnMajor);
assert(matrix.determinant() > 0, 'Laterality reflected');
const original = new THREE.Vector3(-120,-60,1250);
const roundTrip = original.clone().applyMatrix4(matrix).applyMatrix4(matrix.clone().invert());
assert(original.distanceTo(roundTrip) < 1e-9);
const origin = new THREE.Vector3().applyMatrix4(matrix);
assert(new THREE.Vector3(1,0,0).applyMatrix4(matrix).sub(origin).x > 0, 'Left axis inverted');
assert(new THREE.Vector3(0,1,0).applyMatrix4(matrix).sub(origin).z < 0, 'Posterior axis inverted');
assert(new THREE.Vector3(0,0,1).applyMatrix4(matrix).sub(origin).y > 0, 'Superior axis inverted');
// Test model framing at each preset for desktop and phone aspect ratios, excluding cropped arm.
const points = [];
for (const mesh of nodes.values()) {
  const positions = mesh.geometry.getAttribute('position');
  for (let i=0; i<positions.count; i++) {
    const point = new THREE.Vector3().fromBufferAttribute(positions,i);
    if (point.y >= -3.15) points.push(point);
  }
}
const center = new THREE.Vector3(-.65,-.32,0);
for (const aspect of [.65,.78,1,1.3]) {
  for (const view of [[2.5,1.2,-12],[-1.5,1,12],[-14,1.5,-1.3]]) {
    const camera = new THREE.PerspectiveCamera(39,aspect,.1,100);
    camera.position.copy(center).add(new THREE.Vector3(...view).multiplyScalar(Math.max(1,.93/aspect)));
    camera.lookAt(center); camera.updateMatrixWorld();
    for (const point of points) { const ndc = point.clone().project(camera); assert(Math.abs(ndc.x)<1 && Math.abs(ndc.y)<.88, 'Default model outside viewport'); }
  }
}
const page = await fs.readFile('app/shoulder-explorer.tsx','utf8');
assert(!page.includes('<AnatomyAtlas'), 'Flat plates remain primary');
assert(page.includes('showLabels && mode === \'study\''));
assert(page.includes('practiceScore(shoulderPractice)') && page.includes('beginShoulderPractice'), 'Shoulder does not use tested practice state');
const fixedSession = id => ({ id, mode: 'find', status: 'active', index: 0, questions: quizQuestions.map(q => ({ target: q.answer, choices: [] })), renderedIds: structures.map(s => s.id), responses: [] });
let practice = practiceReducer(initialPractice, { type: 'start', session: fixedSession(1) });
const pick = { type: 'answer', sessionId: 1, index: 0, chosen: quizQuestions[0].answer };
practice = practiceReducer(practice, pick);
assert.equal(practiceScore(practice), 1);
assert.equal(practiceReducer(practice, pick), practice, 'Duplicate score');
practice = practiceReducer(practice, { type: 'dismiss' });
practice = practiceReducer(practice, { type: 'start', session: fixedSession(2) });
assert.equal(practiceScore(practice), 0, 'No score reset');
assert.equal(practiceReducer(practice, pick), practice, 'Stale answer from earlier session');
const credits = await fs.readFile('public/models/bodyparts3d/credits.html','utf8');
assert(credits.includes(manifest.credit));
assert(credits.includes('https://creativecommons.org/licenses/by/4.0/'));
console.log(JSON.stringify({ passed: true, sourceMeshes: nodes.size, selectableStructures: structures.length, triangles, framingChecks:12, verified: ['GLB integrity','all ID/FMA bindings','finite geometry/normals','positive-determinant transform','coordinate round-trip','three-view framing','licence credit','exam label guard'] }, null, 2));
