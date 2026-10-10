import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {lstat, readFile, realpath} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {validatePlexusScene} from './open3dmodel-plexus-scene.mjs';

const names = ['THIRD_PARTY_NOTICES.txt', 'app.js', 'index.html', 'scene.json'];
const types = {'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','scene.json':'application/json; charset=utf-8','THIRD_PARTY_NOTICES.txt':'text/plain; charset=utf-8'};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

export async function open3dmodelPlexusPreviewServer(directory) {
  const folder = resolve(directory);
  assert(!(await lstat(folder)).isSymbolicLink(), 'Preview directory is a link');
  const canonical = await realpath(folder);
  assert.equal(canonical, folder, 'Preview directory changed');
  const manifestPath = join(folder, 'manifest.json');
  assert(!(await lstat(manifestPath)).isSymbolicLink(), 'Manifest is a link');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.equal(manifest.purpose, 'open3dmodel-plexus-source-review');
  assert.deepEqual(manifest.files.map(file => file.name).sort(), names);
  const rows = new Map(manifest.files.map(file => [file.name, file]));
  assert.equal(rows.size, names.length);
  for (const row of rows.values()) {
    assert(Number.isSafeInteger(row.bytes) && row.bytes > 0 && digest(row.sha256), 'Invalid asset manifest');
  }
  async function verified(name) {
    const path = join(folder, name);
    assert(!(await lstat(path)).isSymbolicLink(), 'Preview asset is a link');
    assert.equal(await realpath(path), path, 'Preview asset escaped directory');
    const bytes = await readFile(path), row = rows.get(name);
    assert.equal(bytes.length, row.bytes, 'Preview asset size changed');
    assert.equal(sha(bytes), row.sha256, 'Preview asset hash changed');
    return bytes;
  }
  for (const name of names) await verified(name);
  const scene = JSON.parse((await verified('scene.json')).toString('utf8'));
  assert.equal(scene.schemaVersion, 1);
  assert.equal(scene.purpose, manifest.purpose);
  assert.equal(scene.units, 'unknown-source-units');
  assert.equal(scene.coordinateFrame, 'unaltered-source-OBJ');
  assert.equal(scene.registered, false);
  assert.equal(scene.mirrored, false);
  assert.equal(scene.clinicalApproved, false);
  assert.equal(scene.admissions, 0);
  assert.equal(scene.license, 'CC-BY-SA-4.0');
  for (const field of ['sourceObjSha256','sourceInventorySha256','conversionReportSha256']) assert(digest(scene[field]), 'Invalid source revision');
  assert(Array.isArray(scene.objects) && scene.objects.some(item => item.core === true) && Array.isArray(scene.held), 'Missing core source objects');
  validatePlexusScene(scene);

  const server = createServer(async (req, res) => {
    try {
      const host = `127.0.0.1:${server.address().port}`;
      if (req.headers.host !== host || !['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress) ||
          (req.headers.origin && req.headers.origin !== `http://${host}`)) { res.writeHead(403).end(); return; }
      if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405,{Allow:'GET, HEAD'}).end(); return; }
      // Compare the raw request target before URL parsing can collapse dot segments.
      const rawPath = req.url;
      if (rawPath !== '/' && !names.some(name => rawPath === `/${name}`)) { res.writeHead(404).end(); return; }
      const name = rawPath === '/' ? 'index.html' : rawPath.slice(1);
      const bytes = await verified(name);
      res.writeHead(200, {'Content-Type':types[name],'Content-Length':bytes.length,'Cache-Control':'no-store',
        'X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin',
        'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(503, {'Cache-Control':'no-store'}).end('Pinned source preview unavailable'); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  return server;
}
