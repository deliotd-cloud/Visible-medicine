import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {cardiacVeinApi,hash} from './anterior-cardiac-vein-tools.mjs';
import {beforeAnteriorCardiacTeaching} from './anterior-cardiac-teaching-history.mjs';
import {beforePalmarArterialImaging} from './palmar-arterial-imaging-history.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {snapshot} from './pin-pica-clinical.mjs';
import pins from '../content/anterior-cardiac-teaching-pins.json' with {type:'json'};
import transition from '../content/anterior-cardiac-teaching-transition.json' with {type:'json'};

// Check the exact historical cardiac transition after undoing only the declared later layer.
const api=beforePalmarArterialImaging(await cardiacVeinApi()),raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const display=api.bodyDisplayCatalog(raw),before=beforeAnteriorCardiacTeaching(api),saved=await exactSourceHistoryApi(pins.sourceCommit),savedDisplay=saved.bodyDisplayCatalog(raw);
assert.deepEqual(savedDisplay,display);
assert.equal(hash(snapshot(saved,savedDisplay)),pins.previousAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash);
assert.equal(beforeAnteriorCardiacTeaching(before),before);
assert.deepEqual(display.structures.find(s=>s.id===pins.entry.identity.id),pins.entry.identity);
assert.deepEqual(display.bundles.find(b=>b.id===pins.bundle.id),pins.bundle);

const changedTopics=new Set(pins.entry.topics),draftTopics=new Set(['ct','clinical']);
let changed=0,unchanged=0;
for(const s of display.structures)for(const topic of api.contentTabs){
 const now=api.bodyLesson(s,topic),prior=before.bodyLesson(s,topic);
 if(s.id===pins.entry.identity.id&&changedTopics.has(topic)){
  changed++;assert.deepEqual(prior,pins.entry.previous[topic]);assert.equal(hash(now),transition.entry.sections[topic]);
  assert.equal(now.readiness,draftTopics.has(topic)?'draft':'pending');
  assert.deepEqual(now,api.anteriorCardiacVeinLesson(s,topic),'Actual bodyLesson dispatch must use the source-bound lesson');
  const rendered=api.bodyContent(s,topic),{readiness:_readiness,...expected}=now;assert.deepEqual(rendered,expected);assert.equal(rendered.note,now.note);
 }else{assert.deepEqual(now,saved.bodyLesson(s,topic));assert.deepEqual(now,prior);unchanged++;}
}
assert.equal(changed,6);assert.equal(unchanged,9930);
for(const topic of ['anatomy','function','quiz'])assert.deepEqual(api.bodyLesson(pins.entry.identity,topic),saved.bodyLesson(pins.entry.identity,topic));
for(const topic of ['mri','xray','ultrasound','pathology'])assert.equal(api.bodyLesson(pins.entry.identity,topic).body,'Additional structure-specific teaching remains to be authored and reviewed.');

const leaves=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...p,k]));
let rejected=0;
for(const path of leaves(pins.entry.identity)){
 const bad=structuredClone(pins.entry.identity);let target=bad;for(const key of path.slice(0,-1))target=target[key];const key=path.at(-1),value=target[key];target[key]=typeof value==='number'?value+.01:typeof value==='string'?value+'-foreign':typeof value==='boolean'?!value:'foreign';
 for(const topic of api.contentTabs){assert.equal(api.anteriorCardiacVeinLesson(bad,topic),undefined);rejected++;}
}
for(const mutate of [s=>s.sources.pop(),s=>s.sources.reverse(),s=>s.regions.push('foreign'),s=>{delete s.sources;},s=>s.id+='-foreign',s=>s.laterality='right',s=>s.bundle='foreign',s=>s.sources[0].sha256='0'.repeat(64)]){
 const bad=structuredClone(pins.entry.identity);mutate(bad);for(const topic of api.contentTabs){assert.equal(api.anteriorCardiacVeinLesson(bad,topic),undefined);rejected++;}
}

const review=await api.bodyReviewMaterial(pins.entry.identity.id);assert.equal(review.approval,false);assert.deepEqual(review.source.structure,pins.entry.identity);
for(const topic of pins.entry.topics){const {tab,...lesson}=review.topics.find(item=>item.tab===topic);assert.deepEqual(lesson,api.bodyLesson(pins.entry.identity,topic));}

const refs=['https://pubmed.ncbi.nlm.nih.gov/15734621/','https://pubmed.ncbi.nlm.nih.gov/12645157/','https://link.springer.com/article/10.1186/s13019-014-0184-7'],budgets=Object.fromEntries(refs.map(ref=>[ref,0]));
for(const topic of draftTopics){const lesson=api.bodyLesson(pins.entry.identity,topic),words=[lesson.body,...lesson.bullets].join(' ').trim().split(/\s+/).length;for(const ref of lesson.citations){assert(refs.includes(ref));budgets[ref]+=words;}}
for(const [ref,words] of Object.entries(budgets)){assert(words>0,ref);assert(words<=90,ref+': '+words);}
assert.match(api.bodyLesson(pins.entry.identity,'ct').body,/acquired multiplanar slices/);assert.match(api.bodyLesson(pins.entry.identity,'ct').body,/not from rendered proximity/);
assert.match(api.bodyLesson(pins.entry.identity,'clinical').body,/retrograde cardioplegia/);assert(!/catheter path|management choice|disease finding|safe plane/.test(api.bodyLesson(pins.entry.identity,'clinical').body));
assert.throws(()=>beforeAnteriorCardiacTeaching({...api,bodyLesson:(s,t)=>s.id===pins.entry.identity.id&&t==='ct'?pins.entry.previous.ct:api.bodyLesson(s,t)}),/Mixed/);
console.log(JSON.stringify({sourceCommit:pins.sourceCommit,changedPayloads:changed,unchangedPayloads:unchanged,draftTopics:[...draftTopics],pendingTopics:['mri','xray','ultrasound','pathology'],rejectedIdentityMutations:rejected,sourceWordBudgets:budgets,geometryChanged:false,recipesChanged:false,clinicalApproval:false}));
