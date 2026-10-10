import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='59c40bbb213627c3fc423a0b826f6f3063ea605d';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const specs=[["radial","FMA22733","FMA22734"],["ulnar","FMA22797","FMA22798"],["anteriorInterosseous","FMA22812","FMA22813"],["commonInterosseous","FMA22807","FMA22808"],["recurrentInterosseous","FMA268667","FMA268669"],["cephalic","FMA13325","FMA13326"],["basilic","FMA22909","FMA22910"]];
const {api,catalog}=await contentContext(),before=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);assert.deepEqual(display,before.bodyDisplayCatalog(catalog));
const entries=specs.flatMap(([group,...fmas])=>fmas.map((fma,index)=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1,fma);
 const identity=matches[0];assert.equal(identity.laterality,index===0?'right':'left');assert.equal(identity.system,'vessels');assert(['forearm'].includes(identity.region));
 const previous=before.bodyLesson(identity,'quiz');assert.equal(previous.readiness,'generated-identification');assert.equal(previous.correctAnswer,undefined);
 return{identity,group,previous};
}));
assert.equal(entries.length,14);assert.equal(new Set(entries.map(e=>e.identity.id)).size,14);
const eligible=display.structures.filter(s=>['forearm'].includes(s.region)&&s.system==='vessels'&&before.bodyLesson(s,'quiz').readiness==='generated-identification');
assert.deepEqual(entries.map(e=>e.identity.id).sort(),eligible.map(s=>s.id).sort());
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path='content/forearm-vessel-quiz-pins.json',output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);await assert.rejects(access(path));await writeFile(path,output,{flag:'wx'});}
console.log(JSON.stringify({identities:14,groups:7,pinsHash:hash(record),clinicalApproval:false}));
