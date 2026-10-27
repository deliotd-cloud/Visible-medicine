// Historical a01 title-tour suite. Its seven original cases belong to the
// authenticated 2026-10-26 source epoch, not the current website source.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const receiptFile = 'F:/VisibleMedicine/staging/20261026-title-tour-website/SOURCE_CANDIDATE_V3.json';
const receiptSha256 = '01264592ba332c3ad0f124c5ee9f1f517a231b4a927dda2a8f7e831da5f7c51d';
const historicalWebsite = 'F:/VisibleMedicine/staging/20261026-title-tour-website/website';
const parentFile = 'F:/VisibleMedicine/staging/20261025-compact-access-website/SOURCE_CANDIDATE.json';
const parentSha256 = '78fb4e35a0c9a20347232edfd881f4aeb19ad280fe0d1c6523e699c3496876c1';
const rootRelative = 'tests/regional-tour-title-tour-current.test.mjs';
const rootSha256 = '8a8612d9eaa3ee30cc766a8d21e6aa5f343cfd754d91a027e3beb64fb7384097';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const exactFile = (file, sha) => {
  const bytes = fs.readFileSync(file);
  assert.equal(digest(bytes), sha, `Historical source changed: ${file}`);
  return bytes;
};

test('The authenticated historical a01 title-tour source passes all seven original cases', t => {
  const source = JSON.parse(exactFile(receiptFile, receiptSha256));
  assert.equal(source.schema, 'vm-coherent-title-tour-website-source/1');
  assert.equal(source.website, historicalWebsite);
  assert.equal(source.parent, parentFile);
  assert.equal(source.parentSha256, parentSha256);
  assert.equal(source.atlasHead, 'a01ea4a00740dee0905204a33893761b8ae1ff1e');
  assert.equal(fs.realpathSync(source.website), fs.realpathSync(historicalWebsite));
  exactFile(parentFile, parentSha256);

  // The receipt admits this one historical tree. Verify its complete file set
  // before executing any original test code; reject traversal and substitutions.
  const historicalRoot = fs.realpathSync(historicalWebsite);
  const seen = new Set();
  assert(Array.isArray(source.sourceRows) && source.sourceRows.length > 0);
  for (const row of source.sourceRows) {
    assert.equal(typeof row.path, 'string');
    assert(!seen.has(row.path), `Duplicate historical path: ${row.path}`);
    seen.add(row.path);
    const file = path.resolve(historicalRoot, row.path);
    assert(file.startsWith(historicalRoot + path.sep), `Historical path escapes source: ${row.path}`);
    assert(fs.realpathSync(file).startsWith(historicalRoot + path.sep), `Historical link escapes source: ${row.path}`);
    const bytes = exactFile(file, row.sha256);
    assert.equal(bytes.length, row.bytes, row.path);
  }

  const rows = source.sourceRows.filter(row => row.path === rootRelative);
  assert.equal(rows.length, 1, 'Exactly one original root entry is required');
  assert.equal(rows[0].sha256, rootSha256);
  const rootFile = path.resolve(historicalWebsite, rootRelative);
  assert.equal(rootFile, path.resolve(historicalWebsite, 'tests', 'regional-tour-title-tour-current.test.mjs'));
  assert.equal(fs.realpathSync(rootFile), rootFile, 'Original root cannot be redirected');
  const rootBytes = exactFile(rootFile, rootSha256);
  assert.equal(rootBytes.length, rows[0].bytes);

  for (const dependency of source.dependencies) {
    exactFile(dependency.file, dependency.sha256);
    exactFile(dependency.entry, dependency.entrySha256);
  }

  const child = spawnSync(process.execPath, [
    '--max-old-space-size=1024', '--experimental-strip-types', '--test',
    '--test-reporter=tap', '--test-concurrency=1', rootRelative,
  ], {
    cwd: historicalWebsite,
    env: {
      ...Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(?:path|systemroot|windir|temp|tmp|comspec|pathext|systemdrive)$/i.test(key))),
      NODE_OPTIONS: '--max-old-space-size=1024',
      VM_WEBSITE_ROOT: historicalWebsite,
      VM_ATLAS_SOURCE_REPO: source.atlas,
      ATLAS_SOURCE_REPO: source.atlas,
      VM_CURRENT_SOURCE_RECEIPT: receiptFile,
      VM_CURRENT_SOURCE_SHA256: receiptSha256,
    },
    encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  const output = `${child.stdout ?? ''}\n${child.stderr ?? ''}`;
  assert.ifError(child.error);
  assert.equal(child.signal, null, output);
  assert.equal(child.status, 0, output);
  const counts = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(key => {
    const lines = [...(child.stdout ?? '').matchAll(new RegExp(`^# ${key} (\\d+)\\r?$`, 'gm'))];
    assert.equal(lines.length, 1, `Missing or duplicate TAP ${key} count:\n${output}`);
    return [key, Number(lines[0][1])];
  }));
  assert.deepEqual(counts, { tests: 7, pass: 7, fail: 0, cancelled: 0, skipped: 0, todo: 0 }, output);
  exactFile(receiptFile, receiptSha256);
  exactFile(parentFile, parentSha256);
  for (const row of source.sourceRows) exactFile(path.resolve(historicalWebsite, row.path), row.sha256);
  for (const dependency of source.dependencies) { exactFile(dependency.file, dependency.sha256); exactFile(dependency.entry, dependency.entrySha256); }
  t.diagnostic('Authenticated historical child: 7 original cases passed; historical evidence only.');
});
