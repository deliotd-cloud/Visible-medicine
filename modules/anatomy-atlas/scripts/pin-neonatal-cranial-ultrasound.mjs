import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='c57449c1107a912442c6b0af23e270df41032522';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),path='public/models/bodyparts3d/full-body/catalog.json';
const bytes=await readFile(path);
assert.deepEqual(bytes,execFileSync('git',['show',parentCommit+':'+path],{windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
const before=await exactSourceHistoryApi(parentCommit,'review-security'),catalog=before.bodyDisplayCatalog(JSON.parse(bytes));
const specs=[['caudate','left','left-caudate-nucleus','FMA72827'],['caudate','right','right-caudate-nucleus','FMA72826'],
 ['thalamus','left','left-thalamus','FMA258716'],['thalamus','right','right-thalamus','FMA258714'],
 ['putamen','left','left-putamen','FMA72829'],['putamen','right','right-putamen','FMA72828'],
 ['pallidum','left','left-globus-pallidus','FMA72831'],['pallidum','right','right-globus-pallidus','FMA72830'],
 ['callosum','midline','corpus-callosum','FMA86464'],['plexus','midline','choroid-plexus-of-cerebral-hemisphere','FMA61934']];
const entries=specs.map(([family,side,slug,fma])=>{
 const id=`vm:anatomy:body:head-neck:${side}:organ:${slug}`;
 const found=catalog.structures.filter(structure=>structure.id===id&&structure.fmaId===fma);assert.equal(found.length,1,id);
 const identity=found[0];assert.equal(identity.laterality,side);assert.equal(identity.system,'nerves');
 assert.equal(identity.category,'organ');assert.equal(identity.region,'head-neck');assert.equal(identity.validation.anatomicalReview,false);
 const previous=before.bodyLesson(identity,'ultrasound');assert.equal(previous.readiness,'pending',id);
 return {identity,family,previous};
});
const bundles=catalog.bundles.filter(bundle=>entries.some(entry=>entry.identity.bundle===bundle.id));
for(const bundle of bundles){const data=await readFile('public'+bundle.url.split('?')[0]);assert.equal(data.length,bundle.bytes);assert.equal(sha(data),bundle.sha256);}
const record={parentCommit,catalogHash:sha(JSON.stringify(catalog)),coordinateSystem:catalog.coordinateSystem,bundles,entries};
const destination='content/neonatal-cranial-ultrasound-pins.json',output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(destination,'utf8')).replaceAll('\r\n','\n'),output);
else await writeFile(destination,output,{flag:'wx'});
console.log(JSON.stringify({selections:entries.length,bundles:bundles.length,sourcePinsSha256:sha(JSON.stringify(record)),clinicalApproval:false}));
