import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const target = process.argv[2];
if (!['before', 'after'].includes(target)) throw new Error('Usage: node serve.mjs before|after');
const root = resolve(import.meta.dirname, target);
const files = {'/': ['index.html', 'text/html; charset=utf-8'], '/fixture.js': ['fixture.js', 'text/javascript; charset=utf-8'], '/fixture.css': ['fixture.css', 'text/css; charset=utf-8']};
// Fixed allowlist: no path joining from user input and no source-tree exposure.
const server = createServer((req, res) => {
  const file = files[req.url ?? ''];
  if (!file || req.method !== 'GET') {res.writeHead(404); res.end(); return;}
  try {const body = readFileSync(join(root, file[0])); res.writeHead(200, {'Content-Type': file[1], 'Cache-Control': 'no-store'}); res.end(body);}
  catch {res.writeHead(404); res.end();}
});
server.listen(0, '127.0.0.1', () => console.log(JSON.stringify({pid: process.pid, address: server.address(), target, root})));
