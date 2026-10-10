import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { test } from 'node:test';

const staging = resolve(tmpdir(), 'visible-medicine-recovery-tests');
const sourceRoot = resolve(import.meta.dirname, '..');
const zipName = 'models/bodyparts3d-v3/abdominal-wall/original-source.zip';
const pinnedHash = 'f9b95871318c4e550a58cca06a7f444e0f4f4ea1949709bae963acafa78b227d';
const pinnedBytes = 14227760;
const syntheticZip = Buffer.from('synthetic ZIP fixture; never a product archive');
const syntheticHash = createHash('sha256').update(syntheticZip).digest('hex');
const metadataText = (sha256 = pinnedHash, bytes = pinnedBytes) => JSON.stringify({
  sourcePath: 'public/' + zipName,
  sha256,
  bytes,
  inRuntime: false,
  officialDownload: 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_99.zip',
}, null, 2) + '\n';

const run = (script, args = []) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
const fails = (result, pattern) => {
  assert.notEqual(result.status, 0, `Unexpected success: ${result.stdout}`);
  assert.match(result.stderr, pattern);
};

test('packaging authoring commands do not silently change the renderer package fingerprint', async () => {
  const packageText = (await readFile(join(sourceRoot, 'package.json'), 'utf8')).replaceAll('\r\n', '\n');
  const pkg = JSON.parse(packageText);
  const renderer = JSON.parse(await readFile(join(sourceRoot, 'content/body-renderer-revision.json'), 'utf8'));
  const pin = renderer.dependencies.find(row => row.path === 'package.json');
  assert.ok(pin, 'package.json remains an explicit renderer dependency');
  assert.equal(createHash('sha256').update(packageText).digest('hex'), pin.sha256,
    'Packaging-only package changes must not leave review renderer metadata stale');
  assert.ok(!pkg.scripts.build.includes('verify-source-recovery.mjs'), 'Authoring source verification stays outside release build');
  assert.ok(!Object.keys(pkg.scripts).some(name => name.startsWith('source-archive:')), 'Use direct authoring commands without changing the renderer seed');
});

test('recovery packaging is pinned, source-independent, and fail-closed', async t => {
  await mkdir(staging, { recursive: true });
  const base = await mkdtemp(join(staging, 'fixture-'));
  const stagingReal = await realpath(staging);
  assert.ok((await realpath(base)).startsWith(stagingReal + sep));
  let index = 0;
  const fixture = async (syntheticPin = false) => {
    const root = join(base, String(++index));
    const scripts = join(root, 'scripts');
    const runtime = join(root, 'dist/client');
    const target = join(runtime, zipName);
    const metadata = join(runtime, 'models/recovery-policy.json');
    await mkdir(scripts, { recursive: true });
    await mkdir(join(runtime, 'models/bodyparts3d-v3/abdominal-wall'), { recursive: true });
    const originalGuard = await readFile(join(sourceRoot, 'scripts/exclude-source-recovery.mjs'), 'utf8');
    let guardText = originalGuard;
    if (syntheticPin) {
      assert.equal(guardText.split(pinnedHash).length, 2, 'Expected exactly one pinned hash');
      assert.equal(guardText.split(String(pinnedBytes)).length, 2, 'Expected exactly one pinned size');
      guardText = guardText.replace(pinnedHash, syntheticHash).replace(String(pinnedBytes), String(syntheticZip.length));
    }
    await writeFile(join(scripts, 'exclude-source-recovery.mjs'), guardText);
    await copyFile(join(sourceRoot, 'scripts/verify-source-recovery.mjs'), join(scripts, 'verify-source-recovery.mjs'));
    return { root, runtime, target, metadata, guard: join(scripts, 'exclude-source-recovery.mjs'), verifier: join(scripts, 'verify-source-recovery.mjs') };
  };
  try {
    const absent = await fixture();
    assert.equal(run(absent.guard).status, 0, 'Default guard must work without authoring original');
    assert.equal(await readFile(absent.metadata, 'utf8'), metadataText());
    assert.equal(run(absent.guard, ['--check']).status, 0);
    fails(run(absent.guard, ['--check', '--check']), /Unexpected arguments/);
    fails(run(absent.guard, ['--bad']), /Unexpected arguments/);
    fails(run(absent.verifier), /ENOENT/);

    const poison = await fixture();
    await mkdir(join(poison.root, 'public', zipName), { recursive: true });
    assert.equal(run(poison.guard).status, 0, 'Guard must not inspect the authoring source path');

    const noTargetDirectory = await fixture();
    await rm(join(noTargetDirectory.runtime, 'models/bodyparts3d-v3'), { recursive: true });
    assert.equal(run(noTargetDirectory.guard).status, 0, 'Guard must work when no source ZIP directory was copied');
    assert.equal(await readFile(noTargetDirectory.metadata, 'utf8'), metadataText());

    const valid = await fixture(true);
    await writeFile(valid.target, syntheticZip);
    fails(run(valid.guard, ['--check']), /Recovery ZIP must not be in the live release/);
    assert.equal(run(valid.guard).status, 0, 'Pinned generated ZIP should be removed');
    await assert.rejects(lstat(valid.target), { code: 'ENOENT' });
    assert.equal(await readFile(valid.metadata, 'utf8'), metadataText(syntheticHash, syntheticZip.length));

    const badSize = await fixture(true);
    await writeFile(badSize.target, 'not a ZIP');
    fails(run(badSize.guard), /Unexpected generated ZIP size/);
    assert.equal((await lstat(badSize.target)).size, 9);

    const badHash = await fixture(true);
    const bytes = Buffer.from(syntheticZip);
    bytes[0] ^= 1;
    await writeFile(badHash.target, bytes);
    fails(run(badHash.guard), /Unexpected generated ZIP hash/);
    assert.equal((await lstat(badHash.target)).size, syntheticZip.length);

    const wrongMetadata = await fixture();
    await writeFile(wrongMetadata.metadata, '{}\n');
    fails(run(wrongMetadata.guard), /Recovery metadata differs/);
    fails(run(wrongMetadata.guard, ['--check']), /Recovery metadata differs/);
    const missingMetadata = await fixture();
    fails(run(missingMetadata.guard, ['--check']), /Recovery metadata is missing/);

    const linkedTarget = await fixture();
    try {
      await symlink(join(base, 'outside.zip'), linkedTarget.target, 'file');
      fails(run(linkedTarget.guard), /Recovery target must be a regular file/);
    } catch (error) {
      if (error.code !== 'EPERM') throw error;
      t.diagnostic('File symlink case unavailable: Windows denied symlink creation');
    }

    const linkedRuntime = await fixture();
    const actualRuntime = join(linkedRuntime.root, 'actual-client');
    await mkdir(join(actualRuntime, 'models/bodyparts3d-v3/abdominal-wall'), { recursive: true });
    await rm(linkedRuntime.runtime, { recursive: true });
    try {
      await symlink(actualRuntime, linkedRuntime.runtime, 'junction');
      fails(run(linkedRuntime.guard), /Linked or non-directory runtime path/);
    } catch (error) {
      if (error.code !== 'EPERM') throw error;
      t.diagnostic('Runtime junction case unavailable: Windows denied junction creation');
    }

    const linkedTargetDirectory = await fixture();
    const actualTargetDirectory = join(linkedTargetDirectory.root, 'outside-target-directory');
    await mkdir(actualTargetDirectory);
    await rm(dirname(linkedTargetDirectory.target), { recursive: true });
    try {
      await symlink(actualTargetDirectory, dirname(linkedTargetDirectory.target), 'junction');
      fails(run(linkedTargetDirectory.guard), /Linked or non-directory runtime path/);
    } catch (error) {
      if (error.code !== 'EPERM') throw error;
      t.diagnostic('Target-directory junction case unavailable: Windows denied junction creation');
    }

    const wrongSource = await fixture();
    const authoring = join(wrongSource.root, 'public/models/bodyparts3d-v3/abdominal-wall');
    await mkdir(authoring, { recursive: true });
    await writeFile(join(authoring, 'original-source.zip'), 'wrong');
    fails(run(wrongSource.verifier), /Source recovery archive size differs/);
    const linkedSourceDirectory = await fixture();
    const outsideSourceDirectory = join(linkedSourceDirectory.root, 'outside-source-directory');
    await mkdir(outsideSourceDirectory);
    await rm(join(linkedSourceDirectory.root, 'public/models/bodyparts3d-v3/abdominal-wall'), { recursive: true, force: true });
    await mkdir(join(linkedSourceDirectory.root, 'public/models/bodyparts3d-v3'), { recursive: true });
    try {
      await symlink(outsideSourceDirectory, join(linkedSourceDirectory.root, 'public/models/bodyparts3d-v3/abdominal-wall'), 'junction');
      fails(run(linkedSourceDirectory.verifier), /Linked or non-directory source path/);
    } catch (error) {
      if (error.code !== 'EPERM') throw error;
      t.diagnostic('Source-directory junction case unavailable: Windows denied junction creation');
    }
  } finally {
    assert.ok((await realpath(base)).startsWith(stagingReal + sep), 'Fixture cleanup escaped test staging');
    await rm(base, { recursive: true, force: true });
  }
});
