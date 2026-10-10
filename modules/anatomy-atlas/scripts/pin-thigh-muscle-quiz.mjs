import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='b148cb9ed9ac7e397d1005f7e7aca4017c3c2373';
const bilateral=(names,group)=>['right','left'].flatMap(side=>names.map(name=>['thigh',side,'muscle',name.replace('{side}',side),group]));
const targets=[
  ...bilateral(['{side}-gluteus-maximus'],'gluteusMaximus'),
  ...bilateral(['{side}-gluteus-medius','{side}-gluteus-minimus'],'gluteusMediusMinimus'),
  ...bilateral(['{side}-rectus-femoris'],'rectusFemoris'),
  ...bilateral(['{side}-vastus-lateralis','{side}-vastus-medialis','{side}-vastus-intermedius'],'vasti'),
  ...bilateral(['long-head-of-{side}-biceps-femoris'],'bicepsLong'),
  ...bilateral(['short-head-of-{side}-biceps-femoris'],'bicepsShort'),
  ...bilateral(['{side}-semitendinosus','{side}-semimembranosus'],'semis'),
];
assert(process.argv.slice(2).every(arg=>arg==='--check'));
assert.equal(targets.length,22);
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog}=await contentContext(),previous=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);assert.deepEqual(display,previous.bodyDisplayCatalog(catalog));
const entries=targets.map(([region,side,system,name,group])=>{
 const id=`vm:anatomy:body:${region}:${side}:${system}:${name}`,matches=display.structures.filter(s=>s.id===id);assert.equal(matches.length,1,id);
 const identity=matches[0],lesson=previous.bodyLesson(identity,'quiz');
 assert.equal(lesson.readiness,'generated-identification',id);assert.equal(lesson.correctAnswer,undefined);
 return {identity,group,previous:lesson};
});
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path=new URL('../content/thigh-muscle-quiz-pins.json',import.meta.url),output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({identities:entries.length,pinsHash:hash(record),clinicalApproval:false}));
