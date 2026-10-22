import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const atlas=currentAtlasDeliveryRoot();
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sourcePaths=[
  'content/cerebral-arterial-quiz-pins.json',
  'public/models/bodyparts3d/cranial-arteries/catalog.json',
  'content/intracranial-arterial-xray.ts',
  'lib/intracranial-arterial-xray.ts',
];
const groups={
  anteriorCerebral:['FMA50029','FMA50030'],
  anteriorCommunicating:['FMA50169'],
  posteriorCerebral:['FMA50584','FMA50585'],
  posteriorCommunicating:['FMA50085','FMA50086'],
  middleCerebral:['FMA50082'],
  posteriorInferiorCerebellar:['FMA50519','FMA50520'],
  superiorCerebellar:['FMA50574','FMA50575'],
} as const;
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const normalized=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

test('twelve source-bound intracranial arterial X-ray drafts reach learner and protected Review',async()=>{
  const current=validateCurrentAtlasDelivery();
  assert.equal(current.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
  const review=json('atlas-review/manifest.json');
  assert.equal(review.revision,current.source);
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),current.source);
  assert.equal(execFileSync('git',['merge-base',revision,current.source],{cwd:atlas,windowsHide:true}).toString().trim(),revision);
  const runtimeNames=['head-neck','female-pelvis','lower-limb','shoulder'];
  const runtimes=runtimeNames.map(name=>json(`public/atlas-runtime/${name}/manifest.json`));
  for(const runtime of runtimes){
    assert.equal(runtime.sourceCommit,current.source);
    assert.equal(runtime.patientDataIncluded,false);
    assert.equal(runtime.clinicalApproved,false);
  }
  const learnerBase='public/atlas-runtime/head-neck/';
  const learner=runtimes[0];
  const inputs=json(learnerBase+'source-inputs.json');
  const viewerBase='public/atlas-review-viewer/';
  const viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,current.source);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  for(const path of sourcePaths){
    const committed=execFileSync('git',['show',`${revision}:${path}`],
      {cwd:atlas,windowsHide:true,maxBuffer:32e6});
    const currentSource=execFileSync('git',['show',`${current.source}:${path}`],
      {cwd:atlas,windowsHide:true,maxBuffer:32e6});
    assert.deepEqual(currentSource,committed,`${path}: immutable feature source across epochs`);
    const record=review.files.find((file:{path:string})=>file.path===path);
    assert(record,`Review missing ${path}`);
    assert.equal(record.sourceSha256,sha(currentSource),path);
    const imported=readFileSync('atlas-review/'+path);
    assert.equal(record.importedSha256,sha(imported),path);
    assert.equal(normalized(imported),normalized(committed),`${path}: imported source differs`);
    const checkout=readFileSync(`${atlas}/${path}`);
    assert.equal(normalized(checkout),normalized(committed),
      `${path}: Atlas checkout differs from committed source`);
    assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,sha(checkout),
      `${path}: learner source input`);
  }
  for(const path of sourcePaths.slice(2))for(const base of
    ['public/atlas-review/',learnerBase,viewerBase])
    assert.equal(existsSync(base+path),false,`${base+path}: raw source is public`);

  const pins=json('atlas-review/'+sourcePaths[0]);
  const cranial=json('atlas-review/'+sourcePaths[1]);
  const originals=[...pins.entries.map((entry:{identity:unknown})=>entry.identity),...cranial.structures];
  const expected=Object.entries(groups).flatMap(([group,fmas])=>fmas.map(fma=>({group,fma})));
  assert.equal(expected.length,12);
  const records=expected.map(({group,fma})=>{
    const matches=originals.filter((item:{fmaId:string})=>item.fmaId===fma);
    assert.equal(matches.length,1,`${fma}: one retained full source identity`);
    return {group,identity:matches[0]};
  });
  assert.equal(new Set(records.map(({identity})=>identity.id)).size,12);
  const scope=learner.regionalScopes.find((item:{region:string})=>item.region==='head-neck');
  assert(scope);
  const emitted=[emittedTeaching(learnerBase,learner.files,true),
    emittedTeaching(viewerBase,viewer.files,true)];
  const compiled=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {intracranialArterialXrayLesson} from './atlas-review/lib/intracranial-arterial-xray';",
    "export {intracranialArterialXrayTopics} from './atlas-review/content/intracranial-arterial-xray';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {bodyReviewStale} from './atlas-review/lib/body-review-decisions';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+
    Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  assert.deepEqual(Object.keys(api.intracranialArterialXrayTopics).sort(),Object.keys(groups).sort());
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  for(const {group,identity} of records){
    const id=identity.id;
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
    assert(scope.regionalIds.includes(id),`${id}: head-neck learner scope`);
    assert.equal(identity.region,'head-neck');
    assert.equal(identity.system,'vessels');
    assert.equal(identity.nodeName,identity.fmaId);
    assert.equal(identity.validation.anatomicalReview,false);
    const topic=api.intracranialArterialXrayTopics[group];
    const lesson=api.intracranialArterialXrayLesson(identity,'xray');
    assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.body,topic.body);
    assert.deepEqual(lesson.bullets.slice(1,1+topic.bullets.length),[...topic.bullets]);
    assert.deepEqual(lesson.citations,[...topic.citations]);
    assert.match(lesson.bullets[0],/catheter contrast X-ray\/DSA orientation/i);
    assert.match(lesson.bullets[0],/not routine plain skull radiography/i);
    assert.match(lesson.bullets[0],/CT angiography \(CTA\) and MR angiography \(MRA\) are distinct examinations/i);
    assert.match(lesson.note,/revision-bound radiologist review pending/i);
    assert.match(lesson.note,/No patient-space registration is supplied/i);
    assert.match(lesson.note,/No patient angiogram, publisher figure, diagnostic threshold, procedural route or clinical approval/i);
    assert.match(lesson.note,/Atlas, imaging-case and paid-lecture access remain independent/i);
    for(const citation of lesson.citations)
      assert(['https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p06_index.html',
        'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html',
        'https://www.radiologyinfo.org/en/info/angiocath',
        'https://pubmed.ncbi.nlm.nih.gov/32166198/'].includes(citation),`${id}: cited source`);
    assert(lesson.citations.includes('https://www.radiologyinfo.org/en/info/angiocath'));
    for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,
      ...lesson.citations,lesson.note])
      assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
    for(const tab of ['anatomy','ct','mri','ultrasound','clinical'])
      assert.equal(api.intracranialArterialXrayLesson(identity,tab),undefined,`${id}: ${tab}`);
    for(const changed of [{...identity,name:'forged name'},
      {...identity,sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
      {...identity,bounds:{...identity.bounds,min:[0,0,0]}}])
      assert.equal(api.intracranialArterialXrayLesson(changed,'xray'),undefined,
        `${id}: changed identity`);
    const packet=wire(await api.bodyReviewMaterial(id));
    const context=await api.bodyReviewContext(id);
    assert(packet&&context,id);
    assert.equal(packet.approval,false);
    assert.equal(packet.status,'worksheet-not-submitted');
    assert.deepEqual(packet.source.structure,identity);
    assert.deepEqual(packet.topics.find((item:{tab:string})=>item.tab==='xray'),
      {tab:'xray',...lesson});
    assert.equal(context.sourceHash,packet.fingerprints.source);
    assert.equal(context.teachingHash,packet.fingerprints.teaching);
    assert(context.teachingTabs.includes('xray'));
    assert.equal(context.revisions.imaging,null);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
    for(const mutate of [
      (bad:any)=>{bad.topics.find((item:any)=>item.tab==='xray').body+=' forged';},
      (bad:any)=>{bad.topics.find((item:any)=>item.tab==='xray').citations[0]='https://forged.example';},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
    ]){const bad=wire(packet);mutate(bad);
      assert.equal(await api.parseBodyReviewResponse(bad,id),null,`${id}: forged response`);}
    assert.equal(api.bodyReviewStale({catalogScope:context.catalogScope,structureId:id,
      checklistVersion:context.checklistVersion,revisionHash:'0'.repeat(64),track:'teaching'},
      context),true,`${id}: stale teaching revision`);
  }
  for(const left of catalog.structures.filter((item:{name:string;fmaId:string})=>
    item.fmaId==='FMA50083'||/left middle cerebral artery/i.test(item.name)))
    assert.equal(api.intracranialArterialXrayLesson(left,'xray'),undefined,
      `${left.id}: earlier left MCA identity is not part of these drafts`);
});
