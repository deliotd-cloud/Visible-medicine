import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='e7608c0719fbf77b0f1a350d648dd695be23be6b';
assert(process.argv.length===2||(process.argv.length===3&&process.argv[2]==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected=new Map([
 ['FMA46310','longus'],['FMA46309','longus'],
 ['FMA46314','anterior'],['FMA46313','anterior'],
 ['FMA46318','lateralis'],['FMA46317','lateralis'],
 ['FMA46444','coccygeus'],['FMA46443','coccygeus'],
 ['FMA46018','oblique'],['FMA46019','oblique'],
 ['FMA46020','transverse'],['FMA46021','transverse'],
]);
const {api,catalog}=await contentContext(),before=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);assert.deepEqual(display,before.bodyDisplayCatalog(catalog));
const entries=display.structures.flatMap(identity=>{
 const group=expected.get(identity.fmaId);if(!group)return [];
 assert.equal(identity.system,'muscles');assert.equal(identity.category,'muscle');
 assert.equal(identity.nodeName,identity.fmaId);
 assert.equal(identity.sources.length,identity.fmaId==='FMA46444'?2:1);
 if(identity.fmaId==='FMA46444')assert.deepEqual(identity.sources.map(s=>s.file),['FJ1449M','FJ2542']);
 assert(identity.name.toLowerCase().includes(group));
 assert.equal(identity.region,['longus','anterior','lateralis'].includes(group)?'spine':group==='coccygeus'?'pelvis':'foot');
 const previous=before.bodyLesson(identity,'quiz');assert.equal(previous.readiness,'generated-identification');assert.equal(previous.correctAnswer,undefined);
 return [{identity,group,previous}];
});
assert.equal(entries.length,12);assert.equal(new Set(entries.map(e=>e.identity.id)).size,12);
for(const [fma,group] of expected)assert.equal(entries.filter(e=>e.identity.fmaId===fma&&e.group===group).length,1);
for(const group of new Set(expected.values()))assert.deepEqual(entries.filter(e=>e.group===group).map(e=>e.identity.laterality).sort(),['left','right']);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path=new URL('../content/regional-muscle-completion-quiz-pins.json',import.meta.url),output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else{assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),'{"entries":[]}\n');await writeFile(path,output);}
console.log(JSON.stringify({identities:entries.length,groups:6,bundles:bundles.length,pinsHash:hash(record),clinicalApproval:false}));
