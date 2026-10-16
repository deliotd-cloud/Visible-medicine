import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
assert(process.argv.slice(2).every(a=>a==='--check'));
const baseline='f1dc0ccc54ec82aa774720db3c822d3e0ea9c418';
const old=p=>execFileSync('git',['show',baseline+':'+p],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const api=await exactSourceHistoryApi(baseline,'display-review'),catalog=api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const specs=[['aca','FMA50029'],['aca','FMA50030'],['acom','FMA50169'],['pca','FMA50584'],['pca','FMA50585'],['pcom','FMA50085'],['pcom','FMA50086'],['mca','FMA50082']];
const entries=specs.map(([family,fmaId])=>{const matches=catalog.structures.filter(s=>s.fmaId===fmaId);assert.equal(matches.length,1);const identity=matches[0];assert.equal(identity.region,'head-neck');assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');const previous=api.bodyLesson(identity,'ultrasound');assert.equal(previous.readiness,'pending');return{family,identity,previous};});
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const p='public'+new URL(b.url,'https://local.invalid').pathname,bytes=readFileSync(p);assert.deepEqual(bytes,old(p));assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const result={baseline,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries};
const output=JSON.stringify(result,null,2)+'\n',path='content/intracranial-arterial-us-pins.json';
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),output);else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);writeFileSync(path,output,{flag:'wx'});}
console.log(JSON.stringify({baseline,entries:entries.length,families:5,bundles:bundles.length,geometryChanged:false,clinicalApproval:false}));
