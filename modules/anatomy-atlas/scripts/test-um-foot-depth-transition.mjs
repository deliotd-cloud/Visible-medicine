import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {build} from './workspace-test-build.mjs';
const baseline='19f9a7fa02b98b3df8a71a645fe68d3894094178';
const old=path=>execFileSync('git',['show',baseline+':'+path],{encoding:'utf8',maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
async function load(previous=false){
 const output=await build({stdin:{contents:["export * from './lib/specimen-review-material';","export * from './lib/specimen-review';","export * from './lib/specimen-review-api';","export * from './lib/specimen-depth-scope';","export * from './lib/um-limb-teaching';","export {limbDefinitions} from './lib/um-limb-studies';","export {umFootDepth} from './content/um-foot-depth';"].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:previous?[{name:'exact-before-foot-depth',setup(api){
  for(const path of ['lib/specimen-review-material.ts','lib/specimen-review.ts','content/um-limb-teaching.ts','content/um-calf-depth.ts','content/um-limb-teaching-bindings.v1.json','content/body-renderer-revision.json','lib/specimen-depth-scope.ts'])api.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:old(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}));
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
}
const now=await load(),prior=await load(true),targets=new Set(Object.keys(now.umFootDepth));
assert.equal(targets.size,5);
const beforePins=JSON.parse(old('content/um-limb-teaching-bindings.v1.json')),pins=JSON.parse(readFileSync('content/um-limb-teaching-bindings.v1.json'));
let changedPins=0,unchangedPins=0,foreign=0;
for(const surface of now.limbDefinitions.whole.surfaces){
 const before=beforePins.bindings.find(p=>p.surface.id===surface.id),pin=pins.bindings.find(p=>p.surface.id===surface.id);
 assert.deepEqual(pin.surface,before.surface);assert.equal(pin.bundleSha256,before.bundleSha256);
 const lesson=now.specimenTeachingFor(now.limbDefinitions.whole,surface);assert.deepEqual(lesson,pin.lesson);
 if(targets.has(surface.slug)){changedPins++;assert.deepEqual(lesson.depth,now.umFootDepth[surface.slug]);const retained=structuredClone(lesson);delete retained.depth;assert.deepEqual(retained,before.lesson);}
 else{unchangedPins++;assert.deepEqual(lesson,before.lesson,surface.slug+': earlier teaching exact, including all calf depth');}
 for(const patch of [{name:'Foreign'},{slug:surface.slug+'-foreign'},{laterality:'left'},{sources:surface.sources.map(s=>({...s,sha256:'foreign'}))},{bounds:{...surface.bounds,min:[surface.bounds.min[0]+1,...surface.bounds.min.slice(1)]}}]){assert.equal(now.specimenTeachingFor(now.limbDefinitions.whole,{...surface,...patch}),null);foreign++;}
 const altered=structuredClone(now.limbDefinitions.whole);altered.catalog.bundles.find(b=>b.id===surface.bundle).sha256='foreign';assert.equal(now.specimenTeachingFor(altered,surface),null);foreign++;
}
assert.deepEqual([changedPins,unchangedPins,foreign],[5,62,402]);
let affected=0,unchanged=0,calf=0,earlierThigh=0,rejected=0;
const storage=new Proxy({},{get(){throw Error('Stale depth save reached storage');}});
for(const row of now.specimenReviewRows)for(const s of row.surfaces){
 const a=await prior.specimenReviewMaterial(row.key,s.id),b=await now.specimenReviewMaterial(row.key,s.id);assert(a&&b);
 assert.deepEqual(b.source,a.source);assert.equal(b.context.sourceHash,a.context.sourceHash);assert.equal(b.atlasLink,a.atlasLink);assert.equal(b.atlasPath,a.atlasPath);
 assert.deepEqual(b.context.blockers,a.context.blockers);assert.equal(b.context.revisions.imaging,null);
 assert.notEqual(b.context.rendererHash,a.context.rendererHash);assert.notEqual(b.context.revisions.geometry,a.context.revisions.geometry,'Display review expires, not actual source geometry');
 const matches=row.key.startsWith('um-5t6tz7-v1-2:')&&targets.has(b.source.structure.slug);
 if(!matches){unchanged++;assert.deepEqual(b.teaching,a.teaching);assert.equal(b.context.teachingHash,a.context.teachingHash);assert.equal(b.context.revisions.teaching,a.context.revisions.teaching);assert.deepEqual(b.context.checklists.teaching,a.context.checklists.teaching);assert.deepEqual(b.context.teachingTabs,a.context.teachingTabs);if(b.context.teachingTabs.includes('calf-depth'))calf++;if(b.context.teachingTabs.includes('thigh-depth'))earlierThigh++;continue;}
 affected++;const retained=structuredClone(b.teaching);delete retained.lesson.depth;assert.deepEqual(retained,a.teaching);
 assert.notEqual(b.context.revisions.teaching,a.context.revisions.teaching);assert.equal(b.context.teachingTabs.length,11);assert(b.context.teachingTabs.includes('foot-depth'));assert(!b.context.teachingTabs.includes('calf-depth'));
 assert.deepEqual(b.context.checklists.teaching.filter(c=>c.id!=='foot-depth'),a.context.checklists.teaching);
 const draft=now.blankSpecimenReview(b.context,'teaching');assert.equal(draft.checks['foot-depth'],false);
 for(const patch of [{revisionHash:a.context.revisions.teaching},{materialHash:a.context.materialHash},{sourceFrame:'foreign-frame'}]){
  const c=b.context,response=await now.postSpecimenReview(new Request('https://atlas.test/api/review/specimens',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_FOOT_DEPTH'},body:JSON.stringify({catalogScope:c.catalogScope,specimenKey:row.key,structureId:s.id,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,track:'teaching',expectedVersion:0,draft,...patch})}),storage);assert.equal(response.status,409);rejected++;
 }
 const copy=structuredClone(b);b.teaching.lesson.depth.relationships.body='Changed';assert.deepEqual(await now.specimenReviewMaterial(row.key,s.id),copy);
}
assert.deepEqual([affected,unchanged,calf,earlierThigh,rejected],[10,346,24,32,30]);
const sample=Object.values(now.umFootDepth)[0];assert.equal(now.specimenDepthReviewScope(sample),'foot-depth');
for(const changed of [{revision:'foreign'},{reviewScope:'calf-depth'},{reviewScope:'thigh-depth'},{reviewScope:undefined},{reviewScope:'foreign'},{status:'approved'}])assert.equal(now.specimenDepthReviewScope({...sample,...changed}),null,'No generic fallback or approval from unknown depth');
console.log(JSON.stringify({baseline,sourcePacketsUnchanged:356,newTeachingContexts:affected,teachingContextsExact:unchanged,calfTeachingContextsExact:calf,earlierThighTeachingContextsExact:earlierThigh,changedPins,unchangedPins,foreignBindingRefusals:foreign,staleSaveRefusals:rejected,newModels:0,clinicalApproval:false}));
