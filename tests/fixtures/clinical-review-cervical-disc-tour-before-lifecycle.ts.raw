import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const atlas='F:/VisibleMedicine/atlas';
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const previous='6b6d9bba99985dfc5ca8deb52ca9e2632b837d25';
const previousIntegration='656e9b6dd27f273ef962806250140dc49d061fa29edeb2288bd8f715fc5ae56d';
const frozen='F:/VisibleMedicine/recovery/checkpoints/20261014-cervical-disc-website/website-before-source/source';
const tourId='cervical-whole-discs-orientation';
const tourRevision='cervical-whole-discs-20261014-r1';
const sourcePaths=['lib/cervical-disc-tour.ts','content/cervical-disc-tour-pins.json','lib/regional-tours.ts'];
const discFmas=['FMA25058','FMA13896','FMA13897','FMA13898','FMA13899','FMA13900'];
const boneFmas=['FMA12520','FMA12521','FMA12522','FMA12523','FMA12524','FMA12525','FMA9165'];
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(commit:string,path:string)=>execFileSync('git',['--no-replace-objects','show',`${commit}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:64e6});
const entry=[
 "export * from './atlas-review/lib/regional-tours';",
 "export * from './atlas-review/lib/body-review-material';",
 "export * from './atlas-review/lib/body-review-response';",
 "export * from './atlas-review/lib/body-review-context';",
 "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
 "export {bodyLesson} from './atlas-review/app/body-content';",
 "export {spineImagingLesson} from './atlas-review/lib/spine-imaging';",
 "export {nestedReviewRows,nestedReviewMaterial} from './atlas-review/lib/nested-review-material';",
 "export {specimenReviewRows,specimenReviewMaterial} from './atlas-review/lib/specimen-review-material';",
].join('\n');
async function imported(root?:string){
 const compiled=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
  platform:'node',format:'esm',loader:{'.css':'empty'},
  nodePaths:[resolve(process.cwd(),'node_modules')],
  ...(root?{plugins:[{name:'frozen-review-only',setup(api:any){
   api.onResolve({filter:/^\.\/atlas-review\//},(args:any)=>{
    const stem=resolve(root,args.path.slice(2));
    for(const suffix of ['.ts','.tsx','.js','.json'])if(existsSync(stem+suffix))return {path:stem+suffix};
    throw Error('Missing frozen Review module: '+args.path);
   });
  }}]}:{})});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

test('cervical whole-disc source reaches exact learner and protected Review imports',
 {timeout:600000},async()=>{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),revision);
 const pins=JSON.parse(git(revision,'content/cervical-disc-tour-pins.json').toString());
 const oldReview=json(frozen+'/atlas-review/manifest.json');
 assert.equal(oldReview.revision,previous);
 assert.equal(oldReview.websiteIntegrationSha256,previousIntegration);
 assert.equal(oldReview.files.length,1449);
 // Check every frozen source byte before compiling or comparing any prior packet.
 for(const file of oldReview.files)
  assert.equal(sha(readFileSync(frozen+'/atlas-review/'+file.path)),file.importedSha256,`frozen ${file.path}`);
 const review=json('atlas-review/manifest.json');
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 const modules=['head-neck','shoulder','female-pelvis','lower-limb'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
  manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
 assert.equal(review.revision,revision);
 assert.notEqual(review.websiteIntegrationSha256,previousIntegration);
 assert.equal(viewer.sourceCommit,revision);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const {name,base,manifest} of modules){
  assert.equal(manifest.sourceCommit,revision,name);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false,name+': '+flag);
  const inputs=json(base+'source-inputs.json');
  for(const path of sourcePaths){
   const input=inputs.find((file:any)=>file.path===path);
   if(name==='head-neck')assert.equal(input?.sha256,sha(git(revision,path)),`${name}: ${path}`);
   else assert.equal(input,undefined,`${name}: unrelated runtime has ${path}`);
  }
 }
 for(const path of sourcePaths){
  const expected=sha(git(revision,path));
  const record=review.files.find((file:any)=>file.path===path);assert(record,path);
  assert.equal(record.sourceSha256,expected,path);
  assert.equal(record.importedSha256,expected,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),expected,path);
  assert.equal(sha(Buffer.from(readFileSync(atlas+'/'+path).toString().replaceAll('\r\n','\n'))),expected,path);
  for(const base of ['public/atlas-review/',viewerBase,...modules.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`no public raw ${base+path}`);
 }
 const rendererPath='content/body-renderer-revision.json';
 const rendererRecord=review.files.find((file:any)=>file.path===rendererPath);assert(rendererRecord);
 const sourceRenderer=JSON.parse(git(revision,rendererPath).toString());
 const oldSourceRenderer=JSON.parse(git(previous,rendererPath).toString());
 const boundRenderer=json('atlas-review/'+rendererPath);
 const oldRenderer=json(frozen+'/atlas-review/'+rendererPath);
 assert.equal(rendererRecord.sourceSha256,sha(git(revision,rendererPath)));
 assert.equal(rendererRecord.importedSha256,sha(readFileSync('atlas-review/'+rendererPath)));
 assert.equal(boundRenderer.sourceRendererSha256,sourceRenderer.sha256);
 assert.equal(boundRenderer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(boundRenderer.sha256,sha(JSON.stringify({source:sourceRenderer.sha256,website:review.websiteIntegrationSha256})));
 assert.equal(oldRenderer.sourceRendererSha256,oldSourceRenderer.sha256);
 assert.equal(oldRenderer.websiteIntegrationSha256,previousIntegration);
 assert.equal(oldRenderer.sha256,sha(JSON.stringify({source:oldSourceRenderer.sha256,website:previousIntegration})));
 assert.notEqual(sourceRenderer.sha256,oldSourceRenderer.sha256);
 for(const path of ['public/models/bodyparts3d/full-body/catalog.json']){
  assert.deepEqual(git(revision,path),git(previous,path),`unchanged source ${path}`);
  assert.deepEqual(readFileSync('atlas-review/'+path),git(revision,path),`imported ${path}`);
 }
 const glbs=execFileSync('git',['ls-tree','-r','--name-only',revision],{cwd:atlas,windowsHide:true}).toString().trim().split(/\r?\n/).filter(path=>path.endsWith('.glb'));
 assert.equal(glbs.length,146);
 for(const path of glbs)assert.deepEqual(git(revision,path),git(previous,path),`unchanged GLB ${path}`);
 const live=await imported(),before=await imported(frozen);
 const catalog=live.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const oldCatalog=before.bodyDisplayCatalog(json(frozen+'/atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 assert.deepEqual(catalog,oldCatalog);
 assert.deepEqual(pins.entries.map((s:any)=>s.fmaId),discFmas);
 assert.deepEqual(pins.contextEntries.map((s:any)=>s.fmaId),boneFmas);
 assert.deepEqual(pins.bundles.map((b:any)=>b.id).sort(),['spine-connective-gaps','spine-skeleton']);
 const tour=live.regionalTours.find((item:any)=>item.id===tourId);assert(tour);
 assert.equal(tour.title,'Cervical spine: whole discs');assert.equal(tour.revision,tourRevision);assert.equal(tour.status,'draft');
 assert.equal(live.regionalTours.length,49);
 assert.equal(live.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),296);
 assert.deepEqual(live.regionalTours.filter((t:any)=>t.id!==tourId),before.regionalTours);
 assert.equal(before.regionalTours.length,48);
 assert.equal(live.regionalTourFor('spine').id,before.regionalTourFor('spine').id,'existing spine default');
 assert.deepEqual(live.regionalToursFor('spine').map((t:any)=>t.id),[...before.regionalToursFor('spine').map((t:any)=>t.id),tourId]);
 const chooser=readFileSync('atlas-review/app/whole-body-guided-learning.tsx');
 assert.deepEqual(chooser,readFileSync(frozen+'/atlas-review/app/whole-body-guided-learning.tsx'));
 assert.match(chooser.toString(),/regionalTours\.filter\(t=>t\.region===region\)/);
 assert.match(chooser.toString(),/region==='whole-body'\?wholeBodyTourOptions/);
 const structures=live.regionalTourStructures(catalog,tour);
 assert.equal(structures.length,13);
 assert.deepEqual(tour.steps.map((s:any)=>structures.find((x:any)=>x.id===s.selectedId)?.fmaId),discFmas);
 assert.deepEqual(tour.contextIds.map((id:string)=>structures.find((x:any)=>x.id===id)?.fmaId),boneFmas);
 assert.deepEqual(tour.steps.map((s:any)=>s.frameIds),pins.entries.map((disc:any,i:number)=>[disc.id,pins.contextEntries[i].id,pins.contextEntries[i+1].id]));
 assert(tour.steps.every((step:any)=>step.view==='left'&&step.fadeOthers===true&&step.durationMs===14000));
 assert.equal(live.regionalTourStepFrames(catalog,tour)?.length,6);
 const expectedIds=new Set([...pins.entries,...pins.contextEntries].map((s:any)=>s.id));
 assert.deepEqual(new Set(Object.keys(tour.requiredDisplayBundles)),expectedIds);
 for(const s of structures){
  const pinned=[...pins.entries,...pins.contextEntries].find((item:any)=>item.id===s.id);assert(pinned);
  assert.deepEqual(s,pinned);
  assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);
 }
 for(const disc of pins.entries){
  const actual=structures.find((s:any)=>s.id===disc.id);assert(actual);
  const prior=oldCatalog.structures.find((s:any)=>s.id===disc.id);assert(prior);
  for(const modality of ['ct','mri','xray','ultrasound']){
   const source=live.spineImagingLesson(actual,modality);
   const imported=live.bodyLesson(actual,modality);
   const old=before.bodyLesson(prior,modality);
   assert.deepEqual(imported,old,`${disc.fmaId}/${modality}: original notes preserved`);
   if(source)assert.deepEqual(imported,source,`${disc.fmaId}/${modality}: exact source note`);
   else assert.equal(modality,'ultrasound',`only ultrasound may be pending for ${disc.fmaId}`);
  }
 }
 const emitted=[emittedTeaching(modules[0].base,modules[0].manifest.files,true),emittedTeaching(viewerBase,viewer.files,true)];
 for(const code of emitted)for(const value of [tourId,tour.title,tourRevision,...tour.steps.map((s:any)=>s.title)])
  assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`reachable emitted ${value}`);
 const changed=new Set<string>();
 for(const structure of catalog.structures){
  const current=await live.bodyReviewMaterial(structure.id),prior=await before.bodyReviewMaterial(structure.id);
  assert(current&&prior,structure.id);
  assert.equal(current.topics.length,9,`${structure.id}: all topic placements`);
  assert.equal(prior.topics.length,9,`${structure.id}: frozen topic placements`);
  if(expectedIds.has(structure.id)){
   changed.add(structure.id);
   const evidence=current.guidedTours.find((item:any)=>item.tour.id===tourId);assert(evidence,structure.id);
   assert.deepEqual(evidence.tour,tour);assert.equal(evidence.stepFrames.length,6);
   assert.deepEqual(evidence.structures,structures);
   assert.deepEqual(evidence.bundles.map((b:any)=>b.id).sort(),['spine-connective-gaps','spine-skeleton']);
   assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.transitionMs,1800);
   assert.equal(current.approval,false);
   assert.equal((await live.bodyReviewContext(structure.id))?.revisions.imaging,null);
   assert.equal((await live.parseBodyReviewResponse(current,structure.id))?.structureId,structure.id);
   for(const mutate of [
    (p:any)=>{p.guidedTours.find((e:any)=>e.tour.id===tourId).tour.steps[0].frameIds.pop();},
    (p:any)=>{p.guidedTours.find((e:any)=>e.tour.id===tourId).stepFrames[0].min[0]-=1;},
    (p:any)=>{p.guidedTours.find((e:any)=>e.tour.id===tourId).structures[0].sources[0].sha256='f'.repeat(64);},
    (p:any)=>{p.approval=true;},
   ]){const forged=wire(current);mutate(forged);assert.equal(await live.parseBodyReviewResponse(forged,structure.id),null);}
   assert.deepEqual(current.source,prior.source);
  }else{
   assert.deepEqual(current.source,prior.source,structure.id);
   assert.deepEqual(current.topics,prior.topics,structure.id);
   assert.deepEqual(current.guidedTours,prior.guidedTours,structure.id);
   assert.equal(current.fingerprints.teaching,prior.fingerprints.teaching,structure.id);
  }
 }
 assert.equal(changed.size,13);
 assert.equal(catalog.structures.length-changed.size,1091);
 assert.equal(catalog.structures.length*9,9936,'nine root topic placements per preserved structure');
 assert.deepEqual(live.nestedReviewRows,before.nestedReviewRows);
 assert.deepEqual(live.specimenReviewRows,before.specimenReviewRows);
 let nested=0,specimen=0;
 for(const row of live.nestedReviewRows)for(const surface of row.surfaces){
  const current=await live.nestedReviewMaterial(row.key,surface.id);
  const prior=await before.nestedReviewMaterial(row.key,surface.id);
  assert(current&&prior,`nested ${row.key}/${surface.id}`);
  assert.deepEqual(current.source,prior.source);assert.deepEqual(current.teaching,prior.teaching);
  assert.equal(current.context.sourceHash,prior.context.sourceHash);
  assert.equal(current.context.teachingHash,prior.context.teachingHash);
  assert.equal(current.context.revisions.teaching,prior.context.revisions.teaching);
  assert.equal(current.context.revisions.imaging,null);
  nested++;
 }
 for(const row of live.specimenReviewRows)for(const surface of row.surfaces){
  const current=await live.specimenReviewMaterial(row.key,surface.id);
  const prior=await before.specimenReviewMaterial(row.key,surface.id);
  assert(current&&prior,`specimen ${row.key}/${surface.id}`);
  assert.deepEqual(current.source,prior.source);assert.deepEqual(current.teaching,prior.teaching);
  assert.equal(current.context.sourceHash,prior.context.sourceHash);
  assert.equal(current.context.teachingHash,prior.context.teachingHash);
  assert.equal(current.context.revisions.teaching,prior.context.revisions.teaching);
  assert.equal(current.context.revisions.imaging,null);
  specimen++;
 }
 assert.deepEqual({nested,specimen},{nested:108,specimen:356});
 const missing=wire(catalog);missing.structures=missing.structures.filter((s:any)=>s.id!==pins.entries[0].id);
 assert.throws(()=>live.regionalTourStructures(missing,tour));
 const altered=wire(catalog);altered.structures.find((s:any)=>s.id===pins.entries[0].id).sources[0].sha256='f'.repeat(64);
 assert.throws(()=>live.regionalTourStructures(altered,tour));
 const frame=wire(tour);frame.steps[0].frameIds[1]=pins.contextEntries[3].id;
 assert.throws(()=>live.regionalTourStructures(catalog,frame));
});
