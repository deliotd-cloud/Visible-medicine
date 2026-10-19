import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {build as savedBuild,preHepatobiliaryWebsiteEpoch} from './atlas-pre-hepatobiliary-history.ts';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';

const atlasSource='F:/VisibleMedicine/atlas/scripts/exact-source-history-api.mjs';
const completedTourEpoch='a70b6f640c5511330f250882f525b63a4a21117b';
const elbowTourEpoch='7d77c973aab2a7135635ab2e65a2831f3e7d22c4';
const portalTourEpoch='47a851db0fb3369ad056fb8a8fcc3f3ba73656ea';
const lowerVenousV2Epoch='628102945520c98aaca1c9fd9e539839caa1f324';
// Immutable additive-quiz milestone; later modality teaching has its own checks.
const completedEpoch='51de4546a0b33a1ce93bfec4c9c43f760bf82b4e';
const liveSourceEpoch='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const atlasGit=(commit:string,path:string)=>execFileSync('git',['show',`${commit}:${path}`],{cwd:'F:/VisibleMedicine/atlas',windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

const teachingEntry=`
    export {structures} from './atlas-review/app/anatomy-data';
    export {shoulderTour} from './atlas-review/lib/shoulder-tours';
    export {regionalTours,regionalTourStructures,circleWillisTour} from './atlas-review/lib/regional-tours';
    export {bodyLesson} from './atlas-review/app/body-content';
    export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';
    import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
    import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
    export const catalog=bodyDisplayCatalog(raw as any);
  `;
async function teachingApi(historical:boolean|'thoracic'=false){
  if(historical==='thoracic')return atlasExactGitApi('d52d75df84118f4a76783d04bfff3541380e7741',teachingEntry);
  const result=await (historical?savedBuild:build)({stdin:{contents:teachingEntry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('guided imaging notes reach both learners and review without inventing scan access',async()=>{
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(review.revision,liveSourceEpoch);
  for(const module of ['head-neck','shoulder']){
    const base=`public/atlas-runtime/${module}/`;
    const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
    assert.equal(learner.sourceCommit,liveSourceEpoch);
    const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
    for(const path of ['app/tour-imaging-notes.tsx','app/tour-imaging-notes.css']){
      const f=review.files.find((f:any)=>f.path===path);assert.ok(f,path);
      assert.equal(inputs.find((i:any)=>i.path===path)?.sha256,f.sourceSha256);
      assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),f.importedSha256);
    }
    const js=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
    for(const label of ['CT / MRI & imaging notes','No scan loaded or spatial alignment','Teaching notes only'])assert.ok(js.includes(label),module+': '+label);
    for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(learner[flag],false);
  }
  // Keep the original 604/564 expectations at their immutable 146-stop epoch.
  // Runtime/source checks above remain live; current teaching is checked below.
  assert.equal(preHepatobiliaryWebsiteEpoch,'bee7d759305803ade07ecd26fc877099b7008ff1');
  const api=await teachingApi(true);
  let checked=0;
  for(const tour of api.regionalTours) for(const step of tour.steps){
    const structure=api.regionalTourStructures(api.catalog,tour).find((s:any)=>s.id===step.selectedId);
    const packet=await api.bodyReviewMaterial(structure.id);
    assert.equal(packet.approval,false);
    for(const tab of ['ct','mri','xray','ultrasound']){
      const lesson=api.bodyLesson(structure,tab),topic=packet.topics.find((t:any)=>t.tab===tab);
      for(const key of ['title','body','bullets','citations','note','readiness'])assert.deepEqual(lesson[key]??null,topic[key]??null);
      checked++;
    }
  }
  for(const step of api.shoulderTour.steps){
    const structure=api.structures.find((s:any)=>s.id===step.selectedId);
    for(const tab of ['ct','mri','xray','ultrasound']){assert.ok(structure.sections[tab]?.body);checked++;}
  }
  assert.equal(api.circleWillisTour.steps.length,10);
  assert.equal(checked,604); // 146 regional stops plus five shoulder stops, four modalities each.
  assert.equal(checked-api.circleWillisTour.steps.length*4,564,'Prior 136 regional/five shoulder stops retained');
  const notes=readFileSync('atlas-review/app/tour-imaging-notes.tsx','utf8');
  assert.ok(notes.includes('paid lectures require their own access'));
  assert.ok(notes.includes('if(event.currentTarget.open)onOpen()'));
  assert.ok(!/fetch\(|imagingBridge|postMessage|<img|<iframe/.test(notes));
  const reader=readFileSync('atlas-review/app/tour-imaging-notes.css','utf8');
  assert.ok(reader.includes('max-height:min(30vh,20rem)'));
  assert.ok(notes.includes('tabIndex={0}'));
});

test('saved d52d milestone: 189-stop guided imaging notes match unsigned learner/review teaching for every modality',async()=>{
  const api=await teachingApi('thoracic');let checked=0,handChecks=0,venousChecks=0,handVenousChecks=0,coronaryChecks=0,thoracicChecks=0;
  const completedHandTours=api.regionalTours.filter((t:any)=>t.id!=='thoracic-spine-discs-orientation'&&t.id!=='coronary-arterial-orientation'&&t.id!=='right-lower-limb-venous-orientation'&&!['right-hand-venous-orientation','left-hand-venous-orientation'].includes(t.id));
  assert.equal(completedHandTours.length,27);
  assert.equal(completedHandTours.reduce((n:number,t:any)=>n+t.steps.length,0),157);
  const earlierTours=completedHandTours.filter((t:any)=>t.id!=='right-hand-arterial-orientation');
  assert.equal(earlierTours.length,26);
  assert.equal(earlierTours.reduce((n:number,t:any)=>n+t.steps.length,0),150);
  assert.equal(api.regionalTours.length,32);
  assert.equal(api.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),189);
  assert.equal(api.regionalTours.find((t:any)=>t.id==='thoracic-spine-discs-orientation')?.steps.length,6);
  assert.equal(api.regionalTours.find((t:any)=>t.id==='coronary-arterial-orientation')?.steps.length,6);
  assert.equal(api.regionalTours.find((t:any)=>t.id==='hepatobiliary-surface-orientation')?.steps.length,4);
  for(const tour of api.regionalTours)for(const step of tour.steps){
    const structure=api.regionalTourStructures(api.catalog,tour).find((s:any)=>s.id===step.selectedId);
    assert.ok(structure,tour.id+': '+step.selectedId);
    const packet=await api.bodyReviewMaterial(structure.id);assert.equal(packet.approval,false);
    for(const tab of ['ct','mri','xray','ultrasound']){
      const lesson=api.bodyLesson(structure,tab),topic=packet.topics.find((t:any)=>t.tab===tab);
      assert.ok(topic,structure.id+': '+tab);
      for(const key of ['title','body','bullets','citations','note','readiness'])assert.deepEqual(lesson[key]??null,topic[key]??null);
      checked++;
      if(tour.id==='right-hand-arterial-orientation')handChecks++;
      if(tour.id==='right-lower-limb-venous-orientation')venousChecks++;
      if(['right-hand-venous-orientation','left-hand-venous-orientation'].includes(tour.id))handVenousChecks++;
      if(tour.id==='coronary-arterial-orientation')coronaryChecks++;
      if(tour.id==='thoracic-spine-discs-orientation')thoracicChecks++;
    }
  }
  for(const step of api.shoulderTour.steps){
    const structure=api.structures.find((s:any)=>s.id===step.selectedId);assert.ok(structure);
    for(const tab of ['ct','mri','xray','ultrasound']){assert.ok(structure.sections[tab]?.body);checked++;}
  }
  assert.equal(handChecks,28);
  assert.equal(venousChecks,24);
  assert.equal(handVenousChecks,56);
  assert.equal(coronaryChecks,24);
  assert.equal(thoracicChecks,24);
  assert.equal(checked-thoracicChecks-coronaryChecks-handChecks-venousChecks-handVenousChecks,620); // Original150 regional plus five shoulder stops.
  assert.equal(checked-thoracicChecks-coronaryChecks-venousChecks-handVenousChecks,648); // Completed157 regional plus five shoulder stops.
  assert.equal(checked-thoracicChecks-coronaryChecks-handVenousChecks,672); // All 163 earlier regional plus five shoulder stops remain covered.
  assert.equal(checked-thoracicChecks-coronaryChecks,728); // Previous177 regional plus five shoulder stops, four modalities.
  assert.equal(checked-thoracicChecks,752); // Previous183 regional plus five shoulder stops retained.
  assert.equal(checked,776); // Current189 regional plus five shoulder stops, four modalities.
  assert.equal(api.circleWillisTour.steps.length,10);
});

test('completed 274-stop regional and five-stop shoulder imaging teaching preserves the prior 265-stop catalogue across all four modalities',async()=>{
  const {exactSourceHistoryApi}=await import(pathToFileURL(atlasSource).href);
  const api=await exactSourceHistoryApi(completedTourEpoch,'regional-tour-security');
  const teaching=await exactSourceHistoryApi(completedTourEpoch,'review-security');
  const previous=await exactSourceHistoryApi('1604303bb9377dd2390e840c079652eb59c47fb0','regional-tour-security');
  assert.equal(previous.regionalTours.length,45);
  assert.equal(previous.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),265);
  assert.deepEqual(api.regionalTours.slice(0,-1),previous.regionalTours,'Every prior tour remains exact and ordered');
  assert.equal(api.regionalTours.at(-1).id,'pancreatic-arterial-relationships');
  assert.equal(api.regionalTours.at(-1).steps.length,9);
  assert.equal(api.regionalTours.length,46);assert.equal(new Set(api.regionalTours.map((tour:any)=>tour.id)).size,46);
  assert.equal(api.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),274);
  let checked=0;
  for(const tour of api.regionalTours){
    assert.equal(tour.status,'draft');
    for(const step of tour.steps){
      const structure=api.regionalTourStructures(api.catalog,tour).find((s:any)=>s.id===step.selectedId);assert.ok(structure,tour.id+': '+step.selectedId);
      const packet=await api.bodyReviewMaterial(structure.id);assert.equal(packet.approval,false);
      assert.deepEqual(packet.source.structure,structure);
      assert(packet.guidedTours.some((e:any)=>e.tour.id===tour.id&&e.tour.revision===tour.revision),'Exact tour must be included in Review');
      for(const tab of ['ct','mri','xray','ultrasound']){
        const lesson=teaching.bodyLesson(structure,tab),topic=packet.topics.find((t:any)=>t.tab===tab);assert.ok(topic);
        for(const key of ['title','body','bullets','citations','note','readiness'])assert.deepEqual(lesson[key]??null,topic[key]??null,structure.id+': '+tab+': '+key);
        checked++;
      }
    }
  }
  // Complete runtime closure of shoulder-tours: study-views and other imports are type-only.
  const shoulderClosure=['lib/shoulder-tours.ts','app/anatomy-data.ts','public/models/bodyparts3d/manifest.json',
    'lib/inspection-state.ts','lib/xray-teaching.ts','lib/shoulder-soft-tissue-xray.ts','content/shoulder-xray-bindings.json'];
  const historicalAnatomy=atlasGit(completedTourEpoch,'app/anatomy-data.ts').toString();
  const quizTypes=`/** Optional source-bound formative question; no score or approval is implied. */\nexport type ContentQuizCheck = {\n  key: string;\n  body: string;\n  bullets: string[];\n  correctAnswer: string;\n  explanation: string;\n  citations: string[];\n  note: string;\n};\n\n`;
  const currentAnatomy=atlasGit(liveSourceEpoch,'app/anatomy-data.ts').toString();
  assert.equal(currentAnatomy.replace(quizTypes,'').replace('  additionalChecks?: ContentQuizCheck[];\n',''),historicalAnatomy,
    'Only the quiz type contract extends the completed shoulder anatomy source');
  for(const path of shoulderClosure){
    const completed=atlasGit(completedTourEpoch,path),imported=readFileSync('atlas-review/'+path);
    assert.deepEqual(atlasGit(elbowTourEpoch,path),completed,`${path}: exact completed shoulder closure at elbow admission`);
    assert.deepEqual(imported,atlasGit(liveSourceEpoch,path),`${path}: live Review import must match committed source`);
    if(path!=='app/anatomy-data.ts')assert.deepEqual(imported,completed,`${path}: completed shoulder runtime closure remains exact`);
  }
  const shoulder=(await teachingApi()).shoulderTour;
  assert.equal(shoulder.steps.length,5);
  for(const step of shoulder.steps){
    const structure=teaching.structures.find((s:any)=>s.id===step.selectedId);assert.ok(structure,step.selectedId);
    for(const tab of ['ct','mri','xray','ultrasound']){assert.ok(structure.sections[tab]?.body);checked++;}
  }
  assert.equal(checked,1116);
  assert.equal(checked-api.regionalTours.at(-1).steps.length*4,1080,'Prior regional and shoulder modality coverage retained');
});

test('live right-elbow arterial pairs extend the exact completed catalogue while imaging teaching stays unchanged',async()=>{
  const {exactSourceHistoryApi}=await import(pathToFileURL(atlasSource).href);
  const previous=await exactSourceHistoryApi(completedTourEpoch,'regional-tour-security');
  const previousTeaching=await exactSourceHistoryApi(completedTourEpoch,'review-security');
  const admitted=await exactSourceHistoryApi(elbowTourEpoch,'review-security');
  const completed=await exactSourceHistoryApi(completedEpoch,'review-security');
  const live=await boundLiveAtlasHistory(liveSourceEpoch);
  const api=await teachingApi();
  assert.deepEqual(api.regionalTours,live.regionalTours,'Learner and protected Review bind one live tour registry');
  const portalEra=await exactSourceHistoryApi(portalTourEpoch,'regional-tour-security');
  const portalTours=portalEra.regionalTours;
  const lowerV2=(await exactSourceHistoryApi(lowerVenousV2Epoch,'regional-tour-security')).regionalTours.find((tour:any)=>tour.id==='right-lower-limb-venous-orientation');
  const currentLower=api.regionalTours.find((tour:any)=>tour.id==='right-lower-limb-venous-orientation');
  const priorLower=portalTours.find((tour:any)=>tour.id==='right-lower-limb-venous-orientation');
  assert.deepEqual(currentLower,lowerV2,'Only the exact admitted lower-venous V2 sequence replaces the historical tour');
  assert.equal(priorLower.revision,'right-lower-limb-venous-orientation-v1');assert.equal(priorLower.steps.length,6);
  assert.equal(currentLower.revision,'right-lower-limb-venous-orientation-v2');assert.equal(currentLower.steps.length,9);
  assert.deepEqual(api.regionalTours.slice(0,48).map((tour:any)=>tour.id===currentLower.id?priorLower:tour),portalTours,
    'Every other portal-era tour stays exact and ordered; the one V2 replacement is separately source-pinned');
  const legacyTours=portalTours.filter((tour:any)=>tour.id!=='portal-hepatic-venous-relationships');
  assert.equal(portalTours.length,48);
  assert.equal(new Set(portalTours.map((tour:any)=>tour.id)).size,48);
  assert.equal(portalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),290);
  assert.deepEqual(portalTours.slice(0,-1),legacyTours,'The exact elbow-era catalogue remains an ordered live prefix');
  assert.equal(api.regionalTours.length,50);
  assert.equal(new Set(api.regionalTours.map((tour:any)=>tour.id)).size,50);
  assert.equal(api.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),304);
  assert.deepEqual(api.regionalTours.slice(48).map((tour:any)=>tour.id),['cervical-whole-discs-orientation','right-medial-thigh-orientation']);
  assert.equal(api.regionalTours.slice(48).reduce((n:number,tour:any)=>n+tour.steps.length,0),11);
  const portal=portalTours.at(-1);
  assert.equal(portal.id,'portal-hepatic-venous-relationships');
  assert.equal(portal.region,'abdomen');
  assert.equal(portal.revision,'portal-hepatic-venous-relationships-20261014-r1');
  assert.equal(portal.status,'draft');
  assert.equal(portal.steps.length,8);
  assert.equal(previous.regionalTours.length,46);
  assert.equal(previous.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),274);
  assert.deepEqual(legacyTours.slice(0,-1),previous.regionalTours,'All 46 prior tours remain exact and ordered');
  assert.equal(legacyTours.length,47);
  assert.equal(new Set(legacyTours.map((tour:any)=>tour.id)).size,47);
  assert.equal(legacyTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),282);
  assert.equal(legacyTours.at(-2).id,'pancreatic-arterial-relationships');
  const elbow=legacyTours.at(-1);
  assert.equal(elbow.id,'right-elbow-arterial-pairs');
  assert.equal(elbow.region,'forearm');
  assert.equal(elbow.revision,'right-elbow-arterial-pairs-20261012-r1');
  assert.equal(elbow.status,'draft');
  for(const boundary of ['not measured donor-specific communications','do not demonstrate a connected lumen','no acquired CT, MRI or ultrasound','no source junction or missing segment is reconstructed','pending revision-bound radiologist sign-off','access remain independent'])
    assert.ok(elbow.limitations.includes(boundary),boundary);
  const pins=JSON.parse(readFileSync('atlas-review/content/elbow-arterial-tour-pins.json','utf8'));
  assert.equal(pins.baseline,completedTourEpoch);
  assert.deepEqual(pins.entries.map((entry:any)=>entry.fmaId),['FMA22712','FMA22801','FMA22707','FMA22804','FMA23126','FMA22764','FMA23124','FMA268667']);
  assert.deepEqual(pins.contextEntries.map((entry:any)=>entry.fmaId),['FMA23130','FMA23464','FMA23467']);
  assert.equal(pins.entries.length+pins.contextEntries.length,11);
  assert.deepEqual(elbow.steps.map((step:any)=>step.id),['inferior-ulnar-collateral','anterior-ulnar-recurrent','superior-ulnar-collateral','posterior-ulnar-recurrent','radial-collateral','radial-recurrent','middle-collateral','recurrent-interosseous']);
  assert.deepEqual(elbow.steps.map((step:any)=>step.selectedId),pins.entries.map((entry:any)=>entry.id));
  assert.deepEqual(elbow.contextIds,pins.contextEntries.map((entry:any)=>entry.id));
  assert.deepEqual(api.regionalTourStructures(api.catalog,elbow),[...pins.contextEntries,...pins.entries]);
  for(const entry of [...pins.entries,...pins.contextEntries]){
    assert.equal(entry.validation.anatomicalReview,false);
    const packet=await api.bodyReviewMaterial(entry.id);
    assert.equal(packet.approval,false);
    assert.equal(packet.status,'worksheet-not-submitted');
    assert.deepEqual(packet.source.structure,entry);
    const evidence=packet.guidedTours.filter((item:any)=>item.tour.id===elbow.id);
    assert.equal(evidence.length,1,entry.id);
    assert.deepEqual(evidence[0].tour,elbow);
    assert.deepEqual(evidence[0].structures,[...pins.contextEntries,...pins.entries]);
    assert.equal(evidence[0].patientRegistered,undefined);
    for(const tab of ['ct','mri','xray','ultrasound']){
      const lesson=api.bodyLesson(entry,tab),topic=packet.topics.find((item:any)=>item.tab===tab);
      assert.ok(topic,entry.id+': '+tab);
      for(const key of ['title','body','bullets','citations','note','readiness'])
        assert.deepEqual(lesson[key]??null,topic[key]??null,entry.id+': '+tab+': '+key);
    }
  }
  const priorContent=previousTeaching.bodyContentRecords(previous.catalog);
  const admittedContent=admitted.bodyContentRecords(admitted.bodyDisplayCatalog(JSON.parse(atlasGit(elbowTourEpoch,'public/models/bodyparts3d/full-body/catalog.json').toString())));
  const completedContent=completed.bodyContentRecords(completed.bodyDisplayCatalog(JSON.parse(atlasGit(completedEpoch,'public/models/bodyparts3d/full-body/catalog.json').toString())));
  assert.equal(priorContent.length,1104);assert.equal(admittedContent.length,1104);assert.equal(completedContent.length,1104);
  const quizPins=JSON.parse(atlasGit(completedEpoch,'content/limb-nerve-quiz-pins.json').toString());
  assert.equal(quizPins.parentCommit,elbowTourEpoch);
  const quizIds=new Set(quizPins.entries.map((entry:any)=>entry.identity.id));assert.equal(quizIds.size,18);
  let placements=0;
  let addedQuizChecks=0;
  for(let index=0;index<completedContent.length;index++){
    assert.equal(completedContent[index].id,priorContent[index].id);
    assert.equal(admittedContent[index].id,priorContent[index].id);
    for(const tab of completed.contentTabs){
      assert.deepEqual(admittedContent[index].content[tab],priorContent[index].content[tab],
        admittedContent[index].id+': '+tab+': exact elbow admission teaching');
      const current=completedContent[index].content[tab];
      if(tab==='quiz'&&quizIds.has(completedContent[index].id)){
        const {additionalChecks,...retained}=current;
        assert.deepEqual(retained,admittedContent[index].content[tab],completedContent[index].id+': retained quiz');
        assert.equal(additionalChecks?.length,1,completedContent[index].id+': one source-bound check');
        addedQuizChecks++;
      }else assert.deepEqual(current,admittedContent[index].content[tab],completedContent[index].id+': '+tab);
      placements++;
    }
  }
  assert.equal(placements,9936);
  assert.equal(addedQuizChecks,18);
  assert.equal(api.shoulderTour.steps.length,5);
  let checked=0,portalChecks=0,extendedChecks=0;
  for(const tour of api.regionalTours){
    assert.equal(tour.status,'draft');
    const structures=api.regionalTourStructures(api.catalog,tour);
    for(const step of tour.steps){
      const structure=structures.find((item:any)=>item.id===step.selectedId);assert.ok(structure,tour.id+': '+step.selectedId);
      for(const tab of ['ct','mri','xray','ultrasound']){
        assert.ok(api.bodyLesson(structure,tab).title,structure.id+': '+tab);
        checked++;
        if(tour.id===portal.id)portalChecks++;
        if(api.regionalTours.indexOf(tour)>=48)extendedChecks++;
      }
    }
  }
  for(const step of api.shoulderTour.steps){
    const structure=api.structures.find((item:any)=>item.id===step.selectedId);assert.ok(structure);
    for(const tab of ['ct','mri','xray','ultrasound']){assert.ok(structure.sections[tab]?.body);checked++;}
  }
  assert.equal(portalChecks,32);
  const lowerAdditionalChecks=(currentLower.steps.length-priorLower.steps.length)*4;
  assert.equal(lowerAdditionalChecks,12,'Exact V2 adds three lower-venous stops');
  assert.equal(extendedChecks,44,'All 11 stops in the two later tours retain four modality checks');
  assert.equal(checked-portalChecks-extendedChecks-lowerAdditionalChecks,1148,'The elbow-era 282 stops and five shoulder stops retain all modality checks');
  assert.equal(checked-extendedChecks-lowerAdditionalChecks,1180,'The exact 290-stop portal-era catalogue and five shoulder stops retain all modality teaching');
  assert.equal(checked,1236,'All 304 live regional stops and five shoulder stops have modality teaching');
});
