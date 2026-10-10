import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='994da77df921985ec83d45dff8da55c7a1332346';
const targets=[
 ['midline','external-intercostal-muscle','external'],
 ['midline','internal-intercostal-muscle','internal'],
 ['midline','innermost-intercostal-muscle','innermost'],
 ['right','right-transversus-thoracis','transversus'],
 ['left','left-transversus-thoracis','transversus'],
 ['midline','diaphragm','diaphragm'],
];
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog}=await contentContext(),previous=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);assert.deepEqual(display,previous.bodyDisplayCatalog(catalog));
const entries=targets.map(([side,name,group])=>{
 const id=`vm:anatomy:body:thorax:${side}:muscle:${name}`,matches=display.structures.filter(s=>s.id===id);assert.equal(matches.length,1);
 const identity=matches[0],lesson=previous.bodyLesson(identity,'quiz');
 assert.equal(lesson.readiness,'generated-identification');assert.equal(lesson.correctAnswer,undefined);
 return {identity,group,previous:lesson};
});
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path=new URL('../content/chest-wall-quiz-pins.json',import.meta.url),output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({identities:entries.length,pinsHash:hash(record),clinicalApproval:false}));
