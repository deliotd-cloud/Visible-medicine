import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {createServer, request as httpRequest} from 'node:http';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {createHeadTransferDiagnostics, headTransferDiagnosticsEnabled,
  HEAD_TRANSFER_TRACE_LIMIT, HEAD_TRANSFER_TRACE_PREFIX} from '../scripts/head-transfer-diagnostics.mjs';
import {localHeadAtlasPlugin} from '../scripts/local-head-atlas-plugin.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const decode = line => {
  assert.ok(line.startsWith(HEAD_TRANSFER_TRACE_PREFIX));
  const record = JSON.parse(line.slice(HEAD_TRANSFER_TRACE_PREFIX.length));
  assert.ok(Object.keys(record).every(key => ['schema', 'request', 'kind', 'phase', 'elapsedMs', 'bytes', 'status'].includes(key)));
  return record;
};

test('diagnostics require the exact process-only serve opt-in', () => {
  assert.equal(headTransferDiagnosticsEnabled('serve', '1'), true);
  for (const command of ['serve', 'build', 'preview', undefined]) {
    for (const value of [undefined, '', '0', 'true', true, 1, ' 1', '1 ']) {
      assert.equal(headTransferDiagnosticsEnabled(command, value), false);
    }
  }
  assert.equal(headTransferDiagnosticsEnabled('build', '1'), false);
});

test('disabled or invalid trace calls never access the clock or writer', () => {
  const fail = () => assert.fail('disabled diagnostics must be inert');
  for (const enabled of [false, undefined, 1, '1']) {
    createHeadTransferDiagnostics({enabled, write: fail, now: fail})('asset')('asset-read');
  }
  const begin = createHeadTransferDiagnostics({enabled: true, write: fail, now: fail});
  begin('/private/path')('asset-read');
  createHeadTransferDiagnostics({enabled: true, now: fail})('asset')('asset-read');
});

test('events are bounded and contain only closed fields and validated numeric details', () => {
  const lines = [];
  let time = 10;
  const begin = createHeadTransferDiagnostics({enabled: true, write: line => lines.push(line), now: () => time++});
  const trace = begin('asset');
  trace('asset-read', {bytes: 4, status: 200, path: '/private/path', hash: 'secret', error: new Error('secret'), buffer: Buffer.from('secret')});
  trace('not-a-phase', {bytes: 9});
  trace('asset-verified', {bytes: -1, status: 403});
  trace('asset-verified', {bytes: 536870913, status: '200'});
  trace('asset-verified', {bytes: NaN});
  trace('asset-verified', {bytes: 1.5});
  for (let index = 0; index < HEAD_TRANSFER_TRACE_LIMIT + 4; index++) begin('manifest')('manifest-verified');
  assert.equal(lines.length, HEAD_TRANSFER_TRACE_LIMIT);
  assert.deepEqual(decode(lines[1]), {schema: 1, request: 1, kind: 'asset', phase: 'asset-read', elapsedMs: 2, bytes: 4, status: 200});
  for (const line of lines.slice(2, 6)) {
    const record = decode(line);
    assert.equal('bytes' in record, false);
    assert.equal('status' in record, false);
  }
  assert.equal(lines.join('\n').includes('secret'), false);
  assert.equal(lines.join('\n').includes('/private'), false);
  assert.ok(lines.every(line => Number.isSafeInteger(decode(line).elapsedMs)));
});

test('clock regressions, invalid values and throws cannot produce invalid timings', () => {
  const times = [100, 110, 95, NaN, Infinity, -Infinity, 999999999, undefined];
  const lines = [];
  const trace = createHeadTransferDiagnostics({enabled: true, write: line => lines.push(line), now: () => {
    if (!times.length) throw new Error('clock');
    return times.shift();
  }})('asset');
  for (let index = 0; index < 10; index++) trace('asset-read');
  const elapsed = lines.map(line => decode(line).elapsedMs);
  assert.equal(elapsed[0], 10);
  assert.ok(elapsed.every((value, index) => value >= 0 && value <= 86400000 && (!index || value >= elapsed[index - 1])));
  assert.equal(elapsed.at(-1), 86400000);
});

test('failing observers and hostile details remain bounded and do not throw', () => {
  let writes = 0;
  const trace = createHeadTransferDiagnostics({enabled: true, write: () => { writes++; throw new Error('observer'); }})('asset');
  assert.doesNotThrow(() => trace('asset-read', null));
  assert.doesNotThrow(() => trace('asset-read', {get bytes() { throw new Error('details'); }}));
  for (let index = 0; index < HEAD_TRANSFER_TRACE_LIMIT * 2; index++) assert.doesNotThrow(() => trace('asset-read'));
  assert.equal(writes, HEAD_TRANSFER_TRACE_LIMIT);
});

async function fixture(run) {
  const parent = path.resolve(os.tmpdir());
  const root = await mkdtemp(path.join(parent, 'vm-head-transfer-'));
  const bytes = Buffer.from('PUBLIC_SYNTHETIC_BYTES_ONLY');
  const manifest = Buffer.from(JSON.stringify({
    schema_version: 'visible-medicine.head-browser/1', version: '1.0.2', byte_order: 'little', source_studies_are_distinct: true,
    studies: Object.fromEntries(['CT', 'MRI'].map(modality => [modality, {image: {file: `${modality}/image.raw`, sha256: hash(bytes)}, entries: []}]))
  }));
  try {
    for (const modality of ['CT', 'MRI']) {
      await mkdir(path.join(root, modality));
      await writeFile(path.join(root, modality, 'image.raw'), bytes);
    }
    await writeFile(path.join(root, 'manifest.json'), manifest);
    return await run({root, bytes, manifest, expectedHash: hash(manifest)});
  } finally {
    assert.equal(path.dirname(path.resolve(root)), parent);
    assert.ok(path.basename(root).startsWith('vm-head-transfer-'));
    await rm(root, {recursive: true, force: true});
  }
}

async function withServer(options, run, publicAddress = false) {
  let middleware;
  const vite = {middlewares: {use(fn) { middleware = fn; }}};
  localHeadAtlasPlugin(options).configureServer(vite);
  const server = createServer((req, res) => {
    const next = () => {res.statusCode = 404; res.end('Unavailable');};
    if (middleware) middleware(req, res, next); else next();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  // Simulated address only: never binds a public interface.
  vite.httpServer = publicAddress ? {address: () => ({...address, address: '0.0.0.0'})} : server;
  try {
    return await run(async (route, init = {}) => {
      // Raw HTTP intentionally preserves forged Host/Origin headers. Fetch may
      // silently replace Host, which tests the client rather than this gate.
      return await new Promise((resolve, reject) => {
        const request = httpRequest(`http://127.0.0.1:${address.port}${route}`, {headers: {'X-Visible-Medicine-Local': '1', ...init.headers}, method: init.method ?? 'GET'}, response => {
          const chunks = [];
          response.on('data', chunk => chunks.push(chunk));
          response.once('error', reject);
          response.once('end', () => resolve({status: response.statusCode, headers: new Headers(response.headers), bytes: Buffer.concat(chunks)}));
        });
        request.once('error', reject);
        request.end();
      });
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}
const asset = '/__vm-local-head/asset?path=CT%2Fimage.raw';
const manifestRoute = '/__vm-local-head/manifest.json';

test('enabled tracing preserves exact bytes, status and security headers; default remains silent', async () => fixture(async data => {
  let enabledHeaders;
  for (const diagnostics of [true, false, undefined]) {
    const lines = [];
    await withServer({...data, diagnostics, writeDiagnostic: line => lines.push(line)}, async request => {
      const response = await request(asset);
      assert.equal(response.status, 200);
      assert.deepEqual(response.bytes, data.bytes);
      const stable = Object.fromEntries([...response.headers].filter(([key]) => !['date', 'connection', 'keep-alive'].includes(key)));
      if (diagnostics) enabledHeaders = stable; else assert.deepEqual(stable, enabledHeaders);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('x-visible-medicine-local'), '1');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('content-type'), 'application/octet-stream');
    });
    assert.deepEqual(lines.map(line => decode(line).phase), diagnostics ? ['start', 'manifest-verified', 'asset-read', 'asset-verified', 'response-finished'] : []);
    if (diagnostics) assert.equal(decode(lines.at(-1)).bytes, data.bytes.length);
  }
}));

test('manifest events describe server completion only and never contain source bytes or identifiers', async () => fixture(async data => {
  const lines = [];
  await withServer({...data, diagnostics: true, writeDiagnostic: line => lines.push(line)}, async request => {
    const response = await request(manifestRoute);
    assert.deepEqual(response.bytes, data.manifest);
  });
  const records = lines.map(decode);
  assert.deepEqual(records.map(record => record.phase), ['start', 'manifest-verified', 'response-finished']);
  assert.ok(records.every(record => record.kind === 'manifest' && record.request === 1));
  assert.equal(records.at(-1).status, 200);
  assert.equal(records.at(-1).bytes, data.manifest.length);
  for (const secret of [data.root, data.expectedHash, data.bytes.toString(), 'image.raw', 'source_studies', 'sha256']) assert.equal(lines.join('\n').includes(secret), false);
}));

test('unauthorized, nonroute, wrong method, disabled-root and invalid-pin requests produce no diagnostics', async () => fixture(async data => {
  const lines = [];
  const config = {...data, diagnostics: true, writeDiagnostic: line => lines.push(line)};
  await withServer(config, async request => {
    for (const [route, init, status] of [
      [manifestRoute, {headers: {'X-Visible-Medicine-Local': ''}}, 403],
      [manifestRoute, {headers: {Origin: 'http://foreign.invalid'}}, 403],
      [manifestRoute, {headers: {'Sec-Fetch-Site': 'cross-site'}}, 403],
      [manifestRoute, {headers: {Host: 'foreign.invalid:123'}}, 403],
      [manifestRoute, {method: 'POST'}, 405],
      ['/unrelated?secret=not-logged', {}, 404],
    ]) assert.equal((await request(route, init)).status, status);
  });
  await withServer(config, async request => assert.equal((await request(manifestRoute)).status, 403), true);
  await withServer({...config, root: undefined}, async request => assert.equal((await request(manifestRoute)).status, 404));
  await withServer({...config, expectedHash: 'invalid'}, async request => assert.equal((await request(manifestRoute)).status, 404));
  assert.deepEqual(lines, []);
}));

test('refusals stay sanitized; changing a manifest or asset never bypasses a hash gate', async () => fixture(async data => {
  const lines = [];
  await withServer({...data, diagnostics: true, writeDiagnostic: line => lines.push(line)}, async request => {
    for (const route of [`${asset}&path=private-name`, '/__vm-local-head/asset?path=..%2Fprivate-name', `${manifestRoute}?private-name=1`]) {
      const response = await request(route);
      assert.equal(response.status, 404);
      assert.equal(response.bytes.toString(), 'Unavailable');
    }
    await writeFile(path.join(data.root, 'CT', 'image.raw'), 'CHANGED_PRIVATE_NAME');
    assert.equal((await request(asset)).status, 404);
    await writeFile(path.join(data.root, 'manifest.json'), '{}');
    assert.equal((await request(manifestRoute)).status, 404);
  });
  const records = lines.map(decode);
  assert.equal(records.filter(record => record.phase === 'refused').length, 5);
  assert.equal(records.filter(record => record.phase === 'asset-verified').length, 0);
  assert.equal(records.filter(record => record.phase === 'response-finished' && record.status === 404 && record.bytes === 11).length, 5);
  for (const secret of ['private-name', 'CHANGED_PRIVATE_NAME', data.root, data.expectedHash]) assert.equal(lines.join('\n').includes(secret), false);
}));

test('throwing diagnostic writer does not alter a successful transport result', async () => fixture(async data => {
  await withServer({...data, diagnostics: true, writeDiagnostic: () => {throw new Error('observer');}}, async request => {
    const response = await request(asset);
    assert.equal(response.status, 200);
    assert.deepEqual(response.bytes, data.bytes);
  });
}));

test('an early response close is distinct from finish without recording request strings', async () => fixture(async data => {
  const lines = [];
  let middleware;
  localHeadAtlasPlugin({...data, diagnostics: true, writeDiagnostic: line => lines.push(line)}).configureServer({
    middlewares: {use(fn) {middleware = fn;}}, httpServer: {address: () => ({address: '127.0.0.1', port: 1234})}
  });
  const response = new EventEmitter();
  response.writableFinished = false;
  response.setHeader = () => {};
  response.end = () => response.emit('close');
  await middleware({url: asset, method: 'GET', socket: {remoteAddress: '127.0.0.1'}, headers: {host: '127.0.0.1:1234', 'x-visible-medicine-local': '1'}}, response, () => assert.fail('unexpected next'));
  assert.equal(lines.map(decode).filter(record => record.phase === 'response-closed-before-finish').length, 1);
  assert.equal(lines.map(decode).filter(record => record.phase === 'response-finished').length, 0);
}));

test('Vite wiring uses process-only exact serve opt-in and preserves the source root policy', async () => {
  const config = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');
  assert.ok(config.includes('diagnostics: headTransferDiagnosticsEnabled(command, process.env.VM_LOCAL_HEAD_DIAGNOSTICS)'));
  assert.ok(config.includes("process.env.VM_LOCAL_HEAD_ROOT ?? loadEnv(mode, process.cwd(), 'VM_LOCAL_HEAD_').VM_LOCAL_HEAD_ROOT"));
  assert.equal(config.includes('VITE_VM_LOCAL_HEAD_DIAGNOSTICS'), false);
});
