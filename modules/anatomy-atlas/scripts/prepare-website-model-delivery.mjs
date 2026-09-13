// Build-only transformation: the website's public exports and Atlas originals
// remain byte-for-byte intact. Run after the website build, before packaging.
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, realpath, lstat } from 'node:fs/promises';
import { resolve, relative, sep, isAbsolute, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';
import { compressGlb, validateGlbDelivery, digest } from './glb-lossless-codec.mjs';

const atlas = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2), check = args.includes('--check');
assert.ok(args.length === (check ? 2 : 1) && (!check || args[1] === '--check'), 'Usage: node scripts/prepare-website-model-delivery.mjs <absolute-website-checkout> [--check]');
assert.ok(isAbsolute(args[0]), 'An explicit absolute website checkout is required');
const website = resolve(args[0]);
assert.notEqual(website.toLowerCase(), atlas.toLowerCase());
const git = (cwd, ...arguments_) => execFileSync('git', arguments_, { cwd, encoding: 'utf8' }).trim();
assert.equal(resolve(git(website, 'rev-parse', '--show-toplevel')).toLowerCase(), website.toLowerCase());
assert.equal(git(atlas, 'status', '--porcelain'), '', 'Commit Atlas delivery code before exporting');
assert.equal(git(website, 'status', '--porcelain'), '', 'Commit and build the website before preparing delivery');
const sourceCommit = git(atlas, 'rev-parse', 'HEAD'), websiteCommit = git(website, 'rev-parse', 'HEAD');
const config = JSON.parse(await readFile(resolve(website, '.openai/hosting.json'), 'utf8'));
assert.equal(config.project_id, 'appgprj_6a8b1e2c3d348191be844899e57ccbc6', 'Wrong website destination');
const modules = ['shoulder', 'female-pelvis', 'lower-limb', 'head-neck'];
const counts = [1, 1, 5, 37];
const canonicalRoot = resolve(website, 'public/atlas-runtime');
const deliveredRoot = resolve(website, 'dist/client/atlas-runtime');
const require = createRequire(import.meta.url);
const dreiRequire = createRequire(require.resolve('@react-three/drei'));
const loaderPackages = ['@react-three/drei', '@react-three/fiber', 'three', 'three-stdlib'];
async function packageVersion(name) {
  let directory = dirname((name === 'three-stdlib' ? dreiRequire : require).resolve(name));
  while (directory !== dirname(directory)) {
    try {
      const pkg = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'));
      if (pkg.name === name) { assert.equal(pkg.license, 'MIT'); return pkg.version; }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    directory = dirname(directory);
  }
  throw Error('Missing loader package identity: ' + name);
}
const loaderVersions = Object.fromEntries(await Promise.all(loaderPackages.map(async name => [name, await packageVersion(name)])));
const codecInputs = await Promise.all(['scripts/glb-lossless-codec.mjs', 'scripts/prepare-website-model-delivery.mjs', 'package-lock.json'].map(async path => ({ path, sha256: digest(await readFile(resolve(atlas, path))) })));

async function confined(root, name = '') {
  assert.ok(!name.includes('\\') && !name.includes(':') && !name.split('/').includes('..') && !name.startsWith('/'), 'Unsafe relative path');
  const path = resolve(root, name);
  assert.ok(path === root || path.startsWith(root + sep));
  assert.equal((await realpath(path)).toLowerCase(), path.toLowerCase(), 'Symlink/reparse-point destination');
  assert.ok(!(await lstat(path)).isSymbolicLink());
  return path;
}
async function walk(root, name = '') {
  const result = [];
  for (const item of await readdir(await confined(root, name), { withFileTypes: true })) {
    assert.ok(!item.isSymbolicLink());
    const path = (name ? name + '/' : '') + item.name;
    if (item.isDirectory()) result.push(...await walk(root, path));
    else { assert.ok(item.isFile()); result.push(path); }
  }
  return result.sort();
}
const canonicalFileRecords = [], prepared = [], summaries = [];
await confined(canonicalRoot); await confined(deliveredRoot);
assert.deepEqual((await readdir(canonicalRoot)).sort(), [...modules].sort());
assert.deepEqual((await readdir(deliveredRoot)).sort(), [...modules].sort());
for (const [index, module] of modules.entries()) {
  const source = await confined(canonicalRoot, module), output = await confined(deliveredRoot, module);
  const manifestBytes = await readFile(await confined(source, 'manifest.json'));
  const manifest = JSON.parse(manifestBytes);
  assert.match(manifest.sourceCommit, /^[a-f0-9]{40}$/);
  assert.equal(manifest.patientDataIncluded, false); assert.equal(manifest.clinicalApproved, false);
  assert.ok(!manifest.transportDelivery, 'Canonical exports must not already be compressed');
  assert.equal(new Set(manifest.files.map(f => f.path)).size, manifest.files.length);
  const expected = ['manifest.json', ...manifest.files.map(f => f.path)].sort();
  assert.deepEqual(await walk(source), expected, 'Unexpected canonical export file');
  assert.deepEqual(await walk(output), check ? [...expected, 'canonical-manifest.json', 'transport-manifest.json'].sort() : expected, 'Run a fresh website build before compression');
  if (!check) assert.ok((await readFile(await confined(output, 'manifest.json'))).equals(manifestBytes));
  const deps = JSON.parse(await readFile(resolve(source, 'bundled-dependencies.json'), 'utf8'));
  for (const [name, version] of Object.entries(loaderVersions)) {
    assert.deepEqual(deps.filter(d => d.name === name), [{ name, version, license: 'MIT' }], 'Rebuild or audit a module with a different loader/decoder');
  }
  const records = [], files = [];
  for (const file of manifest.files) {
    const sourcePath = await confined(source, file.path), outputPath = await confined(output, file.path);
    const original = await readFile(sourcePath);
    assert.equal(original.length, file.bytes); assert.equal(digest(original), file.sha256, 'Canonical export hash mismatch');
    canonicalFileRecords.push({ path: sourcePath, hash: file.sha256 });
    if (!file.path.endsWith('.glb')) {
      assert.ok((await readFile(outputPath)).equals(original), 'Build changed non-model export: ' + file.path);
      files.push(file); continue;
    }
    assert.match(file.path, /^models\/[a-zA-Z0-9_./-]+\.glb$/);
    const atlasPath = await confined(resolve(atlas, 'public'), file.path);
    assert.ok((await readFile(atlasPath)).equals(original), 'Website model is not the exact canonical Atlas source');
    canonicalFileRecords.push({ path: atlasPath, hash: file.sha256 });
    const packed = await compressGlb(original);
    const proof = await validateGlbDelivery(original, packed);
    if (check) assert.ok((await readFile(outputPath)).equals(packed), 'Stale/damaged model transport: ' + file.path);
    else {
      assert.ok((await readFile(outputPath)).equals(original), 'Build must initially contain canonical model bytes');
      prepared.push({ path: outputPath, bytes: packed });
    }
    const record = { path: file.path, canonicalSha256: file.sha256, canonicalBytes: file.bytes,
      transportSha256: digest(packed), transportBytes: packed.length,
      gzipCanonicalBytes: gzipSync(original).length, gzipTransportBytes: gzipSync(packed).length, ...proof };
    records.push(record); files.push({ path: file.path, bytes: packed.length, sha256: record.transportSha256 });
  }
  assert.equal(records.length, counts[index]);
  const report = { schemaVersion: 1, encoding: 'EXT_meshopt_compression', precision: 'byte-exact',
    changes: 'Transport only; no quantization, simplification, index reordering or normal filtering.',
    canonicalHashScope: 'Catalogue hashes identify unchanged source GLBs, not transported file bytes.',
    atlasDeliverySourceCommit: sourceCommit, websiteSourceCommit: websiteCommit, moduleSourceCommit: manifest.sourceCommit,
    codecInputs, loaderVersions, canonicalManifestSha256: digest(manifestBytes), records };
  const reportBytes = Buffer.from(JSON.stringify(report, null, 2) + '\n');
  files.push({ path: 'canonical-manifest.json', bytes: manifestBytes.length, sha256: digest(manifestBytes) },
    { path: 'transport-manifest.json', bytes: reportBytes.length, sha256: digest(reportBytes) });
  const deliveredManifest = Buffer.from(JSON.stringify({ ...manifest, transportDelivery: 'transport-manifest.json', files }, null, 2) + '\n');
  for (const [name, bytes] of [['canonical-manifest.json', manifestBytes], ['transport-manifest.json', reportBytes], ['manifest.json', deliveredManifest]]) {
    if (check) assert.ok((await readFile(await confined(output, name))).equals(bytes), 'Stale delivery metadata: ' + name);
    else prepared.push({ path: resolve(output, name), bytes });
  }
  summaries.push({ module, models: records.length, meshes: records.reduce((n, r) => n + r.meshes, 0),
    canonicalBytes: records.reduce((n, r) => n + r.canonicalBytes, 0), transportBytes: records.reduce((n, r) => n + r.transportBytes, 0),
    gzipSaving: records.reduce((n, r) => n + r.gzipCanonicalBytes - r.gzipTransportBytes, 0) });
}
// No output writes until every source, destination, loader and scene has passed.
for (const file of canonicalFileRecords) assert.equal(digest(await readFile(file.path)), file.hash, 'Canonical source changed during processing');
assert.equal(git(atlas, 'rev-parse', 'HEAD'), sourceCommit); assert.equal(git(website, 'rev-parse', 'HEAD'), websiteCommit);
if (!check) for (const file of prepared) {
  assert.ok(file.path.startsWith(deliveredRoot + sep));
  await confined(deliveredRoot, relative(deliveredRoot, resolve(file.path, '..')).split(sep).join('/'));
  await writeFile(file.path, file.bytes);
}
console.log(JSON.stringify({ mode: check ? 'verified' : 'prepared', sourceCommit, websiteCommit, modules: summaries,
  canonicalFiles: 'unchanged', sceneAndAccessorEquality: 'verified for every model', newRuntimeDependencies: 0 }));
