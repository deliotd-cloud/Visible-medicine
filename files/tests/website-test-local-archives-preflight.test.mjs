import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertWebsiteLocalTestArchives, requiredLocalTestArchives } from '../scripts/website-test-local-archives-preflight.mjs';

const path = 'tests/fixtures/synthetic-archive.json';
const bytes = '{"synthetic":true}\n';
const sha256 = createHash('sha256').update(bytes).digest('hex');
const spec = [{ path, sha256 }];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'vm-local-archives-'));
  mkdirSync(join(root, 'tests', 'fixtures'), { recursive: true });
  return root;
}

test('fixed production list has five unique local fixture paths and SHA-256 digests', () => {
  assert.deepEqual(requiredLocalTestArchives, [
    { path: 'tests/fixtures/hand-vessel-xray-589-delivery-archive-v3.json', sha256: '422e4ccfeb1f440a31fb6a1cf218c9171b0cc0471d66911d2cafdb51e7934904' },
    { path: 'tests/fixtures/head-pilot-9fba-epoch.json', sha256: '644bae978dcd4e2a167e119788fdf7d8e7ce32052b375e431159405a766b87c0' },
    { path: 'tests/fixtures/historical-inline-45-epoch.json', sha256: '6f64fd26f4608c813aeb9c08bb98e3c3293f593fd2675b4c27f39350c2f3ba8e' },
    { path: 'tests/fixtures/historical-inline-46-epoch.json', sha256: '75281702b12599ee02c2d15c2996bea149062a4ad509040baf381eb1d190c9c3' },
    { path: 'tests/fixtures/intracranial-us-589-delivery-archive.json', sha256: '650ceba861ab61694d07a8bd8c0b7736b70149d7bf565f853e7aed3dc06c543b' },
  ]);
  assert.equal(requiredLocalTestArchives.length, 5);
  assert.equal(new Set(requiredLocalTestArchives.map(item => item.path)).size, 5);
  for (const item of requiredLocalTestArchives) {
    assert.match(item.path, /^tests\/fixtures\/[A-Za-z0-9._/-]+\.json$/);
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
  }
});

test('nonregular fixture directory refuses without creating output', async () => {
  const root = mkdtempSync(join(tmpdir(), 'vm-local-archives-'));
  mkdirSync(join(root, 'tests'));
  writeFileSync(join(root, 'tests', 'fixtures'), 'not a directory');
  await assert.rejects(assertWebsiteLocalTestArchives(root, spec), /nonregular or symlink directory/);
  assert.equal(existsSync(join(root, '.local')), false);
});

test('matching synthetic archive passes without changing its bytes or creating output', async () => {
  const root = fixture();
  writeFileSync(join(root, path), bytes);
  assert.deepEqual(await assertWebsiteLocalTestArchives(root, spec), { checkedLocalArchives: 1 });
  assert.equal(readFileSync(join(root, path), 'utf8'), bytes);
  assert.equal(existsSync(join(root, '.local')), false);
});

test('missing and changed local evidence fail with a local restoration instruction', async () => {
  const root = fixture();
  await assert.rejects(assertWebsiteLocalTestArchives(root, spec), /synthetic-archive\.json \(missing\).*Restore trusted local test evidence.*do not add these archives to public source exports/);
  writeFileSync(join(root, path), '{"synthetic":false}\n');
  await assert.rejects(assertWebsiteLocalTestArchives(root, spec), /SHA-256 mismatch/);
  assert.equal(existsSync(join(root, '.local')), false);
});

test('symlink archive and malformed specifications fail closed', async (t) => {
  const root = fixture();
  const target = join(root, 'safe.json');
  writeFileSync(target, bytes);
  try { symlinkSync(target, join(root, path)); }
  catch (error) {
    if (error?.code !== 'EPERM') throw error;
    t.diagnostic('Windows denied symlink creation; symlink rejection not exercised here');
  }
  if (existsSync(join(root, path)))
    await assert.rejects(assertWebsiteLocalTestArchives(root, spec), /nonregular or symlink file/);
  await assert.rejects(assertWebsiteLocalTestArchives(root, [{ path: 'tests/fixtures/../outside.json', sha256 }]), /invalid required archive specification/);
  assert.equal(readFileSync(target, 'utf8'), bytes);
});
