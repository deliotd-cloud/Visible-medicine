import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const PAGE_SIZE = 24;
const CATALOG = 'b'.repeat(64);
const ROW_REVISION = 'c'.repeat(64);
const state = { count: 49, delayMs: 0, failPage: null, status: 503, context: 'a'.repeat(64) };
const requests = [];
const html = [
  '<!doctype html><html lang="en"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<title>Synthetic Clinical Review Inbox QA</title>',
  '<link rel="stylesheet" href="/bundle.css">',
  '<style>*,*::before,*::after{box-sizing:border-box}html{font-family:system-ui,sans-serif;color:#17352f;background:#f5f8f6}body{margin:0}.qa-banner{padding:1rem max(1rem,calc((100vw - 80rem)/2));background:#fff7d7;border-bottom:3px solid #a64b00}.qa-banner strong{display:block;font-size:1.25rem}.qa-banner p{margin:.25rem 0}main{max-width:80rem;margin:0 auto;padding:1rem}</style>',
  '</head><body><header class="qa-banner"><strong>SYNTHETIC BROWSER QA · LOCAL ONLY</strong>',
  '<p>Fabricated review rows. No sign-in, account, clinical decision, real worksheet, or full-site chrome is available here.</p>',
  '</header><main id="inbox-root"></main><script src="/bundle.js" defer></script></body></html>',
].join('');

function respond(res, status, body, type = 'application/json; charset=utf-8', extra = {}) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    ...extra,
  });
  res.end(body);
}
const json = (res, status, value, extra) => respond(res, status, JSON.stringify(value), 'application/json; charset=utf-8', extra);
const row = index => ({
  key: 'synthetic:structure:' + String(index + 1).padStart(2, '0'),
  title: index === 0 ? 'Bíceps · long head' : 'Synthetic anatomy row ' + String(index + 1).padStart(2, '0'),
  area: 'structures',
  scopeLabel: index === 0 ? 'FMA37686 · synthetic anatomy scope' : 'Synthetic source-bound anatomy',
  href: '/workspace/atlas-review/body?structure=synthetic-' + String(index + 1),
  trackLabel: 'Anatomy',
  revision: ROW_REVISION,
  status: 'not-started',
  capability: 'decision',
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function handleInbox(req, res, url) {
  const params = url.searchParams;
  const pageValues = params.getAll('page');
  const revisionValues = params.getAll('revision');
  const page = pageValues.length === 1 && /^[1-9][0-9]*$/.test(pageValues[0]) ? Number(pageValues[0]) : NaN;
  const valid = [...params.keys()].every(key => key === 'page' || key === 'revision') &&
    Number.isSafeInteger(page) && page >= 1 && page <= 10 &&
    (page === 1 ? revisionValues.length === 0 : revisionValues.length === 1 && revisionValues[0] === CATALOG);
  if (!valid) return json(res, 400, { error: 'Synthetic page or revision request rejected.' });
  const request = { page, revision: revisionValues[0] ?? null, context: state.context, at: new Date().toISOString() };
  requests.push(request);
  if (requests.length > 500) requests.shift();
  const delayMs = state.delayMs;
  const failPage = state.failPage;
  const failStatus = state.status;
  const context = state.context;
  const count = state.count;
  if (delayMs) await wait(delayMs);
  if (page === failPage) return json(res, failStatus, { error: 'Synthetic controlled failure.' }, { 'X-Clinical-Review-Context': context });
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (page > pageCount) return json(res, 409, { error: 'Synthetic page is outside this catalogue.' }, { 'X-Clinical-Review-Context': context });
  const items = Array.from({ length: Math.min(PAGE_SIZE, Math.max(0, count - (page - 1) * PAGE_SIZE)) },
    (_, offset) => row((page - 1) * PAGE_SIZE + offset));
  return json(res, 200, {
    schema: 'vm-clinical-inbox-1',
    scope: 'private-to-signed-in-account-and-institution',
    catalogRevision: CATALOG,
    page,
    pageCount,
    selectionTotal: count,
    nextPage: page < pageCount ? page + 1 : null,
    items,
    approval: false,
  }, { 'X-Clinical-Review-Context': context });
}

async function handleControl(req, res) {
  let body = '';
  try {
    for await (const part of req) {
      body += part.toString('utf8');
      if (body.length > 2048) return json(res, 413, { error: 'Synthetic control body too large.' });
    }
    const patch = JSON.parse(body);
    if (!patch || Array.isArray(patch) || typeof patch !== 'object' || !Object.keys(patch).length ||
      Object.keys(patch).some(key => !['count', 'delayMs', 'failPage', 'status', 'context'].includes(key)))
      return json(res, 400, { error: 'Unknown synthetic control field.' });
    if ('count' in patch && (!Number.isSafeInteger(patch.count) || patch.count < 0 || patch.count > 240))
      return json(res, 400, { error: 'count must be 0–240.' });
    if ('delayMs' in patch && (!Number.isSafeInteger(patch.delayMs) || patch.delayMs < 0 || patch.delayMs > 5000))
      return json(res, 400, { error: 'delayMs must be 0–5000.' });
    if ('failPage' in patch && (patch.failPage !== null && (!Number.isSafeInteger(patch.failPage) || patch.failPage < 1 || patch.failPage > 10)))
      return json(res, 400, { error: 'failPage must be null or 1–10.' });
    if ('status' in patch && ![401, 403, 409, 500, 503].includes(patch.status))
      return json(res, 400, { error: 'Unsupported synthetic failure status.' });
    if ('context' in patch && (typeof patch.context !== 'string' || !/^[a-f0-9]{64}$/.test(patch.context)))
      return json(res, 400, { error: 'context must be 64 lowercase hex characters.' });
    Object.assign(state, patch);
    return json(res, 200, { synthetic: true, control: state });
  } catch {
    return json(res, 400, { error: 'Malformed synthetic control body.' });
  }
}

const server = createServer((req, res) => {
  const rawPath = (req.url ?? '').split('?', 1)[0];
  let url;
  try { url = new URL(req.url ?? '', 'http://127.0.0.1'); }
  catch { return json(res, 400, { error: 'Malformed local route.' }); }
  if (rawPath !== url.pathname || !['GET', 'POST'].includes(req.method ?? ''))
    return json(res, 404, { error: 'Unknown local route.' });
  if (rawPath === '/workspace/clinical-review-inbox' && req.method === 'GET') return respond(res, 200, html, 'text/html; charset=utf-8');
  if (rawPath === '/bundle.js' && req.method === 'GET') {
    try { return respond(res, 200, readFileSync(join(root, 'bundle.js')), 'text/javascript; charset=utf-8'); }
    catch { return json(res, 503, { error: 'Run the local synthetic bundle build first.' }); }
  }
  if (rawPath === '/bundle.css' && req.method === 'GET') {
    try { return respond(res, 200, readFileSync(join(root, 'bundle.css')), 'text/css; charset=utf-8'); }
    catch { return json(res, 503, { error: 'Run the local synthetic bundle build first.' }); }
  }
  if (rawPath === '/api/atlas-review/inbox' && req.method === 'GET') return void handleInbox(req, res, url);
  if (rawPath === '/__test/control' && req.method === 'POST') return void handleControl(req, res);
  if (rawPath === '/__test/requests' && req.method === 'GET') return json(res, 200, { synthetic: true, requests, control: state });
  return json(res, 404, { error: 'Unknown local route.' });
});
server.listen(0, '127.0.0.1', () => {
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a loopback TCP port.');
  const receipt = {
    schema: 'vm-clinical-inbox-synthetic-server/1',
    address: 'http://127.0.0.1:' + address.port + '/workspace/clinical-review-inbox',
    host: '127.0.0.1', port: address.port, pid: process.pid, syntheticOnly: true,
    startedAt: new Date().toISOString(),
  };
  writeFileSync(join(root, 'SERVER_START.json'), JSON.stringify(receipt, null, 2) + '\n');
  process.stdout.write(JSON.stringify(receipt) + '\n');
});
let closing = false;
function close() {
  if (closing) return;
  closing = true;
  server.close(() => process.exit(0));
  server.closeAllConnections();
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
