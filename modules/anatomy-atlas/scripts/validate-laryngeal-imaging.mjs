import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-test-build.mjs';
import pins from '../content/laryngeal-imaging-pins.json' with {type:'json'};
const {api,display,catalog}=await context({current:true});
const saved=await exactSourceHistoryApi(pins.sourceCommit);
assert.deepEqual(display,saved.bodyDisplayCatalog(catalog));
assert.equal(hash(snapshot(saved,display)),pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(api.dissectionProfiles,saved.dissectionProfiles);
assert.deepEqual(api.structures,saved.structures);
const built=await build({stdin:{contents:"export {laryngealImagingLesson} from './lib/laryngeal-imaging';export {bodyReviewMaterial} from './lib/body-review-material';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {laryngealImagingLesson:lesson,bodyReviewMaterial}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const selected=new Map(pins.entries.map(e=>[e.identity.id,e]));
const entries=[];let changed=0,unchanged=0,rejected=0;
for(const s of display.structures)for(const tab of api.contentTabs){
 const prior=saved.bodyLesson(s,tab),now=api.bodyLesson(s,tab),pin=selected.get(s.id);
 if(!pin||!['ct','mri'].includes(tab)){assert.deepEqual(now,prior);assert.equal(lesson(s,tab),undefined);unchanged++;continue;}
 assert.deepEqual(s,pin.identity);assert.deepEqual(prior,pin.previous[tab]);
 assert.equal(prior.readiness,'pending');assert.equal(now.readiness,'draft');
 assert.deepEqual(now,lesson(s,tab));assert(now.citations.length>0);assert.match(now.note,/revision-bound radiologist/);
 const {readiness,...rendered}=now;assert.deepEqual(api.bodyContent(s,tab),rendered);
 const packet=await bodyReviewMaterial(s.id);assert.equal(packet.approval,false);
 const {tab:_tab,...review}=packet.topics.find(t=>t.tab===tab);assert.deepEqual(review,now);
 entries.push({id:s.id,tab,previousHash:hash(prior),currentHash:hash(now)});changed++;
 const original=structuredClone(now);now.bullets.length=0;now.citations.push('foreign');assert.deepEqual(lesson(s,tab),original);
}
assert.equal(changed,6);assert.equal(unchanged,9930);
const leaves=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...p,k]));
for(const e of pins.entries){
 for(const path of leaves(e.identity)){
  const bad=structuredClone(e.identity);let t=bad;for(const k of path.slice(0,-1))t=t[k];const k=path.at(-1),v=t[k];t[k]=typeof v==='number'?v+.01:typeof v==='string'?v+'-foreign':typeof v==='boolean'?!v:'foreign';
  assert.equal(lesson(bad,'ct'),undefined);assert.equal(lesson(bad,'mri'),undefined);rejected++;
 }
 for(const mutate of [s=>s.sources.pop(),s=>{delete s.sources;},s=>s.regions.push('foreign'),s=>s.sources.push(s.sources[0])]){const bad=structuredClone(e.identity);mutate(bad);assert.equal(lesson(bad,'ct'),undefined);rejected++;}
}
const transition={sourceCommit:pins.sourceCommit,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
const path='content/laryngeal-imaging-transition.json';
if(process.argv.includes('--record')){await assert.rejects(access(path));await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});}
else assert.deepEqual(JSON.parse(await readFile(path)),transition);
console.log(JSON.stringify({changed,unchanged,rejectedIdentityMutations:rejected,transitionHash:hash(transition),pinsHash:hash(pins),geometryChanged:false,recipesChanged:false,clinicalApproval:false}));
