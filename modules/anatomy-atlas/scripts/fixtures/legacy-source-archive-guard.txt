// Packaging only. Never touches geometry, licence notices or source originals.
import assert from 'node:assert/strict';
import { readFile, writeFile, realpath, lstat, unlink } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '..'), check = process.argv.includes('--check');
assert.ok(process.argv.slice(2).every(a => a === '--check'));
const name = 'models/bodyparts3d-v3/abdominal-wall/original-source.zip';
const source = resolve(root, 'public', name), runtime = resolve(root, 'dist/client'), target = resolve(runtime, name);
assert.ok(target.startsWith(runtime + sep) && source !== target);
assert.equal((await realpath(runtime)).toLowerCase(), runtime.toLowerCase());
assert.equal((await realpath(source)).toLowerCase(), source.toLowerCase());
assert.ok((await lstat(source)).isFile());
const digest = bytes => createHash('sha256').update(bytes).digest('hex'), bytes = await readFile(source);
const record = { sourcePath: 'public/' + name, sha256: digest(bytes), bytes: bytes.length, inRuntime: false,
  officialDownload: 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_99.zip' };
let exists = false;
try { const stat = await lstat(target); assert.ok(stat.isFile() && !stat.isSymbolicLink()); exists = true; }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (check) assert.ok(!exists, 'Recovery ZIP must not be in the live release');
else if (exists) {
  assert.equal((await realpath(target)).toLowerCase(), target.toLowerCase());
  assert.equal(digest(await readFile(target)), record.sha256, 'Unexpected generated file; refusing removal');
  await unlink(target); // One validated generated copy only; no recursive/glob deletion.
}
assert.equal(digest(await readFile(source)), record.sha256, 'Source recovery archive must remain intact');
const metadata = resolve(runtime, 'models/recovery-policy.json'), text = JSON.stringify(record, null, 2) + '\n';
if (check) assert.equal(await readFile(metadata, 'utf8'), text); else await writeFile(metadata, text);
console.log(JSON.stringify({check, sourcePreserved:true, generatedRecoveryExcluded:true, bytes:record.bytes}));
