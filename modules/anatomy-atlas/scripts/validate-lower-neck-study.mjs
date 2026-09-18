import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';

const compiled=await build({stdin:{contents:`export * from './content/lower-neck-study';export * from './lib/lower-neck-study';export * from './lib/limb-vascular-studies';export * from './app/dissection-data';export * from './lib/body-display-catalog';export * from './lib/study-links';export * from './lib/study-library';export * from './lib/dissection-scope';export * from './lib/dissection-guidance';export * from './lib/anatomy-practice';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const root=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const catalog=api.bodyDisplayCatalog(root),original=JSON.stringify(catalog);
const pins=JSON.parse(await readFile('content/lower-neck-study-pins.json'));
const study=api.lowerNeckStudy,allIds=new Set(api.lowerNeckSourceIds);
const ids=structures=>structures.map(structure=>structure.id).sort();
const expectedFiles={
  FMA3941:'FJ3564',FMA4058:'FJ3483',FMA4754:'FJ3585',FMA4762:'FJ3485',
  FMA3953:'FJ3579',FMA4694:'FJ3479',FMA4755:'FJ3587',FMA4763:'FJ3486',
  FMA13392:'FJ1592',FMA13393:'FJ1570',FMA13390:'FJ1593',FMA13391:'FJ1571',
  FMA13388:'FJ1594',FMA13389:'FJ1572',FMA13408:'FJ1595',FMA13409:'FJ1573',
  FMA13348:'FJ1586',FMA13349:'FJ1565',
};

assert.equal(study.id,'lower-neck-vessels-scalenes');assert.equal(study.title,'Lower neck: vessels & scalenes');
assert.deepEqual(study.regions,['head-neck','whole-body']);assert.equal(study.view,'anterior');
assert.deepEqual([...study.targetFmaIds].sort(),[
  'FMA13388','FMA13389','FMA13390','FMA13391','FMA13392','FMA13393','FMA3941',
  'FMA3953','FMA4058','FMA4694','FMA4754','FMA4755','FMA4762','FMA4763',
]);assert.equal(allIds.size,18);
assert.equal(pins.sourceCommit,'2d68ad0aa45aa270f2b0a114be82003ea6d1b9c8');
assert.equal(pins.entries.length,18);assert.equal(pins.bundles.length,3);
assert.deepEqual(pins.entries.map(entry=>entry.fmaId).sort(),Object.keys(expectedFiles).sort());
for(const pin of pins.entries){
  assert.deepEqual(pin.sources.map(source=>source.file),[expectedFiles[pin.fmaId]]);
  assert(['left','right'].includes(pin.laterality));assert(pin.regions.includes('head-neck'));
}
assert.equal(pins.entries.filter(entry=>entry.laterality==='left').length,9);
assert.equal(pins.entries.filter(entry=>entry.laterality==='right').length,9);
assert.deepEqual(pins.bundles.map(bundle=>bundle.id).sort(),['head-neck-muscles','head-neck-vessels-recovery','thorax-vessels-recovery']);
for(const bundle of pins.bundles){
  const bytes=await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}
assert(pins.entries.every(entry=>['muscles','vessels'].includes(entry.system)));
assert.match(study.inspect,/not supplied/);assert.match(study.inspect,/return separation to 0%/i);
assert.match(study.inspect,/not proof of a complete neck/);assert.match(study.inspect,/vascular patency/);
assert.match(study.inspect,/CT\/ultrasound registration/);assert(!/cervical sheath is|within the cervical sheath/i.test(study.inspect));

let scopes=0,historyActions=0,practiceTargets=0,links=0,rejected=0,searches=0;
const visibleByRegion=new Map();
for(const region of study.regions){
  const profile=api.dissectionProfiles[region];
  assert.equal(profile.focuses.filter(focus=>focus.id===study.id).length,1);
  assert(api.lowerNeckStudyReady(catalog,region,study.id));
  assert(api.limbVascularStudyReady(catalog,region,study.id));
  assert(!api.lowerNeckStudyReady(null,region,study.id));
  for(const side of ['both','left','right']){
    const scope=api.bodyStudyScope(catalog,region,side);
    const state=api.dissectionReducer(api.initialDissection,{type:'focus',id:study.id});
    assert.equal(api.dissectionReducer(state,api.dissectionScopeAction(catalog,profile,region,side)),state);
    const visible=api.resolveDissection(scope,profile,state).visible;
    assert.deepEqual(ids(visible),ids(scope.filter(structure=>allIds.has(structure.fmaId))));
    assert.equal(visible.length,side==='both'?18:9);
    const targetCount=visible.filter(structure=>study.targetFmaIds.includes(structure.fmaId)).length;
    assert.equal(targetCount,side==='both'?14:7);assert.equal(visible.length-targetCount,side==='both'?4:2);
    const recipes=api.studyLibrary(scope,profile).flatMap(card=>card.recipes).filter(candidate=>candidate.id===study.id);
    assert.equal(recipes.length,1);const recipe=recipes[0];assert(recipe.available);
    assert.deepEqual(ids(recipe.visible),ids(visible));assert.equal(recipe.targets.length,targetCount);
    const landmarks=api.dissectionLandmarks(visible,study.landmarks);
    assert.equal(landmarks.length,Math.min(targetCount,8));assert(landmarks.every(structure=>study.targetFmaIds.includes(structure.fmaId)));
    const loaded=[...new Set(visible.map(structure=>structure.bundle))];
    const practice=api.practicePool(visible,loaded,recipe.targets.map(target=>target.id));
    assert.deepEqual(ids(practice),ids(recipe.targets));assert(practice.every(target=>study.targetFmaIds.includes(target.fmaId)));practiceTargets+=practice.length;
    for(const query of ['lower neck','carotid','scalenus',recipe.targets[0].fmaId]){
      const found=api.filterStudyLibrary(api.studyLibrary(scope,profile),query).flatMap(card=>card.recipes);
      assert(found.some(candidate=>candidate.id===study.id));searches++;
    }
    assert(api.filterStudyLibrary(api.studyLibrary(scope,profile),'lower neck','vessels').flatMap(card=>card.recipes).some(candidate=>candidate.id===study.id));
    assert(api.filterStudyLibrary(api.studyLibrary(scope,profile),'lower neck','muscles').flatMap(card=>card.recipes).some(candidate=>candidate.id===study.id));searches+=2;
    for(const target of recipe.targets){
      const removed=api.dissectionReducer(state,{type:'remove',id:target.id});
      assert(!api.resolveDissection(scope,profile,removed).visible.some(structure=>structure.id===target.id));
      const undo=api.dissectionReducer(removed,{type:'undo'});assert.deepEqual(ids(api.resolveDissection(scope,profile,undo).visible),ids(visible));
      const redo=api.dissectionReducer(undo,{type:'redo'});assert(!api.resolveDissection(scope,profile,redo).visible.some(structure=>structure.id===target.id));historyActions+=3;
    }
    const selected=recipe.targets[0],href=api.makeStudyLink(catalog,region,selected.id,side,study.id);assert(href);
    const parsed=api.parseStudyLink(Object.fromEntries(new URL(href,'https://atlas.invalid').searchParams));
    assert.equal(api.resolveStudyLink(catalog,region,parsed).status,'ready');links++;
    visibleByRegion.set(side+':'+region,ids(visible));scopes++;
  }
}
for(const side of ['both','left','right'])assert.deepEqual(visibleByRegion.get(side+':head-neck'),visibleByRegion.get(side+':whole-body'));
for(const region of Object.keys(api.dissectionProfiles).filter(region=>!study.regions.includes(region)))assert(!api.lowerNeckStudyReady(catalog,region,study.id));
assert(api.lowerNeckStudyReady(catalog,'head-neck','assembled'));

const linkTarget=catalog.structures.find(entry=>entry.fmaId===study.targetFmaIds[0]);
const href=api.makeStudyLink(catalog,'head-neck',linkTarget.id,'both',study.id);
const link=api.parseStudyLink(Object.fromEntries(new URL(href,'https://atlas.invalid').searchParams));
const reject=mutate=>{
  const changed=structuredClone(catalog);mutate(changed);
  for(const region of study.regions){
    assert(!api.lowerNeckStudyReady(changed,region,study.id));assert(!api.limbVascularStudyReady(changed,region,study.id));
  }
  assert.equal(api.resolveStudyLink(changed,'head-neck',link).status,'rejected');rejected++;
};
for(const pin of pins.entries){
  for(const mutate of [entry=>entry.name+=' altered',entry=>entry.fmaId+='x',entry=>entry.laterality=entry.laterality==='left'?'right':'left',entry=>entry.bounds.min[0]+=.1,entry=>entry.regions=['other'],entry=>entry.sources[0].file+='altered',entry=>entry.sources[0].sha256='0'.repeat(64)])reject(changed=>mutate(changed.structures.find(entry=>entry.id===pin.id)));
  reject(changed=>{changed.structures=changed.structures.filter(entry=>entry.id!==pin.id);});
  reject(changed=>changed.structures.push({...structuredClone(pin),id:pin.id+'-duplicate'}));
}
for(const pin of pins.bundles){
  for(const mutate of [bundle=>bundle.sha256='0'.repeat(64),bundle=>bundle.url+='.altered',bundle=>bundle.bytes+=1,bundle=>bundle.structures+=1])reject(changed=>mutate(changed.bundles.find(bundle=>bundle.id===pin.id)));
  reject(changed=>{changed.bundles=changed.bundles.filter(bundle=>bundle.id!==pin.id);});
  reject(changed=>changed.bundles.push({...structuredClone(pin),id:pin.id+'-duplicate'}));
}
for(const mutate of [changed=>changed.sourceVersion+='x',changed=>changed.license+='x',changed=>changed.coordinateSystem.unitsPerMillimetre+=.01])reject(mutate);
assert.equal(JSON.stringify(catalog),original,'Exact original identities must remain unaffected by mutation guards');
console.log(JSON.stringify({source:pins.sourceCommit,studies:1,selections:18,targets:14,context:4,bundles:3,scopes,searches,historyActions,practiceTargets,links,rejectedIdentityMutations:rejected,crossRegionIdentity:true,heldOrMissingAnatomyAdded:false,geometryChanged:false,clinicalApproval:false,browserAcceptance:false}));
