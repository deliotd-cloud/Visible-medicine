import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {snapshot,hash} from './pin-cerebellar-mca-imaging.mjs';
const pins=JSON.parse(await readFile('content/cerebellar-mca-imaging-pins.json'));
const live=await contentContext(),{api}=live,display=api.bodyDisplayCatalog(live.catalog),parent=await exactSourceHistoryApi(pins.parentCommit);
assert.equal(hash(snapshot(parent,display)),pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(display,parent.bodyDisplayCatalog(live.catalog));
assert.deepEqual(api.structures,parent.structures);assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
const targets=new Map(pins.entries.flatMap(e=>e.topics.map(t=>[e.identity.id+'|'+t,e])));
assert.equal(pins.entries.length,5);assert.equal(targets.size,10);
const transitionEntries=[];let unchanged=0,rejected=0;
for(const s of display.structures)for(const t of api.contentTabs){
 const old=parent.bodyLesson(s,t),now=api.bodyLesson(s,t),target=targets.get(s.id+'|'+t);
 if(!target){assert.deepEqual(now,old,s.id+'|'+t);assert.equal(api.cerebellarMcaImagingLesson(s,t),undefined);unchanged++;continue;}
 assert.deepEqual(s,target.identity);assert.deepEqual(old,target.previous[t]);assert.equal(old.readiness,'pending');
 assert.equal(now.readiness,'draft');assert.notDeepEqual(now,old);assert.deepEqual(now,api.cerebellarMcaImagingLesson(s,t));
 assert.match(now.note,/revision-bound radiologist review/i);assert.match(now.note,/independent/);
 assert(now.note.includes(s.coverageNote),'Exact source limitation retained');
 assert(now.citations.length>=1);assert.equal(new Set(now.citations).size,now.citations.length);
 for(const url of now.citations)assert.equal(new URL(url).protocol,'https:');
 const {readiness:_r,...shown}=now;assert.deepEqual(api.bodyContent(s,t),shown);
 const copy=structuredClone(now);now.bullets.push('foreign');now.citations.length=0;
 assert.deepEqual(api.bodyLesson(s,t),copy,'No mutable shared lesson arrays');
 transitionEntries.push({id:s.id,tab:t,previousHash:hash(old),currentHash:hash(copy)});
}
assert.equal(unchanged,9926);
const records=api.bodyContentRecords(display),registry=new Map([...live.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r])),validate=await contentValidator(registry);
for(const e of pins.entries){
 const record=records.find(r=>r.id===e.identity.id);assert(validate(record));assert.equal(record.validation.clinicalApproval,'not-included');
 const packet=await api.bodyReviewMaterial(e.identity.id);assert.equal(packet.approval,false);
 for(const t of e.topics){assert.deepEqual(record.content[t],api.bodyLesson(e.identity,t));const {tab:_t,...shown}=packet.topics.find(x=>x.tab===t);assert.deepEqual(shown,api.bodyLesson(e.identity,t));}
 function leaves(v,path=[]){return v!==null&&typeof v==='object'?Object.entries(v).flatMap(([k,x])=>leaves(x,[...path,k])):[path];}
 for(const path of leaves(e.identity)){
  const changed=structuredClone(e.identity);let cursor=changed;for(const k of path.slice(0,-1))cursor=cursor[k];const k=path.at(-1),v=cursor[k];cursor[k]=typeof v==='string'?v+'-foreign':typeof v==='number'?v+0.1:typeof v==='boolean'?!v:'foreign';
  for(const t of e.topics){assert.equal(api.cerebellarMcaImagingLesson(changed,t),undefined,path.join('.'));rejected++;}
 }
 for(const changed of [{...e.identity,foreign:true},{...e.identity,sources:e.identity.sources.slice(1)},{...e.identity,sources:[...e.identity.sources,e.identity.sources[0]]}])for(const t of e.topics){assert.equal(api.cerebellarMcaImagingLesson(changed,t),undefined);rejected++;}
}
for(const b of pins.bundles){assert.deepEqual(display.bundles.find(x=>x.id===b.id),b);const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const transition={parentCommit:pins.parentCommit,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries:transitionEntries};
const path='content/cerebellar-mca-imaging-transition.json';
if(process.argv.includes('--record'))await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});
else{
 assert.deepEqual(JSON.parse(await readFile(path)),transition);
 const {beforeCerebellarMcaImaging}=await import('./cerebellar-mca-imaging-history.mjs');
 const restored=beforeCerebellarMcaImaging(api,display);assert.deepEqual(snapshot(restored,display),snapshot(parent,display));assert.equal(beforeCerebellarMcaImaging(restored,display),restored);
 const e=pins.entries[0];for(const mode of ['mixed','foreign'])assert.throws(()=>beforeCerebellarMcaImaging({...api,bodyLesson(s,t){const lesson=api.bodyLesson(s,t);return s.id===e.identity.id&&t==='ct'?mode==='mixed'?e.previous.ct:{...lesson,body:'foreign'}:lesson;}},display),/Mixed|Unrecorded/);
}
console.log(JSON.stringify({changed:10,unchanged,rejected,reviewSelections:5,pinsHash:hash(pins),transitionHash:hash(transition),clinicalApproval:false,sourceGeometryChanged:false}));
