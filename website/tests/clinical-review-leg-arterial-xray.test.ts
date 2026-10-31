import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const atlasBaseline='628102945520c98aaca1c9fd9e539839caa1f324';
// Pin to the exact integrated Atlas source revision after its commit.
const historicalLiveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const liveCommit=CURRENT_ATLAS_REVISION;
const atlas=currentAtlasDeliveryRoot();
const pinsPaths=['content/popliteal-vessel-study-pins.json','content/limb-vascular-study-pins.json',
  'content/genicular-imaging-pins.json'];
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const teachingPaths=['content/leg-arterial-xray.ts','lib/leg-arterial-xray.ts'];
const paths=[...pinsPaths,...teachingPaths];
const targets={
  'right-popliteal-artery':{fma:'FMA77380',side:'right',files:['FJ2170'],bundle:'leg-vessels-recovery',topic:'popliteal-artery'},
  'left-popliteal-artery':{fma:'FMA77381',side:'left',files:['FJ2086'],bundle:'leg-vessels-recovery',topic:'popliteal-artery'},
  'right-anterior-tibial-artery':{fma:'FMA43896',side:'right',files:['FJ2130'],bundle:'leg-vessels-recovery',topic:'anterior-tibial-artery'},
  'left-anterior-tibial-artery':{fma:'FMA43897',side:'left',files:['FJ2065'],bundle:'leg-vessels-recovery',topic:'anterior-tibial-artery'},
  'right-posterior-tibial-artery':{fma:'FMA43898',side:'right',files:['FJ2172'],bundle:'leg-vessels-recovery',topic:'posterior-tibial-artery'},
  'left-posterior-tibial-artery':{fma:'FMA43899',side:'left',files:['FJ2087'],bundle:'leg-vessels-recovery',topic:'posterior-tibial-artery'},
  'right-medial-superior-genicular-artery':{fma:'FMA22586',side:'right',files:['FJ2166'],bundle:'genicular-arteries',topic:'medial-superior-genicular-artery'},
  'left-medial-superior-genicular-artery':{fma:'FMA22587',side:'left',files:['FJ2083'],bundle:'genicular-arteries',topic:'medial-superior-genicular-artery'},
  'right-lateral-superior-genicular-artery':{fma:'FMA22588',side:'right',files:['FJ2162'],bundle:'genicular-arteries',topic:'lateral-superior-genicular-artery'},
  'left-lateral-superior-genicular-artery':{fma:'FMA22589',side:'left',files:['FJ2080'],bundle:'genicular-arteries',topic:'lateral-superior-genicular-artery'},
  'right-inferior-medial-genicular-artery':{fma:'FMA43890',side:'right',files:['FJ2152'],bundle:'genicular-arteries',topic:'inferior-medial-genicular-artery'},
  'left-inferior-medial-genicular-artery':{fma:'FMA43891',side:'left',files:['FJ2077'],bundle:'genicular-arteries',topic:'inferior-medial-genicular-artery'},
  'right-inferior-lateral-genicular-artery':{fma:'FMA43892',side:'right',files:['FJ2150'],bundle:'genicular-arteries',topic:'inferior-lateral-genicular-artery'},
  'left-inferior-lateral-genicular-artery':{fma:'FMA43893',side:'left',files:['FJ2076'],bundle:'genicular-arteries',topic:'inferior-lateral-genicular-artery'},
  'right-middle-genicular-artery':{fma:'FMA22562',side:'right',files:['FJ2167'],bundle:'genicular-arteries',topic:'middle-genicular-artery'},
  'left-middle-genicular-artery':{fma:'FMA22563',side:'left',files:['FJ2084'],bundle:'genicular-arteries',topic:'middle-genicular-artery'},
} as const;
type Target=keyof typeof targets;
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const idFor=(name:Target)=>`vm:anatomy:body:leg:${targets[name].side}:vessel:${name}`;
const selected=():{identity:any;name:Target}[]=>{
  const popliteal=json('atlas-review/'+pinsPaths[0]);
  const tibial=json('atlas-review/'+pinsPaths[1]);
  const genicular=json('atlas-review/'+pinsPaths[2]);
  assert.equal(popliteal.entries.length,14);
  assert.equal(tibial.entries.length,42);
  assert.equal(genicular.entries.length,10);
  assert.equal(genicular.bundles.length,1);
  assert.equal(genicular.bundles[0].id,'genicular-arteries');
  return [...popliteal.entries,...tibial.entries,...genicular.entries.map((entry:{identity:any})=>entry.identity)]
    .filter((identity:any)=>Object.hasOwn(targets,identity.id.split(':').at(-1)))
    .map((identity:any)=>({identity,name:identity.id.split(':').at(-1) as Target}));
};
async function history(revision:string){
  const api=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  return api.exactSourceHistoryApi(revision,'review-security');
}
async function closure(){
  const built=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {legArterialXrayLesson} from './atlas-review/lib/leg-arterial-xray';",
    "export {legArterialXrayTopics} from './atlas-review/content/leg-arterial-xray';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {structures} from './atlas-review/app/anatomy-data';",
    "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
    "export {regionalTours} from './atlas-review/lib/regional-tours';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export * from './atlas-review/lib/body-review-material';",
    "export * from './atlas-review/lib/body-review-context';",
    "export * from './atlas-review/lib/body-review-response';",
    "export * from './atlas-review/lib/body-review-api';",
    "export * from './atlas-review/lib/body-review-decisions';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
    platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}
function semantics(prose:string,topic:string){
  for(const pattern of [
    /plain.{0,100}(?:radiograph|X.ray)/i, /contrast.{0,100}(?:catheter|angiograph)/i,
    /\bDSA\b|digital subtraction/i, /\bCTA\b/, /\bMRA\b/, /ultrasound/i,
    /projection/i, /retained source laterality/i, /patient.side marker/i,
    /no acquired/i, /patient.space registration/i, /patency/i, /perfusion/i,
    /procedur|route/i, /clinical approval/i, /revision.bound radiologist review pending/i,
    /Atlas, Education case and paid.lecture access remain independent/i,
  ])assert.match(prose,pattern);
  assert.doesNotMatch(prose,/approved for clinical use|recommended catheter route|diagnostic threshold is/i);
  assert.doesNotMatch(prose,/(?:validated|proven|confirmed) (?:exact )?(?:junction|network|patency|perfusion)/i);
  if(topic==='popliteal-artery')for(const pattern of [/posterior knee|behind the knee/i,/Kim/i,/Kil/i,/variant/i])assert.match(prose,pattern);
  if(topic==='anterior-tibial-artery')for(const pattern of [/anterior leg/i,/posterior tibial/i,/variable anterior tibial origins/i])assert.match(prose,pattern);
  if(topic==='posterior-tibial-artery')for(const pattern of [/posterior lower leg/i,/anterior tibial/i,/variant tibial patterns/i])assert.match(prose,pattern);
  if(topic.includes('genicular'))for(const pattern of [/genicular/i,/junctions or networks/i,/supply territory/i])assert.match(prose,pattern);
  if(topic==='middle-genicular-artery')for(const pattern of [/two disconnected components/i,/not two validated branches/i,/posterior capsule/i])assert.match(prose,pattern);
}

test('16 exact leg arterial X-ray drafts reach protected Review and emitted full Atlas learner',async()=>{
  assert.match(liveCommit,/^[a-f0-9]{40}$/,'Replace __ATLAS_COMMIT__ after the Atlas feature commit');
  const review=json('atlas-review/manifest.json'),revision=review.revision;
  assert.equal(revision,liveCommit);
  assert.notEqual(revision,atlasBaseline);
  assert.equal(revision,liveCommit,'Exact pinned current Review source');
  const deliveryPin=validateCurrentAtlasDelivery();
  assert.equal(revision,deliveryPin.source,'Review retains the strict current-source contract');
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);
  const learners=['head-neck','female-pelvis','lower-limb','shoulder'].map(name=>({name,
    base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){
    assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);
    assert.equal(manifest.patientDataIncluded,false,name);
    assert.equal(manifest.clinicalApproved,false,name);
  }
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learner=learners.find(item=>item.name==='head-neck');assert(learner);
  const inputs=json(learner.base+'source-inputs.json');
  for(const path of paths){
    const source=committed(revision,path),imported=readFileSync('atlas-review/'+path);
    const record=review.files.find((file:{path:string})=>file.path===path);assert(record,`Review missing ${path}`);
    assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(imported),path);
    assert.equal(norm(imported),norm(source),`${path}: imported source`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(source),`${path}: Atlas checkout`);
    assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,
      sha(readFileSync(`${atlas}/${path}`)),`${path}: exact learner build input`);
  }
  for(const path of paths)for(const base of ['public/atlas-review/',viewerBase,
    ...learners.map(item=>item.base)])assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
  const api=await closure(),entries=selected();
  assert.deepEqual(Object.keys(api.legArterialXrayTopics).sort(),
    ['popliteal-artery','anterior-tibial-artery','posterior-tibial-artery',
      'medial-superior-genicular-artery','lateral-superior-genicular-artery',
      'inferior-medial-genicular-artery','inferior-lateral-genicular-artery','middle-genicular-artery'].sort());
  assert.equal(entries.length,16);assert.equal(new Set(entries.map(({identity}:any)=>identity.id)).size,16);
  const catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
  const scope=learner.manifest.regionalScopes.find((item:{region:string})=>item.region==='leg');assert(scope);
  const wholeBody=learner.manifest.regionalScopes.find((item:{region:string})=>item.region==='whole-body');assert(wholeBody);
  const lowerLimb=learners.find(item=>item.name==='lower-limb');assert(lowerLimb);
  // The independently framed specimen workbench has its own curriculum; root
  // Leg and Whole body teaching is delivered through the shared head-neck runtime.
  const specimenInputs=json(lowerLimb.base+'source-inputs.json');
  for(const path of teachingPaths)assert(!specimenInputs.some((input:{path:string})=>input.path===path));
  const emitted=[emittedTeaching(learner.base,learner.manifest.files,true),
    emittedTeaching(viewerBase,viewer.files,true)];
  for(const {identity,name} of entries){
    const expected=targets[name],id=identity.id,topic=api.legArterialXrayTopics[expected.topic];
    assert.equal(id,idFor(name));assert.equal(identity.fmaId,expected.fma);assert.equal(identity.nodeName,expected.fma);
    assert.equal(identity.region,'leg');assert.equal(identity.laterality,expected.side);
    assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
    assert.deepEqual(identity.sources.map((source:any)=>source.file),expected.files);
    assert.equal(identity.bundle,expected.bundle);assert.equal(identity.validation.anatomicalReview,false);
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
    assert(scope.regionalIds.includes(id),`${id}: leg learner scope`);
    assert(wholeBody.regionalIds.includes(id),`${id}: whole-body learner scope`);
    assert.equal(identity.sourceTree,'isa');
    const lesson=api.legArterialXrayLesson(identity,'xray');
    assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${identity.name} · ${topic.title} · draft`);
    assert.equal(lesson.body,topic.body);
    assert.deepEqual(lesson.bullets.slice(0,topic.bullets.length),[...topic.bullets]);
    assert(lesson.bullets.includes(identity.coverageNote),`${id}: source coverage note preserved`);
    assert.deepEqual(lesson.citations,[...topic.citations]);
    assert(lesson.citations.includes('https://www.radiologyinfo.org/en/info/angiocath'));
    assert(!lesson.citations.includes('https://pubmed.ncbi.nlm.nih.gov/40925979/'));
    assert(lesson.citations.some((url:string)=>/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\//.test(url)));
    if(expected.topic.includes('genicular')&&expected.topic!=='middle-genicular-artery')
      assert(lesson.citations.some((url:string)=>/40640408|34657976|26130286/.test(url)));
    if(expected.topic==='middle-genicular-artery')
      assert(lesson.citations.includes('https://pubmed.ncbi.nlm.nih.gov/26130286/'));
    for(const citation of lesson.citations)assert.match(citation,/^https:\/\//);
    semantics([lesson.body,...lesson.bullets,lesson.note].join(' '),expected.topic);
    for(const code of emitted)for(const value of [identity.name,topic.title,lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
      assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
    for(const tab of api.contentTabs.filter((tab:string)=>tab!=='xray'))
      assert.equal(api.legArterialXrayLesson(identity,tab),undefined,`${id}:${tab}`);
    const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
    assert.deepEqual(api.legArterialXrayLesson(identity,'xray'),clean,'Fresh lesson arrays');
    const pathsWhere=(value:any,predicate:(value:any)=>boolean,path:string[]=[]):string[][]=>[
      ...(predicate(value)?[path]:[]),
      ...(value&&typeof value==='object'
        ?Object.entries(value).flatMap(([key,child])=>pathsWhere(child,predicate,[...path,key])):[]),
    ];
    const at=(value:any,path:string[])=>path.reduce((part,key)=>part[key],value);
    const refused=(bad:any,label:string)=>assert.equal(api.legArterialXrayLesson(bad,'xray'),undefined,id+': '+label);
    for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
      const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
      const original=parent[key];parent[key]=typeof original==='string'?original+'-foreign'
        :typeof original==='number'?original+0.01:original===null?'foreign':!original;
      refused(bad,path.join('.'));
    }
    for(const path of pathsWhere(identity,Array.isArray)){
      const bad=wire(identity);at(bad,path).push('foreign');refused(bad,path.join('.')+': append');
    }
    for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
      const bad=wire(identity);at(bad,path).unexpected=true;refused(bad,path.join('.')+': extra field');
      for(const key of Object.keys(at(identity,path))){
        const omitted=wire(identity);delete at(omitted,path)[key];refused(omitted,[...path,key].join('.')+': omitted');
      }
    }
  }
  for(const structure of catalog.structures)if(!entries.some(({identity})=>identity.id===structure.id))
    for(const tab of api.contentTabs)
      assert.equal(api.legArterialXrayLesson(structure,tab),undefined,`${structure.id}:${tab}: unrelated`);
});

test('admission changes 16 of 9,936 lessons and 1,104 Review packets; forged requests never reach storage',async()=>{
  assert.match(liveCommit,/^[a-f0-9]{40}$/,'Replace __ATLAS_COMMIT__ after the Atlas feature commit');
  const imported=await closure(),previous=await history(atlasBaseline);
  const featureCommit=git(['log','--diff-filter=A','-1','--format=%H','--',teachingPaths[0]]).toString().trim();
  assert.match(featureCommit,/^[a-f0-9]{40}$/);
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit,'Exact live source head');
  git(['merge-base','--is-ancestor',historicalLiveCommit,liveCommit]);
  for(const path of paths)assert.deepEqual(committed(liveCommit,path),committed(historicalLiveCommit,path),`${path}: historical 9f teaching/source bytes preserved at current admission`);
  const current=await history(featureCommit),live=await boundLiveAtlasHistory(liveCommit);
  const catalog=current.bodyDisplayCatalog(JSON.parse(committed(featureCommit,catalogPath).toString()));
  assert.deepEqual(catalog,previous.bodyDisplayCatalog(JSON.parse(committed(atlasBaseline,catalogPath).toString())));
  assert.deepEqual(imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath)),catalog);
  for(const path of pinsPaths){
    assert.deepEqual(json('atlas-review/'+path),JSON.parse(committed(atlasBaseline,path).toString()));
    assert.deepEqual(committed(featureCommit,path),committed(atlasBaseline,path),`${path}: admission source bytes unchanged`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(committed(liveCommit,path)),`${path}: live source bytes`);
  }
  assert.deepEqual(current.regionalTours,previous.regionalTours);
  assert.deepEqual(current.structures,previous.structures);
  assert.deepEqual(current.dissectionProfiles,previous.dissectionProfiles);
  assert.deepEqual(current.contentTabs,previous.contentTabs);
  assert.deepEqual(imported.regionalTours,live.regionalTours);
  assert.deepEqual(imported.structures,live.structures,'Current imported structures matches its exact current Atlas source');
  assert.deepEqual(imported.dissectionProfiles,live.dissectionProfiles,'Current imported dissectionProfiles matches its exact current Atlas source');
  const preservedPaths=['app/anatomy-data.ts','app/dissection-data.ts','lib/regional-tours.ts',
    'content/leg-venous-xray.ts','lib/leg-venous-xray.ts',
    ...git(['ls-tree','-r','--name-only',atlasBaseline,'--','app','lib','content']).toString().split(/\r?\n/)
      .filter(path=>/(?:nested|specimen)/i.test(path))];
  assert(preservedPaths.length>3);
  for(const path of preservedPaths){
    assert.deepEqual(committed(featureCommit,path),committed(atlasBaseline,path),`${path}: admission unchanged`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(committed(liveCommit,path)),`${path}: current source`);
  }
  for(const bundle of catalog.bundles){
    const path='public'+bundle.url.split('?')[0],baselineBytes=committed(atlasBaseline,path);
    const featureBytes=committed(featureCommit,path);
    assert.equal(sha(featureBytes),bundle.sha256,path);
    assert.deepEqual(featureBytes,baselineBytes,`${path}: admission geometry unchanged`);
    assert.deepEqual(readFileSync(`${atlas}/${path}`),baselineBytes,`${path}: current geometry unchanged`);
  }
  assert.equal(catalog.structures.length,1104);assert.equal(current.contentTabs.length,9);
  const ids=new Set(selected().map(({identity}:any)=>identity.id));assert.equal(ids.size,16);
  let storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected request reached private storage');}};
  for(const id of ids){
    const structure=catalog.structures.find((item:any)=>item.id===id);assert(structure);
    for(const tab of current.contentTabs)
      assert.deepEqual(imported.bodyLesson(structure,tab),live.bodyLesson(structure,tab),`${id}:${tab}: imported live`);
    const livePacket=wire(await live.bodyReviewMaterial(id));
    assert.deepEqual(wire(await imported.bodyReviewMaterial(id)),livePacket);
    assert.deepEqual(await imported.parseBodyReviewResponse(livePacket,id),livePacket,`${id}: live packet`);
    const context=await imported.bodyReviewContext(id);
    assert.deepEqual(context,await live.bodyReviewContext(id),`${id}: live Review context`);
    const forgedPacket=wire(livePacket);forgedPacket.topics.find((row:any)=>row.tab==='xray').body+=' forged';
    assert.equal(await imported.parseBodyReviewResponse(forgedPacket,id),null);
    const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,
      checklistVersion:context.checklistVersion,draft:imported.blankBodyReview(context,'teaching')};
    const save=(input:any)=>imported.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-leg-arterial-reviewer'},body:JSON.stringify(input),
    }),storage);
    assert.equal((await save({...decision,materialHash:'0'.repeat(64)})).status,409);
    assert.equal((await save({...decision,revisionHash:'0'.repeat(64)})).status,409);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422);
  }
  let placements=0,changed=0,packets=0,changedPackets=0;
  for(const structure of catalog.structures){
    const target=ids.has(structure.id);
    for(const tab of current.contentTabs){
      const before=previous.bodyLesson(structure,tab),after=current.bodyLesson(structure,tab);placements++;
      if(!target||tab!=='xray'){assert.deepEqual(after,before,`${structure.id}:${tab}`);continue;}
      changed++;assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
      assert.deepEqual(after,imported.legArterialXrayLesson(structure,tab));
    }
    const before=wire(await previous.bodyReviewMaterial(structure.id));
    const after=wire(await current.bodyReviewMaterial(structure.id));packets++;
    assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
    if(!target){assert.deepEqual(after,before,`${structure.id}: preserved packet`);continue;}
    changedPackets++;
    for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
      assert.deepEqual(after[key],before[key]);
    assert.deepEqual(after.topics.filter((row:any)=>row.tab!=='xray'),before.topics.filter((row:any)=>row.tab!=='xray'));
    assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),{tab:'xray',...current.bodyLesson(structure,'xray')});
    assert.equal(after.fingerprints.source,before.fingerprints.source);
    assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
    assert.notEqual(after.materialHash,before.materialHash);
    assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
    assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
    const context=await current.bodyReviewContext(structure.id),oldContext=await previous.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash,oldContext.sourceHash);
    assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
    assert.equal(context.revisions.imaging,null);assert(context.teachingTabs.includes('xray'));
    assert.equal(current.bodyReviewStale({catalogScope:context.catalogScope,structureId:structure.id,
      checklistVersion:context.checklistVersion,revisionHash:oldContext.revisions.teaching,track:'teaching'},context),true);
    for(const mutate of [
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').body+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').bullets[0]+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').citations[0]='https://forged.example';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').readiness='approved';},
      (bad:any)=>{bad.topics.splice(bad.topics.findIndex((row:any)=>row.tab==='xray'),1);},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
    ]){const forged=wire(after);mutate(forged);assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null);}
    const save=(input:any)=>current.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-leg-admission-reviewer'},body:JSON.stringify(input),
    }),storage);
    const decision={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:current.blankBodyReview(context,'teaching')};
    for(const patch of [{materialHash:before.materialHash},{revisionHash:oldContext.revisions.teaching},
      {materialHash:before.materialHash,revisionHash:oldContext.revisions.teaching}])
      assert.equal((await save({...decision,...patch})).status,409,`${structure.id}: stale before storage`);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422);
  }
  assert.deepEqual({placements,changed,packets,changedPackets,storageCalls},
    {placements:9936,changed:16,packets:1104,changedPackets:16,storageCalls:0});
  assert.equal(placements-changed,9920);assert.equal(packets-changedPackets,1088);
});
