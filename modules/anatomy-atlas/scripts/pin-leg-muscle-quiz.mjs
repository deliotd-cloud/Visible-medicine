import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import imagingPins from '../content/leg-muscle-imaging-pins.json' with {type:'json'};

const parentCommit='4bb7a85b962e2cbd20ee9f329ddd0ae38e4f0642';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog}=await contentContext();
const previous=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);
assert.deepEqual(display,previous.bodyDisplayCatalog(catalog));
const entries=imagingPins.entries.map(({identity:imagingIdentity,group:imagingGroup})=>{
  const matches=display.structures.filter(s=>s.id===imagingIdentity.id);
  assert.equal(matches.length,1,imagingIdentity.id);
  const identity=matches[0];
  assert.deepEqual(identity,imagingIdentity);
  const group=imagingGroup==='medialGastrocnemius'||imagingGroup==='lateralGastrocnemius'?'gastrocnemiusHeads':imagingGroup;
  const previousLesson=previous.bodyLesson(identity,'quiz');
  assert.equal(previousLesson.readiness,'generated-identification',identity.id);
  assert.equal(previousLesson.correctAnswer,undefined,identity.id);
  return {identity,group,previous:previousLesson};
});
assert.equal(entries.length,28);
assert.equal(new Set(entries.map(e=>e.identity.id)).size,28);
assert.equal(new Set(entries.map(e=>e.group)).size,13);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
assert.equal(bundles.length,2);
for(const bundle of bundles){
  const bytes=await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path=new URL('../content/leg-muscle-quiz-pins.json',import.meta.url);
const output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({identities:entries.length,groups:new Set(entries.map(e=>e.group)).size,pinsHash:hash(record),clinicalApproval:false}));
