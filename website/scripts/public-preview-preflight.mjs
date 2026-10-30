import { createHash } from 'node:crypto';
import { closeSync, constants, fstatSync, lstatSync, openSync, readSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const relativeDirectory = ['public', 'media', 'atlas'];
const manifestName = 'manifest.json';
const manifestBytes = 927;
const manifestSha256 = '191e57f8ad31fd31d6f7e6c0f733a814a0e2a9ac9f5332b12d0614d308f7b937';
const noticesName = 'NOTICES.md';
const noticesBytes = 3536;
const noticesSha256 = 'c2247722b9a67799ff1a1518945023e5bd270f9b5538f9c0ac37cd5f0c62ee89';
const expected = new Map([
  ['3d-detail-preview.jpg', [73545, '67c354decc43afced6cf0aa61bf6cc4172031c5eda79d963807e7f98a067d94b']],
  ['ct-preview.png', [137738, 'e771bf1c5e614020c45342f3e5c6843f1d9d0032e5939d2459b139099a1f3ff2']],
  ['mri-preview.png', [546242, '35580ccf620795682545c3d328ed06085d4f2560902181f6f67f7999a2e2f2a0']],
  ['ultrasound-preview.jpg', [128929, 'f177e3bc56a35bd16b48b48ee1cd8d4f41a90b9610217f4175f0a61b205b6239']],
  ['xray-preview.png', [4198015, 'a43431b089a6dfab031c10eceef6c821e4f326913bf9015f73f4a1f0446d2be1']],
]);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const guidance = 'Restore the existing admitted public preview assets locally from the original project or an independently verified asset backup; source-only backups may omit these binaries. Do not download, regenerate, or upload scans.';

function fail(reason) { throw new Error(`Public Atlas preview preflight: ${reason}. ${guidance}`); }
function directory(path) {
  let stat;
  try { stat = lstatSync(path); } catch { fail(`missing directory ${path}`); }
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`unsafe non-directory or symlink ${path}`);
}
function regular(path, maxBytes) {
  let stat;
  try { stat = lstatSync(path); } catch { fail(`missing existing public file ${path}`); }
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`unsafe nonregular or symlink ${path}`);
  if (stat.size > maxBytes) fail(`oversized public file ${path} (${stat.size} > ${maxBytes} bytes)`);
  return stat;
}
// Read no more than the admitted length plus one byte, even if a file grows during inspection.
function boundedBytes(path, size) {
  const before = regular(path, size);
  let fd;
  try { fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW || 0)); }
  catch { fail(`cannot safely open existing public file ${path}`); }
  try {
    const opened = fstatSync(fd);
    if (!opened.isFile() || opened.size > size || opened.size !== before.size ||
        opened.dev !== before.dev || opened.ino !== before.ino)
      fail(`unsafe or changed public file ${path}`);
    const buffer = Buffer.alloc(size + 1);
    let count = 0;
    while (count < buffer.length) {
      const n = readSync(fd, buffer, count, buffer.length - count, null);
      if (!n) break;
      count += n;
    }
    if (count !== size) fail(`wrong size for ${path} (${count} bytes; expected ${size})`);
    const after = lstatSync(path);
    if (!after.isFile() || after.isSymbolicLink() || after.dev !== opened.dev || after.ino !== opened.ino)
      fail(`unsafe or replaced public file ${path}`);
    return buffer.subarray(0, size);
  } finally { closeSync(fd); }
}
function fields(value, names, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...names].sort()))
    fail(`unexpected ${label} fields`);
}

/** Validate the five known public descriptors before accepting the pinned manifest bytes. */
export function inspectPreviewManifest(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length !== manifestBytes) fail('wrong manifest size');
  let manifest;
  try { manifest = JSON.parse(bytes.toString('utf8')); } catch { fail('invalid manifest JSON'); }
  fields(manifest, ['purpose', 'reviewed', 'images'], 'manifest');
  if (manifest.purpose !== 'Representative navigation previews only; see NOTICES.md for source and reuse conditions.' ||
      manifest.reviewed !== '2026-09-13' || !Array.isArray(manifest.images) || manifest.images.length !== expected.size)
    fail('unexpected public preview manifest identity or count');
  const seen = new Set();
  for (const entry of manifest.images) {
    fields(entry, ['file', 'bytes', 'sha256'], 'image descriptor');
    if (typeof entry.file !== 'string' || !/^[a-z0-9-]+\.(?:jpg|png)$/.test(entry.file))
      fail(`unsafe preview basename ${String(entry.file)}`);
    if (seen.has(entry.file)) fail(`duplicate preview ${entry.file}`);
    seen.add(entry.file);
    const pin = expected.get(entry.file);
    if (!pin) fail(`unknown preview ${entry.file}`);
    if (entry.bytes !== pin[0] || entry.sha256 !== pin[1]) fail(`wrong pinned size or hash for ${entry.file}`);
  }
  if (digest(bytes) !== manifestSha256) fail('changed pinned preview manifest');
  return manifest.images;
}

/** Read only the pinned public tile set and its attribution metadata. Safe to call before and after a test run. */
export function verifyPublicPreviewAssets(root) {
  const base = resolve(root);
  directory(base);
  let cursor = base;
  for (const part of relativeDirectory) { cursor = join(cursor, part); directory(cursor); }
  const manifest = inspectPreviewManifest(boundedBytes(join(cursor, manifestName), manifestBytes));
  const notices = boundedBytes(join(cursor, noticesName), noticesBytes);
  if (digest(notices) !== noticesSha256) fail(`changed attribution notices ${join(cursor, noticesName)}`);
  const assets = manifest.map(({ file, bytes, sha256 }) => {
    const path = join(cursor, file);
    if (digest(boundedBytes(path, bytes)) !== sha256) fail(`changed public preview bytes ${path}`);
    return { file: `public/media/atlas/${file}`, bytes, sha256 };
  });
  return {
    schema: 'vm-public-preview-preflight-1', manifestSha256, noticesSha256, assets,
    claimScope: 'Only five existing public preview tiles and their pinned attribution metadata; no clinical, privacy, rights or release approval.',
  };
}

const self = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (self) {
  const args = process.argv.slice(2);
  const root = args.length === 0 ? resolve(dirname(fileURLToPath(import.meta.url)), '..') :
    args.length === 2 && args[0] === '--root' ? args[1] : null;
  if (root === null) { console.error('Usage: node scripts/public-preview-preflight.mjs [--root WEBSITE_ROOT]'); process.exitCode = 2; }
  else try { console.log(JSON.stringify(verifyPublicPreviewAssets(root))); }
  catch (error) { console.error(String(error)); process.exitCode = 1; }
}
