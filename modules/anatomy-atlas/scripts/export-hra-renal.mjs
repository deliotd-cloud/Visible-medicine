import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readGlb } from './glb-lossless-codec.mjs';
import { hraSource, hraDigest, hraAccessor, hraSubset, hraWriteGlb } from './hra-pelvis-source.mjs';

// Derive only from the retained, original audit subset. Never repair a held node.
const dir = 'content/sources/hra-renal', out = 'public/models/hra-renal';
const retained = await readFile(dir + '/renal-source.glb');
assert.equal(hraDigest(retained), 'cd61f47dabab9af7510b35a8a446e64de7fcccc053986bc838b93f5753c055fa');
const auditBytes = await readFile('docs/hra-renal-source-audit.json');
assert.equal(hraDigest(auditBytes), 'afff6ce5b6e0d6ee428d9b181b1ce5bedfc785497816cb46f253c98093ad09bc');
const audit = JSON.parse(auditBytes), retention = JSON.parse(await readFile(dir + '/retention.json'));
for (const [file, pin] of [['metadata.json', hraSource.metadataSha256], ['crosswalk.csv', hraSource.crosswalkSha256]])
  assert.equal(hraDigest(await readFile(dir + '/' + file)), pin);
const heldNames = ['VH_F_outer_cortex_of_kidney_L', 'VH_F_renal_column_R', 'VH_F_left_renal_vein'];
assert.deepEqual(Object.keys(retention.heldNodes).sort(), heldNames.sort());
assert.equal(audit.sourceSha256, hraSource.sha256);
const { json, bin } = readGlb(retained);
assert.equal(json.nodes.length, 85);
const sourceNodes = json.nodes.map((n, i) => ({ n, i })).filter(({ n }) => !heldNames.includes(n.name));
assert.equal(sourceNodes.length, 82);
const display = hraSubset(json, bin, sourceNodes.map(({ i }) => i));
for (const ai of new Set(display.json.meshes.flatMap(m => m.primitives.map(p => p.attributes.POSITION)))) {
  const a = display.json.accessors[ai], v = display.json.bufferViews[a.bufferView];
  assert(a.componentType === 5126 && a.type === 'VEC3');
  const start = (v.byteOffset ?? 0) + (a.byteOffset ?? 0), stride = v.byteStride ?? 12;
  for (let i = 0; i < a.count; i++) for (let k = 0; k < 3; k++) {
    const offset = start + i * stride + 4 * k;
    display.bin.writeFloatLE(Math.fround(display.bin.readFloatLE(offset) * 10), offset);
  }
  for (const key of ['min', 'max']) if (a[key]) a[key] = a[key].map(n => Math.fround(n * 10));
}
const source = { ...hraSource, key: 'hra-united-female-v1.10-kidneys' };
const rules = [
  [/kidney_capsule/, 'capsule', 'Renal capsule', 'capsule', '#ddcfad'],
  [/hilum_of_kidney/, 'hilum', 'Renal hilum', 'hilum', '#d3bca6'],
  [/outer_cortex/, 'cortex', 'Outer renal cortex', 'cortex', '#ba8291'],
  [/renal_column/, 'column', 'Renal columns', 'cortex', '#ba8291'],
  [/renal_pyramid/, 'pyramid', 'Renal pyramid', 'medulla', '#ac626c'],
  [/renal_papilla/, 'papilla', 'Renal papilla', 'papilla', '#ce9b94'],
  [/minor_calyx/, 'minor-calyx', 'Minor calyx', 'collecting', '#d6b477'],
  [/major_calyx/, 'major-calyx', 'Major calyx', 'collecting', '#d6b477'],
  [/renal_pelvis/, 'pelvis', 'Renal pelvis', 'collecting', '#d6b477'],
  [/ureter/, 'ureter', 'Ureter', 'collecting', '#d6b477'],
  [/renal_artery/, 'artery', 'Renal artery', 'artery', '#bf514d'],
  [/renal_vein/, 'vein', 'Renal vein', 'vein', '#597dba'],
];
const structures = display.json.nodes.map((n, i) => {
  const row = audit.rows.find(r => r.nodeName === n.name);
  assert(row && row.nodeIndex === sourceNodes[i].n.extras.originalNodeIndex);
  for (const key of ['duplicateFaces', 'collapsedFaces', 'degenerateFaces', 'nonManifoldEdges', 'nonManifoldVertices', 'inconsistentWindingEdges'])
    assert(!row.topology[key], n.name + ': review required ' + key);
  const p = display.json.meshes[n.mesh].primitives[0];
  const points = hraAccessor(display.json, display.bin, p.attributes.POSITION);
  const normals = hraAccessor(display.json, display.bin, p.attributes.NORMAL);
  const min = [0, 1, 2].map(k => Math.min(...points.map(p => p[k])));
  const max = [0, 1, 2].map(k => Math.max(...points.map(p => p[k])));
  const center = min.map((v, k) => (v + max[k]) / 2);
  const distance = p => p.reduce((s, v, k) => s + (v - center[k]) ** 2, 0);
  const anchor = points.reduce((a, p) => distance(p) < distance(a) ? p : a);
  const side = /_L(?:_|$)|_left_/.test(n.name) ? 'left' : /_R(?:_|$)|_right_/.test(n.name) ? 'right' : null;
  assert(side, 'Unresolved laterality ' + n.name);
  const matches = rules.filter(([re]) => re.test(n.name));
  assert.equal(matches.length, 1, 'Unresolved concept ' + n.name);
  const [, concept, title, tissue, color] = matches[0];
  const sourcePart = n.name.match(/_[LR]_([a-z])$/)?.[1] ?? null;
  const slug = n.name.replace(/^VH_F_/, '').toLowerCase().replaceAll('_', '-');
  return {
    id: 'vm:reference:hra-united-female-v1-10:kidneys:' + slug,
    slug, name: side[0].toUpperCase() + side.slice(1) + ' ' + title.toLowerCase() + (sourcePart ? ' (source part ' + sourcePart.toUpperCase() + ')' : ''),
    sourceName: n.name, nodeName: n.name, originalNodeIndex: row.nodeIndex,
    sourceOntologyId: row.metadata.ontologyid, fmaId: /^FMA:\d+$/.test(row.metadata.ontologyid) ? row.metadata.ontologyid.replace(':', '') : null,
    concept, sourcePart, tissue, laterality: side, bundle: source.key,
    bounds: { min, max }, center, anchor,
    sources: [{ file: '3d-vh-f-united.glb#' + n.name, sha256: hraSource.sha256 }],
    triangles: row.triangles, omittedSourceFaces: [],
    sourceQuality: { components: row.topology.components.length, nonManifoldEdges: 0, zeroNormalVertices: normals.filter(n => n.every(v => v === 0)).length },
    coverageNote: 'Partial reference surfaces; open boundaries and separate source shells retained. Source-part letters are identifiers, not validated drainage correspondences. No complete lumen or scan registration.',
    color,
  };
});
assert.equal(structures.reduce((n, s) => n + s.triangles, 0), 189794);
const glb = hraWriteGlb(display.json, display.bin);
const catalog = {
  version: 1, specimenId: source.key, source, sourceSubsetSha256: hraDigest(retained),
  sourceFrame: 'hra-united-female-v1.10:lps-mm',
  displayTransformColumnMajor: [0.01, 0, 0, 0, 0, 0, -0.01, 0, 0, 0.01, 0, 0, 0, 0, 0, 1],
  coordinateNote: 'Original GLB metres: x left, y superior, z anterior. LPS mm=(1000*x,-1000*z,1000*y). Display=(10*x,10*y,10*z). Separate reference; no patient registration.',
  structures, bundles: [{ id: source.key, url: '/models/hra-renal/kidneys.glb?v=' + hraDigest(glb).slice(0, 12), sha256: hraDigest(glb), bytes: glb.length, structures: structures.length }],
  heldNodes: retention.heldNodes, clinicalApproval: false, patientRegistration: false,
};
const check = process.argv.includes('--check');
if (!check) await mkdir(out, { recursive: true });
for (const [path, bytes] of [['kidneys.glb', glb], ['catalog.json', Buffer.from(JSON.stringify(catalog, null, 2) + '\n')]]) {
  if (check) assert.deepEqual(await readFile(out + '/' + path), bytes, 'Stale renal display: ' + path);
  else await writeFile(out + '/' + path, bytes);
}
console.log(JSON.stringify({ surfaces: structures.length, triangles: 189794, held: 3, bytes: glb.length, sha256: hraDigest(glb), check }));
