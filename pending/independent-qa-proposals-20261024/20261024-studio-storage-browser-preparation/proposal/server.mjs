// Run only after Main's live regression diagnostic is terminal.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const assets=new Map([
  ['/fixture.js',{file:'.bundle/fixture.js',type:'application/javascript'}],
  ['/fixture.css',{file:'.bundle/fixture.css',type:'text/css'}],
]);
const server=http.createServer(async (request,response)=>{
  const url=new URL(request.url,'http://127.0.0.1');
  if(request.method!=='GET'||url.pathname.startsWith('/api/')){response.writeHead(404);response.end();return;}
  const asset=assets.get(url.pathname);
  const file=asset?asset.file:'index.html';
  try{const body=await readFile(path.join(here,file));response.writeHead(200,{'Content-Type':asset?.type??'text/html; charset=utf-8','Cache-Control':'no-store'});response.end(body);}
  catch{response.writeHead(404);response.end();}
});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({url:`http://127.0.0.1:${server.address().port}/studio/courses/one`,pid:process.pid})));
