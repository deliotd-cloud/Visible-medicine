import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bodyBundleGeometries} from '../lib/body-bundle-geometry.ts';
import {build} from './workspace-test-build.mjs';

// Actual catalogue and GLBs: no WebGL, network, source edits or clinical approval.
const compiled = await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",
  resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog} = await import('data:text/javascript;base64,'+
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const typedHash = array => hash(Buffer.from(array.buffer,array.byteOffset,array.byteLength));
const geometrySnapshot = scene => {
  const rows = [];
  scene.traverse(node => {
    if (!node.isMesh) return;
    rows.push([node.name,node.matrix.toArray(),node.position.toArray(),node.quaternion.toArray(),node.scale.toArray(),
      Object.entries(node.geometry.attributes).map(([name,attribute]) => [name,typedHash(attribute.array)]),
      node.geometry.index ? typedHash(node.geometry.index.array) : null,{...node.geometry.drawRange}]);
  });
  return rows;
};
const regions = ['whole-body', ...catalog.regions.map(region => region.id)];
const counts = Object.fromEntries(regions.map(region => [region, 0]));
let bundles = 0, meshes = 0;
for (const bundle of catalog.bundles) {
  const bytes = await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(hash(bytes),bundle.sha256,'Source bytes must retain catalogue identity');
  const {scene} = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const expected = catalog.structures.filter(item => item.bundle === bundle.id);
  assert(expected.length > 0,'Every tested bundle must have expected structures');
  const original = geometrySnapshot(scene);
  const actual = bodyBundleGeometries(scene,catalog.structures,bundle.id);
  assert.equal(bodyBundleGeometries(scene,catalog.structures,bundle.id),actual,'Reuse unchanged source index');
  assert.deepEqual(geometrySnapshot(scene),original,'Validation must not transform or mutate anatomy');
  for (const item of expected) {
    const source = scene.getObjectByName(item.nodeName);
    assert(source?.isMesh,item.id);
    assert.equal(actual.get(item.nodeName),source.geometry,'Do not copy or replace source geometry');
    for (const region of regions)
      if (region === 'whole-body' || item.regions.includes(region)) counts[region]++;
    meshes++;
  }
  // A corrupt GLB scene lacking a catalogue node must not become ready even if
  // the omitted structure would currently be hidden. A fresh valid load recovers.
  const missing = scene.clone(true), victim = missing.getObjectByName(expected[0].nodeName);
  victim.removeFromParent();
  assert.throws(() => bodyBundleGeometries(missing,catalog.structures,bundle.id));
  assert.doesNotThrow(() => bodyBundleGeometries(scene.clone(true),catalog.structures,bundle.id));
  scene.traverse(node => {
    if (!node.isMesh) return;
    node.geometry.dispose();
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose();
  });
  bundles++;
}
assert.equal(meshes,catalog.structures.length);
for (const region of regions) assert.equal(counts[region],catalog.structures.filter(item =>
  region === 'whole-body' || item.regions.includes(region)).length);
const result = {bundles,meshes,regions:counts,sourceBytesUnchanged:true,
  missingNodeRejections:bundles,freshSceneRecoveries:bundles,browserAcceptance:false,clinicalApproval:false,
  limitations:'Actual GLTFLoader scenes and shipped catalogue contracts. No GPU, browser retry, device or clinical acceptance; malformed position and duplicate-node cases are in the focused unit suite.'};
await writeFile('docs/body-bundle-geometry-validation.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
