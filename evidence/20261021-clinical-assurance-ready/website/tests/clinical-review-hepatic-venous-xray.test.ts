import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';
import {loadHepaticAdmissionImport,readHepaticAdmissionImport} from './hepatic-admission-import-history.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {isAbsolute,realpathSync,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const atlasBaseline='6c4c9d093b57f232f8d5bb597e65a31ab4709845';
const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const atlas=currentAtlasDeliveryRoot();
const historicalRoot='F:/VisibleMedicine/staging/20261016-isolated-atlas-integration/canonical-original';
const historicalRead=(path:string)=>{
  assert(!isAbsolute(path)&&!path.includes('\\')&&!path.split('/').some(part=>!part||part==='.'||part==='..'),'Safe historical relative path');
  const root=realpathSync(historicalRoot),target=realpathSync(resolve(root,path)),inside=relative(root,target);
  assert(inside&&!inside.startsWith('..')&&!isAbsolute(inside),'Historical path inside closed archive');
  return readFileSync(target);
};
const historicalJson=(path:string)=>JSON.parse(historicalRead(path).toString());
const pinsPath='content/central-vessel-imaging-pins.json';
const teachingPaths=['content/hepatic-venous-xray.ts','lib/hepatic-venous-xray.ts'];
const paths=[pinsPath,...teachingPaths];
const targets={
  'inferior-vena-cava':{fma:'FMA10951',side:'unspecified',files:['FJ3441','FJ3659'],bundle:'abdomen-vessels-recovery'},
  'right-hepatic-vein':{fma:'FMA14338',side:'right',files:['FJ2416'],bundle:'abdomen-vessels-recovery'},
  'left-hepatic-vein':{fma:'FMA14339',side:'left',files:['FJ2415'],bundle:'abdomen-vessels-recovery'},
  'middle-hepatic-vein':{fma:'FMA14340',side:'unspecified',files:['FJ2414'],bundle:'hepatic-veins'},
} as const;
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const entries=(read=json):{identity:any;group:keyof typeof targets}[]=>read('atlas-review/'+pinsPath).entries.map((row:any)=>row.identity)
  .filter((identity:any)=>Object.hasOwn(targets,identity.id.split(':').at(-1)))
  .map((identity:any)=>({identity,group:identity.id.split(':').at(-1) as keyof typeof targets}));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
async function history(revision:string){
  const api=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  return api.exactSourceHistoryApi(revision,'review-security');
}
async function closure(){
  const built=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {hepaticVenousXrayLesson} from './atlas-review/lib/hepatic-venous-xray';",
    "export {hepaticVenousXrayTopics} from './atlas-review/content/hepatic-venous-xray';",
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

function assertSemantics(prose:string,group:keyof typeof targets){
  assert.match(prose,/contrast.{0,40}(?:venogra|X.ray)|(?:venogra|cavogra).{0,40}contrast/i);
  assert.match(prose,/\bDSA\b/);
  assert.match(prose,/plain.{0,40}radiograph/i);
  assert.match(prose,/CT venography/i);assert.match(prose,/MR venography/i);
  assert.match(prose,/Doppler/i);assert.match(prose,/projection/i);
  assert.match(prose,/patient.side marker/i);
  assert.match(prose,/source laterality/i);
  assert.match(prose,/cannot establish.{0,160}(?:flow simulation|patient.space registration)/i);
  assert.match(prose,/no acquired image/i);
  assert.match(prose,/publication media/i);
  assert.match(prose,/procedural guidance/i);
  assert.match(prose,/clinical approval/i);
  assert.match(prose,/revision.bound radiologist review pending/i);
  assert.match(prose,/Atlas, Education case and paid.lecture access remain independent/i);
  assert.doesNotMatch(prose,/approved for clinical use|recommended catheter route|diagnostic threshold is/i);
  if(group==='inferior-vena-cava'){
    assert.match(prose,/renal venous entry/i);assert.match(prose,/hepatic venous outflow/i);
    assert.match(prose,/108 referrals/i);assert.match(prose,/selective renal venography/i);
    assert.match(prose,/variants missed on standard cavography/i);
    assert.match(prose,/two original files as one selection/i);
    assert.match(prose,/(?:neither.{0,120}|not a )calibrated patient measurement/i);
  }else{
    assert.match(prose,/102 selected patients/i);
    assert.match(prose,/portal hypertension/i);assert.match(prose,/TIPS/i);
    assert.match(prose,/balloon.occlusion angiography/i);
    assert.match(prose,/not routine normal.anatomy visibility evidence/i);
    assert.match(prose,/69.liver cadaver study/i);
    if(group==='right-hepatic-vein'){
      assert.match(prose,/portal inflow/i);
      assert.match(prose,/accessory right hepatic vein/i);
      assert.match(prose,/not automatically part of this selected main vein/i);
      assert.match(prose,/not map every right.liver tributary/i);
    }else if(group==='left-hepatic-vein'){
      assert.match(prose,/left portal branch/i);
      assert.match(prose,/left.middle common trunk/i);
      assert.match(prose,/not an invariant junction/i);
      assert.match(prose,/both left.middle and separate major openings/i);
    }else{
      assert.match(prose,/common trunk with the left hepatic vein/i);
      assert.match(prose,/separate caval opening/i);
      assert.match(prose,/disconnected components/i);
      assert.match(prose,/not newly named tributaries/i);
      assert.match(prose,/unspecified laterality is preserved/i);
    }
  }
}

test('four exact hepatic venous X-ray drafts reach body learner and protected Review',async()=>{
  const review=historicalJson('atlas-review/manifest.json'),revision=review.revision;
  assert.match(revision,/^[a-f0-9]{40}$/);
  assert.equal(revision,liveCommit,'Original closed delivery epoch');
  assert.notEqual(revision,atlasBaseline);
  assert.equal(git(['rev-parse',revision+'^{commit}']).toString().trim(),revision);
  const learners=['head-neck','female-pelvis','lower-limb','shoulder'].map(name=>({name,
    base:`public/atlas-runtime/${name}/`,manifest:historicalJson(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){
    assert.equal(manifest.sourceCommit,revision,name);
    assert.equal(manifest.patientDataIncluded,false,name);
    assert.equal(manifest.clinicalApproved,false,name);
  }
  const viewerBase='public/atlas-review-viewer/',viewer=historicalJson(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learner=learners.find(item=>item.name==='head-neck');assert(learner);
  const inputs=historicalJson(learner.base+'source-inputs.json');
  for(const path of paths){
    const source=committed(revision,path),imported=readHepaticAdmissionImport('atlas-review/'+path);
    const record=review.files.find((file:{path:string})=>file.path===path);
    assert(record,`Review missing ${path}`);
    assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(imported),path);
    assert.equal(norm(imported),norm(source),`${path}: imported source`);
    assert.equal(norm(historicalRead('atlas-review/'+path)),norm(source),`${path}: Atlas checkout`);
    assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,
      sha(historicalRead('atlas-review/'+path)),`${path}: exact learner build input`);
  }
  for(const path of paths)for(const base of ['public/atlas-review/',viewerBase,
    ...learners.map(item=>item.base)])assert.equal(existsSync(historicalRoot+'/'+base+path),false,`${base+path}: raw source public`);
  const api=await loadHepaticAdmissionImport(),selected=entries(historicalJson);
  assert.deepEqual(Object.keys(api.hepaticVenousXrayTopics).sort(),Object.keys(targets).sort());
  assert.equal(selected.length,4);
  assert.equal(new Set(selected.map(({identity}:any)=>identity.id)).size,4);
  const catalog=api.bodyDisplayCatalog(historicalJson('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const scope=learner.manifest.regionalScopes.find((item:{region:string})=>item.region==='abdomen');assert(scope);
  const emitted=[emittedTeaching(historicalRoot+'/'+learner.base,learner.manifest.files,true),
    emittedTeaching(historicalRoot+'/'+viewerBase,viewer.files,true)];
  for(const {identity,group} of selected){
    const id=identity.id,expected=targets[group],topic=api.hepaticVenousXrayTopics[group];
    assert.equal(id,`vm:anatomy:body:abdomen:${expected.side}:vessel:${group}`);
    assert.equal(identity.fmaId,expected.fma);assert.equal(identity.nodeName,expected.fma);
    assert.equal(identity.region,'abdomen');assert.equal(identity.laterality,expected.side);
    assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
    assert.deepEqual(identity.sources.map((source:any)=>source.file),expected.files);
    assert.equal(identity.bundle,expected.bundle);
    assert.equal(identity.validation.anatomicalReview,false);
    if(group==='middle-hepatic-vein')assert.match(identity.coverageNote,/disconnected components/i);
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
    assert(scope.regionalIds.includes(id),`${id}: abdomen learner scope`);
    const lesson=api.hepaticVenousXrayLesson(identity,'xray');
    assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${identity.name} · ${topic.title} · draft`);
    assert.equal(lesson.body,topic.body);
    assert.deepEqual(lesson.bullets.slice(0,topic.bullets.length),[...topic.bullets]);
    assert.deepEqual(lesson.citations,[...topic.citations]);
    assert(lesson.citations.includes('https://www.radiologyinfo.org/en/info/venography'));
    assert(lesson.citations.includes('https://pubmed.ncbi.nlm.nih.gov/20177869/'));
    assert(lesson.citations.includes(group==='inferior-vena-cava'
      ?'https://pubmed.ncbi.nlm.nih.gov/8541675/'
      :'https://www.wjgnet.com/2307-8960/full/v10/i14/4460.htm'));
    for(const citation of lesson.citations)assert.match(citation,/^https:\/\//);
    assertSemantics([lesson.body,...lesson.bullets,lesson.note].join(' '),group);
    for(const code of emitted){
      for(const value of [identity.name,topic.title,lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
        assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
    }
    for(const tab of api.contentTabs.filter((tab:string)=>tab!=='xray'))
      assert.equal(api.hepaticVenousXrayLesson(identity,tab),undefined,`${id}:${tab}`);
    const clean=wire(lesson);
    lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
    assert.deepEqual(api.hepaticVenousXrayLesson(identity,'xray'),clean,'Fresh lesson arrays');
    const pathsWhere=(value:any,predicate:(value:any)=>boolean,path:string[]=[]):string[][]=>[
      ...(predicate(value)?[path]:[]),
      ...(value&&typeof value==='object'
        ?Object.entries(value).flatMap(([key,child])=>pathsWhere(child,predicate,[...path,key])):[]),
    ];
    const at=(value:any,path:string[])=>path.reduce((part,key)=>part[key],value);
    const refused=(bad:any,label:string)=>assert.equal(api.hepaticVenousXrayLesson(bad,'xray'),undefined,id+': '+label);
    for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
      const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
      const original=parent[key];
      parent[key]=typeof original==='string'?original+'-foreign'
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
  for(const structure of catalog.structures)if(!Object.hasOwn(targets,structure.id.split(':').at(-1)))
    for(const tab of api.contentTabs)
      assert.equal(api.hepaticVenousXrayLesson(structure,tab),undefined,`${structure.id}:${tab}: unrelated`);
});

test('admission changes only four of 9,936 lessons and 1,104 worksheets; forged review stays out of storage',async()=>{
  const imported=await loadHepaticAdmissionImport(),previous=await history(atlasBaseline);
  const featureCommit=git(['log','--diff-filter=A','-1','--format=%H','--',teachingPaths[0]]).toString().trim();
  assert.match(featureCommit,/^[a-f0-9]{40}$/);
  const current=await history(featureCommit);
  assert.equal(git(['rev-parse',liveCommit+'^{commit}']).toString().trim(),liveCommit,'Exact original source epoch');
  const live=await history(liveCommit);
  const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
  const catalog=current.bodyDisplayCatalog(JSON.parse(committed(featureCommit,catalogPath).toString()));
  assert.deepEqual(catalog,previous.bodyDisplayCatalog(JSON.parse(committed(atlasBaseline,catalogPath).toString())));
  assert.deepEqual(imported.bodyDisplayCatalog(historicalJson('atlas-review/'+catalogPath)),catalog);
  assert.deepEqual(historicalJson('atlas-review/'+pinsPath),JSON.parse(committed(atlasBaseline,pinsPath).toString()));
  assert.deepEqual(committed(featureCommit,pinsPath),committed(atlasBaseline,pinsPath),'Source pin bytes unchanged at admission');
  assert.equal(norm(readHepaticAdmissionImport('atlas-review/'+pinsPath)),norm(committed(atlasBaseline,pinsPath)),'Original source pins unchanged');
  assert.deepEqual(current.regionalTours,previous.regionalTours);
  assert.deepEqual(current.structures,previous.structures);
  assert.deepEqual(current.dissectionProfiles,previous.dissectionProfiles);
  assert.deepEqual(current.contentTabs,previous.contentTabs);
  assert.deepEqual(imported.regionalTours,live.regionalTours);
  assert.deepEqual(imported.structures,current.structures);
  assert.deepEqual(imported.dissectionProfiles,current.dissectionProfiles);
  for(const path of ['app/anatomy-data.ts','app/dissection-data.ts','lib/regional-tours.ts']){
    const original=committed(atlasBaseline,path);
    assert.deepEqual(committed(featureCommit,path),original,`${path}: admission guide/source bytes unchanged`);
    assert.equal(norm(readHepaticAdmissionImport('atlas-review/'+path)),norm(committed(liveCommit,path)),`${path}: original guide/source matches its committed epoch`);
  }
  for(const bundle of catalog.bundles){
    const path='public'+bundle.url.split('?')[0];
    const baselineBytes=committed(atlasBaseline,path),featureBytes=committed(featureCommit,path);
    assert.equal(sha(featureBytes),bundle.sha256,path);
    assert.deepEqual(featureBytes,baselineBytes,`${path}: admission source geometry unchanged`);
    assert.deepEqual(committed(liveCommit,path),baselineBytes,`${path}: original source geometry unchanged`);
  }
  assert.equal(catalog.structures.length,1104);assert.equal(current.contentTabs.length,9);
  const selected=new Set(entries(historicalJson).map(({identity}:any)=>identity.id));
  for(const id of selected){
    const structure=catalog.structures.find((item:any)=>item.id===id);assert(structure);
    for(const tab of current.contentTabs)
      assert.deepEqual(imported.bodyLesson(structure,tab),current.bodyLesson(structure,tab),`${id}:${tab}: live imported`);
  }
  let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected request reached private storage');}};
  for(const structure of catalog.structures){
    const target=selected.has(structure.id);
    for(const tab of current.contentTabs){
      const before=previous.bodyLesson(structure,tab),after=current.bodyLesson(structure,tab);placements++;
      if(!target||tab!=='xray'){assert.deepEqual(after,before,`${structure.id}:${tab}`);continue;}
      changed++;assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
      assert.deepEqual(after,imported.hepaticVenousXrayLesson(structure,tab));
    }
    const before=wire(await previous.bodyReviewMaterial(structure.id));
    const after=wire(await current.bodyReviewMaterial(structure.id));packets++;
    assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
    if(!target){assert.deepEqual(after,before,`${structure.id}: preserved packet`);continue;}
    changedPackets++;
    for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])assert.deepEqual(after[key],before[key]);
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
    const decision={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:current.blankBodyReview(context,'teaching')};
    const save=(input:any)=>current.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-hepatic-venous-reviewer'},body:JSON.stringify(input),
    }),storage);
    for(const patch of [{materialHash:before.materialHash},{revisionHash:oldContext.revisions.teaching},
      {materialHash:before.materialHash,revisionHash:oldContext.revisions.teaching}])
      assert.equal((await save({...decision,...patch})).status,409,`${structure.id}: stale before storage`);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422,`${structure.id}: malformed before storage`);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422,`${structure.id}: unreviewed approval before storage`);
  }
  assert.deepEqual({placements,changed,packets,changedPackets,storageCalls},
    {placements:9936,changed:4,packets:1104,changedPackets:4,storageCalls:0});
  assert.equal(placements-changed,9932);assert.equal(packets-changedPackets,1100);
});

test('current 485 delivery retains four unchanged hepatic X-ray drafts and protected Review packets',async()=>{
  const revision=admitPreservedClinicalReview({revision:liveCommit,sourceHashes:{
    'content/central-vessel-imaging-pins.json':'29610e12ec6864a4131874e0d3f6520597af3e65179fd0f009b216aff1371a63',
    'content/hepatic-venous-xray.ts':'8d8e74ab220e10e15c17c7fb91e343cc1479946da4303f0c35c0515bc80835ef',
    'lib/hepatic-venous-xray.ts':'24ecd4853dd474d3817ac83c4dfc1c30e85eb2ff1de196964d81ebd6a3125eaf',
  },learnerModules:['head-neck']});
  assert.equal(revision,CURRENT_ATLAS_REVISION);
  const review=json('atlas-review/manifest.json'),learnerBase='public/atlas-runtime/head-neck/';
  const learner=json(learnerBase+'manifest.json'),viewerBase='public/atlas-review-viewer/';
  const viewer=json(viewerBase+'manifest.json');
  assert.equal(review.revision,revision);
  assert.equal(learner.sourceCommit,revision);assert.equal(viewer.sourceCommit,revision);
  assert.equal(learner.patientDataIncluded,false);assert.equal(learner.clinicalApproved,false);
  assert.equal(viewer.personalRecordsIncluded,false);
  for(const path of paths)for(const base of ['public/atlas-review/',viewerBase,learnerBase])
    assert.equal(existsSync(base+path),false,`${base+path}: current raw source public`);
  const api=await closure(),live=await boundLiveAtlasHistory(revision),selected=entries(),imported=api;
  assert.equal(selected.length,4);
  assert.deepEqual(Object.keys(api.hepaticVenousXrayTopics).sort(),Object.keys(targets).sort());
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const scope=learner.regionalScopes.find((item:{region:string})=>item.region==='abdomen');assert(scope);
  const emitted=[emittedTeaching(learnerBase,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];
  for(const {identity,group} of selected){
    const id=identity.id,topic=api.hepaticVenousXrayTopics[group];
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
    assert(scope.regionalIds.includes(id),`${id}: current learner scope`);
    const lesson=api.hepaticVenousXrayLesson(identity,'xray');
    assert.equal(lesson.readiness,'draft');
    assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
    assert.deepEqual(live.bodyLesson(identity,'xray'),lesson);
    assert.equal(lesson.body,topic.body);
    assertSemantics([lesson.body,...lesson.bullets,lesson.note].join(' '),group);
    for(const code of emitted)for(const value of [identity.name,topic.title,lesson.body,...lesson.citations])
      assert(visible(code,value),`${id}: current emitted teaching missing ${value}`);
    const packet=wire(await api.bodyReviewMaterial(id));
    assert.deepEqual(packet,wire(await live.bodyReviewMaterial(id)),`${id}: exact current source-bound packet`);
    assert.deepEqual(packet.source.structure,identity,`${id}: Review source identity`);
    assert.equal(packet.status,'worksheet-not-submitted');assert.equal(packet.approval,false);
    assert.deepEqual(packet.topics.find((row:any)=>row.tab==='xray'),{tab:'xray',...lesson});
    assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
    const forged=wire(packet);forged.source.structure.sources[0].sha256='0'.repeat(64);
    assert.equal(await api.parseBodyReviewResponse(forged,id),null,`${id}: forged source refused`);
    const livePacket=wire(await live.bodyReviewMaterial(id));
    assert.deepEqual(wire(await imported.bodyReviewMaterial(id)),livePacket);
    assert.deepEqual(await imported.parseBodyReviewResponse(livePacket,id),livePacket,`${id}: live packet`);
    const liveContext=await imported.bodyReviewContext(id);
    assert.deepEqual(liveContext,await live.bodyReviewContext(id),`${id}: exact live Review context`);
    const forgedLivePacket=wire(livePacket);forgedLivePacket.topics.find((row:any)=>row.tab==='xray').body+=' forged';
    assert.equal(await imported.parseBodyReviewResponse(forgedLivePacket,id),null,`${id}: forged live material refused`);
    const liveDecision={catalogScope:liveContext.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
      materialHash:liveContext.materialHash,revisionHash:liveContext.revisions.teaching,checklistVersion:liveContext.checklistVersion,
      draft:imported.blankBodyReview(liveContext,'teaching')};
    const saveLive=(input:any)=>imported.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-live-xray-reviewer'},body:JSON.stringify(input),
    }),{prepare(){throw Error('Rejected live request reached private storage');}});
    assert.equal((await saveLive({...liveDecision,materialHash:'0'.repeat(64)})).status,409,`${id}: stale live material before storage`);
    assert.equal((await saveLive({...liveDecision,revisionHash:'0'.repeat(64)})).status,409,`${id}: stale live revision before storage`);
    const forgedLiveDecision=wire(liveDecision);forgedLiveDecision.draft.checks.foreign=true;
    assert.equal((await saveLive(forgedLiveDecision)).status,422,`${id}: forged live decision before storage`);
    const liveApproval=wire(liveDecision);liveApproval.draft.status='approved';
    assert.equal((await saveLive(liveApproval)).status,422,`${id}: unreviewed live approval before storage`);
  }
});
