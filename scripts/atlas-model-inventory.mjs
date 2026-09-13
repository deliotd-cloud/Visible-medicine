import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, lstatSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = ['shoulder', 'female-pelvis', 'lower-limb', 'head-neck'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const records = new Map();
const sources = [];
for (const module of modules) {
  const directory = realpathSync(resolve(root, 'public/atlas-runtime', module));
  const manifestBytes = readFileSync(resolve(directory, 'manifest.json'));
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.patientDataIncluded, false, `${module}: private-data declaration`);
  assert.match(manifest.sourceCommit, /^[a-f0-9]{40}$/);
  assert.ok(manifest.files.some(file => file.path === 'LICENSES/THIRD_PARTY_NOTICES.md'));
  const paths = new Set();
  let models = 0;
  // Check all companion notices and runtime files, not only the model names.
  for (const file of manifest.files) {
    assert.match(file.path, /^[a-zA-Z0-9_./-]+$/);
    assert.ok(!file.path.split('/').some(part => part === '..' || part === '.' || !part));
    assert.ok(!paths.has(file.path), `${module}: duplicate ${file.path}`);
    paths.add(file.path);
    const path = resolve(directory, file.path);
    assert.ok(lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink());
    const within = relative(directory, realpathSync(path));
    assert.ok(within && !within.startsWith(`..${sep}`) && within !== '..');
    const bytes = readFileSync(path);
    assert.equal(bytes.length, file.bytes, `${module}/${file.path}: length`);
    assert.equal(hash(bytes), file.sha256, `${module}/${file.path}: digest`);
    if (!file.path.endsWith('.glb')) continue;
    assert.ok(file.path.startsWith('models/'));
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(4), 2);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.ok(bytes.length <= 32 * 1024 * 1024, 'Review upload limit before admitting larger models');
    const record = records.get(file.sha256) ?? { sha256: file.sha256, bytes: file.bytes, paths: [] };
    assert.equal(record.bytes, file.bytes);
    record.paths.push(`/atlas-runtime/${module}/${file.path}`);
    records.set(file.sha256, record);
    models++;
  }
  assert.ok(models > 0);
  sources.push({ module, sourceCommit: manifest.sourceCommit, manifestSha256: hash(manifestBytes), modelPaths: models });
}
const inventory = {
  schemaVersion: 1,
  purpose: 'licensed-atlas-model-staging-only',
  learnerDelivery: 'existing-static-assets',
  sources,
  models: [...records.values()].sort((a, b) => a.sha256.localeCompare(b.sha256)),
};
const output = `${JSON.stringify(inventory, null, 2)}\n`;
const target = resolve(root, 'lib/atlas-model-inventory.json');
assert.ok(process.argv.slice(2).every(argument => argument === '--check'));
if (process.argv.includes('--check')) assert.equal(readFileSync(target, 'utf8').replaceAll('\r\n', '\n'), output, 'Regenerate model inventory');
else writeFileSync(target, output);
console.log(JSON.stringify({ models: inventory.models.length, paths: sources.reduce((sum, source) => sum + source.modelPaths, 0), bytes: inventory.models.reduce((sum, model) => sum + model.bytes, 0), mode: process.argv.includes('--check') ? 'verified' : 'generated' }));
