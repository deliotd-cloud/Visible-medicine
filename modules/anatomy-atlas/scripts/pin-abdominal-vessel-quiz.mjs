import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='f12348a11c0e8e0b642ec43c9285107259ca7ea5';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const specs=[["aorta","FMA3789"],["celiac","FMA50737"],["sma","FMA14749"],["ima","FMA14750"],["renal","FMA14752","FMA14753"],["caval","FMA10951"],["hepatic","FMA14338","FMA14339","FMA14340","FMA15791","FMA15794"],["splenic","FMA14331"]];
const {api,catalog}=await contentContext(),before=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);assert.deepEqual(display,before.bodyDisplayCatalog(catalog));
const entries=specs.flatMap(([group,...fmas])=>fmas.map((fma,index)=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1,fma);
 const identity=matches[0];assert.equal(identity.system,'vessels');assert(['abdomen'].includes(identity.region));
 const previous=before.bodyLesson(identity,'quiz');assert.equal(previous.readiness,'generated-identification');assert.equal(previous.correctAnswer,undefined);
 return{identity,group,previous};
}));
assert.equal(entries.length,13);assert.equal(new Set(entries.map(e=>e.identity.id)).size,13);
const eligible = display.structures.filter(s => ["FMA3789","FMA50737","FMA14749","FMA14750","FMA14752","FMA14753","FMA10951","FMA14338","FMA14339","FMA14340","FMA15791","FMA15794","FMA14331"].includes(s.fmaId) && before.bodyLesson(s, 'quiz')?.readiness === 'generated-identification');
assert.deepEqual(entries.map(e=>e.identity.id).sort(),eligible.map(s=>s.id).sort());
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path='content/abdominal-vessel-quiz-pins.json',output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);await assert.rejects(access(path));await writeFile(path,output,{flag:'wx'});}
console.log(JSON.stringify({identities:13,groups:8,pinsHash:hash(record),clinicalApproval:false}));
