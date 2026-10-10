import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {build} from './workspace-test-build.mjs';

const baseline='05596d396d104a65cdd7a1fdf770505c3dfb3139';
const old=path=>execFileSync('git',['show',baseline+':'+path],{encoding:'utf8',maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
async function load(previous=false){
 const output=await build({stdin:{contents:["export * from './lib/specimen-review-material';","export * from './lib/specimen-review';","export * from './lib/specimen-review-api';","export {limbDefinitions} from './lib/um-limb-studies';","export {umLimbGuidedDissection} from './lib/um-limb-guided-dissection';"].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:previous?[{name:'exact-before-knee-comparison',setup(api){
  for(const path of ['lib/um-proximal-guided-dissection.ts','content/body-renderer-revision.json'])api.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:old(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}));
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
}
const now=await load(),prior=await load(true),scope=now.limbDefinitions.knee.key;
const newGuide=now.umLimbGuidedDissection(now.limbDefinitions.knee),oldGuide=prior.umLimbGuidedDissection(prior.limbDefinitions.knee);
assert.equal(oldGuide.steps.length,6);assert.equal(newGuide.steps.length,7);
assert.deepEqual(newGuide.steps.filter(s=>s.id!=='um-knee-stability-compare'),oldGuide.steps);
assert.deepEqual(newGuide.steps[5].ids,['tibia','fibula','acl','pcl','mcl','lcl'].map(slug=>'vm:reference:um-5t6tz7-v1-2:knee:'+slug));
assert.match(newGuide.steps[5].caption,/femur is hidden for visibility only/);
assert.match(newGuide.steps[5].caption,/do not simulate loading, injury/);
assert.equal(readFileSync('content/um-limb-teaching-bindings.v1.json','utf8').replaceAll('\r\n','\n'),old('content/um-limb-teaching-bindings.v1.json'),'All67 lesson pins stay exact; no repin');
const storage=new Proxy({},{get(){throw Error('Stale knee guide reached review storage');}});
async function stale(packet,track,patch){
 const c=packet.context,draft=now.blankSpecimenReview(c,track);
 const response=await now.postSpecimenReview(new Request('https://atlas.test/api/review/specimens',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_KNEE_GUIDE'},body:JSON.stringify({catalogScope:c.catalogScope,specimenKey:c.specimenKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft,...patch})}),storage);
 assert.equal(response.status,409,'Stale/foreign save rejected before storage');
}
let changed=0,unchanged=0,sourceExact=0,rejected=0,calf=0,thigh=0;
for(const row of now.specimenReviewRows)for(const surface of row.surfaces){
 const a=await prior.specimenReviewMaterial(row.key,surface.id),b=await now.specimenReviewMaterial(row.key,surface.id);assert(a&&b);
 assert.deepEqual(b.source,a.source);assert.equal(b.context.sourceHash,a.context.sourceHash);sourceExact++;
 assert.equal(b.atlasLink,a.atlasLink);assert.equal(b.atlasPath,a.atlasPath);
 assert.deepEqual(b.context.blockers,a.context.blockers);assert.deepEqual(b.context.checklists,a.context.checklists);
 assert.deepEqual(b.context.teachingTabs,a.context.teachingTabs);assert.equal(b.context.revisions.imaging,null);
 assert.notEqual(b.context.rendererHash,a.context.rendererHash);assert.notEqual(b.context.revisions.geometry,a.context.revisions.geometry,'Display revision changes, not source geometry');
 if(row.key!==scope){
  unchanged++;assert.deepEqual(b.teaching,a.teaching);assert.equal(b.context.teachingHash,a.context.teachingHash);assert.equal(b.context.revisions.teaching,a.context.revisions.teaching);
  if(b.context.teachingTabs.includes('calf-depth'))calf++;if(b.context.teachingTabs.includes('thigh-depth'))thigh++;
  await stale(b,'geometry',{revisionHash:a.context.revisions.geometry});rejected++;continue;
 }
 changed++;assert.deepEqual(b.teaching.guidedDissection,newGuide);
 const retained=structuredClone(b.teaching);retained.guidedDissection=a.teaching.guidedDissection;assert.deepEqual(retained,a.teaching,'Only knee guide changes; lesson, references, topics and quizzes exact');
 assert.notEqual(b.context.teachingHash,a.context.teachingHash);assert.notEqual(b.context.revisions.teaching,a.context.revisions.teaching);
 const draft=now.blankSpecimenReview(b.context,'teaching');assert.equal(draft.status,'draft');assert.equal(draft.checks['guided-dissection'],false);
 assert(now.specimenApprovalProblems({...draft,reviewer:'Synthetic',qualification:'Synthetic',scope:'Synthetic',attested:true,evidence:['https://example.test']},b.context,'teaching').includes('Complete every checklist item.'));
 for(const patch of [{revisionHash:a.context.revisions.teaching},{materialHash:a.context.materialHash},{sourceFrame:'foreign-frame'}]){await stale(b,'teaching',patch);rejected++;}
 const copy=structuredClone(b);b.teaching.guidedDissection.steps[5].caption='Changed';assert.deepEqual(await now.specimenReviewMaterial(row.key,surface.id),copy,'Returned review packet detached');
}
assert.deepEqual([sourceExact,changed,unchanged,rejected],[356,15,341,386]);
// One calf-depth placement (popliteus) is in the changed knee guide; its entire
// underlying lesson is still compared exactly in the affected branch above.
assert.equal(calf,23);assert.equal(thigh,32);
for(const other of ['hip-thigh','calf','foot','whole'])assert.deepEqual(now.umLimbGuidedDissection(now.limbDefinitions[other]),prior.umLimbGuidedDissection(prior.limbDefinitions[other]));
console.log(JSON.stringify({baseline,sourcePacketsExact:sourceExact,kneeGuideTeachingContextsChanged:changed,otherTeachingContextsExact:unchanged,lessonPinsExact:67,staleOrForeignSavesRefusedBeforeStorage:rejected,otherGuidesExact:4,newMeshes:0,clinicalApproval:false}));
