// Explicit local-only recipe. Do not run on a public interface.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'dist');
const blank='<!doctype html><html lang="en"><title>Synthetic blank Atlas iframe</title><body style="margin:0;background:#dce8e3;color:#31594f;font:14px system-ui;padding:20px">Synthetic blank iframe. No model loaded.</body></html>';
const files=new Map([['/','index.html'],['/harness.js','harness.js'],['/harness.css','harness.css'],['/fixture-inputs.json','fixture-inputs.json']]);
const types={'index.html':'text/html; charset=utf-8','harness.js':'text/javascript; charset=utf-8','harness.css':'text/css; charset=utf-8','fixture-inputs.json':'application/json; charset=utf-8'};
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(['/atlas-runtime/head-neck/index.html','/atlas-runtime/other/index.html'].includes(url.pathname)){
  res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(blank);return;
 }
 const file=files.get(url.pathname);
 if(!file){res.writeHead(404);res.end('Not found');return;}
 try{const bytes=readFileSync(resolve(root,file));res.writeHead(200,{'content-type':types[file],'cache-control':'no-store'});res.end(bytes);}
 catch{res.writeHead(503);res.end('Fixture not built');}
});
server.listen(0,'127.0.0.1',()=>console.log(`Synthetic local fixture: http://127.0.0.1:${server.address().port}/`));

process.stdin.setEncoding('utf8');process.stdin.on('data',text=>{if(text.trim()==='stop')server.close(()=>process.exit(0));});process.stdin.resume();
