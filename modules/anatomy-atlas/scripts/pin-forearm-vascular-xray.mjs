import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='f74eb2529eccc7c4ad0a0f9bcd3fda95f9958c24';
assert(process.argv.slice(2).every(a=>a==='--check'));
const sha=b=>createHash('sha256').update(b).digest('hex'),path='public/models/bodyparts3d/full-body/catalog.json';
const bytes=await readFile(path);
assert.deepEqual(bytes,execFileSync('git',['show',parentCommit+':'+path],{windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
const before=await exactSourceHistoryApi(parentCommit,'review-security');
const catalog=before.bodyDisplayCatalog(JSON.parse(bytes));
const groups={radial:['FMA22733','FMA22734'],ulnar:['FMA22797','FMA22798'],cephalic:['FMA13325','FMA13326'],basilic:['FMA22909','FMA22910']};
const entries=Object.entries(groups).flatMap(([family,fmas])=>fmas.map((fma,index)=>{
 const found=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(found.length,1,fma);const identity=found[0];
 assert.equal(identity.laterality,index===0?'right':'left');assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
 assert.equal(identity.region,'forearm');assert.equal(identity.bundle,'forearm-vessels-recovery');assert.equal(identity.validation.anatomicalReview,false);
 const previous=before.bodyLesson(identity,'xray');assert.equal(previous.readiness,'pending');return {identity,family,previous};
}));
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,1);
for(const bundle of bundles){const data=await readFile('public'+bundle.url.split('?')[0]);assert.equal(data.length,bundle.bytes);assert.equal(sha(data),bundle.sha256);}
const record={parentCommit,catalogHash:sha(JSON.stringify(catalog)),coordinateSystem:catalog.coordinateSystem,bundles,entries};
const destination='content/forearm-vascular-xray-pins.json',output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(destination,'utf8')).replaceAll('\r\n','\n'),output);else await writeFile(destination,output,{flag:'wx'});
console.log(JSON.stringify({selections:entries.length,bundles:bundles.length,sourcePinsSha256:sha(JSON.stringify(record)),clinicalApproval:false}));
