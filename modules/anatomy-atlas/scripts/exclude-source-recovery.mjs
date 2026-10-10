// Packaging only. The authoring archive is never opened or inspected here.
import assert from 'node:assert/strict';
import { readFile, realpath, lstat, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--check'), 'Unexpected arguments');
const check = args.length === 1;
const root = resolve(import.meta.dirname, '..');
const runtime = resolve(root, 'dist/client');
const name = 'models/bodyparts3d-v3/abdominal-wall/original-source.zip';
const target = resolve(runtime, name);
const metadata = resolve(runtime, 'models/recovery-policy.json');
const record = {
  sourcePath: 'public/' + name,
  sha256: 'f9b95871318c4e550a58cca06a7f444e0f4f4ea1949709bae963acafa78b227d',
  bytes: 14227760,
  inRuntime: false,
  officialDownload: 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_99.zip',
};
const expectedMetadata = JSON.stringify(record, null, 2) + '\n';
const comparable = path => process.platform === 'win32' ? path.toLowerCase() : path;
const assertExactPath = (actual, expected, message) => assert.equal(comparable(actual), comparable(expected), message);
const exactDirectory = async path => {
  const stat = await lstat(path);
  assert.ok(stat.isDirectory() && !stat.isSymbolicLink(), `Linked or non-directory runtime path: ${path}`);
  assertExactPath(await realpath(path), path, `Symlinked or escaping directory: ${path}`);
};
assert.ok(target.startsWith(runtime + sep) && metadata.startsWith(runtime + sep));
await exactDirectory(runtime);
await exactDirectory(dirname(metadata));
for (const directory of [resolve(runtime, 'models/bodyparts3d-v3'), dirname(target)]) {
  try { await exactDirectory(directory); }
  catch (error) { if (error.code === 'ENOENT') break; throw error; }
}

let targetStat;
try { targetStat = await lstat(target); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (targetStat) {
  assert.ok(targetStat.isFile() && !targetStat.isSymbolicLink(), 'Recovery target must be a regular file');
  assertExactPath(await realpath(target), target, 'Symlinked or escaping recovery target');
  assert.ok(!check, 'Recovery ZIP must not be in the live release');
  assert.equal(targetStat.size, record.bytes, 'Unexpected generated ZIP size; refusing removal');
  const digest = createHash('sha256').update(await readFile(target)).digest('hex');
  assert.equal(digest, record.sha256, 'Unexpected generated ZIP hash; refusing removal');
}

let metadataStat;
try { metadataStat = await lstat(metadata); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (metadataStat) {
  assert.ok(metadataStat.isFile() && !metadataStat.isSymbolicLink(), 'Recovery metadata must be a regular file');
  assertExactPath(await realpath(metadata), metadata, 'Symlinked or escaping recovery metadata');
  assert.equal(await readFile(metadata, 'utf8'), expectedMetadata, 'Recovery metadata differs from pinned record');
} else {
  assert.ok(!check, 'Recovery metadata is missing');
}

if (targetStat) await unlink(target); // Only the exact validated generated copy.
if (!metadataStat) await writeFile(metadata, expectedMetadata, { flag: 'wx' });
console.log(JSON.stringify({ check, generatedRecoveryExcluded: true, bytes: record.bytes }));
