import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='5363ae64e06cb5629a36469c7d15fddbcfff32b4';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const specs=[["brevis","FMA22452","FMA22454"],["longus","FMA22456","FMA22457"],["magnus","FMA22459","FMA22460"],["minimus","FMA43886","FMA43887"],["inferior","FMA22336","FMA22337"],["superior","FMA22334","FMA22335"],["gracilis","FMA43883","FMA43884"],["iliacus","FMA22322","FMA22323"],["externus","FMA22326","FMA22327"],["internus","FMA22324","FMA22325"],["pectineus","FMA22450","FMA22451"],["piriformis","FMA22340","FMA22341"],["quadratus","FMA22338","FMA22339"],["sartorius","FMA22354","FMA22355"],["tensor","FMA22425","FMA22426"]];
const {api,catalog}=await contentContext(),before=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);assert.deepEqual(display,before.bodyDisplayCatalog(catalog));
const entries=specs.flatMap(([group,...fmas])=>fmas.map((fma,index)=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1,fma);
 const identity=matches[0];assert.equal(identity.system,'muscles');assert(['thigh'].includes(identity.region));
 const previous=before.bodyLesson(identity,'quiz');assert.equal(previous.readiness,'generated-identification');assert.equal(previous.correctAnswer,undefined);
 return{identity,group,previous};
}));
assert.equal(entries.length,30);assert.equal(new Set(entries.map(e=>e.identity.id)).size,30);
const eligible = display.structures.filter(s => s.region === 'thigh' && s.system === 'muscles' && before.bodyLesson(s, 'quiz')?.readiness === 'generated-identification');
assert.deepEqual(entries.map(e=>e.identity.id).sort(),eligible.map(s=>s.id).sort());
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path='content/thigh-deep-muscle-quiz-pins.json',output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);await assert.rejects(access(path));await writeFile(path,output,{flag:'wx'});}
console.log(JSON.stringify({identities:30,groups:15,pinsHash:hash(record),clinicalApproval:false}));
