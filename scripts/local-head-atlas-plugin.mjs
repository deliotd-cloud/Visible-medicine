import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { open, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { createHeadTransferDiagnostics } from './head-transfer-diagnostics.mjs';

const PREFIX = '/__vm-local-head/';
const MANIFEST = `${PREFIX}manifest.json`;
const ASSET = `${PREFIX}asset`;
const MAX_MANIFEST = 16 * 1024 * 1024;
const MAX_ASSET = 512 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const NOFOLLOW = constants.O_NOFOLLOW ?? 0;

function digest(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function validPath(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 240 &&
    !value.startsWith('/') && !value.includes('\\') && !value.includes(':') &&
    !value.includes('%') && !/[\u0000-\u001f\u007f]/.test(value) &&
    value.split('/').every(part => part && part !== '.' && part !== '..');
}
function addAsset(allowed, file, hash) {
  if (!validPath(file) || !HASH.test(hash)) throw new Error('Invalid asset declaration');
  const key = file.toLowerCase();
  const old = allowed.get(key);
  if (old && (old.file !== file || old.hash !== hash)) throw new Error('Conflicting asset declaration');
  allowed.set(key, { file, hash });
  if (allowed.size > 5000) throw new Error('Excessive asset inventory');
}
function parseManifest(bytes) {
  const manifest = JSON.parse(bytes.toString('utf8'));
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) ||
      manifest.schema_version !== 'visible-medicine.head-browser/1' ||
      manifest.version !== '1.0.2' || manifest.byte_order !== 'little' ||
      manifest.source_studies_are_distinct !== true ||
      !manifest.studies || typeof manifest.studies !== 'object') throw new Error('Invalid manifest');
  const allowed = new Map();
  for (const modality of ['CT', 'MRI']) {
    const study = manifest.studies[modality];
    if (!study || typeof study !== 'object' || !study.image || !Array.isArray(study.entries)) throw new Error('Invalid study');
    addAsset(allowed, study.image.file, study.image.sha256);
    for (const entry of study.entries) {
      if (!entry || typeof entry !== 'object') throw new Error('Invalid entry');
      if (entry.mask) addAsset(allowed, entry.mask.file, entry.mask.sha256);
      if (entry.mesh) {
        addAsset(allowed, entry.mesh.positions_file, entry.mesh.positions_sha256);
        addAsset(allowed, entry.mesh.indices_file, entry.mesh.indices_sha256);
      }
    }
  }
  return allowed;
}
function within(root, target) {
  const relative = path.relative(root, target);
  return relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
async function checkedRoot(root) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) throw new Error('Invalid root');
  const resolved = path.resolve(root);
  const stat = await lstat(resolved);
  if (!stat.isDirectory() || stat.isSymbolicLink() || await realpath(resolved) !== resolved) throw new Error('Invalid root');
  return resolved;
}
async function checkedFile(root, relative, limit) {
  if (!validPath(relative)) throw new Error('Invalid path');
  const segments = relative.split('/');
  let current = root;
  for (let index = 0; index < segments.length; index++) {
    current = path.join(current, segments[index]);
    if (!within(root, current)) throw new Error('Invalid path');
    const stat = await lstat(current);
    if (stat.isSymbolicLink() || (index < segments.length - 1 ? !stat.isDirectory() : !stat.isFile() || stat.nlink !== 1)) {
      throw new Error('Invalid file');
    }
  }
  if (!within(root, await realpath(current))) throw new Error('Invalid file');
  const handle = await open(current, constants.O_RDONLY | NOFOLLOW);
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.nlink !== 1 || before.size < 0 || before.size > limit) throw new Error('Invalid file');
    const bytes = Buffer.alloc(before.size);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await handle.read(bytes, offset, bytes.length - offset, offset);
      if (bytesRead === 0) throw new Error('File changed');
      offset += bytesRead;
    }
    const after = await handle.stat();
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || after.nlink !== 1 ||
        !within(root, await realpath(current))) throw new Error('File changed');
    return bytes;
  } finally { await handle.close(); }
}
async function pinnedManifest(root, expectedHash) {
  const bytes = await checkedFile(root, 'manifest.json', MAX_MANIFEST);
  if (digest(bytes) !== expectedHash) throw new Error('Manifest changed');
  return { bytes, allowed: parseManifest(bytes) };
}
function loopback(value) {
  return value === '127.0.0.1' || value === '::1' || value === '::ffff:127.0.0.1';
}
function requestAllowed(req, server) {
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string' || !loopback(address.address)) return false;
  if (!loopback(req.socket?.remoteAddress)) return false;
  const host = req.headers.host;
  if (typeof host !== 'string' || !/^(?:localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(host)) return false;
  const port = Number(host.slice(host.lastIndexOf(':') + 1));
  if (port !== address.port) return false;
  if (req.headers['x-visible-medicine-local'] !== '1') return false;
  const origin = req.headers.origin;
  if (origin !== undefined && origin !== `http://${host}`) return false;
  const site = req.headers['sec-fetch-site'];
  return site === undefined || site === 'same-origin';
}
function reply(res, status, bytes, type) {
  res.statusCode = status;
  res.setHeader('X-Visible-Medicine-Local', '1');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', type ?? 'text/plain; charset=utf-8');
  res.end(bytes ?? 'Unavailable');
}

/** @param {{root?: string, expectedHash?: string, diagnostics?: boolean, writeDiagnostic?: (line: string) => void}} options */
export function localHeadAtlasPlugin({ root, expectedHash, diagnostics = false, writeDiagnostic } = {}) {
  return {
    name: 'visible-medicine-local-head-atlas',
    apply: 'serve',
    enforce: 'pre',
    config(config) {
      if (!root) return;
      const host = config.server?.host;
      if (host !== undefined && host !== 'localhost' && host !== '127.0.0.1' && host !== '::1') {
        throw new Error('Local head atlas requires a loopback development server.');
      }
      return { server: { host: '127.0.0.1' } };
    },
    configureServer(server) {
      if (!root) return;
      const beginTrace = createHeadTransferDiagnostics({enabled: diagnostics, write: line => {
        if (typeof writeDiagnostic === 'function') writeDiagnostic(line);
        else if (server.config?.logger) server.config.logger.info(line);
        else console.info(line);
      }});
      server.middlewares.use(async (req, res, next) => {
        let url;
        try { url = new URL(req.url ?? '/', 'http://localhost'); } catch { return next(); }
        if (url.pathname !== MANIFEST && url.pathname !== ASSET) return next();
        if (req.method !== 'GET') return reply(res, 405);
        if (!requestAllowed(req, server)) return reply(res, 403);
        if (!HASH.test(expectedHash ?? '')) return reply(res, 404);
        const trace = beginTrace(url.pathname === MANIFEST ? 'manifest' : 'asset');
        let responseBytes;
        res.once('finish', () => trace('response-finished', {status: res.statusCode, bytes: responseBytes}));
        res.once('close', () => {
          if (!res.writableFinished) trace('response-closed-before-finish', {status: res.statusCode});
        });
        const respond = (status, bytes, type) => {
          responseBytes = bytes?.byteLength ?? 11; // The fixed "Unavailable" response.
          if (status !== 200) trace('refused', {status});
          return reply(res, status, bytes, type);
        };
        try {
          const boundRoot = await checkedRoot(root);
          const { bytes: manifestBytes, allowed } = await pinnedManifest(boundRoot, expectedHash);
          trace('manifest-verified', {bytes: manifestBytes.byteLength});
          if (url.pathname === MANIFEST) {
            if (url.search) return respond(404);
            return respond(200, manifestBytes, 'application/json; charset=utf-8');
          }
          if ([...url.searchParams.keys()].length !== 1 || !url.searchParams.has('path')) return respond(404);
          const requested = url.searchParams.get('path');
          if (!validPath(requested)) return respond(404);
          const asset = allowed.get(requested.toLowerCase());
          if (!asset || asset.file !== requested) return respond(404);
          const bytes = await checkedFile(boundRoot, asset.file, MAX_ASSET);
          trace('asset-read', {bytes: bytes.byteLength});
          if (digest(bytes) !== asset.hash) return respond(404);
          trace('asset-verified', {bytes: bytes.byteLength});
          return respond(200, bytes, 'application/octet-stream');
        } catch { return respond(404); }
      });
    },
  };
}
