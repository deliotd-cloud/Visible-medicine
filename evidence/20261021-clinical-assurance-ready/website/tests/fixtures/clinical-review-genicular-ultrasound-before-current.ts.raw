import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';

const atlas='F:/VisibleMedicine/atlas';
const baseline='20988a1ba542b7a39d2135cfa5c2e426ab81d593';
const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2'; // Exact integrated Atlas feature commit.
const pinPath='content/genicular-imaging-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const teachingPaths=['content/genicular-ultrasound.ts','lib/genicular-ultrasound.ts','app/body-content.ts'];
const inputPaths=[pinPath,...teachingPaths];
const targets={
  'right-middle-genicular-artery':{side:'right',fma:'FMA22562',file:'FJ2167',group:'middle'},
  'left-middle-genicular-artery':{side:'left',fma:'FMA22563',file:'FJ2084',group:'middle'},
  'right-inferior-lateral-genicular-artery':{side:'right',fma:'FMA43892',file:'FJ2150',group:'inferior-lateral'},
  'left-inferior-lateral-genicular-artery':{side:'left',fma:'FMA43893',file:'FJ2076',group:'inferior-lateral'},
} as const;
type Target=keyof typeof targets;
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const idFor=(name:Target)=>`vm:anatomy:body:leg:${targets[name].side}:vessel:${name}`;
const entries=():{identity:any;group:string;name:Target}[]=>json('atlas-review/'+pinPath).entries
  .filter((row:{identity:{id:string}})=>Object.hasOwn(targets,row.identity.id.split(':').at(-1)??''))
  .map((row:{identity:any;group:string})=>({identity:row.identity,group:row.group,
    name:row.identity.id.split(':').at(-1) as Target}));
async function closure(){
  const built=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {genicularUltrasoundLesson} from './atlas-review/lib/genicular-ultrasound';",
    "export {genicularUltrasoundTopics} from './atlas-review/content/genicular-ultrasound';",
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

test('four exact ultrasound drafts reach imported Review and emitted learners',async()=>{
  assert.match(liveCommit,/^[a-f0-9]{40}$/,'Coordinator must replace __ATLAS_COMMIT__');
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,liveCommit);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','shoulder'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
    manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){
    assert.equal(manifest.sourceCommit,liveCommit,name);
    assert.equal(manifest.patientDataIncluded,false,name);
    assert.equal(manifest.clinicalApproved,false,name);
  }
  const inputs=json(learners[0].base+'source-inputs.json');
  for(const path of inputPaths){
    const source=committed(liveCommit,path),imported=readFileSync('atlas-review/'+path);
    const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);
    assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(imported),path);
    assert.equal(norm(imported),norm(source),`${path}: imported bytes`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(source),`${path}: live Atlas bytes`);
    assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,sha(source),`${path}: emitted input`);
  }
  assert.deepEqual(json('atlas-review/'+pinPath),JSON.parse(committed(baseline,pinPath).toString()),
    'Historical genicular source pins unchanged');
  for(const path of inputPaths)for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
    assert.equal(existsSync(base+path),false,`${base+path}: raw source must not be public`);
  const api=await closure(),selected=entries();
  assert.equal(selected.length,4);
  assert.equal(new Set(selected.map(({identity}:any)=>identity.id)).size,4);
  assert.deepEqual(Object.keys(api.genicularUltrasoundTopics).sort(),['inferior-lateral','middle']);
  const catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
  const scope=learners[0].manifest.regionalScopes.find((item:{region:string})=>item.region==='leg');assert(scope);
  const whole=learners[0].manifest.regionalScopes.find((item:{region:string})=>item.region==='whole-body');assert(whole);
  const emitted=learners.map(item=>emittedTeaching(item.base,item.manifest.files,true));
  for(const {identity,group,name} of selected){
    const target=targets[name],id=identity.id,topic=api.genicularUltrasoundTopics[group];
    assert.equal(id,idFor(name));assert.equal(group,target.group);
    assert.equal(identity.fmaId,target.fma);assert.equal(identity.nodeName,target.fma);
    assert.equal(identity.laterality,target.side);assert.equal(identity.region,'leg');
    assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
    assert.equal(identity.bundle,'genicular-arteries');assert.equal(identity.sourceTree,'isa');
    assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),[target.file]);
    assert.equal(identity.validation.anatomicalReview,false);
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
    assert(scope.regionalIds.includes(id));assert(whole.regionalIds.includes(id));
    const lesson=api.genicularUltrasoundLesson(identity,'ultrasound');assert(lesson);
    assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson);
    assert.equal(lesson.readiness,'draft');assert.equal(lesson.body,topic.body);
    assert.deepEqual(lesson.bullets.slice(0,topic.bullets.length),topic.bullets);
    assert(lesson.bullets.includes(identity.coverageNote));
    assert.deepEqual(lesson.citations,topic.citations);
    const prose=[lesson.title,lesson.body,...lesson.bullets,lesson.note].join(' ');
    assert.match(prose,/(?:exact.revision|revision.bound) radiologist review pending/i);
    assert.match(prose,/no patient scan/i);assert.match(prose,/no.{0,100}clinical approval/i);
    assert.match(prose,/patient.space registration/i);
    assert.match(prose,/Atlas, Education case and paid.lecture access remain independent/i);
    if(group==='middle'){
      for(const pattern of [/Watanabe/i,/ten healthy young men/i,/right knees/i,/B.mode/i,
        /pulsed Doppler/i,/does not establish a detection rate/i,/two disconnected components/i])
        assert.match(prose,pattern);
      assert.doesNotMatch(prose,/two (?:validated )?branches/i);
    }else{
      for(const pattern of [/Karimov and Madrakhimov/i,/day.one postoperative/i,
        /12 selected total.knee.arthroplasty patients/i,/eight of the 12 knees/i,
        /did not establish a side.specific detection rate/i,/unoperated knees/i,
        /transillumination/i,/not an ultrasound detection figure/i])
        assert.match(prose,pattern);
    }
    for(const code of emitted)for(const value of [identity.name,topic.title,lesson.body,
      ...lesson.bullets,...lesson.citations,lesson.note])
      assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
    for(const tab of api.contentTabs.filter((tab:string)=>tab!=='ultrasound'))
      assert.equal(api.genicularUltrasoundLesson(identity,tab),undefined,`${id}:${tab}`);
    const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
    assert.deepEqual(api.genicularUltrasoundLesson(identity,'ultrasound'),clean,'Fresh lesson arrays');
    const mutations=[(bad:any)=>{bad.name+=' foreign';},(bad:any)=>{bad.fmaId+='foreign';},
      (bad:any)=>{bad.sources[0].sha256='0'.repeat(64);},
      (bad:any)=>{bad.coverageNote+=' foreign';},
      (bad:any)=>{bad.bounds.min[0]+=0.01;},
      (bad:any)=>{bad.validation.anatomicalReview=true;},
      (bad:any)=>{bad.sources.push(wire(bad.sources[0]));}];
    for(const mutate of mutations){const bad=wire(identity);mutate(bad);
      assert.equal(api.genicularUltrasoundLesson(bad,'ultrasound'),undefined,`${id}: altered identity`);}
  }
  for(const structure of catalog.structures)if(!selected.some(({identity}:any)=>identity.id===structure.id))
    assert.equal(api.genicularUltrasoundLesson(structure,'ultrasound'),undefined,`${structure.id}: unrelated`);
});

test('live Review binds exact source and refuses stale or forged ultrasound submissions',async()=>{
  assert.match(liveCommit,/^[a-f0-9]{40}$/,'Coordinator must replace __ATLAS_COMMIT__');
  const imported=await closure(),live=await boundLiveAtlasHistory(liveCommit);
  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const old=await exactSourceHistoryApi(baseline,'review-security');
  const catalog=imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
  assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
  assert.deepEqual(imported.structures,live.structures);
  assert.deepEqual(imported.dissectionProfiles,live.dissectionProfiles);
  assert.deepEqual(imported.regionalTours,live.regionalTours);
  assert.deepEqual(imported.contentTabs,live.contentTabs);
  const selected=entries(),storage={prepare(){throw Error('Rejected request reached storage');}};
  for(const {identity} of selected){
    const id=identity.id,structure=catalog.structures.find((item:{id:string})=>item.id===id);assert(structure);
    for(const tab of imported.contentTabs){
      assert.deepEqual(imported.bodyLesson(structure,tab),live.bodyLesson(structure,tab),`${id}:${tab}: live`);
      if(tab==='ultrasound'){
        assert.equal(old.bodyLesson(structure,tab).readiness,'pending');
        assert.equal(imported.bodyLesson(structure,tab).readiness,'draft');
      }else assert.deepEqual(imported.bodyLesson(structure,tab),old.bodyLesson(structure,tab),`${id}:${tab}: preserved`);
    }
    const packet=wire(await imported.bodyReviewMaterial(id)),livePacket=wire(await live.bodyReviewMaterial(id));
    const previous=wire(await old.bodyReviewMaterial(id));
    assert.deepEqual(packet,livePacket);assert.equal(packet.approval,false);
    assert.deepEqual(packet.topics.filter((row:any)=>row.tab!=='ultrasound'),
      previous.topics.filter((row:any)=>row.tab!=='ultrasound'));
    assert.deepEqual(packet.topics.find((row:any)=>row.tab==='ultrasound'),
      {tab:'ultrasound',...imported.bodyLesson(structure,'ultrasound')});
    assert.equal(packet.fingerprints.source,previous.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching,previous.fingerprints.teaching);
    assert.notEqual(packet.materialHash,previous.materialHash);
    assert.deepEqual(await imported.parseBodyReviewResponse(packet,id),packet);
    assert.equal(await imported.parseBodyReviewResponse(previous,id),null);
    for(const mutate of [
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ultrasound').body+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ultrasound').bullets[0]+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ultrasound').citations[0]='https://forged.example';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ultrasound').readiness='approved';},
      (bad:any)=>{bad.topics.splice(bad.topics.findIndex((row:any)=>row.tab==='ultrasound'),1);},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
    ]){const forged=wire(packet);mutate(forged);
      assert.equal(await imported.parseBodyReviewResponse(forged,id),null);}
    const context=await imported.bodyReviewContext(id),prior=await old.bodyReviewContext(id);
    assert.deepEqual(context,await live.bodyReviewContext(id));
    assert.equal(context.sourceHash,prior.sourceHash);
    assert.notEqual(context.revisions.teaching,prior.revisions.teaching);
    assert.equal(context.revisions.imaging,null);
    assert(context.teachingTabs.includes('ultrasound'));
    assert.equal(imported.bodyReviewStale({catalogScope:context.catalogScope,structureId:id,
      checklistVersion:context.checklistVersion,revisionHash:prior.revisions.teaching,track:'teaching'},context),true);
    const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,
      checklistVersion:context.checklistVersion,draft:imported.blankBodyReview(context,'teaching')};
    const save=(input:any)=>imported.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-genicular-ultrasound-reviewer'},body:JSON.stringify(input),
    }),storage);
    for(const patch of [{materialHash:prior.materialHash},{revisionHash:prior.revisions.teaching},
      {materialHash:prior.materialHash,revisionHash:prior.revisions.teaching}])
      assert.equal((await save({...decision,...patch})).status,409);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422);
  }
});
