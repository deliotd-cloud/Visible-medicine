import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='171e6c5562fa9e65314eb59e11b0df743d143405';
const targets=[
 ['leg','right','tendon','right-calcaneal-tendon','achilles'],
 ['leg','left','tendon','left-calcaneal-tendon','achilles'],
 ['leg','right','ligament','interosseous-membrane-of-right-leg','membrane'],
 ['leg','left','ligament','interosseous-membrane-of-left-leg','membrane'],
 ['foot','right','ligament','right-long-plantar-ligament','plantar'],
 ['foot','left','ligament','left-long-plantar-ligament','plantar'],
 ['thigh','right','fascia','right-iliotibial-tract','iliotibial'],
 ['thigh','left','fascia','left-iliotibial-tract','iliotibial'],
];
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog}=await contentContext(),previous=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);assert.deepEqual(display,previous.bodyDisplayCatalog(catalog));
const entries=targets.map(([region,side,system,name,group])=>{
 const id=`vm:anatomy:body:${region}:${side}:${system}:${name}`,matches=display.structures.filter(s=>s.id===id);assert.equal(matches.length,1);
 const identity=matches[0],lesson=previous.bodyLesson(identity,'quiz');
 assert.equal(lesson.readiness,'generated-identification');assert.equal(lesson.correctAnswer,undefined);
 return {identity,group,previous:lesson};
});
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path=new URL('../content/lower-limb-connective-quiz-pins.json',import.meta.url),output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({identities:entries.length,pinsHash:hash(record),clinicalApproval:false}));
