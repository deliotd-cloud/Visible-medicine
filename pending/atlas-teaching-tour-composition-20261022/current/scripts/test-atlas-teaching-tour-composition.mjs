import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve,relative,dirname,extname} from 'node:path';

// Current-source admission, separate from the preserved historical tour proofs.
// Only these three exact baseline modules are substituted in the before graph.
const root=resolve(import.meta.dirname,'..');
const epoch='2381efe43b75f8a7fb768a069eecd7268c508dac';
const {build}=createRequire(resolve(root,'package.json'))('esbuild');
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true,encoding:'utf8',maxBuffer:32e6});
const posix=p=>p.replaceAll('\\','/');
const modified=['app/anatomy-data.ts','app/body-content.ts','lib/regional-tours.ts'];
const added=['lib/legacy-shoulder-bone-references.ts','lib/legacy-shoulder-muscle-references.ts',
  'lib/legacy-shoulder-references.ts','lib/hamstring-tours.ts','content/hamstring-tour-pins.json'];
const originals=new Map(modified.map(p=>[p,git('show',`${epoch}:${p}`)]));
const tracked=new Set(git('ls-tree','-r','--name-only',epoch).trim().split('\n'));
const changed=new Set(git('diff',epoch,'--name-only').trim().split('\n'));
const statusBefore=git('status','--porcelain');
const entry="export * from './lib/body-review-material';export * from './lib/body-review-display-evidence';export * from './lib/regional-tours';export {bodyLesson} from './app/body-content';export {contentTabs} from './lib/content-types';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);";
async function load(before){
  const result=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,
    platform:'node',format:'esm',tsconfigRaw:{},metafile:true,plugins:[{name:'explicit-composition-epoch',setup(api){
      api.onLoad({filter:/\.(?:ts|tsx)$/},args=>{
        const p=posix(relative(root,args.path));
        if(before&&originals.has(p))return{contents:originals.get(p),loader:extname(p)==='.tsx'?'tsx':'ts',resolveDir:dirname(args.path)};
      });
      api.onLoad({filter:/\.(?:glb|gltf|obj|png|jpe?g|webp|nii|dcm)$/i},()=>{throw Error('Binary/model input refused');});
    }}]});
  for(const input of Object.keys(result.metafile.inputs)){
    if(input==='<stdin>')continue;
    const p=posix(relative(root,resolve(root,input)));
    assert(!p.startsWith('../')&&!p.includes('node_modules/'),'Only checkout data modules are admitted: '+p);
    if(tracked.has(p))assert(!changed.has(p)||modified.includes(p),'Unexpected changed data dependency: '+p);
    else assert(added.includes(p),'Unexpected added data dependency: '+p);
  }
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const before=await load(true),after=await load(false);
const pins=JSON.parse(readFileSync(resolve(root,'content/hamstring-tour-pins.json'),'utf8'));
const displayPins=JSON.parse(readFileSync(resolve(root,'content/body-review-display-pins.json'),'utf8'));
const displayById=new Map(displayPins.pins.map(row=>[row.structureId,row.sha256]));
const newIds=new Set(['right-hamstring-orientation','left-hamstring-orientation']);
const tourSources=new Set([...pins.entries,...pins.contextEntries].map(s=>s.id));
const topicSources=new Set();
let placements=0,topicChanges=0,pending=0;
await test('all current root lessons preserve source/readiness and only the isolated 89 teaching placements change',()=>{
  assert.deepEqual(after.catalog,before.catalog);
  assert.equal(after.catalog.structures.length,1104);
  assert.deepEqual(after.contentTabs,before.contentTabs);
  for(const s of after.catalog.structures)for(const tab of after.contentTabs){
    placements++;
    const old=before.bodyLesson(s,tab),actual=after.bodyLesson(s,tab);
    assert.equal(actual.readiness,old.readiness,s.id+':'+tab);
    if(actual.readiness==='pending')pending++;
    if(JSON.stringify(old)!==JSON.stringify(actual)){topicChanges++;topicSources.add(s.id);}
  }
  assert.equal(placements,9936);assert.equal(topicChanges,89);assert.equal(topicSources.size,12);assert.equal(pending,525);
  assert.equal(tourSources.size,10);
  for(const id of tourSources)assert(!topicSources.has(id),'Teaching and tour source sets are independently bounded');
});
await test('all 51 historical tour definitions/defaults remain exact, with only two additional source-bound draft tours',()=>{
  assert.equal(before.regionalTours.length,51);assert.equal(after.regionalTours.length,53);
  assert.deepEqual(after.regionalTours.filter(t=>!newIds.has(t.id)),before.regionalTours);
  assert.deepEqual(after.regionalTours.filter(t=>newIds.has(t.id)),after.hamstringTours);
  for(const region of after.catalog.regions)assert.deepEqual(after.regionalTourFor(region.id),before.regionalTourFor(region.id));
  for(const tour of after.hamstringTours){
    assert.equal(tour.status,'draft');assert.equal(tour.steps.length,4);
    assert.equal(tour.revision,pins.revision);
    assert.equal(after.regionalTourStructures(after.catalog,tour).length,5);
  }
});
let snapshotChanges=0,unchangedSnapshots=0,newTourEvidence=0;
await test('every one of 1104 actual Review snapshots preserves source and old tour evidence; exactly 22 change',()=>{
  for(const s of after.catalog.structures){
    const old=before.bodyReviewSnapshot(s.id),actual=after.bodyReviewSnapshot(s.id);assert(old&&actual);
    assert.equal(displayById.get(s.id),createHash('sha256').update(after.bodyReviewDisplayPreimage(actual,s.id)).digest('hex'),s.id+': current display pin');
    assert.deepEqual(actual.source,old.source,s.id);
    assert.deepEqual(actual.reasoning,old.reasoning,s.id);
    assert.equal(actual.atlasLink,old.atlasLink,s.id);
    assert.deepEqual(actual.limits,old.limits,s.id);
    assert.deepEqual(actual.guidedTours.filter(e=>!newIds.has(e.tour.id)),old.guidedTours,s.id);
    const addedEvidence=actual.guidedTours.filter(e=>newIds.has(e.tour.id));
    if(tourSources.has(s.id)){
      assert.equal(addedEvidence.length,1,s.id);newTourEvidence++;
      const evidence=addedEvidence[0];assert.equal(evidence.tour.status,'draft');
      assert.equal(evidence.tour.revision,pins.revision);assert.equal(evidence.structures.length,5);
      assert.equal(evidence.sourceVersion,pins.sourceVersion);
      assert.deepEqual(evidence.coordinateSystem,pins.coordinateSystem);
      assert.equal(evidence.continuousPlayback.transition,'quintic-orbit');
      assert.equal(evidence.continuousPlayback.start,'explicit-play-full-tour');
      assert.deepEqual(actual.topics,old.topics,s.id);
      const expected=structuredClone(old.checklist);
      if(!old.guidedTours.length)expected.teaching.push('Review the entire displayed guided tour, all context surfaces, captions, references, target selections and camera transitions; record framing or teaching corrections.');
      assert.deepEqual(actual.checklist,expected,s.id);
    }else{
      assert.equal(addedEvidence.length,0,s.id);
      assert.deepEqual(actual.checklist,old.checklist,s.id);
      if(!topicSources.has(s.id))assert.deepEqual(actual,old,s.id);
    }
    const changed=JSON.stringify(actual)!==JSON.stringify(old);
    assert.equal(changed,topicSources.has(s.id)||tourSources.has(s.id),s.id);
    if(changed)snapshotChanges++;else unchangedSnapshots++;
  }
  assert.equal(snapshotChanges,22);assert.equal(unchangedSnapshots,1082);assert.equal(newTourEvidence,10);
});
await test('changed Review material receives new teaching identities without source/approval transfer; other complete worksheet is exact',async()=>{
  const unaffected=after.catalog.structures.find(s=>s.region==='foot'&&!topicSources.has(s.id)&&!tourSources.has(s.id));assert(unaffected);
  for(const id of [...topicSources,...tourSources,unaffected.id]){
    const old=await before.bodyReviewMaterial(id),actual=await after.bodyReviewMaterial(id);assert(old&&actual);
    assert.equal(actual.status,'worksheet-not-submitted');assert.equal(actual.approval,false);
    assert.deepEqual(actual.reviewerNotes,old.reviewerNotes);
    assert.deepEqual(actual.source,old.source);assert.equal(actual.fingerprints.source,old.fingerprints.source);
    if(id===unaffected.id)assert.deepEqual(actual,old);
    else{assert.notEqual(actual.fingerprints.teaching,old.fingerprints.teaching,id);assert.notEqual(actual.materialHash,old.materialHash,id);}
  }
});
await test('regenerated display bindings advance exactly the 22 changed worksheets, with no added or removed identities',()=>{
  const old=JSON.parse(git('show',epoch+':content/body-review-display-pins.json'));
  assert.equal(displayPins.schema,old.schema);assert.deepEqual(displayPins.evidenceFields,old.evidenceFields);
  assert.equal(displayPins.pins.length,1104);assert.equal(displayById.size,1104);
  assert.deepEqual(displayPins.pins.map(p=>p.structureId),old.pins.map(p=>p.structureId));
  const changedPins=displayPins.pins.filter((p,i)=>p.sha256!==old.pins[i].sha256);
  assert.deepEqual(new Set(changedPins.map(p=>p.structureId)),new Set([...topicSources,...tourSources]));
  assert.equal(changedPins.length,22);
});
assert.equal(git('status','--porcelain'),statusBefore,'Read-only admission changed candidate files');
console.log(JSON.stringify({baseline:epoch,currentTours:53,preservedTours:51,newStops:8,rootSelections:1104,
  topicPlacements:placements,changedTopicPlacements:topicChanges,pendingTopicPlacements:pending,
  changedReviewSnapshots:snapshotChanges,unchangedReviewSnapshots:unchangedSnapshots,newTourEvidence,
  approvalTransferred:false,patientSpaceRegistration:false,previewChanged:false,
  scope:'Current-source data/Review composition only; not full types/build/browser, geometry or clinical acceptance.'}));
