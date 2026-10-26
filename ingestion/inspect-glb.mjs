import fs from 'node:fs';
import crypto from 'node:crypto';

const fail = (message) => { throw new Error(message); };
const assert = (value, message) => { if (!value) fail(message); };
const integer = (n, label, min = 0) => { assert(Number.isSafeInteger(n) && n >= min, `${label}: invalid integer`); return n; };
const finite = (n, label) => { assert(typeof n === 'number' && Number.isFinite(n), `${label}: nonfinite number`); return n; };
const at = (array, i, label) => { integer(i, label); assert(Array.isArray(array) && i < array.length, `${label}: out of range`); return array[i]; };
const componentBytes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const typeCount = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function multiply(a, b) {
  const c = new Array(16).fill(0);
  for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++)
    for (let k = 0; k < 4; k++) c[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
  return c;
}
function localMatrix(n, label) {
  if (n.matrix !== undefined) {
    assert(n.translation === undefined && n.rotation === undefined && n.scale === undefined, `${label}: matrix and TRS both present`);
    assert(Array.isArray(n.matrix) && n.matrix.length === 16, `${label}: invalid matrix`);
    const matrix=n.matrix.map((v, i) => finite(v, `${label}.matrix[${i}]`));
    assert(matrix[3]===0&&matrix[7]===0&&matrix[11]===0&&matrix[15]===1, `${label}: non-affine matrix`);
    return matrix;
  }
  const t = n.translation ?? [0, 0, 0], q = n.rotation ?? [0, 0, 0, 1], s = n.scale ?? [1, 1, 1];
  for (const [v, len, name] of [[t, 3, 'translation'], [q, 4, 'rotation'], [s, 3, 'scale']]) {
    assert(Array.isArray(v) && v.length === len, `${label}: invalid ${name}`);
    v.forEach((x, i) => finite(x, `${label}.${name}[${i}]`));
  }
  const [x, y, z, w] = q;
  assert(Math.abs(x*x+y*y+z*z+w*w-1)<=1e-5, `${label}: non-unit quaternion`);
  const m = [
    (1-2*(y*y+z*z))*s[0], (2*(x*y+z*w))*s[0], (2*(x*z-y*w))*s[0], 0,
    (2*(x*y-z*w))*s[1], (1-2*(x*x+z*z))*s[1], (2*(y*z+x*w))*s[1], 0,
    (2*(x*z+y*w))*s[2], (2*(y*z-x*w))*s[2], (1-2*(x*x+y*y))*s[2], 0,
    ...t, 1,
  ];
  assert(m.every(Number.isFinite), `${label}: nonfinite matrix product`);
  return m;
}
function bounds() { return { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }; }
function include(b, p) { p.forEach((v, i) => { b.min[i] = Math.min(b.min[i], v); b.max[i] = Math.max(b.max[i], v); }); }
function finishBounds(b) { return b.min[0] === Infinity ? null : b; }
function transform(m, p) {
  const o = [0, 1, 2].map(r => m[r]*p[0] + m[4+r]*p[1] + m[8+r]*p[2] + m[12+r]);
  assert(o.every(Number.isFinite), 'nonfinite transformed POSITION');
  return o;
}
function readComponent(bin, pos, type) {
  switch (type) {
    case 5120: return bin.readInt8(pos);
    case 5121: return bin.readUInt8(pos);
    case 5122: return bin.readInt16LE(pos);
    case 5123: return bin.readUInt16LE(pos);
    case 5125: return bin.readUInt32LE(pos);
    case 5126: return bin.readFloatLE(pos);
    default: fail(`unsupported componentType ${type}`);
  }
}
export function inspect(bytes) {
  assert(Buffer.isBuffer(bytes) && bytes.length >= 20, 'short GLB header');
  assert(bytes.toString('ascii', 0, 4) === 'glTF', 'bad GLB magic');
  assert(bytes.readUInt32LE(4) === 2, 'unsupported GLB version');
  assert(bytes.readUInt32LE(8) === bytes.length, 'GLB declared length mismatch');
  let cursor = 12, chunks = [];
  while (cursor < bytes.length) {
    assert(cursor + 8 <= bytes.length, 'truncated chunk header');
    const len = bytes.readUInt32LE(cursor), type = bytes.toString('ascii', cursor + 4, cursor + 8);
    assert(len % 4 === 0 && cursor + 8 + len <= bytes.length, 'invalid chunk length/alignment');
    chunks.push({ type, body: bytes.subarray(cursor + 8, cursor + 8 + len) });
    cursor += 8 + len;
  }
  assert(cursor === bytes.length && chunks.length === 2 && chunks[0].type === 'JSON' && chunks[1].type === 'BIN\0', 'expected exact JSON and BIN chunks');
  const jsonBytes = chunks[0].body;
  assert(!jsonBytes.includes(0), 'NUL in JSON chunk');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(jsonBytes).replace(/ +$/, '');
  let gltf;
  try { gltf = JSON.parse(text); } catch { fail('invalid GLB JSON'); }
  assert(gltf && typeof gltf === 'object' && gltf.asset?.version === '2.0', 'invalid glTF asset/version');
  function rejectResources(value, label='gltf') {
    if (Array.isArray(value)) return value.forEach((x,i)=>rejectResources(x,`${label}[${i}]`));
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      assert(key !== 'extensions', `${label}: extension payload`);
      assert(key !== 'uri', `${label}: external URI`);
      rejectResources(item, `${label}.${key}`);
    }
  }
  rejectResources(gltf);
  for (const field of ['extensionsUsed', 'extensionsRequired', 'animations', 'skins', 'cameras'])
    assert(gltf[field] === undefined || (Array.isArray(gltf[field]) && gltf[field].length === 0), `unsupported ${field}`);
  const buffers = gltf.buffers, views = gltf.bufferViews ?? [], accessors = gltf.accessors ?? [];
  assert(Array.isArray(buffers) && buffers.length === 1 && buffers[0].uri === undefined, 'external or multiple buffers');
  const bin = chunks[1].body;
  const declared = integer(buffers[0].byteLength, 'buffer byteLength');
  assert(bin.length >= declared && bin.length - declared <= 3 && bin.subarray(declared).every(v => v === 0), 'BIN length/padding mismatch');
  const viewInfo = views.map((v, i) => {
    assert(v.buffer === 0, `bufferView ${i}: unsupported buffer`);
    const offset = integer(v.byteOffset ?? 0, `bufferView ${i} offset`), length = integer(v.byteLength, `bufferView ${i} length`);
    assert(offset + length <= declared, `bufferView ${i}: outside buffer`);
    if (v.byteStride !== undefined) { integer(v.byteStride, `bufferView ${i} stride`, 4); assert(v.byteStride <= 252 && v.byteStride % 4 === 0, `bufferView ${i}: invalid stride`); }
    assert(v.extensions === undefined, `bufferView ${i}: extension`);
    return { offset, length, stride: v.byteStride };
  });
  const accessorInfo = accessors.map((a, i) => {
    assert(a.sparse === undefined && a.extensions === undefined, `accessor ${i}: unsupported sparse/extension`);
    const v = at(viewInfo, a.bufferView, `accessor ${i} bufferView`);
    const count = integer(a.count, `accessor ${i} count`), size = componentBytes[a.componentType], n = typeCount[a.type];
    assert(size && n, `accessor ${i}: invalid type`);
    const offset = integer(a.byteOffset ?? 0, `accessor ${i} offset`), element = size*n, stride = v.stride ?? element;
    assert(offset % size === 0 && (v.offset + offset) % size === 0 && stride >= element && stride % size === 0, `accessor ${i}: invalid alignment/stride`);
    assert(offset + (count ? (count-1)*stride + element : 0) <= v.length, `accessor ${i}: outside bufferView`);
    return { count, type: a.type, componentType: a.componentType, start: v.offset + offset, stride, n, size };
  });
  function readAccessor(i, label) {
    const a = at(accessorInfo, i, label), data = new Array(a.count);
    for (let j = 0; j < a.count; j++) {
      data[j] = Array.from({ length: a.n }, (_, k) => readComponent(bin, a.start + j*a.stride + k*a.size, a.componentType));
      assert(data[j].every(Number.isFinite), `${label}: nonfinite value ${j}`);
    }
    return { a, data };
  }
  const images = (gltf.images ?? []).map((im, i) => {
    assert(im.uri === undefined && im.extensions === undefined, `image ${i}: external/extension`);
    const v = at(viewInfo, im.bufferView, `image ${i} bufferView`);
    assert(im.mimeType === 'image/png' || im.mimeType === 'image/jpeg', `image ${i}: invalid MIME`);
    const sig = bin.subarray(v.offset, v.offset + Math.min(8, v.length));
    assert(im.mimeType === 'image/png' ? sig.equals(Buffer.from([137,80,78,71,13,10,26,10])) : sig.subarray(0,3).equals(Buffer.from([255,216,255])), `image ${i}: MIME/signature mismatch`);
    return { name: im.name ?? null, mimeType: im.mimeType, byteLength: v.length, sha256: crypto.createHash('sha256').update(bin.subarray(v.offset, v.offset + v.length)).digest('hex') };
  });
  const textures = gltf.textures ?? [];
  textures.forEach((t, i) => { at(images, t.source, `texture ${i} image`); assert(t.extensions === undefined, `texture ${i}: extension`); });
  const materials = (gltf.materials ?? []).map((m, i) => {
    assert(m.extensions === undefined, `material ${i}: extension`);
    for (const field of [m.pbrMetallicRoughness?.baseColorTexture, m.pbrMetallicRoughness?.metallicRoughnessTexture, m.normalTexture, m.occlusionTexture, m.emissiveTexture])
      if (field) at(textures, field.index, `material ${i} texture`);
    return { name: m.name ?? null, alphaMode: m.alphaMode ?? 'OPAQUE', doubleSided: m.doubleSided ?? false, baseColorTexture: m.pbrMetallicRoughness?.baseColorTexture?.index ?? null };
  });
  const meshes = (gltf.meshes ?? []).map((mesh, mi) => {
    assert(mesh.weights === undefined && mesh.extensions === undefined, `mesh ${mi}: morph/extension`);
    assert(Array.isArray(mesh.primitives) && mesh.primitives.length > 0, `mesh ${mi}: no primitives`);
    let meshB = bounds(), vertexCount = 0, triangleCount = 0, degenerateCount = 0, components = 0;
    const primitives = mesh.primitives.map((p, pi) => {
      const label = `mesh ${mi} primitive ${pi}`;
      assert((p.mode ?? 4) === 4 && p.targets === undefined && p.extensions === undefined, `${label}: unsupported mode/morph/extension`);
      assert(p.attributes && typeof p.attributes === 'object' && !Array.isArray(p.attributes), `${label}: no attributes`);
      const { a: pa, data: positions } = readAccessor(p.attributes.POSITION, `${label} POSITION`);
      assert(pa.type === 'VEC3' && pa.componentType === 5126 && pa.count > 0, `${label}: invalid POSITION`);
      for (const [name, ai] of Object.entries(p.attributes)) {
        const a = at(accessorInfo, ai, `${label} ${name}`);
        assert(a.count === pa.count, `${label}: attribute count mismatch`);
        if (name !== 'POSITION') readAccessor(ai, `${label} ${name}`);
      }
      assert(p.indices !== undefined, `${label}: missing indices`);
      const { a: ia, data: rawIndices } = readAccessor(p.indices, `${label} indices`);
      assert(ia.type === 'SCALAR' && [5121,5123,5125].includes(ia.componentType) && ia.count % 3 === 0, `${label}: invalid triangle indices`);
      const indices = rawIndices.map(v => v[0]);
      assert(indices.every(v => v < pa.count), `${label}: index out of bounds`);
      if (p.material !== undefined) at(materials, p.material, `${label} material`);
      const parent = Array.from({ length: pa.count }, (_, i) => i);
      function find(i) { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; }
      function join(a,b) { a=find(a); b=find(b); if(a!==b) parent[b]=a; }
      let degenerate = 0;
      for (let k = 0; k < indices.length; k += 3) {
        const [a,b,c] = indices.slice(k,k+3); join(a,b); join(a,c);
        const u = positions[b].map((v,j)=>v-positions[a][j]), v = positions[c].map((x,j)=>x-positions[a][j]);
        const cross = [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
        if (a===b || a===c || b===c || cross.every(x=>x===0)) degenerate++;
      }
      const used = new Set(indices), componentCount = new Set([...used].map(find)).size;
      const pb = bounds(); positions.forEach(v => { include(pb,v); include(meshB,v); });
      vertexCount += pa.count; triangleCount += indices.length/3; degenerateCount += degenerate; components += componentCount;
      return { vertexCount: pa.count, triangleCount: indices.length/3, referencedVertices: used.size, exactIndexComponents: componentCount, degenerateTriangles: degenerate, bounds: finishBounds(pb), material: p.material ?? null, positions };
    });
    return { name: mesh.name ?? null, vertexCount, triangleCount, exactIndexComponents: components, degenerateTriangles: degenerateCount, bounds: finishBounds(meshB), primitives };
  });
  const nodes = gltf.nodes ?? [];
  const parents = new Array(nodes.length).fill(0);
  const local = nodes.map((n, i) => {
    assert(n.skin === undefined && n.camera === undefined && n.extensions === undefined && n.weights === undefined, `node ${i}: unsupported skin/camera/extension/morph`);
    if (n.mesh !== undefined) at(meshes, n.mesh, `node ${i} mesh`);
    const children = n.children ?? [];
    assert(Array.isArray(children), `node ${i}: invalid children`);
    const unique = new Set(children); assert(unique.size === children.length, `node ${i}: repeated child`);
    children.forEach(c => { at(nodes,c,`node ${i} child`); parents[c]++; });
    return localMatrix(n, `node ${i}`);
  });
  assert(parents.every(n => n <= 1), 'node has multiple parents');
  const scenes = gltf.scenes ?? [];
  assert(Array.isArray(scenes) && scenes.length > 0, 'no scenes');
  if (gltf.scene !== undefined) at(scenes, gltf.scene, 'default scene');
  const activeScene = gltf.scene ?? 0, scene = scenes[activeScene];
  scenes.forEach((s,si)=>{
    assert(Array.isArray(s.nodes), `scene ${si}: no root array`);
    assert(new Set(s.nodes).size === s.nodes.length, `scene ${si}: repeated root`);
    s.nodes.forEach(i => { at(nodes,i,`scene ${si} root`); assert(parents[i] === 0, `scene ${si}: root has parent`); });
  });
  const colors = new Array(nodes.length).fill(0);
  function cycle(i) { assert(colors[i] !== 1, 'node cycle'); if(colors[i]===2)return; colors[i]=1; (nodes[i].children??[]).forEach(cycle); colors[i]=2; }
  nodes.forEach((_,i)=>cycle(i));
  const sceneBounds = bounds(), visited = new Set(), instances=[];
  function walk(i, parent) {
    assert(!visited.has(i), 'repeated scene node'); visited.add(i);
    const world = multiply(parent, local[i]); assert(world.every(Number.isFinite), `node ${i}: nonfinite world matrix`);
    const n=nodes[i];
    if (n.mesh !== undefined) {
      const b=bounds();
      for(const p of meshes[n.mesh].primitives) for(const v of p.positions) { const w=transform(world,v); include(b,w); include(sceneBounds,w); }
      instances.push({node:i,name:n.name??null,mesh:n.mesh,bounds:finishBounds(b)});
    }
    (n.children??[]).forEach(c=>walk(c,world));
  }
  scene.nodes.forEach(i=>walk(i,identity));
  assert(visited.size === nodes.length, 'unreachable nodes outside active scene');
  const reportMeshes=meshes.map(({primitives,...m})=>({...m,primitives:primitives.map(({positions,...p})=>p)}));
  return { status:'technical-parse-pass', byteLength:bytes.length, sha256:crypto.createHash('sha256').update(bytes).digest('hex'), generator:gltf.asset.generator??null, counts:{nodes:nodes.length,meshes:meshes.length,accessors:accessors.length,bufferViews:views.length,images:images.length,materials:materials.length,sceneMeshInstances:instances.length}, scene:activeScene, sceneBounds:finishBounds(sceneBounds), meshes:reportMeshes, instances, materials, images, limitations:['Exact-index components do not represent anatomical continuity or semantic structures.','Degenerate triangles are counted, not repaired.','This is a technical parse only; laterality, units, anatomy, registration, clinical suitability, and rights are not validated.'] };
}
if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).href) {
  const path=process.argv[2];
  if (!path) fail('usage: node inspect-glb.mjs INPUT.glb [OUTPUT.json]');
  const result=inspect(fs.readFileSync(path));
  const out=JSON.stringify(result,null,2)+'\n';
  if (process.argv[3]) fs.writeFileSync(process.argv[3],out,{flag:'wx'}); else process.stdout.write(out);
}
