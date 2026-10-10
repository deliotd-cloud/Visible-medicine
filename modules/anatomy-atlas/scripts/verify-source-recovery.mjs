// Authoring-only integrity check. Keep outside the default release build.
import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { lstat, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';

assert.equal(process.argv.length, 2, 'Unexpected arguments');
const source = resolve(import.meta.dirname, '..', 'public/models/bodyparts3d-v3/abdominal-wall/original-source.zip');
const expectedBytes = 14227760;
const expectedSha256 = 'f9b95871318c4e550a58cca06a7f444e0f4f4ea1949709bae963acafa78b227d';
const comparable = path => process.platform === 'win32' ? path.toLowerCase() : path;
const sourceDirectory = dirname(source);
const directoryStat = await lstat(sourceDirectory);
assert.ok(directoryStat.isDirectory() && !directoryStat.isSymbolicLink(), 'Linked or non-directory source path');
assert.equal(comparable(await realpath(sourceDirectory)), comparable(sourceDirectory), 'Symlinked source directory');
const before = await lstat(source);
assert.ok(before.isFile() && !before.isSymbolicLink(), 'Source recovery archive must be a regular file');
assert.equal(comparable(await realpath(source)), comparable(source), 'Symlinked source recovery archive');
assert.equal(before.size, expectedBytes, 'Source recovery archive size differs from pinned record');
const hash = createHash('sha256');
let bytes = 0;
for await (const chunk of createReadStream(source)) { hash.update(chunk); bytes += chunk.length; }
const after = await lstat(source);
assert.ok(after.isFile() && !after.isSymbolicLink(), 'Source recovery archive changed during verification');
assert.equal(after.size, before.size, 'Source recovery archive changed during verification');
assert.equal(after.mtimeMs, before.mtimeMs, 'Source recovery archive changed during verification');
assert.equal(bytes, expectedBytes, 'Source recovery archive size differs from pinned record');
assert.equal(hash.digest('hex'), expectedSha256, 'Source recovery archive hash differs from pinned record');
console.log(JSON.stringify({ sourceVerified: true, bytes }));
