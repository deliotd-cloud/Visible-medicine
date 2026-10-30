import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspectPreviewManifest, verifyPublicPreviewAssets } from '../scripts/public-preview-preflight.mjs';

const sourceRoot = resolve(process.env.VM_PUBLIC_PREVIEW_SOURCE_ROOT || '.');
const stageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureParent = join(stageRoot, '.local', 'public-preview-preflight-fixtures');
mkdirSync(fixtureParent, { recursive: true });
assert(lstatSync(fixtureParent).isDirectory() && !lstatSync(fixtureParent).isSymbolicLink());
const fixtureParentReal = realpathSync(fixtureParent);
const rel = join('public', 'media', 'atlas');
const names = ['manifest.json', 'NOTICES.md', '3d-detail-preview.jpg', 'ct-preview.png',
  'mri-preview.png', 'ultrasound-preview.jpg', 'xray-preview.png'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const source = join(sourceRoot, rel);
const sourceManifest = readFileSync(join(source, 'manifest.json'));
assert.equal(sourceManifest.length, 927);
assert.equal(sha(sourceManifest), '191e57f8ad31fd31d6f7e6c0f733a814a0e2a9ac9f5332b12d0614d308f7b937');
const sourceNotices = readFileSync(join(source, 'NOTICES.md'));
assert.equal(sourceNotices.length, 3536);
assert.equal(sha(sourceNotices), 'c2247722b9a67799ff1a1518945023e5bd270f9b5538f9c0ac37cd5f0c62ee89');

function fixture(t) {
  const root = mkdtempSync(join(fixtureParentReal, 'vm-public-preview-'));
  t.after(() => {
    const target = resolve(root);
    const within = relative(fixtureParentReal, target);
    assert(within && within !== '..' && !within.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(within),
      'Fixture cleanup target must stay strictly inside the stage fixture parent');
    const stat = lstatSync(target);
    assert(stat.isDirectory() && !stat.isSymbolicLink(), 'Fixture cleanup target must be a real directory');
    assert.equal(realpathSync(target), target, 'Fixture cleanup target must resolve to itself');
    rmSync(target, { recursive: true });
  });
  const dir = join(root, rel);
  mkdirSync(dir, { recursive: true });
  for (const name of names) copyFileSync(join(source, name), join(dir, name));
  return { root, dir };
}
function paddedManifest(mutator) {
  const m = JSON.parse(sourceManifest.toString('utf8'));
  mutator(m);
  const json = JSON.stringify(m);
  assert(json.length <= 927, 'synthetic manifest must fit bounded pinned size');
  return Buffer.from(json.padEnd(927, ' '));
}

test('pins the exact five public preview bytes and attribution; repeat check detects later drift', t => {
  const { root, dir } = fixture(t);
  const receipt = verifyPublicPreviewAssets(root);
  assert.equal(receipt.assets.length, 5);
  assert.deepEqual(receipt.assets.map(a => a.file.split('/').at(-1)), names.slice(2));
  assert.equal(receipt.manifestSha256, sha(sourceManifest));
  assert.equal(receipt.noticesSha256, sha(readFileSync(join(source, 'NOTICES.md'))));
  for (const item of receipt.assets) assert.equal(item.sha256, sha(readFileSync(join(root, item.file))));
  assert.match(receipt.claimScope, /no clinical, privacy, rights or release approval/);
  const path = join(dir, 'ct-preview.png'), bytes = readFileSync(path);
  bytes[0] ^= 1; writeFileSync(path, bytes);
  assert.throws(() => verifyPublicPreviewAssets(root), /changed public preview bytes.*ct-preview\.png/);
});

test('source-only recovery gap fails before test spawn with local restoration guidance', t => {
  const { root, dir } = fixture(t);
  rmSync(join(dir, 'mri-preview.png'));
  assert.throws(() => verifyPublicPreviewAssets(root), error =>
    /missing existing public file.*mri-preview\.png/.test(String(error)) &&
    /Restore the existing admitted public preview assets locally from the original project or an independently verified asset backup/.test(String(error)) &&
    /source-only backups may omit these binaries/.test(String(error)));
});

test('same-size attribution change is refused by the exact notice hash', t => {
  const { root, dir } = fixture(t);
  const changed = Buffer.from(sourceNotices);
  changed[0] ^= 1;
  writeFileSync(join(dir, 'NOTICES.md'), changed);
  assert.equal(changed.length, sourceNotices.length);
  assert.throws(() => verifyPublicPreviewAssets(root), /changed attribution notices.*NOTICES\.md/);
});

test('oversized attribution is refused before reading its contents', t => {
  const { root, dir } = fixture(t);
  writeFileSync(join(dir, 'NOTICES.md'), Buffer.concat([sourceNotices, Buffer.from('x')]));
  assert.throws(() => verifyPublicPreviewAssets(root), /oversized public file.*NOTICES\.md/);
});

test('old notice falsely claiming the absent legacy capture is refused', t => {
  const { root, dir } = fixture(t);
  const current = 'also used in the preceding private website. This distribution includes\n' +
    '`3d-detail-preview.jpg`; the earlier `3d-preview.png` is not included.\n';
  const old = 'also used in the preceding private website. The earlier `3d-preview.png` is\n' +
    'retained as a legacy capture from private version 61.\n';
  const text = sourceNotices.toString('utf8');
  assert(text.includes(current), 'Fixture must contain the audited correction');
  const stale = Buffer.from(text.replace(current, old));
  assert.equal(stale.length, 3524);
  assert.equal(sha(stale), '55f0d74ecb7d0a110c901f97e59a3522c9ed27c781f86e6cf65406a264a3c5bd');
  writeFileSync(join(dir, 'NOTICES.md'), stale);
  assert.throws(() => verifyPublicPreviewAssets(root), /wrong size.*NOTICES\.md/);
});

test('bounded reads refuse oversized assets, wrong sizes, and missing attribution', t => {
  const { root, dir } = fixture(t);
  const asset = join(dir, '3d-detail-preview.jpg');
  writeFileSync(asset, Buffer.alloc(73546));
  assert.throws(() => verifyPublicPreviewAssets(root), /oversized public file/);
  writeFileSync(asset, Buffer.alloc(3));
  assert.throws(() => verifyPublicPreviewAssets(root), /wrong size/);
  copyFileSync(join(source, '3d-detail-preview.jpg'), asset);
  rmSync(join(dir, 'NOTICES.md'));
  assert.throws(() => verifyPublicPreviewAssets(root), /missing existing public file.*NOTICES\.md/);
});

test('manifest rejects duplicate, unknown, traversal, changed hash and changed pinned identity', () => {
  assert.equal(inspectPreviewManifest(sourceManifest).length, 5);
  assert.throws(() => inspectPreviewManifest(paddedManifest(m => { m.images[1].file = m.images[0].file; })), /duplicate preview/);
  assert.throws(() => inspectPreviewManifest(paddedManifest(m => { m.images[1].file = 'other-preview.png'; })), /unknown preview/);
  assert.throws(() => inspectPreviewManifest(paddedManifest(m => { m.images[1].file = '..\/private.png'; })), /unsafe preview basename/);
  assert.throws(() => inspectPreviewManifest(paddedManifest(m => { m.images[1].sha256 = '0'.repeat(64); })), /wrong pinned size or hash/);
  assert.throws(() => inspectPreviewManifest(paddedManifest(m => { m.reviewed = '2026-09-14'; })), /unexpected public preview manifest identity/);
});

test('nonregular public preview files are refused', t => {
  const { root, dir } = fixture(t);
  const path = join(dir, 'ultrasound-preview.jpg');
  rmSync(path); mkdirSync(path);
  assert.throws(() => verifyPublicPreviewAssets(root), /unsafe nonregular or symlink/);
});

test('file symlinks are refused when this Windows host permits creating them', t => {
  const { root, dir } = fixture(t);
  const path = join(dir, 'ultrasound-preview.jpg');
  rmSync(path);
  try { symlinkSync(join(source, 'ultrasound-preview.jpg'), path, 'file'); }
  catch (error) { if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { t.skip(`File symlink creation unavailable: ${error.code}`); return; } throw error; }
  assert.throws(() => verifyPublicPreviewAssets(root), /unsafe nonregular or symlink/);
});

test('symlinked or junction directory segments are refused when supported', t => {
  const { root, dir } = fixture(t);
  const actual = join(root, 'public', 'media', 'atlas-original');
  const ownedRoot = realpathSync(root);
  for (const location of [dir, actual]) {
    const absolute = resolve(location), within = relative(ownedRoot, absolute);
    assert(within && within !== '..' && !within.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(within),
      'Both move endpoints must stay strictly inside the owned fixture');
    assert.equal(realpathSync(dirname(absolute)), dirname(absolute), 'Move parent must not be redirected');
  }
  assert(lstatSync(dir).isDirectory() && !lstatSync(dir).isSymbolicLink(), 'Move only the regular fixture directory');
  assert(!existsSync(actual), 'Move destination must be fresh');
  renameSync(dir, actual);
  try { symlinkSync(actual, dir, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { t.skip(`Directory link creation unavailable: ${error.code}`); return; } throw error; }
  assert.throws(() => verifyPublicPreviewAssets(root), /unsafe non-directory or symlink/);
});
