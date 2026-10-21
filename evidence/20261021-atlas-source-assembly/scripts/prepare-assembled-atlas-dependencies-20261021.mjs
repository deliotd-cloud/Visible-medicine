import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { read, json, sha, runGit } from './source-only-backup-20261019.mjs';
const original = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const target = 'F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const evidence = 'F:/VisibleMedicine/staging/20261021-atlas-source-assembly';
const from = fs.realpathSync(original + '/node_modules');
const to = target + '/node_modules';
assert(!fs.existsSync(to) && !fs.existsSync(evidence + '/DEPENDENCIES.json'));
assert.equal(runGit(['-C', original, 'status', '--porcelain']).toString().trim(), '');
const beforeStatus = runGit(['-C', target, 'status', '--porcelain=v1', '-z', '--untracked-files=all']);
assert.deepEqual(read(original + '/package-lock.json'), read(target + '/package-lock.json'));
const sourcePackage = json(original + '/package.json'), targetPackage = json(target + '/package.json');
for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'engines']) assert.deepEqual(targetPackage[key], sourcePackage[key]);
const files = [], dirs = [], links = [];
let totalBytes = 0;
async function fileSha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(file, { highWaterMark: 128 * 1024 })) hash.update(chunk);
  return hash.digest('hex');
}
function within(p) { const rel = path.relative(from, p); return !path.isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + path.sep); }
function scan(rel) {
  const file = path.join(from, rel), stat = fs.lstatSync(file);
  if (stat.isSymbolicLink()) {
    const actual = fs.realpathSync(file); assert(within(actual), 'Installed dependency link escapes the selected forest');
    links.push({ path: rel, target: path.relative(from, actual), directory: fs.statSync(actual).isDirectory() }); return;
  }
  if (stat.isDirectory()) {
    dirs.push(rel);
    for (const entry of fs.readdirSync(file)) {
      if (rel === '' && ['.cache', '.vite', '.tmp'].includes(entry)) continue;
      scan(path.join(rel, entry));
    }
  } else {
    assert(stat.isFile(), 'Only regular installed dependency files');
    assert(stat.size < 256e6, 'Bounded installed native binary: ' + rel);
    files.push({ path: rel, bytes: stat.size });
    totalBytes += stat.size;
    assert(files.length <= 100000 && totalBytes < 3e9, 'Bounded installed forest');
  }
}
scan('');
for (const rel of dirs) fs.mkdirSync(path.join(to, rel), { recursive: true });
for (const row of files) {
  const src = path.join(from, row.path), dest = path.join(to, row.path);
  assert.equal(fs.statSync(src).size, row.bytes);
  row.sha256 = await fileSha256(src);
  fs.copyFileSync(src, dest, fs.constants.COPYFILE_EXCL);
  assert.equal(await fileSha256(dest), row.sha256);
}
for (const row of links) {
  const dest = path.join(to, row.path), actual = path.join(to, row.target);
  assert(fs.existsSync(actual));
  fs.symlinkSync(row.directory ? actual : path.relative(path.dirname(dest), actual), dest, row.directory ? 'junction' : 'file');
  assert.equal(fs.realpathSync(dest), fs.realpathSync(actual));
}
for (const row of files) assert.equal(await fileSha256(path.join(from, row.path)), row.sha256, 'Original dependency remains unchanged');
assert.deepEqual(runGit(['-C', target, 'status', '--porcelain=v1', '-z', '--untracked-files=all']), beforeStatus);
assert.equal(runGit(['-C', original, 'status', '--porcelain']).toString().trim(), '');
fs.writeFileSync(evidence + '/DEPENDENCIES.json', JSON.stringify({ at: new Date().toISOString(), from, to,
  files, links, directories: dirs.length, totalBytes: files.reduce((n, r) => n + r.bytes, 0),
  originalUnchanged: true, trackedSourceUnchanged: true, separatePhysicalFileCopies: true,
  excludedRootCaches: ['.cache', '.vite', '.tmp'], dependencyPackageFieldsAndLockPreserved: true,
  installedFromNetwork: false, npmInstallRun: false, lockfileByteAttested: false,
  correction: 'Initial64MB per-file preflight refused the existing official workerd.exe98366464bytes before any copy. Preserved initial helper and tool error; corrected to128KB streaming hashes/kernel file copies,256MB per-file and3GB aggregate bounds, not a full-file heap allocation or runtime check bypass.',
  limits: 'Exact copies of the existing installed forest, not independent registry/tarball/lockfile-byte attestation. No cache reuse, foreign dependency junction, package upgrades, scripts or build/test execution.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ evidence: evidence + '/DEPENDENCIES.json', sha256: sha(read(evidence + '/DEPENDENCIES.json')), files: files.length, links: links.length, bytes: files.reduce((n, r) => n + r.bytes, 0), installedFromNetwork: false }));
