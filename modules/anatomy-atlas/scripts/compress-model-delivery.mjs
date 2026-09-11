// Build-only transport transformation. Canonical public/source files are read-only.
import assert from 'node:assert/strict';
import { readdir, readFile, writeFile, realpath, lstat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { compressGlb, validateGlbDelivery, digest } from './glb-lossless-codec.mjs';
const root = resolve(import.meta.dirname, '..'), source = resolve(root, 'public/models'), destination = resolve(root, 'dist/client/models');
const measure = process.argv.includes('--measure-only'), check = process.argv.includes('--check');
assert.ok(process.argv.slice(2).every(a => ['--measure-only', '--check'].includes(a)) && !(measure && check));
async function walk(dir) {
  const rows = [];
  for (const file of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, file.name);
    assert.ok(!file.isSymbolicLink(), 'Symlinks are not allowed in model-delivery inputs');
    if (file.isDirectory()) rows.push(...await walk(path));
    else if (file.name.endsWith('.glb')) rows.push(path);
  } return rows.sort();
}
const files = await walk(source), records = [];
if (!measure) {
  assert.equal((await realpath(destination)).toLowerCase(), destination.toLowerCase());
  assert.equal(relative(root, destination), ['dist', 'client', 'models'].join(sep));
  assert.deepEqual((await walk(destination)).map(p => relative(destination, p)), files.map(p => relative(source, p)), 'Build must contain exactly the canonical model file set');
}
for (const path of files) {
  const name = relative(source, path), target = resolve(destination, name);
  assert.ok(!name.startsWith('..') && target.startsWith(destination + sep));
  if (!measure) { assert.ok(!(await lstat(target)).isSymbolicLink()); assert.equal((await realpath(target)).toLowerCase(), target.toLowerCase()); }
  const original = await readFile(path), encoded = await compressGlb(original);
  const proof = await validateGlbDelivery(original, encoded);
  if (check) assert.ok(encoded.equals(await readFile(target)), `Stale or damaged delivery file: ${name}`);
  else if (!measure) await writeFile(target, encoded);
  records.push({ url: '/models/' + name.split(sep).join('/'), canonicalSha256: digest(original), canonicalBytes: original.length,
    transportSha256: digest(encoded), transportBytes: encoded.length, gzipCanonicalBytes: gzipSync(original).length, gzipTransportBytes: gzipSync(encoded).length, ...proof });
  assert.equal(digest(await readFile(path)), records.at(-1).canonicalSha256, 'Canonical source changed during processing');
}
const report = { version: 1, encoding: 'EXT_meshopt_compression', precision: 'byte-exact; no reordering, quantization or geometry simplification',
  canonicalHashScope: 'Catalogue bundle hashes and byte counts describe the unchanged public/models GLBs, not compressed transport files.',
  decoder: 'Installed @react-three/drei three-stdlib GLTFLoader/MeshoptDecoder', records };
if (!measure) {
  const path = resolve(destination, 'transport-manifest.json'), text = JSON.stringify(report, null, 2) + '\n';
  if (check) assert.equal(await readFile(path, 'utf8'), text); else await writeFile(path, text);
}
console.log(JSON.stringify({ mode: measure ? 'measure-only' : check ? 'check' : 'build', files: records.length, compressed: records.filter(r => r.compressed).length,
  meshes: records.reduce((n, r) => n + r.meshes, 0), bufferViews: records.reduce((n, r) => n + r.bufferViews, 0),
  canonicalBytes: records.reduce((n, r) => n + r.canonicalBytes, 0), transportBytes: records.reduce((n, r) => n + r.transportBytes, 0),
  gzipCanonicalBytes: records.reduce((n, r) => n + r.gzipCanonicalBytes, 0), gzipTransportBytes: records.reduce((n, r) => n + r.gzipTransportBytes, 0),
  sourceBytesAndDecodedScene: 'unchanged; verified for every model' }));
