import fs from 'node:fs';
import http from 'node:http';
import { build } from 'esbuild';
const root = 'G:/VisibleMedicine-temp/proposals/20261031-review-shared-filters';
fs.mkdirSync(root + '/browser', { recursive: true });
await build({ stdin: { contents: "import React from 'react';import {createRoot} from 'react-dom/client';import {ClinicalReviewInbox} from './components/ClinicalReviewInbox';createRoot(document.getElementById('root')).render(<ClinicalReviewInbox/>);", resolveDir: root, loader: 'tsx' },
  bundle: true, platform: 'browser', format: 'esm', jsx: 'automatic', outfile: root + '/browser/app.js', define: { 'process.env.NODE_ENV': '"development"' } });
const make = (key, title, status, scopeLabel, extra = {}) => ({ key, title, status, scopeLabel, area: 'structures', trackLabel: 'Anatomy', revision: 'c'.repeat(64), capability: 'decision', href: '/workspace/atlas-review?selection=' + key, ...extra });
const items = [make('biceps', 'Biceps long head', 'changes-required', 'Whole body · shoulder-arm · muscles · FMA1 · right'),
  make('ethmoid-new', 'Ethmoid bone', 'not-started', 'Whole body · head-neck · bones · FMA52747 · midline'),
  make('ethmoid-issue', 'Ethmoid bone source group', 'changes-required', 'Whole body · head-neck · bones · FMA52747 · left'),
  make('ethmoid-guide', 'Ethmoid teaching', 'not-started', 'Head learning', { area: 'head-learning', trackLabel: 'Teaching' }),
  make('viewer', 'Viewer-changed structure', 're-review', 'Whole body · head-neck · bones · FMA999 · midline', { changeReason: 'viewer-only' }),
  make('source', 'Source-changed structure', 're-review', 'Whole body · head-neck · bones · FMA998 · midline', { changeReason: 'source-or-teaching' })];
const batch = { schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution', catalogRevision: 'b'.repeat(64), page: 1, pageCount: 1, selectionTotal: items.length, nextPage: null, items, approval: false };
const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Synthetic review filter QA</title><link rel="stylesheet" href="/app.css"><style>body{margin:1rem;font:16px system-ui;color:#132c32;background:#f6f8f7}main{max-width:1250px;margin:auto}button,input,select{font:inherit}h1{font-size:1.4rem}</style></head><body><main><p>Synthetic review QA — no real reviews or decisions</p><div id="root"></div></main><script type="module" src="/app.js"></script></body></html>';
const requests = [];
const server = http.createServer((req, res) => {
  requests.push({ method: req.method, path: req.url });
  fs.writeFileSync(root + '/browser/REQUESTS.json', JSON.stringify(requests, null, 2));
  if (req.method !== 'GET') { res.writeHead(405); return res.end('Read-only synthetic test'); }
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/atlas-review/inbox') { res.writeHead(200, { 'Content-Type': 'application/json', 'X-Clinical-Review-Context': 'a'.repeat(64), 'Cache-Control': 'no-store' }); return res.end(JSON.stringify(batch)); }
  if (pathname === '/app.js' || pathname === '/app.css') { res.writeHead(200, { 'Content-Type': pathname.endsWith('.js') ? 'text/javascript' : 'text/css' }); return res.end(fs.readFileSync(root + '/browser' + pathname)); }
  if (pathname === '/workspace/clinical-review-inbox') { res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }); return res.end(html); }
  res.writeHead(404); res.end('Synthetic route unavailable');
});
server.listen(0, '127.0.0.1', () => { const address = server.address(); const ready = { pid: process.pid, port: address.port, url: `http://127.0.0.1:${address.port}/workspace/clinical-review-inbox`, synthetic: true, realAccountsUsed: false };
  fs.writeFileSync(root + '/browser/READY.json', JSON.stringify(ready, null, 2)); console.log(JSON.stringify(ready)); });
setTimeout(() => server.close(), 15 * 60 * 1000).unref();
