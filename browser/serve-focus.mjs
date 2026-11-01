import http from 'node:http';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const root = 'G:/VisibleMedicine-temp/proposals/20261101-prostate-return-focus';
const helper = stripTypeScriptTypes(fs.readFileSync(root + '/source/app/study-return-focus.ts', 'utf8'));
const html = fs.readFileSync(root + '/browser/focus.html');
const server = http.createServer((req, res) => {
  if (req.url === '/study-return-focus.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' }); res.end(helper);
  } else if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }); res.end(html);
  } else { res.writeHead(404); res.end(); }
});
server.listen(0, '127.0.0.1', () => {
  const state = { port: server.address().port, pid: process.pid, url: `http://127.0.0.1:${server.address().port}/`, source: root + '/source/app/study-return-focus.ts' };
  fs.writeFileSync(root + '/browser/SERVER.json', JSON.stringify(state, null, 2));
  console.log(JSON.stringify(state));
});
