// Owned loopback-only synthetic browser check; does not serve the website or scans.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {createRequire} from 'node:module';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor';
const source=json(root+'/SOURCE.json');
const p='lib/head-surface-validation.ts',input=read(source.website+'/'+p);
assert.equal(sha(input),source.sourceRows.find(r=>r.path===p).sha256);
const require=createRequire(source.website+'/package.json'),ts=require('typescript');
const script=ts.transpileModule(input.toString(),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const page=read('qa-head-surface-cancellation-20261022.html');
const server=http.createServer((req,res)=>{
 if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
 const body=req.url==='/'?page:req.url==='/helper.js'?script:null;
 if(body===null){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':req.url==='/'?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(body);
});
server.listen(3019,'127.0.0.1',()=>{
 const receipt={at:new Date().toISOString(),url:'http://127.0.0.1:3019/',pid:process.pid,sourceReceiptSha256:sha(read(root+'/SOURCE.json')),helperSha256:sha(input),pageSha256:sha(page),syntheticOnly:true,ownerPreviewChanged:false};
 fs.writeFileSync(root+'/BROWSER_SERVER.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
});
