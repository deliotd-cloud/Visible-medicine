// Temporary GET/HEAD-only loopback QA, retaining the owner's protected model API.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking',step=root+'/browser-runtime-qa';
assert(!fs.existsSync(step));fs.mkdirSync(step);
const receipt=root+'/PRODUCT_SOURCE_V4.json',source=json(receipt);
const inventory=json(source.website+'/lib/atlas-model-inventory.json'),models=new Set(inventory.models.flatMap(model=>model.paths));
assert.equal(models.size,144);
const port=3008,security={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
const server=createServer(async(req,res)=>{try{
 if(req.headers.host!==`127.0.0.1:${port}`){res.writeHead(403,security);res.end();return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{...security,Allow:'GET, HEAD'});res.end();return;}
 const raw=req.url??'/',rawPath=raw.split('?')[0];
 if(raw.length>8192||raw.includes('\\')||/%(?:2e|00|5c)/i.test(rawPath)||(rawPath.includes('%')&&!rawPath.startsWith('/@id/'))||rawPath.split('/').includes('..')){res.writeHead(404,security);res.end();return;}
 const url=new URL(raw,`http://127.0.0.1:${port}`),modelPath=url.pathname.startsWith('/api/atlas-delivery/')?url.pathname.replace('/api/atlas-delivery/','/atlas-runtime/'):url.pathname;
 const isModel=models.has(modelPath);
 if(!isModel&&(/\.glb$/i.test(url.pathname)||url.pathname.startsWith('/api/atlas-delivery/'))){res.writeHead(404,security);res.end();return;}
 const target=isModel?'http://127.0.0.1:3000/api/atlas-delivery/'+modelPath.slice('/atlas-runtime/'.length)+url.search:'http://127.0.0.1:3007'+url.pathname+url.search;
 const headers={'accept-encoding':'identity'};
 for(const key of ['cookie','range','if-range','if-none-match','if-modified-since','accept'])if(req.headers[key])headers[key]=req.headers[key];
 const upstream=await fetch(target,{method:req.method,headers,redirect:'manual'}),output={...security};
 // Deliberately never forward Set-Cookie: isolated QA cannot replace owner auth.
 for(const key of ['content-type','content-length','content-range','accept-ranges','etag','last-modified','location','vary'])if(upstream.headers.has(key))output[key]=upstream.headers.get(key);
 res.writeHead(upstream.status,output);
 if(req.method==='HEAD'||!upstream.body)res.end();else Readable.fromWeb(upstream.body).pipe(res);
 }catch{if(!res.headersSent)res.writeHead(502,security);res.end('Isolated candidate QA unavailable');}});
server.listen(port,'127.0.0.1',()=>{
 fs.writeFileSync(step+'/STARTED.json',JSON.stringify({at:new Date().toISOString(),pid:process.pid,port,candidatePort:3007,modelPort:3000,
  receipt,receiptSha256:sha(read(receipt)),registeredModelPaths:models.size,rawModelFilesServed:false,ownerCookiesChanged:false,allWritesDenied:true,
  privateDataOrDatabaseCopied:false,scope:'Read-only local browser QA only; no clinical, spatial or public-release acceptance.'},null,2)+'\n',{flag:'wx'});
 console.log('Read-only candidate QA on http://127.0.0.1:3008/atlas/lower-limb-3d; protected model delivery remains on3000.');
});
