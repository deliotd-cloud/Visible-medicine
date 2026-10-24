import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { read, json, sha } from './source-only-backup-20261019.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-right-gastric-eus-native';
const prep = json(stage + '/PREPARATION.json'), atlas = prep.atlas;
assert.equal(path.resolve(atlas).replaceAll('\\', '/'), stage + '/atlas');
assert.equal(sha(read(stage + '/PREPARATION.json')), 'c53ac83ba02a651cbab983de46188c6ffb1806655a250abc35100ad9c1da287a');
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted, false);
const file = atlas + '/.git/objects/info/alternates', original = read(file);
assert.equal(original.toString().trim().replaceAll('\\', '/'), prep.parentAtlas + '/.git/objects');
const seen = new Set(), ordered = [], inputs = [];
function visit(store) {
  const resolved = fs.realpathSync(store), key = resolved.toLowerCase();
  if (seen.has(key)) return;
  assert(seen.size < 150); assert(fs.statSync(resolved).isDirectory());
  assert(resolved.replaceAll('\\', '/').startsWith('F:/VisibleMedicine/'), 'Object store must remain in authoritative F scope');
  seen.add(key);
  const alternate = path.join(resolved, 'info', 'alternates');
  if (fs.existsSync(alternate)) {
    const bytes = read(alternate); inputs.push({ file: alternate, sha256: sha(bytes) });
    for (const line of bytes.toString().trim().split(/\r?\n/).filter(Boolean)) {
      assert(!line.startsWith('"'), 'Unsupported quoted Git alternate');
      visit(path.isAbsolute(line) ? line : path.resolve(resolved, line));
    }
  }
  ordered.push(resolved.replaceAll('\\', '/'));
}
for (const line of original.toString().trim().split(/\r?\n/)) visit(line);
const changed = Buffer.from(ordered.join('\n') + '\n');
const receipt = {
  at: new Date().toISOString(), target: atlas, cause: 'Shared clone emitted Git alternate-object nesting-depth warnings; parent and product source remain unchanged.',
  originalAlternates: original.toString(), originalSha256: sha(original), flatPostOrderAlternates: ordered, afterSha256: sha(changed),
  readOnlyParentAlternateInputs: inputs, parentEdited: false, sourceEdited: false, noFilesDeleted: true, previewChanged: false,
};
fs.writeFileSync(stage + '/OBJECT_STORE_CLOSURE.before.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
// Only this newly-created clone's mechanical object-store index is rewritten.
fs.writeFileSync(file, changed);
const git = (...args) => execFileSync('git', ['-C', atlas, ...args], { encoding: 'utf8', windowsHide: true, stdio: 'pipe', env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_TERMINAL_PROMPT: '0' } }).trim();
git('config', 'core.autocrlf', 'false');
assert.equal(git('rev-parse', 'HEAD'), prep.parentHead);
assert.equal(git('rev-parse', 'HEAD^{tree}'), prep.parentTree);
for (const revision of [prep.parentHead, 'b03ba458907946c1b1c152149ee5867f8d6a62df', '4233534fadb842b4d3c074b6881b28e29a6fdd06']) assert.equal(git('cat-file', '-t', revision), 'commit');
const parent = json(prep.parentReceipt);
for (const row of parent.sourceRows) {
  assert.equal(sha(read(parent.atlas + '/' + row.path)), row.sha256);
  assert.equal(sha(read(atlas + '/' + row.path)), prep.copiedSourceRows.find(r => r.path === row.path)?.sha256 ?? row.sha256);
}
for (const input of inputs) assert.equal(sha(read(input.file)), input.sha256);
fs.writeFileSync(stage + '/OBJECT_STORE_CLOSURE.json', JSON.stringify({ ...receipt, actualHeadAndTreeVerified: true, requiredEpochCommitsAvailable: 3, unchangedParentPaths: parent.sourceRows.length, sourceBytesVerified: true, afterActualSha256: sha(read(file)) }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ receipt: stage + '/OBJECT_STORE_CLOSURE.json', sha256: sha(read(stage + '/OBJECT_STORE_CLOSURE.json')), objectStores: ordered.length, parentAndSourceUnchanged: true }));
