import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {snapshot,hash} from './pin-tentorium-imaging.mjs';
import {beforeCranialBoneQuiz} from './cranial-bone-quiz-history.mjs';

const pins=JSON.parse(await readFile('content/tentorium-imaging-pins.json'));
const live=await contentContext(),display=live.api.bodyDisplayCatalog(live.catalog),api=beforeCranialBoneQuiz(live.api,display),parent=await exactSourceHistoryApi(pins.parentCommit);
assert.equal(hash(snapshot(parent,display)),pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(display,parent.bodyDisplayCatalog(live.catalog));
assert.deepEqual(api.structures,parent.structures);
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
assert.equal(pins.entries.length,1);
const entry=pins.entries[0];
assert.deepEqual(entry.topics,['ct','mri']);
assert.equal(entry.identity.fmaId,'FMA83966');
assert.equal(entry.identity.bundle,'tentorium-partial');
assert.equal(entry.identity.laterality,'right');
assert.equal(entry.identity.region,'head-neck');
assert.equal(entry.identity.system,'connective');
assert.equal(entry.identity.representation.coverage,'partial');
assert.equal(entry.identity.sources.length,1);
assert.equal(entry.identity.sources[0].file,'FJ1843');
const matches=display.structures.filter(s=>s.fmaId==='FMA83966');
assert.equal(matches.length,1);
assert.deepEqual(matches[0],entry.identity);
const targets=new Set(entry.topics.map(t=>entry.identity.id+'|'+t));
assert.equal(targets.size,2);

const transitionEntries=[];let unchanged=0,rejected=0;
for(const s of display.structures)for(const t of api.contentTabs){
 const old=parent.bodyLesson(s,t),now=api.bodyLesson(s,t),target=targets.has(s.id+'|'+t);
 if(!target){assert.deepEqual(now,old,s.id+'|'+t);assert.equal(api.tentoriumImagingLesson(s,t),undefined);unchanged++;continue;}
 assert.deepEqual(s,entry.identity);assert.deepEqual(old,entry.previous[t]);assert.equal(old.readiness,'pending');
 assert.equal(now.readiness,'draft');assert.notDeepEqual(now,old);assert.deepEqual(now,api.tentoriumImagingLesson(s,t));
 assert.match(now.note,/revision-bound radiologist review/i);assert.match(now.note,/independent/i);
 assert(now.note.includes(s.coverageNote),'Exact source limitation retained');
 assert.match(now.note,/no acquired CT\/MRI images, intensities, masks, registration/i);
 assert.match(now.note,/no.*clinical approval/i);
 assert(now.citations.length>=1);assert.equal(new Set(now.citations).size,now.citations.length);
 for(const url of now.citations)assert.equal(new URL(url).protocol,'https:');
 const {readiness:_r,...shown}=now;assert.deepEqual(api.bodyContent(s,t),shown);
 const copy=structuredClone(now);now.bullets.push('foreign');now.citations.length=0;
 assert.deepEqual(api.bodyLesson(s,t),copy,'No mutable shared lesson arrays');
 transitionEntries.push({id:s.id,tab:t,previousHash:hash(old),currentHash:hash(copy)});
}
assert.equal(unchanged,9934);
const records=api.bodyContentRecords(display),registry=new Map([...live.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r])),validate=await contentValidator(registry);
const record=records.find(r=>r.id===entry.identity.id);
assert(validate(record));assert.equal(record.validation.clinicalApproval,'not-included');
const packet=await api.bodyReviewMaterial(entry.identity.id);assert.equal(packet.approval,false);
for(const t of entry.topics){assert.deepEqual(record.content[t],api.bodyLesson(entry.identity,t));const {tab:_t,...shown}=packet.topics.find(x=>x.tab===t);assert.deepEqual(shown,api.bodyLesson(entry.identity,t));}
function leaves(v,path=[]){return v!==null&&typeof v==='object'?Object.entries(v).flatMap(([k,x])=>leaves(x,[...path,k])):[path];}
for(const path of leaves(entry.identity)){
 const changed=structuredClone(entry.identity);let cursor=changed;for(const k of path.slice(0,-1))cursor=cursor[k];const k=path.at(-1),v=cursor[k];cursor[k]=typeof v==='string'?v+'-foreign':typeof v==='number'?v+0.1:typeof v==='boolean'?!v:'foreign';
 for(const t of entry.topics){assert.equal(api.tentoriumImagingLesson(changed,t),undefined,path.join('.'));rejected++;}
}
for(const changed of [{...entry.identity,foreign:true},{...entry.identity,sources:[]},{...entry.identity,sources:[...entry.identity.sources,entry.identity.sources[0]]}])for(const t of entry.topics){assert.equal(api.tentoriumImagingLesson(changed,t),undefined);rejected++;}
for(const b of pins.bundles){assert.deepEqual(display.bundles.find(x=>x.id===b.id),b);const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}

const transition={parentCommit:pins.parentCommit,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries:transitionEntries};
const transitionPath='content/tentorium-imaging-transition.json';
if(process.argv.includes('--record'))await writeFile(transitionPath,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});
else{
 assert.deepEqual(JSON.parse(await readFile(transitionPath)),transition);
 const {beforeTentoriumImaging}=await import('./tentorium-imaging-history.mjs');
 const restored=beforeTentoriumImaging(api,display);assert.deepEqual(snapshot(restored,display),snapshot(parent,display));assert.equal(beforeTentoriumImaging(restored,display),restored);
 for(const mode of ['mixed','foreign'])assert.throws(()=>beforeTentoriumImaging({...api,bodyLesson(s,t){const lesson=api.bodyLesson(s,t);return s.id===entry.identity.id&&t==='ct'?mode==='mixed'?entry.previous.ct:{...lesson,body:'foreign'}:lesson;}},display),/Mixed|Unrecorded/);
}
console.log(JSON.stringify({changed:2,unchanged,rejected,reviewSelections:1,pinsHash:hash(pins),transitionHash:hash(transition),clinicalApproval:false,sourceGeometryChanged:false}));
