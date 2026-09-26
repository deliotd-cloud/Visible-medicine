import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Matrix4, Vector3, Mesh, Group, BufferGeometry, Float32BufferAttribute} from 'three';
import {build} from './workspace-test-build.mjs';

// CPU evidence from shipped scene-space GLBs, not anatomical or GPU acceptance.
const compiled = await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyPresentationStructure,bodySideMatches} from './lib/body-presentation-parts';",
  resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog,bodyPresentationStructure,bodySideMatches} = await import('data:text/javascript;base64,'+
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const typedHash = array => hash(Buffer.from(array.buffer,array.byteOffset,array.byteLength));
const snapshot = scene => {
  const rows = [];
  scene.traverse(n => rows.push([n.name,n.matrix.toArray(),n.matrixWorld.toArray(),
    n.position.toArray(),n.quaternion.toArray(),n.scale.toArray(),n.isMesh ? [
      Object.entries(n.geometry.attributes).map(([k,a])=>[k,typedHash(a.array)]),
      n.geometry.index ? typedHash(n.geometry.index.array) : null,{...n.geometry.drawRange}] : null]));
  return rows;
};
// Half a binary32 ULP allows correctly rounded catalogue endpoints. Eight
// binary64 epsilons cover the identity world-matrix multiply/add operations.
// No anatomical, scene-unit, or empirically relaxed absolute tolerance.
const tolerance = value => Math.max(2 ** -150, 2 ** (Math.floor(Math.log2(Math.abs(value) || 2 ** -126)) - 24)) +
  8 * Number.EPSILON * Math.max(1,Math.abs(value));
const identity = new Matrix4().toArray(), point = new Vector3();
function inspect(node, bounds) {
  assert.deepEqual(node.matrixWorld.toArray(),identity,'nonidentity source world transform');
  const position = node.geometry.getAttribute('position');
  assert(position?.array instanceof Float32Array && position.itemSize === 3 && position.count >= 3);
  assert(Array.isArray(bounds.min) && bounds.min.length === 3 &&
    Array.isArray(bounds.max) && bounds.max.length === 3, 'Expected three-axis bounds');
  assert([...bounds.min,...bounds.max].every(Number.isFinite));
  assert(bounds.min.every((v,a)=>v <= bounds.max[a]));
  const min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity];
  for(let i=0;i<position.count;i++) {
    point.fromBufferAttribute(position,i).applyMatrix4(node.matrixWorld);
    const values = [point.x,point.y,point.z];
    assert(values.every(Number.isFinite),`nonfinite vertex ${i}`);
    values.forEach((v,a)=>{min[a]=Math.min(min[a],v);max[a]=Math.max(max[a],v);});
  }
  const excursions = min.map((v,a)=>({axis:a,min:Math.max(0,bounds.min[a]-v),
    max:Math.max(0,max[a]-bounds.max[a]),minTolerance:tolerance(bounds.min[a]),maxTolerance:tolerance(bounds.max[a])}));
  return {vertices:position.count,actualBounds:{min,max},excursions,
    contained:!excursions.some(e=>e.min > e.minTolerance || e.max > e.maxTolerance)};
}
if(process.argv.includes('--self-test')) {
  const bounds = {min:[0,0,0],max:[1,1,1]};
  const mesh = x => new Mesh(new BufferGeometry().setAttribute('position',new Float32BufferAttribute([0,0,0,x,0,0,0,1,0],3)));
  assert(inspect(mesh(1),bounds).contained);
  assert(inspect(mesh(1),{min:[-2,-2,-2],max:[2,2,2]}).contained,'Conservative bounds accepted');
  assert(inspect(mesh(1),{min:[0,0,0],max:[1-2**-26,1,1]}).contained,'Binary32 endpoint rounding accepted');
  assert(!inspect(mesh(1.001),bounds).contained,'Finite excursion rejected');
  assert.throws(()=>inspect(mesh(1),{min:[NaN,0,0],max:[1,1,1]}));
  assert.throws(()=>inspect(mesh(1),{min:[0,0,0],max:[Infinity,1,1]}));
  assert.throws(()=>inspect(mesh(1),{min:[2,0,0],max:[1,1,1]}));
  assert.throws(()=>inspect(mesh(1),{min:[],max:[1,1,1]}),/three-axis/);
  for(const value of [NaN,Infinity,-Infinity]) assert.throws(()=>inspect(mesh(value),bounds),/nonfinite/);
  const translated = mesh(1); translated.position.x=1; translated.updateMatrixWorld(true);
  assert.throws(()=>inspect(translated,bounds),/nonidentity/);
  const parent = new Group(), child = mesh(1); parent.add(child); parent.scale.x=2; parent.updateMatrixWorld(true);
  assert.throws(()=>inspect(child,bounds),/nonidentity/);
  console.log('Rendered bounds self-test passed: conservative/rounding acceptance; excursion, nonfinite and mesh/parent transform rejection.');
  process.exit(0);
}
const rows = [], failures = [], bundleEvidence = [];
let vertices = 0, canonicalEntries = 0, projectedEntries = 0;
for (const bundle of catalog.bundles) {
  const path = 'public'+bundle.url.split('?')[0], bytes = await readFile(path);
  assert.equal(bytes.length,bundle.bytes,bundle.id);
  assert.equal(hash(bytes),bundle.sha256,bundle.id);
  const {scene} = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  scene.updateMatrixWorld(true);
  const before = snapshot(scene);
  for (const canonical of catalog.structures.filter(s=>s.bundle === bundle.id)) {
    const records = [{item:canonical,side:'both'}];
    if (canonical.presentationParts) for (const side of ['left','right']) {
      assert(bodySideMatches(canonical,side),canonical.id);
      records.push({item:bodyPresentationStructure(canonical,side),side});
    }
    for (const {item,side} of records) {
      const nodes = [];
      scene.traverse(n=>{if(n.name === item.nodeName) nodes.push(n);});
      assert.equal(nodes.length,1,item.nodeName);
      const node = nodes[0];
      assert(node.isMesh,item.id);
      // BodyScene reuses raw geometry, so discarded loader transforms must be identity.
      const checked = inspect(node,item.bounds);
      const row = {id:item.id,nodeName:item.nodeName,bundle:bundle.id,side,...checked,catalogBounds:item.bounds};
      rows.push(row);
      if(!checked.contained) failures.push(row);
      vertices += checked.vertices;
      if (side === 'both') canonicalEntries++;
      else projectedEntries++;
    }
  }
  assert.deepEqual(snapshot(scene),before,'Validation changed source geometry or transforms');
  assert.equal(hash(await readFile(path)),bundle.sha256,'Source GLB changed during validation');
  bundleEvidence.push({id:bundle.id,bytes:bytes.length,sha256:bundle.sha256});
  scene.traverse(n=>{if(n.isMesh){n.geometry.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material])m.dispose();}});
}
assert.equal(canonicalEntries,catalog.structures.length);
const result = {passed:failures.length === 0,bundles:bundleEvidence.length,canonicalEntries,projectedEntries,vertices,
  displayCatalogSha256:hash(JSON.stringify(catalog)),
  sourceBytesUnchanged:true,sourceGeometryUnchanged:true,identityWorldTransforms:true,positionStorage:'Float32Array',
  coordinateContract:'GLB positions already in catalogue scene units; identity transforms checked; source mm-to-scene mapping is not reapplied.',
  tolerance:'Half binary32 ULP at each catalogue endpoint plus 8 binary64 epsilons times max(1,abs(endpoint)); containment, not equality.',
  maxExcursion:Math.max(...rows.flatMap(r=>r.excursions.flatMap(e=>[e.min,e.max]))),
  browserAcceptance:false,clinicalApproval:false,limitations:'CPU position-buffer/world-bound evidence only; no GPU, rendered pixel, camera occlusion, device or clinical acceptance.',
  bundleEvidence,failures,entries:rows};
await writeFile('docs/rendered-bounds-validation.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:result.passed,bundles:result.bundles,canonicalEntries,projectedEntries,vertices,maxExcursion:result.maxExcursion,failures}));
assert.equal(failures.length,0,'Actual rendered positions exceed display catalogue bounds; inspect evidence without relaxing tolerance');
