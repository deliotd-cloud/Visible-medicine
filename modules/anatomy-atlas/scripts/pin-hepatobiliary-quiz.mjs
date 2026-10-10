import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='e3d71fe4f3ce60169029fa29d0561d81335bad53';
const targets=[
 ['vm:anatomy:body:abdomen:unpaired:organ:liver','liver'],
 ['vm:anatomy:body:pelvis:unpaired:organ:gallbladder','gallbladder'],
 ['vm:anatomy:body:abdomen:unspecified:vessel:hepatic-portal-vein','portal'],
 ['vm:anatomy:body:abdomen:unpaired:organ:cystic-duct','cystic'],
 ['vm:anatomy:body:abdomen:unpaired:organ:common-hepatic-duct','hepatic'],
];
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog}=await contentContext(),previous=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);assert.deepEqual(display,previous.bodyDisplayCatalog(catalog));
const entries=targets.map(([id,group])=>{
 const matches=display.structures.filter(s=>s.id===id);assert.equal(matches.length,1);
 const identity=matches[0],lesson=previous.bodyLesson(identity,'quiz');
 assert.equal(lesson.readiness,'generated-identification');assert.equal(lesson.correctAnswer,undefined);
 return {identity,group,previous:lesson};
});
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path=new URL('../content/hepatobiliary-quiz-pins.json',import.meta.url),output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({identities:entries.length,pinsHash:hash(record),clinicalApproval:false}));
