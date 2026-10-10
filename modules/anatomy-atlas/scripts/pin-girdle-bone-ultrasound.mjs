// Freeze the genuine pre-change records; never infer a side from a display name.
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='3db69cc3f712c7af256650dc645499752ca9adcb';
const targets=[
  ['vm:anatomy:body:shoulder-arm:left:bone:left-clavicle','clavicle'],
  ['vm:anatomy:body:shoulder-arm:left:bone:left-humerus','humerus'],
  ['vm:anatomy:body:shoulder-arm:left:bone:left-scapula','scapula'],
  ['vm:anatomy:body:pelvis:right:bone:right-hip-bone','hip'],
  ['vm:anatomy:body:pelvis:left:bone:left-hip-bone','hip'],
];
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog}=await contentContext();
const previous=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);
assert.deepEqual(display,previous.bodyDisplayCatalog(catalog));
const entries=targets.map(([id,group])=>{
  const found=display.structures.filter(s=>s.id===id);assert.equal(found.length,1);
  const identity=found[0];assert.equal(identity.system,'skeleton');
  const lesson=previous.bodyLesson(identity,'ultrasound');assert.equal(lesson.readiness,'pending');
  return {identity,group,previous:lesson};
});
const bundles=display.bundles.filter(bundle=>entries.some(e=>e.identity.bundle===bundle.id));
assert.equal(bundles.length,2);
for(const bundle of bundles){
  const bytes=await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}
const record={parentCommit,catalogHash:hash(display),coordinateSystem:display.coordinateSystem,bundles,entries};
const path=new URL('../content/girdle-bone-ultrasound-pins.json',import.meta.url);
const output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({identities:entries.length,pinsHash:hash(record),clinicalApproval:false}));
