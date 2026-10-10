import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='cbda5345d2aaa730b0361e7e374e356478f6222d';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected=new Map([
 ['FMA23707','interosseous'],['FMA23708','interosseous'],
 ['FMA40120','retinaculum'],['FMA40121','retinaculum'],
 ['FMA13330','axillary'],['FMA13331','axillary'],
 ['FMA50859','suprascapular'],['FMA50860','suprascapular'],
 ['FMA22935','brachial'],['FMA22936','brachial'],
]);
const {api,catalog}=await contentContext(),before=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);assert.deepEqual(display,before.bodyDisplayCatalog(catalog));
const entries=display.structures.flatMap(identity=>{
 const group=expected.get(identity.fmaId);if(!group)return [];
 const connective=['interosseous','retinaculum'].includes(group);
 assert.equal(identity.system,connective?'connective':'vessels');
 assert.equal(identity.category,connective?'ligament':'vessel');
 if(!connective)assert(identity.name.toLowerCase().includes('vein'));
 assert.equal(identity.nodeName,identity.fmaId);assert.equal(identity.sources.length,1);
 assert(identity.name.toLowerCase().includes(group));
 const previous=before.bodyLesson(identity,'quiz');assert.equal(previous.readiness,'generated-identification');assert.equal(previous.correctAnswer,undefined);
 return [{identity,group,previous}];
});
assert.equal(entries.length,10);assert.equal(new Set(entries.map(e=>e.identity.id)).size,10);
for(const [fma,group] of expected)assert.equal(entries.filter(e=>e.identity.fmaId===fma&&e.group===group).length,1);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path=new URL('../content/upper-limb-completion-quiz-pins.json',import.meta.url),output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else{assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),'{"entries":[]}\n');await writeFile(path,output);}
console.log(JSON.stringify({identities:entries.length,groups:5,bundles:bundles.length,pinsHash:hash(record),clinicalApproval:false}));
