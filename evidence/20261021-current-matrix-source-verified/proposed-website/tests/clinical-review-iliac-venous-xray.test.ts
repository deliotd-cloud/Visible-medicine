import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import type {BodyStructure} from '../atlas-review/app/body-types.ts';

const atlas=currentAtlasDeliveryRoot();
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const paths=['content/iliac-venous-imaging-pins.json',
  'content/iliac-venous-xray.ts','lib/iliac-venous-xray.ts'];
const expected=[
  ['common','FMA21387'],['common','FMA21388'],
  ['external','FMA18885'],['external','FMA18886'],
  ['internal','FMA18887'],['internal','FMA18888'],
] as const;
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const normalized=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('six exact iliac venous X-ray drafts reach learner and protected Review',async()=>{
  const current=validateCurrentAtlasDelivery();
  assert.equal(current.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
  const review=json('atlas-review/manifest.json');
  assert.equal(review.revision,current.source);
  assert.match(revision,/^[0-9a-f]{40}$/);
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),current.source);
  assert.equal(execFileSync('git',['merge-base',revision,current.source],{cwd:atlas,windowsHide:true}).toString().trim(),revision);
  const runtimeNames=['head-neck','female-pelvis','lower-limb','shoulder'];
  const runtimes=runtimeNames.map(name=>json(`public/atlas-runtime/${name}/manifest.json`));
  for(const [index,runtime] of runtimes.entries()){
    assert.equal(runtime.sourceCommit,current.source,`${runtimeNames[index]} source revision`);
    assert.equal(runtime.patientDataIncluded,false);
    assert.equal(runtime.clinicalApproved,false);
  }
  const base='public/atlas-runtime/head-neck/';
  const learner=runtimes[0];
  const inputs=json(base+'source-inputs.json');
  const viewerBase='public/atlas-review-viewer/';
  const viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,current.source);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  for(const path of paths){
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
    assert.equal(normalized(imported),normalized(committed),`${path}: import differs from committed source`);
    const checkout=readFileSync(`${atlas}/${path}`);
    assert.equal(normalized(checkout),normalized(committed),`${path}: checkout differs from committed source`);
    assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,sha(checkout),
      `${path}: learner source input`);
  }
  for(const path of paths.slice(1))for(const prefix of [base,viewerBase,'public/atlas-review/'])
    assert.equal(existsSync(prefix+path),false,`${prefix+path}: raw source is public`);
  const pins=json('atlas-review/'+paths[0]);
  const entries=pins.entries as {group:string;identity:BodyStructure}[];
  assert.deepEqual(entries.map(({group,identity})=>[group,identity.fmaId]),expected);
  assert.equal(new Set(entries.map(({identity})=>identity.id)).size,6);
  const scope=learner.regionalScopes.find((item:{region:string})=>item.region==='pelvis');
  assert(scope);
  const compiled=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {iliacVenousXrayLesson} from './atlas-review/lib/iliac-venous-xray';",
    "export {iliacVenousXrayTopics} from './atlas-review/content/iliac-venous-xray';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {bodyReviewStale} from './atlas-review/lib/body-review-decisions';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  assert.deepEqual(Object.keys(api.iliacVenousXrayTopics).sort(),['common','external','internal']);
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const emitted=[emittedTeaching(base,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];
  for(const {group,identity} of entries){
    const structure=catalog.structures.find((item:{id:string})=>item.id===identity.id);
    assert.deepEqual(structure,identity);
    assert(scope.regionalIds.includes(identity.id));
    assert.equal(identity.region,'pelvis');
    assert.equal(identity.system,'vessels');
    assert(identity.validation,`${identity.id}: validation status is required`);
    assert.equal(identity.validation.anatomicalReview,false);
    const topic=api.iliacVenousXrayTopics[group];
    const lesson=api.iliacVenousXrayLesson(structure,'xray');
    assert.deepEqual(api.bodyLesson(structure,'xray'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.body,topic.body);
    assert.deepEqual(lesson.citations,[...topic.citations]);
    assert(lesson.bullets.some((line:string)=>line.includes('contrast X-ray venography, not a routine plain pelvic radiograph')));
    assert(lesson.bullets.some((line:string)=>line.includes('CT venography (CTV), MR venography (MRV) and IVUS are distinct examinations')));
    assert.match(lesson.note,/revision-bound radiologist review pending/);
    assert.match(lesson.note,/No patient-space registration is supplied/);
    assert.match(lesson.note,/No patient scan, venogram, publisher image, diagnostic threshold, procedural route or clinical approval/);
    assert.match(lesson.note,/Atlas, imaging-case and paid-lecture access remain independent/);
    const limitPrefix='Source limit: ';
    const limit=lesson.bullets.find((line:string)=>line.startsWith(limitPrefix));
    assert(limit,`${identity.id}: source limit is present`);
    for(const code of emitted){
      for(const value of [lesson.body,...lesson.bullets.filter((line:string)=>line!==limit),...lesson.citations,lesson.note])
        assert(visible(code,value),`${identity.id}: emitted teaching missing ${value}`);
      // The generated module builds this source-specific bullet from its template
      // and pinned limit. Keep both checks instead of expecting constant folding.
      assert(visible(code,limitPrefix),`${identity.id}: emitted source-limit template`);
      assert(visible(code,limit.slice(limitPrefix.length)),`${identity.id}: emitted source-specific limit`);
    }
    for(const tab of ['anatomy','ct','mri','ultrasound','clinical'])
      assert.equal(api.iliacVenousXrayLesson(structure,tab),undefined,`${identity.id}: ${tab}`);
    for(const changed of [{...structure,name:'forged name'},
      {...structure,sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
      {...structure,bounds:{...structure.bounds,min:[0,0,0]}}])
      assert.equal(api.iliacVenousXrayLesson(changed,'xray'),undefined,`${identity.id}: changed identity`);
    const packet=wire(await api.bodyReviewMaterial(identity.id));
    const context=await api.bodyReviewContext(identity.id);
    assert(packet&&context);
    assert.equal(packet.approval,false);
    assert.equal(packet.status,'worksheet-not-submitted');
    assert.deepEqual(packet.source.structure,identity);
    assert.deepEqual(packet.topics.find((item:{tab:string})=>item.tab==='xray'),{tab:'xray',...lesson});
    assert.equal(context.sourceHash,packet.fingerprints.source);
    assert.equal(context.teachingHash,packet.fingerprints.teaching);
    assert(context.teachingTabs.includes('xray'));
    assert.equal(context.revisions.imaging,null);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
    assert.equal(api.bodyReviewStale({catalogScope:context.catalogScope,structureId:identity.id,
      checklistVersion:context.checklistVersion,revisionHash:'0'.repeat(64),track:'teaching'},context),true);
    const forged=wire(packet);
    forged.topics.find((item:{tab:string})=>item.tab==='xray').body+=' forged';
    assert.equal(await api.parseBodyReviewResponse(forged,identity.id),null);
  }
});
