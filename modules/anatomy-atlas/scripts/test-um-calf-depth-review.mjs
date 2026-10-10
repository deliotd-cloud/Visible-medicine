import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {build} from './workspace-test-build.mjs';
import {umCalfDepthMilestonePlugin,umCalfDepthMilestone} from './um-calf-depth-history.mjs';
const baseline='4b0c1958e67d99a8d0a0b5da3ef98f23ac1d43b5';
async function load(previous=false){
 const compiled=await build({stdin:{contents:"export * from './lib/specimen-review-material'; export * from './lib/specimen-review'; export * from './lib/specimen-review-api';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:previous?[{name:'exact-before-calf-depth',setup(builder){
  for(const path of ['lib/specimen-review-material.ts','content/um-limb-teaching-bindings.v1.json','content/body-renderer-revision.json'])builder.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:execFileSync('git',['show',baseline+':'+path],{encoding:'utf8',maxBuffer:32e6}),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}));
 }},umCalfDepthMilestonePlugin()]:[umCalfDepthMilestonePlugin()]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
const current=await load(),previous=await load(true),targets=new Set(['tibialis-anterior','tibialis-posterior','flexor-digitorum-longus','flexor-hallucis-longus','peroneus-longus','soleus','gastrocnemius-medial','gastrocnemius-lateral','popliteus']);
const storage=new Proxy({},{get(){throw Error('Stale calf-depth request reached storage');}});
let total=0,changed=0,unchanged=0,rejected=0;
for(const row of current.specimenReviewRows)for(const surface of row.surfaces){
 const old=await previous.specimenReviewMaterial(row.key,surface.id),now=await current.specimenReviewMaterial(row.key,surface.id);assert(old&&now);total++;
 assert.deepEqual(now.source,old.source);assert.equal(now.context.sourceHash,old.context.sourceHash);assert.equal(now.atlasLink,old.atlasLink);assert.equal(now.atlasPath,old.atlasPath);
 assert.deepEqual(now.context.blockers,old.context.blockers);assert.equal(now.context.revisions.imaging,null);
 assert.deepEqual(now.teaching.topics,old.teaching.topics);assert.deepEqual(now.teaching.referenceTitles,old.teaching.referenceTitles);
 assert.deepEqual(now.teaching.guidedDissection,old.teaching.guidedDissection);
 assert.deepEqual(now.context.checklists.geometry,old.context.checklists.geometry);assert.deepEqual(now.context.checklists.imaging,old.context.checklists.imaging);
 assert.notEqual(now.context.rendererHash,old.context.rendererHash);assert.notEqual(now.context.revisions.geometry,old.context.revisions.geometry,'Display approval expires, not model geometry changes');
 const affected=row.key.startsWith('um-5t6tz7-v1-2:')&&targets.has(now.source.structure.slug);
 if(!affected){unchanged++;assert.deepEqual(now.teaching,old.teaching);assert.equal(now.context.teachingHash,old.context.teachingHash);assert.equal(now.context.revisions.teaching,old.context.revisions.teaching);assert.deepEqual(now.context.checklists.teaching,old.context.checklists.teaching);continue;}
 changed++;const copy=structuredClone(now.teaching);delete copy.lesson.depth;assert.deepEqual(copy,old.teaching,'Additive depth only');
 assert.notEqual(now.context.teachingHash,old.context.teachingHash);assert.notEqual(now.context.revisions.teaching,old.context.revisions.teaching);
 const oldChecks=now.context.checklists.teaching.filter(c=>c.id!=='calf-depth');assert.deepEqual(oldChecks,old.context.checklists.teaching);
 assert.equal(now.context.checklists.teaching.filter(c=>c.id==='calf-depth').length,1);assert(now.context.teachingTabs.includes('calf-depth'));
 const draft=current.blankSpecimenReview(now.context,'teaching');assert.equal(draft.status,'draft');assert.equal(draft.attested,false);assert.equal(draft.checks['calf-depth'],false);
 assert(current.specimenApprovalProblems({...draft,reviewer:'Synthetic',qualification:'Synthetic',scope:'Synthetic',attested:true,evidence:['https://example.test']},now.context,'teaching').includes('Complete every checklist item.'));
 for(const patch of [{revisionHash:old.context.revisions.teaching},{materialHash:old.context.materialHash},{sourceFrame:'foreign-frame'}]){
  const response=await current.postSpecimenReview(new Request('https://atlas.test/api/review/specimens',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CALF_DEPTH'},body:JSON.stringify({catalogScope:now.context.catalogScope,specimenKey:row.key,structureId:surface.id,sourceFrame:now.context.sourceFrame,materialHash:now.context.materialHash,revisionHash:now.context.revisions.teaching,checklistVersion:now.context.checklistVersion,track:'teaching',expectedVersion:0,draft,...patch})}),storage);
  assert.equal(response.status,409);rejected++;
 }
 const retained=structuredClone(now);now.teaching.lesson.depth.relationships.body='Changed';now.teaching.lesson.depth.clinicalPitfall.references[0].title='Changed';
 assert.deepEqual(await current.specimenReviewMaterial(row.key,surface.id),retained,'Detached depth review packet');
}
assert.equal(total,356);assert.equal(changed,24);assert.equal(unchanged,332);assert.equal(rejected,72);
console.log(JSON.stringify({baseline,milestone:umCalfDepthMilestone,sourceContextsUnchanged:total,newDepthContexts:changed,teachingContextsUnchanged:unchanged,staleRequestsRefusedBeforeStorage:rejected,imagingApproval:false,clinicalApproval:false}));
