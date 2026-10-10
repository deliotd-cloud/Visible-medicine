import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='574ca99c6119c25d0dce88c21dd77cbab74264cc';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const specs=[["cervical","FMA12522","FMA12523","FMA12524"],["upperThoracic","FMA9187","FMA9209","FMA9248","FMA9922"],["middleThoracic","FMA9945","FMA9968","FMA9991","FMA10014"],["lowerThoracic","FMA10037","FMA10059","FMA10081"]];
const {api,catalog}=await contentContext(),before=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);assert.deepEqual(display,before.bodyDisplayCatalog(catalog));
const entries=specs.flatMap(([group,...fmas])=>fmas.map((fma,index)=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1,fma);
 const identity=matches[0];assert.equal(identity.laterality,'midline');assert.equal(identity.system,'skeleton');assert(['spine'].includes(identity.region));
 const previous=before.bodyLesson(identity,'quiz');assert.equal(previous.readiness,'generated-identification');assert.equal(previous.correctAnswer,undefined);
 return{identity,group,previous};
}));
assert.equal(entries.length,14);assert.equal(new Set(entries.map(e=>e.identity.id)).size,14);
const eligible=display.structures.filter(s=>['spine'].includes(s.region)&&s.system==='skeleton'&&before.bodyLesson(s,'quiz').readiness==='generated-identification');
assert.deepEqual(entries.map(e=>e.identity.id).sort(),eligible.map(s=>s.id).sort());
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path='content/spinal-bone-quiz-pins.json',output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);await assert.rejects(access(path));await writeFile(path,output,{flag:'wx'});}
console.log(JSON.stringify({identities:14,groups:4,pinsHash:hash(record),clinicalApproval:false}));
