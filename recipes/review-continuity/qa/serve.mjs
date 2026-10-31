import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-review-continuity-ready',source=json(root+'/SOURCE.json'),site=source.website,qa=root+'/qa',build=createRequire(site+'/package.json')('esbuild').build;
const baseline='G:/VisibleMedicine-temp/staging/20261031-website-notices-final/website',metadata={};
for(const[label,from]of [['baseline',baseline],['candidate',site]]){
 const result=await build({entryPoints:[qa+'/fixture.tsx'],outfile:qa+'/'+label+'.js',bundle:true,metafile:true,format:'esm',jsx:'automatic',nodePaths:[site+'/node_modules'],define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'selected-test-source',setup(b){b.onResolve({filter:/^vm-under-test$/},()=>({path:from+'/components/ClinicalReviewInbox.tsx'}));}}]});
 metadata[label]={bundle:hash(qa+'/'+label+'.js'),css:hash(qa+'/'+label+'.css'),inputs:Object.keys(result.metafile.inputs).map(p=>({path:path.resolve(p),sha256:hash(path.resolve(p))}))};
}
const markup=label=>`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic Quick review focus QA · ${label}</title><link rel="stylesheet" href="/${label}.css"><style>body{font:16px system-ui;margin:20px;color:#173d42;background:#fff}#qa-controls{padding:12px;background:#e8f4f4;margin-bottom:20px}button,input{font:inherit;margin:4px}h2:focus{outline:3px solid #087a92;outline-offset:4px}</style></head><body><section id="qa-controls"><strong>Synthetic-only Quick review focus · ${label}</strong><p>No real review decisions are submitted.</p><button data-case="removed">Test removed link</button><button data-case="moved">Test moved focus</button><button data-case="survives">Test surviving link</button><label>Unrelated field <input id="outside"></label><p id="result" role="status">Ready</p></section><div id="app"></div><script type="module" src="/${label}.js"></script></body></html>`;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');let data,type;
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 if(url.pathname==='/workspace/clinical-review-inbox'){const label=url.searchParams.get('version')==='baseline'?'baseline':'candidate';data=markup(label);type='text/html';}
 else if(/^\/(baseline|candidate)\.(js|css)$/.test(url.pathname)){data=fs.readFileSync(qa+url.pathname);type=url.pathname.endsWith('.css')?'text/css':'text/javascript';}
 else {res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
});
server.listen(0,'127.0.0.1',()=>{const url=`http://127.0.0.1:${server.address().port}/workspace/clinical-review-inbox`;fs.writeFileSync(qa+'/SERVER.json',JSON.stringify({at:new Date().toISOString(),url,pid:process.pid,source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},metadata,syntheticOnly:true},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({url,pid:process.pid}));});
