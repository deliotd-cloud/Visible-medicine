import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, readFile, rm, unlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const serverScript = fileURLToPath(new URL('./serve-choroidal-context-preview.mjs', import.meta.url));
const fixturePrefix = 'choroidal-context-server-test-';
const digest = (value) => createHash('sha256').update(value).digest('hex');
const assets = new Map([
  ['THIRD_PARTY_NOTICES.txt', 'Synthetic fixture notice.\n'],
  ['app.js', 'console.log("synthetic");\n'],
  ['index.html', '<!doctype html><title>Synthetic preview</title>\n'],
  ['scene.json', '{"synthetic":true}\n'],
]);

async function fixture() {
  const base = await mkdtemp(join(tmpdir(), fixturePrefix));
  const cwd = join(base, 'outputs');
  const preview = join(base, 'work', 'choroidal-context-preview-20260930');
  const reportPath = join(cwd, 'content', 'choroidal-context-review.json');
  await mkdir(join(cwd, 'content'), {recursive: true});
  await mkdir(preview, {recursive: true});
  const report = '{"synthetic":true}\n';
  await writeFile(reportPath, report);
  const files = [];
  for (const [name, content] of assets) {
    const bytes = Buffer.from(content);
    await writeFile(join(preview, name), bytes);
    files.push({name, bytes: bytes.length, sha256: digest(bytes)});
  }
  const manifest = {purpose: 'source-only-choroidal-context-review', reportSha256: digest(report), files};
  await writeFile(join(preview, 'manifest.json'), JSON.stringify(manifest));
  return {base, cwd, preview, reportPath, manifest};
}

async function cleanFixture(base) {
  const target = resolve(base);
  assert.equal(dirname(target), resolve(tmpdir()));
  assert.match(basename(target), /^choroidal-context-server-test-[A-Za-z0-9_-]+$/);
  await rm(target, {recursive: true, force: true});
}

function rejectedAtStartup(cwd, expected) {
  const result = spawnSync(process.execPath, [serverScript], {
    cwd, encoding: 'utf8', timeout: 10000, windowsHide: true,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.notEqual(result.status, 0, 'Invalid preview unexpectedly started');
  assert.equal(result.stdout, '', 'Invalid preview announced a listening URL');
  assert.match(result.stderr, expected);
}

function waitForListening(child) {
  return new Promise((resolveReady, rejectReady) => {
    let output = '';
    let errors = '';
    const timer = setTimeout(() => rejectReady(new Error(`Preview startup timed out: ${errors}`)), 10000);
    child.stdout.on('data', (chunk) => {
      output += chunk;
      const lineEnd = output.indexOf('\n');
      if (lineEnd < 0) return;
      try {
        clearTimeout(timer);
        resolveReady(JSON.parse(output.slice(0, lineEnd)));
      } catch (error) {
        rejectReady(error);
      }
    });
    child.stderr.on('data', (chunk) => { errors += chunk; });
    child.once('error', (error) => { clearTimeout(timer); rejectReady(error); });
    child.once('exit', (code) => {
      clearTimeout(timer);
      rejectReady(new Error(`Preview exited before listening (${code}): ${errors}`));
    });
  });
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolveStopped) => {
    child.once('exit', resolveStopped);
    child.kill();
  });
}

test('source-only preview serves only pinned loopback GET and HEAD assets', async () => {
  const context = await fixture();
  let child;
  try {
    child = spawn(process.execPath, [serverScript], {
      cwd: context.cwd, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    const ready = await waitForListening(child);
    assert.equal(ready.purpose, context.manifest.purpose);
    assert.equal(ready.reportSha256, context.manifest.reportSha256);
    const url = new URL(ready.url);
    assert.equal(url.hostname, '127.0.0.1');

    const index = await fetch(url);
    assert.equal(index.status, 200);
    assert.equal(await index.text(), assets.get('index.html'));
    assert.equal(index.headers.get('cache-control'), 'no-store');
    assert.equal(index.headers.get('x-content-type-options'), 'nosniff');
    assert.match(index.headers.get('content-security-policy'), /default-src 'none'/);
    assert.match(index.headers.get('content-security-policy'), /script-src 'self'/);
    assert.match(index.headers.get('content-security-policy'), /frame-ancestors 'none'/);

    const app = await fetch(new URL('app.js', url));
    assert.equal(app.status, 200);
    assert.equal(await app.text(), assets.get('app.js'));
    const head = await fetch(new URL('scene.json', url), {method: 'HEAD'});
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('content-length'), String(Buffer.byteLength(assets.get('scene.json'))));
    assert.equal(await head.text(), '');
    assert.equal((await fetch(new URL('unknown.txt', url))).status, 404);
    assert.equal((await fetch(url, {method: 'POST'})).status, 404);
  } finally {
    if (child) await stopChild(child);
    await cleanFixture(context.base);
  }
});

test('source-only preview rejects stale or unsafe startup inputs', async (t) => {
  const cases = [
    ['changed asset SHA', async ({preview}) => {
      const path = join(preview, 'app.js');
      const bytes = await readFile(path);
      bytes[0] ^= 1;
      await writeFile(path, bytes);
    }, /Preview asset changed/],
    ['changed asset bytes', async ({preview}) => {
      const path = join(preview, 'app.js');
      await writeFile(path, Buffer.concat([await readFile(path), Buffer.from('!')]));
    }, /Expected values to be strictly equal/],
    ['changed report hash', async ({reportPath}) => {
      await writeFile(reportPath, '{"synthetic":false}\n');
    }, /Preview report stale/],
    ['missing notice', async ({preview}) => {
      await unlink(join(preview, 'THIRD_PARTY_NOTICES.txt'));
    }, /ENOENT/],
    ['unsafe manifest name', async ({preview, manifest}) => {
      manifest.files[1].name = '../escape.js';
      await writeFile(join(preview, 'manifest.json'), JSON.stringify(manifest));
    }, /Expected values to be strictly deep-equal/],
  ];
  for (const [name, change, diagnostic] of cases) {
    await t.test(name, async () => {
      const context = await fixture();
      try {
        await change(context);
        rejectedAtStartup(context.cwd, diagnostic);
      } finally {
        await cleanFixture(context.base);
      }
    });
  }
});
