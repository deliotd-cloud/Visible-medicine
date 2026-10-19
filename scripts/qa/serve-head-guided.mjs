import {createServer} from 'node:http';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve, isAbsolute, relative, sep} from 'node:path';
import {createHash} from 'node:crypto';

// Explicit local output directory; no package installation, credentials, writes
// to the site, production route, patient data or general filesystem server.
const directory = process.argv[2];
if (!directory || !isAbsolute(directory)) throw new Error('Supply an absolute disposable evidence directory (prefer E:).');
const site = fileURLToPath(new URL('../../', import.meta.url));
const stage = resolve(directory);
const fromSite = relative(site,stage);
if (!fromSite || (!isAbsolute(fromSite) && fromSite !== '..' && !fromSite.startsWith('..'+sep))) throw new Error('Keep generated evidence outside the source tree.');
mkdirSync(stage, {recursive:true});
const require = createRequire(new URL('../../package.json', import.meta.url));
await require('esbuild').build({entryPoints:[fileURLToPath(new URL('./head-guided-fixture.tsx', import.meta.url))],
  outfile:resolve(stage,'fixture.js'), bundle:true, format:'esm', jsx:'automatic',
  define:{'process.env.NODE_ENV':'"development"','process.env':'{}'}});
const css = ['imaging-atlas-shell.css','head-atlas.css'].map(file => readFileSync(resolve(site,'components',file),'utf8')).join('\n');
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Guided desktop acceptance — synthetic</title><link rel="stylesheet" href="/style.css"><style>*{box-sizing:border-box}body{margin:0;font:16px system-ui;background:#091512;color:#e7f2ef}header{padding:24px}main{display:grid;grid-template-columns:minmax(0,1fr) 264px;gap:24px;padding:16px}aside{min-width:0;height:650px;overflow:auto;padding:12px;border:1px solid #47625d}section>label{display:block;margin:16px 0}h1{font-size:24px}</style></head><body class="imaging-workspace-page"><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>`;
const bundle = readFileSync(resolve(stage,'fixture.js'));
const routes = new Map([['/', ['text/html',html]], ['/style.css',['text/css',css]], ['/fixture.js',['text/javascript',bundle]]]);
const server = createServer((request,response) => {
  const value = routes.get(request.url);
  if (request.method !== 'GET' || !value) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type',value[0]);
  response.setHeader('Cache-Control','no-store');
  response.setHeader('X-Content-Type-Options','nosniff');
  response.end(value[1]);
});
server.listen(0,'127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  const sha = value => createHash('sha256').update(value).digest('hex');
  writeFileSync(resolve(stage,'fixture-receipt.json'), JSON.stringify({url,pid:process.pid,syntheticOnly:true,
    bundleSha256:sha(bundle),cssSha256:sha(css),componentSha256:sha(readFileSync(resolve(site,'components/HeadAtlasGuidedLearning.tsx')))},null,2)+'\n');
  console.log(url);
});
