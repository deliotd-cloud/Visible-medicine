import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {hippocampalModel,beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const revision='aa290176f8bfdb02157f7197e4647508c9c41d87';
const base='6990315c6b053f623738d8664e06de9d7af1dcf3';
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const hash=(bytes:string|Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const ids=['left','right'].map(s=>`vm:anatomy:body:head-neck:${s}:organ:${s}-hippocampus`);

test('hippocampi add exactly one licensed bundle without replacing any previous model',()=>{
  const current=json('lib/atlas-model-inventory.json');
  const previous=JSON.parse(execFileSync('git',['show',base+':lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  assert.deepEqual(beforeHippocampi(current.models),previous.models);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((m:any)=>m.paths).length,144);
  const bytes=readFileSync('public'+hippocampalModel.paths[0]);
  assert.equal(hash(bytes),hippocampalModel.sha256);assert.equal(bytes.length,38548);
  const module=json('public/atlas-runtime/head-neck/manifest.json');
  assert.equal(module.sourceCommit,revision);
  assert.equal(module.clinicalApproved,false);assert.equal(module.patientDataIncluded,false);
  for(const scope of module.regionalScopes){
    const actual=scope.nestedTargets.filter((t:any)=>ids.includes(t.structureId));
    assert.deepEqual(actual.map((t:any)=>t.structureId),['head-neck','whole-body'].includes(scope.region)?ids:[]);
    assert(actual.every((t:any)=>t.sourceHash===hippocampalModel.sha256&&t.study==='cerebral'));
  }
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,'aa290176f8bfdb02157f7197e4647508c9c41d87');
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  for(const path of ['lib/hippocampi.ts','lib/cerebral.ts','public/models/bodyparts3d/hippocampi/catalog.json']){
    const entry=review.files.find((f:any)=>f.path===path);assert(entry,path);
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,entry.sourceSha256);
    assert.equal(hash(readFileSync('atlas-review/'+path)),entry.importedSha256);
  }
  const source=json('atlas-review/public/models/bodyparts3d/hippocampi/catalog.json');
  assert.equal(source.license,'CC-BY-4.0');assert.equal(source.clinicalApproval,false);
  assert(source.structures.every((s:any)=>s.validation.status==='unvalidated'));
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});

test('both hippocampal review worksheets retain source identity, draft teaching and exact return links',async()=>{
  const result=await build({stdin:{contents:`
    export {nestedReviewRows,nestedReviewMaterial,nestedReviewSelection} from './atlas-review/lib/nested-review-material';
    export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';
    export {clinicalReviewReturn} from './lib/clinical-review-return';
    export {reviewModelHref} from './lib/clinical-review-links';
    export {nestedApprovalProblems,blankNestedReview} from './atlas-review/lib/nested-review';
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')).catch(e=>{e.stack=e.message;throw e;});
  const group=api.nestedReviewRows.find((g:any)=>g.study==='cerebral');assert(group);
  for(const id of ids){
    const material=await api.nestedReviewMaterial(group.key,id);assert(material);
    assert.equal(material.source.childBundleHash,hippocampalModel.sha256);
    assert.equal(material.source.structure.id,id);
    assert(material.teaching.topics.every((t:any)=>t.readiness===(['xray','ultrasound'].includes(t.tab)?'pending':'draft')));
    assert.equal(material.teaching.concept.id,'cerebral-hippocampus');assert.equal(material.context.revisions.imaging,null);
    assert.equal(material.context.blockers.teaching.length,0);
    assert(material.context.blockers.imaging.length>0);
    assert.match(material.teaching.concept.quiz.answer,/temporal \(inferior\) horn/);
    assert.equal(material.teaching.concept.quiz.basis,'primary-reference');
    assert.equal(material.context.sourceHash,id.includes(':left:')?'9e4b583cb33b281e139daba3da0b093209f9584cf8366cf7075ea95d3973e22e':'a7715965a4f5307ca2472dbf1274c433c3c631647773d6d22534ad88b920be39');
    for(const track of ['geometry','teaching','imaging'])assert(api.nestedApprovalProblems(api.blankNestedReview(material.context,track),material.context,track).length);
    assert.equal(await api.nestedReviewSelection(group.key,id,'0'.repeat(64)),null);
    const entry=api.clinicalReviewEntries.find((e:any)=>e.scope==='nested'&&e.id===id);assert(entry);
    const query=Object.fromEntries(new URL(api.reviewModelHref(material.atlasLink),'https://review.test').searchParams);
    assert.deepEqual(await api.clinicalReviewReturn(query),{href:entry.href,name:entry.name});
  }
});

test('hippocampal teaching import preserves all geometry and prior teaching bindings',()=>{
  const before='27e242f56007b49fed33ad2aee2915db47b9aa9e';
  const fromGit=(path:string)=>JSON.parse(execFileSync('git',['show',before+':'+path],{encoding:'utf8'}));
  assert.deepEqual(json('lib/atlas-model-inventory.json').models,fromGit('lib/atlas-model-inventory.json').models);
  assert.deepEqual(json('atlas-review/content/nested-review-bindings.json'),fromGit('atlas-review/content/nested-review-bindings.json'));
  const pins=json('atlas-review/content/nested-teaching-bindings.v1.json');
  assert.equal(pins.bindings.length,75);
  assert.deepEqual({...pins,bindings:pins.bindings.filter((b:any)=>b.conceptId!=='cerebral-hippocampus')},fromGit('atlas-review/content/nested-teaching-bindings.v1.json'));
  const review=json('atlas-review/manifest.json');
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  for(const path of ['content/hippocampal-teaching.ts','content/nested-teaching-bindings.v1.json','content/nested-teaching.ts']){
    const entry=review.files.find((f:any)=>f.path===path);assert(entry,path);
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,entry.sourceSha256);
    assert.equal(hash(readFileSync('atlas-review/'+path)),entry.importedSha256);
  }
});
