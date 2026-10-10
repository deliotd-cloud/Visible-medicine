import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='ed74d3e7c96501f21434f76e136c12a11493c020';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const specs=[
 ['femoralArtery','FMA70249','FMA70250'],['deepFemoralArtery','FMA20796','FMA20797'],
 ['femoralVein','FMA21188','FMA21189'],['greatSaphenous','FMA21379','FMA21380'],
 ['poplitealArtery','FMA77380','FMA77381'],['anteriorTibialArtery','FMA43896','FMA43897'],
 ['posteriorTibialArtery','FMA43898','FMA43899'],['poplitealVein','FMA44328','FMA44329'],
 ['smallSaphenous','FMA44334','FMA44335'],['dorsalisPedis','FMA43916','FMA43917'],
 ['lateralPlantar','FMA43931','FMA43932'],['superficialMedialPlantar','FMA43937','FMA43938'],
 ['anteriorTibialVein','FMA44336','FMA44337'],['posteriorTibialVein','FMA44338','FMA44339'],
 ['deepFemoralVein','FMA51042','FMA51043'],
];
const {api,catalog}=await contentContext(),before=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);assert.deepEqual(display,before.bodyDisplayCatalog(catalog));
const entries=specs.flatMap(([group,...fmas])=>fmas.map((fma,index)=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1,fma);
 const identity=matches[0];assert.equal(identity.laterality,index===0?'right':'left');assert.equal(identity.system,'vessels');assert(['thigh','leg','foot'].includes(identity.region));
 const previous=before.bodyLesson(identity,'quiz');assert.equal(previous.readiness,'generated-identification');assert.equal(previous.correctAnswer,undefined);
 return{identity,group,previous};
}));
assert.equal(entries.length,30);assert.equal(new Set(entries.map(e=>e.identity.id)).size,30);
const eligible=display.structures.filter(s=>['thigh','leg','foot'].includes(s.region)&&s.system==='vessels'&&before.bodyLesson(s,'quiz').readiness==='generated-identification');
assert.deepEqual(entries.map(e=>e.identity.id).sort(),eligible.map(s=>s.id).sort());
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path='content/lower-limb-vessel-quiz-pins.json',output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);await assert.rejects(access(path));await writeFile(path,output,{flag:'wx'});}
console.log(JSON.stringify({identities:30,groups:15,pinsHash:hash(record),clinicalApproval:false}));
