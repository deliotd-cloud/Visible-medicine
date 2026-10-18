import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const featureRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const featureTree='1bd327fb20a52b35bec584675c457173c548e24b';
const revision=CURRENT_ATLAS_REVISION;
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:string|Uint8Array)=>createHash('sha256').update(b).digest('hex');
test('heart cavity guide reaches the regional learner and protected exact-revision Review',async()=>{
  const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
  assert.equal(pin.source,revision);
  const review=json('atlas-review/manifest.json'),learner=json('public/atlas-runtime/head-neck/manifest.json');
  const viewer=json('public/atlas-review-viewer/manifest.json');
  assert.equal(review.revision,revision);assert.equal(learner.sourceCommit,revision);assert.equal(viewer.sourceCommit,revision);
  assert.equal(learner.patientDataIncluded,false);assert.equal(learner.clinicalApproved,false);assert.equal(viewer.personalRecordsIncluded,false);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  const path='lib/cardiac-cavity-guide.ts',record=review.files.find((f:{path:string})=>f.path===path);assert(record);
  const committed=execFileSync('git',['show',`${revision}:${path}`],{cwd:sourceRoot,windowsHide:true});
  assert.equal(execFileSync('git',['rev-parse',`${featureRevision}^{tree}`],{cwd:sourceRoot,encoding:'utf8'}).trim(),featureTree);
  for(const historicalPath of [path,'lib/cardiac.ts','lib/nested-guided-learning.ts','lib/nested-review-material.ts'])
    assert.deepEqual(execFileSync('git',['show',`${revision}:${historicalPath}`],{cwd:sourceRoot}),
      execFileSync('git',['show',`${featureRevision}:${historicalPath}`],{cwd:sourceRoot}),historicalPath+': immutable feature source held');
  assert.equal(record.sourceSha256,sha(committed));assert.equal(record.importedSha256,sha(readFileSync('atlas-review/'+path)));
  assert.equal(readFileSync('atlas-review/'+path,'utf8').replaceAll('\r\n','\n'),committed.toString().replaceAll('\r\n','\n'));
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  assert.equal(inputs.find((f:{path:string})=>f.path===path)?.sha256,sha(readFileSync(sourceRoot+'/'+path)));
  const output=await build({stdin:{contents:"export {cardiacCavityGuide} from './atlas-review/lib/cardiac-cavity-guide';export {cardiacCatalog} from './atlas-review/lib/cardiac';export {nestedGuidedStudyOptions} from './atlas-review/lib/nested-guided-learning';export {nestedReviewRows,nestedReviewMaterial} from './atlas-review/lib/nested-review-material';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {default as raw} from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
  const guide=api.cardiacCavityGuide(api.cardiacCatalog.parent);assert(guide);assert.equal(guide.steps.length,6);
  const catalog=api.bodyDisplayCatalog(api.raw),cardiac=api.nestedGuidedStudyOptions(catalog,'thorax');
  assert.equal(cardiac.length,1);assert.deepEqual(cardiac[0].guide,guide);
  assert.equal(api.nestedGuidedStudyOptions(catalog,'head-neck').length,3);
  const group=api.nestedReviewRows.find((r:{study:string})=>r.study==='cardiac');assert.equal(group.surfaces.length,4);
  for(const row of group.surfaces){
    const material=await api.nestedReviewMaterial(group.key,row.id);
    assert.deepEqual(material.teaching.guidedLearning,guide);
    assert(material.context.teachingTabs.includes('guided-learning'));
    assert(material.context.checklists.teaching.some((c:{id:string})=>c.id==='guided-learning'));
    assert.equal(material.context.revisions.imaging,null);
  }
  for(const [base,manifest]of [['public/atlas-runtime/head-neck/',learner],['public/atlas-review-viewer/',viewer]] as const){
    const code=emittedTeaching(base,manifest.files,true);
    for(const value of [guide.title,'Start cardiac cavity walkthrough',...guide.steps.map((s:{caption:string})=>s.caption)])
      assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`${base}: guide is reachable in emitted code`);
  }
});


test('cardiac cavity current source binding refuses forged source, import and learner metadata',()=>{
  const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
  assert.equal(pin.source,revision);
  const path='lib/cardiac-cavity-guide.ts';
  const review=json('atlas-review/manifest.json'),inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  const committed=execFileSync('git',['show',`${revision}:${path}`],{cwd:sourceRoot,windowsHide:true});
  const imported=readFileSync('atlas-review/'+path);
  const verify=(manifest:any,learnerInputs:any,importedBytes:Uint8Array=imported)=>{
    const entry=manifest.files.find((file:{path:string})=>file.path===path);assert(entry,path);
    assert.equal(entry.sourceSha256,sha(committed),'Exact committed source');
    assert.equal(entry.importedSha256,sha(importedBytes),'Exact Review import');
    assert.deepEqual(learnerInputs.filter((file:{path:string})=>file.path===path),
      [{path,sha256:sha(committed)}],'Exact learner input');
  };
  verify(review,inputs);
  for(const field of ['sourceSha256','importedSha256']){
    const altered=structuredClone(review);altered.files.find((file:{path:string})=>file.path===path)[field]='0'.repeat(64);
    assert.throws(()=>verify(altered,inputs),field==='sourceSha256'?/committed source/:/Review import/);
  }
  const alteredInputs=structuredClone(inputs);alteredInputs.find((file:{path:string})=>file.path===path).sha256='0'.repeat(64);
  assert.throws(()=>verify(review,alteredInputs),/learner input/);
  const alteredImport=Buffer.from(imported);alteredImport[0]^=1;
  assert.throws(()=>verify(review,inputs,alteredImport),/Review import/);
});
