import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {umCalfDepthMilestonePlugin,umCalfDepthMilestoneText,umCalfDepthMilestone} from './um-calf-depth-history.mjs';
const baseline='4b0c1958e67d99a8d0a0b5da3ef98f23ac1d43b5';
const oldFile=path=>execFileSync('git',['show',baseline+':'+path],{encoding:'utf8',maxBuffer:32e6});
const prior=JSON.parse(oldFile('content/um-limb-teaching-bindings.v1.json'));
const compiled=await build({stdin:{contents:"export * from './lib/um-limb-teaching'; export {limbDefinitions} from './lib/um-limb-studies'; export {specimenLessons} from './content/um-limb-teaching'; export {umCalfDepth} from './content/um-calf-depth';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[umCalfDepthMilestonePlugin()]});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const target=['tibialis-anterior','tibialis-posterior','flexor-digitorum-longus','flexor-hallucis-longus','peroneus-longus','soleus','gastrocnemius-medial','gastrocnemius-lateral','popliteus'];
assert.deepEqual(Object.keys(api.umCalfDepth).sort(),[...target].sort());
const whole=api.limbDefinitions.whole,now=JSON.parse(umCalfDepthMilestoneText('content/um-limb-teaching-bindings.v1.json'));
assert.equal(whole.surfaces.length,67); assert.equal(now.bindings.length,67);
let changed=0,unchanged=0,negative=0;
for(const surface of whole.surfaces){
 const old=prior.bindings.find(p=>p.surface.id===surface.id),pin=now.bindings.find(p=>p.surface.id===surface.id);
 assert(old&&pin);assert.deepEqual(surface,old.surface);assert.deepEqual(pin.surface,old.surface);assert.equal(pin.bundleSha256,old.bundleSha256);
 const lesson=api.specimenTeachingFor(whole,surface);assert.deepEqual(lesson,api.specimenLessons[surface.slug]);assert.deepEqual(pin.lesson,lesson);
 if(target.includes(surface.slug)){
  changed++;assert.equal(old.lesson.depth,undefined);assert.deepEqual(lesson.depth,api.umCalfDepth[surface.slug]);
  const retained=structuredClone(lesson);delete retained.depth;assert.deepEqual(retained,old.lesson,surface.slug+': all original teaching retained');
  const copy=structuredClone(lesson);lesson.depth.relationships.body='Changed';lesson.depth.arterialSupply.references[0].title='Changed';
  assert.deepEqual(api.specimenTeachingFor(whole,surface),copy,'Depth is detached');
 }else{unchanged++;assert.deepEqual(lesson,old.lesson,surface.slug+': unrelated lesson exact');}
 const topics=['anatomy','function',...Object.keys(old.lesson.extended?.topics??{})];
 assert.deepEqual([...api.availableSpecimenTopics(whole,surface.id)].sort(),topics.sort(),'No invented topic or imaging readiness');
 for(const patch of [{name:'Foreign'}, {slug:surface.slug+'-foreign'}, {laterality:'left'}, {sources:surface.sources.map(s=>({...s,sha256:'foreign'}))}, {bounds:{...surface.bounds,min:[surface.bounds.min[0]+1,...surface.bounds.min.slice(1)]}}]){
  assert.equal(api.specimenTeachingFor(whole,{...surface,...patch}),null);negative++;
 }
 const foreign=structuredClone(whole);foreign.catalog.bundles.find(b=>b.id===surface.bundle).sha256='foreign';
 assert.equal(api.specimenTeachingFor(foreign,surface),null);negative++;
}
assert.equal(changed,9);assert.equal(unchanged,58);assert.equal(negative,402);
for(const path of ['lib/um-limb-teaching.ts','lib/um-limb-studies.ts','lib/um-limb-navigation.ts','lib/um-limb-guided-dissection.ts','content/um-limb-motor.ts','content/um-limb-clinical.ts','public/models/um-limb/catalog.json','public/models/um-knee/catalog.json'])
 assert.equal(readFileSync(path,'utf8').replaceAll('\r',''),oldFile(path).replaceAll('\r',''),path+': source/old topics/frame/navigation exact');
console.log(JSON.stringify({baseline,milestone:umCalfDepthMilestone,sourceBindings:67,newDepthLessons:changed,unchangedLessons:unchanged,foreignBindingRefusals:negative,newMeshes:0,clinicalApproved:false}));
