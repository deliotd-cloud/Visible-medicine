import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';
import {preHandIntrinsicProfiles} from './hand-intrinsic-study-history.mjs';

const compiled=await build({stdin:{contents:`export * from './content/hand-intrinsic-studies';export * from './lib/hand-intrinsic-studies';export * from './lib/limb-vascular-studies';export * from './app/dissection-data';export * from './lib/body-display-catalog';export * from './lib/study-links';export * from './lib/study-library';export * from './lib/dissection-scope';export * from './lib/dissection-guidance';export * from './lib/anatomy-practice';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const root=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const catalog=api.bodyDisplayCatalog(root),pins=JSON.parse(await readFile('content/hand-intrinsic-study-pins.json'));
const ids=structures=>structures.map(structure=>structure.id).sort();
const expectedFiles={
  FMA24464:'FJ3350',FMA24465:'FJ3240',FMA24466:'FJ3352',FMA24467:'FJ3243',FMA24468:'FJ3354',
  FMA24469:'FJ3246',FMA24470:'FJ3356',FMA24471:'FJ3249',FMA24472:'FJ3358',FMA24473:'FJ3252',
  FMA37386:'FJ1483',FMA37387:'FJ1483M',FMA37390:'FJ1501',FMA37391:'FJ1501M',
  FMA46121:'FJ1481',FMA46122:'FJ1481M',FMA46123:'FJ1515',FMA46124:'FJ1515M',
  FMA42398:'FJ1510',FMA42399:'FJ1510M',FMA42402:'FJ1511',FMA42403:'FJ1511M',FMA42404:'FJ1509',FMA42405:'FJ1509M',
};
assert.equal(pins.entries.length,24);assert.equal(pins.bundles.length,5);
assert.deepEqual(pins.entries.map(entry=>entry.fmaId).sort(),Object.keys(expectedFiles).sort());
const leftFmas=new Set(['FMA24465','FMA24467','FMA24469','FMA24471','FMA24473','FMA37387','FMA37391','FMA46122','FMA46124','FMA42399','FMA42403','FMA42405']);
for(const pin of pins.entries){
  assert.deepEqual(pin.sources.map(source=>source.file),[expectedFiles[pin.fmaId]]);
  assert.equal(pin.laterality,leftFmas.has(pin.fmaId)?'left':'right');
  assert.equal(pin.region,'hand');assert(pin.regions.includes('hand'));
}
assert(!catalog.structures.some(structure=>/flexor pollicis brevis/i.test(structure.name)),'Quarantined flexor pollicis brevis is not displayed');
for(const bundle of pins.bundles){
  const bytes=await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}

let scopes=0,historyActions=0,rejected=0,links=0,practiceTargets=0;
const profile=api.dissectionProfiles.hand;
const priorProfiles=preHandIntrinsicProfiles(api.dissectionProfiles);
assert.equal(preHandIntrinsicProfiles(priorProfiles),priorProfiles,'History removal is idempotent');
const mixedProfiles=structuredClone(api.dissectionProfiles);mixedProfiles.hand.focuses=mixedProfiles.hand.focuses.filter(focus=>focus.id!=='hand-intrinsic-interosseous-lumbrical');
assert.throws(()=>preHandIntrinsicProfiles(mixedProfiles));
const foreignProfiles=structuredClone(api.dissectionProfiles);foreignProfiles.hand.focuses.push({...foreignProfiles.hand.focuses.at(-1),id:'foreign-hand-history'});
assert.throws(()=>preHandIntrinsicProfiles(foreignProfiles));
for(const study of api.handIntrinsicStudies){
  const allowed=new Set([...study.targetFmaIds,...study.context.flatMap(rule=>rule.fmaIds??[])]);
  const records=pins.entries.filter(entry=>allowed.has(entry.fmaId));
  const bundleIds=new Set(records.map(entry=>entry.bundle));
  assert(api.handIntrinsicStudyReady(catalog,'hand',study.id));
  assert(api.limbVascularStudyReady(catalog,'hand',study.id));
  assert(!api.handIntrinsicStudyReady(null,'hand',study.id));
  for(const region of catalog.regions.map(entry=>entry.id))if(region!=='hand')assert(!api.handIntrinsicStudyReady(catalog,region,study.id));
  for(const side of ['both','left','right']){
    const scope=api.bodyStudyScope(catalog,'hand',side);
    const state=api.dissectionReducer(api.initialDissection,{type:'focus',id:study.id});
    assert.equal(api.dissectionReducer(state,api.dissectionScopeAction(catalog,profile,'hand',side)),state);
    const visible=api.resolveDissection(scope,profile,state).visible;
    assert.deepEqual(ids(visible),ids(scope.filter(structure=>allowed.has(structure.fmaId))));
    const expected=study.id==='hand-intrinsic-thenar-adductor'?(side==='both'?10:5):(side==='both'?16:8);
    assert.equal(visible.length,expected);
    const recipe=api.studyLibrary(scope,profile).flatMap(card=>card.recipes).find(candidate=>candidate.id===study.id);
    assert(recipe?.available);assert.deepEqual(ids(recipe.visible),ids(visible));
    assert.equal(recipe.targets.length,study.targetFmaIds.length/(side==='both'?1:2));
    const context=visible.filter(structure=>!study.targetFmaIds.includes(structure.fmaId));
    assert.equal(context.length,study.context.flatMap(rule=>rule.fmaIds??[]).length/(side==='both'?1:2));
    // The root recipe includes its context until an explicit dissection action.
    assert.deepEqual(ids(api.resolveDissection(scope,profile,state).visible.filter(structure=>!study.targetFmaIds.includes(structure.fmaId))),ids(context));
    const landmarks=api.dissectionLandmarks(visible,study.landmarks);
    assert.equal(landmarks.length,recipe.targets.length);assert(landmarks.every(structure=>study.targetFmaIds.includes(structure.fmaId)));
    const loaded=[...new Set(visible.map(structure=>structure.bundle))];
    const focusedPractice=api.practicePool(visible,loaded,recipe.targets.map(target=>target.id));
    assert.deepEqual(ids(focusedPractice),ids(recipe.targets));practiceTargets+=focusedPractice.length;
    for(const target of recipe.targets){
      const removed=api.dissectionReducer(state,{type:'remove',id:target.id});
      assert(!api.resolveDissection(scope,profile,removed).visible.some(structure=>structure.id===target.id));
      const undo=api.dissectionReducer(removed,{type:'undo'});assert.deepEqual(ids(api.resolveDissection(scope,profile,undo).visible),ids(visible));
      const redo=api.dissectionReducer(undo,{type:'redo'});assert(!api.resolveDissection(scope,profile,redo).visible.some(structure=>structure.id===target.id));historyActions+=3;
    }
    const selected=recipe.targets[0],href=api.makeStudyLink(catalog,'hand',selected.id,side,study.id);
    assert(href);const parsed=api.parseStudyLink(Object.fromEntries(new URL(href,'https://atlas.invalid').searchParams));
    assert.equal(api.resolveStudyLink(catalog,'hand',parsed).status,'ready');links++;
    const changed=structuredClone(catalog);changed.structures.find(entry=>entry.id===selected.id).sources[0].file+='-altered';
    assert.equal(api.makeStudyLink(changed,'hand',selected.id,side,study.id),null);
    assert.equal(api.resolveStudyLink(changed,'hand',parsed).status,'rejected');rejected+=2;
    scopes++;
  }
  for(const pin of records)for(const mutate of [entry=>entry.name+=' altered',entry=>entry.fmaId+='x',entry=>entry.laterality=entry.laterality==='left'?'right':'left',entry=>entry.bounds.min[0]+=.1,entry=>entry.regions=['other'],entry=>entry.sources[0].file+='altered']){
    const changed=structuredClone(catalog);mutate(changed.structures.find(entry=>entry.id===pin.id));
    assert(!api.handIntrinsicStudyReady(changed,'hand',study.id));assert(!api.limbVascularStudyReady(changed,'hand',study.id));rejected++;
  }
  for(const pin of records){
    const missing={...catalog,structures:catalog.structures.filter(entry=>entry.id!==pin.id)};
    const duplicate={...catalog,structures:[...catalog.structures,structuredClone(pin)]};
    for(const changed of [missing,duplicate]){
      assert(!api.handIntrinsicStudyReady(changed,'hand',study.id));assert(!api.limbVascularStudyReady(changed,'hand',study.id));rejected++;
    }
  }
  for(const pin of pins.entries.filter(entry=>!allowed.has(entry.fmaId))){
    const changed=structuredClone(catalog);changed.structures.find(entry=>entry.id===pin.id).name+=' unrelated';
    assert(api.handIntrinsicStudyReady(changed,'hand',study.id));
  }
  const linkTarget=catalog.structures.find(entry=>entry.fmaId===study.targetFmaIds[0]);
  for(const pin of pins.bundles.filter(bundle=>bundleIds.has(bundle.id))){
    const variants=[];
    for(const mutate of [bundle=>bundle.sha256='0'.repeat(64),bundle=>bundle.url+='.altered',bundle=>bundle.bytes+=1]){
      const changed=structuredClone(catalog);mutate(changed.bundles.find(bundle=>bundle.id===pin.id));variants.push(changed);
    }
    variants.push({...catalog,bundles:catalog.bundles.filter(bundle=>bundle.id!==pin.id)});
    variants.push({...catalog,bundles:[...catalog.bundles,structuredClone(pin)]});
    for(const changed of variants){
      assert(!api.handIntrinsicStudyReady(changed,'hand',study.id));assert(!api.limbVascularStudyReady(changed,'hand',study.id));
      assert.equal(api.makeStudyLink(changed,'hand',linkTarget.id,'both',study.id),null);rejected++;
    }
  }
  for(const pin of pins.bundles.filter(bundle=>!bundleIds.has(bundle.id))){
    const changed=structuredClone(catalog);changed.bundles.find(bundle=>bundle.id===pin.id).sha256='0'.repeat(64);
    assert(api.handIntrinsicStudyReady(changed,'hand',study.id));
  }
}
for(const mutate of [changed=>changed.sourceVersion+='x',changed=>changed.license+='x',changed=>changed.coordinateSystem.unitsPerMillimetre+=.01])for(const study of api.handIntrinsicStudies){
  const changed=structuredClone(catalog);mutate(changed);assert(!api.handIntrinsicStudyReady(changed,'hand',study.id));rejected++;
}
assert(api.handIntrinsicStudyReady(catalog,'hand','assembled'));
console.log(JSON.stringify({source:pins.sourceCommit,studies:2,selections:24,bundles:5,scopes,historyActions,practiceTargets,links,rejectedIdentityMutations:rejected,recipeContextIncluded:true,quarantinedFlexorPollicisBrevis:false,geometryChanged:false,clinicalApproval:false,browserAcceptance:false}));
