// Local diagnostic only. No production routes, model files or storage are changed.
import {createServer} from 'node:http';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {headNeckModuleInputs} from './head-neck-module-inputs.mjs';
import {regionalCompanions} from '../integration/head-neck/companions.mjs';

assert(process.argv[2],'Pass a new local receipt JSON path; never run this server on a public interface.');
const receiptPath=resolve(process.argv[2]);
const source=resolve(import.meta.dirname,'..'),root=resolve(source,'.sites-runtime/head-neck-module');
const sha=b=>createHash('sha256').update(b).digest('hex');
const inputs=JSON.parse(await readFile(root+'/source-inputs.json'));
for(const entry of inputs){
 assert(!entry.path.includes('..')&&!entry.path.includes(':')&&!entry.path.startsWith('/'));
 assert.equal(sha(await readFile(source+'/'+entry.path)),entry.sha256,entry.path);
}
const files=new Map();
for(const name of ['index.html','source-inputs.json',...(await readdir(root+'/assets')).map(n=>'assets/'+n)])files.set(name,await readFile(root+'/'+name));
for(const [from,to] of regionalCompanions)files.set(to,await readFile(source+'/'+from));
const {models}=await headNeckModuleInputs(true);
for(const model of models)files.set(model.path,await readFile(model.file));
const sceneNames=[...files.keys()].filter(n=>/^assets\/body-scene-[^/]+\.js$/.test(n));
assert.equal(sceneNames.length,1,'Exactly one scene chunk must be identified from the verified build');
const encoded=new Map();
for(const [name,bytes] of files){
 const compressed=gzipSync(bytes,{level:6});
 assert.equal(sha(gunzipSync(compressed)),sha(bytes),'HTTP gzip roundtrip: '+name);
 encoded.set(name,compressed);
}
const prefix='/atlas-runtime/head-neck/';
const servers=[];
function serve(mode){return new Promise(resolveServer=>{
 const server=createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  const path=new URL(req.url,'http://127.0.0.1').pathname;
  const name=path.startsWith(prefix)?path.slice(prefix.length):'';
  let bytes=files.get(name);
  if(!bytes){res.writeHead(404).end();return;}
  if(mode==='gzip-preload'&&name==='index.html')bytes=Buffer.from(bytes.toString().replace('</head>',`<link rel="modulepreload" href="${prefix}${sceneNames[0]}"></head>`));
  // This is a controlled browser experiment, not a production negotiator.
  const compressed=mode!=='identity'&&(mode!=='gzip-text'||/\.(html|js|css|json)$/.test(name))&&/\bgzip\b/.test(req.headers['accept-encoding']??'');
  const body=compressed?(mode==='gzip-preload'&&name==='index.html'?gzipSync(bytes,{level:6}):encoded.get(name)):bytes;
  const type=name.endsWith('.html')?'text/html':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':name.endsWith('.glb')?'model/gltf-binary':'application/octet-stream';
  res.writeHead(200,{'Content-Type':type,'Content-Length':body.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',Vary:'Accept-Encoding',...(compressed?{'Content-Encoding':'gzip'}:{})});
  res.end(req.method==='HEAD'?undefined:body);
 });
 server.listen(0,'127.0.0.1',()=>{servers.push(server);resolveServer({mode,url:`http://127.0.0.1:${server.address().port}${prefix}index.html?region=whole-body`});});
});}
const endpoints=await Promise.all(['identity','gzip-text','gzip','gzip-preload'].map(serve));
const receipt={diagnosticOnly:true,inputs,scene:sceneNames[0],endpoints,files:[...files].map(([name,bytes])=>({name,sha256:sha(bytes),bytes:bytes.length,gzipBytes:encoded.get(name).length}))};
await writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({endpoints,verifiedSourceInputs:inputs.length,verifiedRoundtrips:files.size}));
process.on('SIGINT',()=>{for(const server of servers)server.close();});
