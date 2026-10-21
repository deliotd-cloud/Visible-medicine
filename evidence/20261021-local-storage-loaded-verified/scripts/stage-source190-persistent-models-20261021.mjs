import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {createRequire} from 'node:module';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/staging/20261021-source190-website/website';
const stage='F:/VisibleMedicine/staging/20261021-source190-persistent-models';assert(!fs.existsSync(stage));
const started=json('F:/VisibleMedicine/staging/20261021-source190-loaded-qa/STARTED.json');
assert.equal(started.pid,276244);assert(fs.existsSync('F:/VisibleMedicine/staging/20261021-source190-loaded-qa/STOPPED.json'));
const busy=await new Promise(resolve=>{const s=net.createConnection({host:'127.0.0.1',port:3002});s.once('connect',()=>{s.destroy();resolve(true);});s.once('error',()=>resolve(false));});assert.equal(busy,false);
const inventory=json(site+'/lib/atlas-model-inventory.json');assert.equal(inventory.models.length,137);
const models=inventory.models.map(m=>{const p=path.resolve(site,'public'+m.paths[0]);assert(p.startsWith(path.resolve(site,'public/atlas-runtime')+path.sep));assert(fs.lstatSync(p).isFile()&&!fs.lstatSync(p).isSymbolicLink());const b=read(p);assert.equal(b.length,m.bytes);assert.equal(sha(b),m.sha256);return{...m,source:p};});
const require=createRequire(site+'/package.json');const {Miniflare,Log,LogLevel,convertV4MiniflareOptions}=require('miniflare');
const options=convertV4MiniflareOptions({name:'vm-source190-persistent-staging',modules:true,script:'export default {fetch(){return new Response("Local staging only",{status:404})}};',compatibilityDate:'2026-08-23',host:'127.0.0.1',port:0,r2Buckets:{FILES:'site-creator-r2'},resourcePersistencePath:site+'/.wrangler/state/v3',log:new Log(LogLevel.NONE)});
assert.equal(options.resourcePersistencePath,site+'/.wrangler/state/v3');assert(!('r2Persist'in options));
fs.mkdirSync(stage);const verified=[];
const check=(object,m)=>{assert(object);assert.equal(object.key,'atlas-models/v1/'+m.sha256+'.glb');assert.equal(object.size,m.bytes);assert.equal(Buffer.from(object.checksums.sha256??[]).toString('hex'),m.sha256);};
let mf=new Miniflare(options);
try{const bucket=await mf.getR2Bucket('FILES');for(const m of models){const key='atlas-models/v1/'+m.sha256+'.glb',existing=await bucket.head(key);if(existing)check(existing,m);else check(await bucket.put(key,read(m.source),{sha256:m.sha256,onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'model/gltf-binary'},customMetadata:{purpose:'licensed-atlas-model',sha256:m.sha256}}),m);const object=await bucket.get(key);check(object,m);assert.equal(sha(Buffer.from(await object.arrayBuffer())),m.sha256);verified.push({sha256:m.sha256,bytes:m.bytes,preexisting:!!existing});if(verified.length%32===0)console.log(JSON.stringify({phase:'persistent-staging',objects:verified.length}));}}finally{await mf.dispose();}
// A same-lifetime read is insufficient: prove the actual persisted binding
// survives disposal and a new emulator before starting the website again.
const reopened=[];mf=new Miniflare(options);
try{const bucket=await mf.getR2Bucket('FILES');for(const m of models){const object=await bucket.get('atlas-models/v1/'+m.sha256+'.glb');check(object,m);assert.equal(sha(Buffer.from(await object.arrayBuffer())),m.sha256);reopened.push(m.sha256);}}finally{await mf.dispose();}
assert.equal(reopened.length,137);
const result={at:new Date().toISOString(),site,models:137,bytes:verified.reduce((n,m)=>n+m.bytes,0),verified,reopened:137,exactFullReadbackAfterReopen:true,resourcePersistencePathUsed:true,legacyR2PersistIgnoredByInstalledConverter:true,databaseTouched:false,permissionsEdited:false,identitiesEdited:false,remoteBindings:false,ownerPreviewTouched:false,scanFilesCopied:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(stage+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({phase:'new-emulator-readback-verified',models:137,bytes:result.bytes,reopened:137,databaseTouched:false,permissionsEdited:false}));
