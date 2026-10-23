import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const stage='F:/VisibleMedicine/staging/20261023-midfoot-reasoning';
const parentStage='F:/VisibleMedicine/staging/20261023-native-workspace-disclosures';
const source='2ab63cbbc1c5e18a4d7b3a65f799e863f5be0491';
const tree='c625d8b1a55aabd8e6497169856e9d67b85ea0f3';
const parentSource='66ac064579ee23c5739d0907e8378e0e2d57d7bd';
const independent='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path));
const copy=value=>JSON.parse(JSON.stringify(value));
const receiptBytes=readFileSync(stage+'/SOURCE_BOUND.json');
assert.equal(sha(receiptBytes),'feba2ee6e0127ff34a9b23eaf01b3fe9ed83b8ced45d0803c66feaacd9b3d7fc');
const receipt=JSON.parse(receiptBytes);
assert.equal(receipt.head,source);assert.equal(receipt.tree,tree);assert.equal(receipt.parent,parentSource);
const parentBytes=readFileSync(parentStage+'/SOURCE_BOUND.json');
assert.equal(sha(parentBytes),'c9525d20da416a7ca112cbd1da1248b8640538f5ac65f8e62009ec1272407342');
const parentReceipt=JSON.parse(parentBytes);
assert.equal(parentReceipt.atlasHead,parentSource);
assert.equal(parentReceipt.atlasTree,receipt.parentTree);
const parentRoot=parentReceipt.website.replaceAll('\\','/')+'/';
const parentRead=path=>{
  const row=parentReceipt.sourceRows.find(item=>item.path===path);assert(row,`Parent receipt: ${path}`);
  const bytes=readFileSync(parentRoot+path);assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256);return bytes;
};
const sourceRow=path=>{const row=receipt.sourceRows.find(item=>item.path===path);assert(row,`Atlas receipt: ${path}`);return row;};
const paths=['content/midfoot-relationships-reasoning-pins.json','lib/midfoot-relationships-reasoning.ts','lib/reasoning-questions.ts'];
const keys=['medial-cuneiform','intermediate-cuneiform','lateral-cuneiform','first-metatarsal','second-metatarsal','fourth-metatarsal'].map(slug=>`midfoot-relationships-${slug}`);
const expectedPairs=[
  [['FMA24521','FJ3377'],['FMA24522','FJ3271']],
  [['FMA24523','FJ3370'],['FMA24524','FJ3264']],
  [['FMA24525','FJ3373'],['FMA24526','FJ3267']],
  [['FMA24507','FJ3351'],['FMA24508','FJ3241']],
  [['FMA24509','FJ3353'],['FMA24510','FJ3244']],
  [['FMA24513','FJ3357'],['FMA24514','FJ3250']],
];
const entry=[
  "export * from './atlas-review/lib/reasoning-questions';",
  "export * from './atlas-review/lib/midfoot-relationships-reasoning';",
  "export * from './atlas-review/lib/atlas-practice';",
  "export * from './atlas-review/lib/body-review-material';",
  "export * from './atlas-review/lib/body-review-response';",
  "export * from './atlas-review/lib/body-review-context';",
  "export * from './atlas-review/lib/body-review-decisions';",
  "export * from './atlas-review/lib/body-review-api';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
].join('\n');
const load=async(resolveDir,contents=entry)=>{
  const result=await build({stdin:{contents,resolveDir,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
};

test('sealed source and Website parent deliver twelve paired midfoot identities only to shared learning and protected Review',()=>{
  const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
  for(const module of ['head-neck','shoulder'])assert.equal(pin.runtimeSources[module],source);
  for(const module of ['lower-limb','female-pelvis'])assert.equal(pin.runtimeSources[module],independent);
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,source);
  const viewer=json('public/atlas-review-viewer/manifest.json');assert.equal(viewer.sourceCommit,source);
  assert.equal(viewer.websiteIntegrationSha256,pin.reviewIntegration);
  assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.mode,'production');
  const shared=json('public/atlas-runtime/head-neck/manifest.json');
  const shoulder=json('public/atlas-runtime/shoulder/manifest.json');
  assert.equal(shared.sourceCommit,source);assert.equal(shoulder.sourceCommit,source);
  assert.equal(shared.patientDataIncluded,false);assert.equal(shoulder.patientDataIncluded,false);
  assert.equal(shared.clinicalApproved,false);assert.equal(shoulder.clinicalApproved,false);
  const sharedInputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  const shoulderInputs=json('public/atlas-runtime/shoulder/source-inputs.json');
  for(const path of paths){
    const authored=readFileSync(stage+'/atlas/'+path);assert.equal(sha(authored),sourceRow(path).sha256);
    const row=review.files.find(item=>item.path===path);assert(row,`Review input: ${path}`);
    assert.equal(row.sourceSha256,sha(authored));
    const imported=readFileSync('atlas-review/'+path);
    const adapted=path.endsWith('.ts')?Buffer.from(authored.toString().replace(/(['"])@\//g,'$1@/atlas-review/')):authored;
    assert.deepEqual(imported,adapted);assert.equal(row.importedSha256,sha(imported));
    assert.equal(sharedInputs.find(item=>item.path===path)?.sha256,sha(authored));
    assert(!shoulderInputs.some(item=>item.path===path),`Dedicated shoulder excludes ${path}`);
  }
  const inventory=json('lib/atlas-model-inventory.json');
  assert.deepEqual(inventory.models,JSON.parse(parentRead('lib/atlas-model-inventory.json')).models);
  const emitted=emittedTeachingSearch('public/atlas-runtime/head-neck/',shared.files);
  const display=emittedTeachingSearch('public/atlas-review-viewer/',viewer.files);
  const pins=json('atlas-review/content/midfoot-relationships-reasoning-pins.json');
  assert.equal(pins.parentSource,parentSource);assert.equal(pins.entries.length,12);
  for(const [index,key] of keys.entries()){
    const entries=pins.entries.filter(item=>item.key===key);assert.equal(entries.length,2);
    assert.deepEqual(entries.map(item=>[item.identity.fmaId,item.identity.sources[0].file]),expectedPairs[index]);
    assert.deepEqual(entries.map(item=>item.identity.laterality),['right','left']);
    for(const {identity} of entries)for(const output of [emitted,display])
      for(const value of [key,identity.id,identity.fmaId,identity.sources[0].file])
        assert(output.includes(value)||output.includes(JSON.stringify(value).slice(1,-1)),`Reachable ${value}`);
  }
  for(const module of ['lower-limb','female-pelvis']){
    const manifest=json(`public/atlas-runtime/${module}/manifest.json`);
    assert.equal(manifest.sourceCommit,independent);assert.equal(manifest.patientDataIncluded,false);
  }
  assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,source:parentSource}}));
});

test('imported midfoot practice and worksheet parser retain exact source, four same-side choices and revision refusals',async()=>{
  const api=await load(process.cwd());
  const old=await load(parentRoot,entry.replace("export * from './atlas-review/lib/midfoot-relationships-reasoning';",''));
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const loaded=catalog.bundles.map(bundle=>bundle.id);
  const pins=json('atlas-review/content/midfoot-relationships-reasoning-pins.json');
  assert.equal(old.reasoningConcepts.length,204);assert.equal(api.reasoningConcepts.length,210);
  assert.deepEqual(copy(api.reasoningConcepts.slice(0,204)),copy(old.reasoningConcepts));
  assert.equal(catalog.structures.filter(old.reasoningConceptFor).length,368);
  assert.equal(catalog.structures.filter(api.reasoningConceptFor).length,380);
  for(const oldTarget of catalog.structures.filter(old.reasoningConceptFor))
    assert.deepEqual(copy(api.reasoningConceptFor(oldTarget)),copy(old.reasoningConceptFor(oldTarget)),`Old target: ${oldTarget.id}`);
  for(const key of keys){
    const concept=api.reasoningConcepts.find(item=>item.key===key);assert(concept);
    assert.equal(concept.readiness,'draft');assert.equal(concept.revision,1);
    assert.equal(concept.region,'foot');assert.equal(concept.sourceTissue,'bone');
    assert.deepEqual(copy(concept.sourceRegions),['foot']);
    const entries=pins.entries.filter(item=>item.key===key);
    assert.deepEqual(copy(concept.bindings),entries.map(({identity})=>({fma:identity.fmaId,side:identity.laterality,file:identity.sources[0].file})));
    for(const {identity} of entries){
      const target=catalog.structures.find(row=>row.id===identity.id);
      assert.deepEqual(copy(target),identity);assert.equal(old.reasoningConceptFor(target),undefined);
      assert.equal(api.midfootRelationshipsReasoningSourceMatches(target,key),true);
      assert.equal(api.reasoningConceptFor(target)?.key,key);
      for(const changed of [
        {...target,name:target.name+' foreign'},
        {...target,sources:[{...target.sources[0],sha256:'0'.repeat(64)}]},
        {...target,center:[target.center[0]+1,...target.center.slice(1)]},
      ]){
        assert.equal(api.midfootRelationshipsReasoningSourceMatches(changed,key),false);
        assert.equal(api.reasoningConceptFor(changed),undefined);
      }
      const foot=catalog.structures.filter(row=>row.regions.includes('foot'));
      const options={id:1,mode:'reason',sampling:'all',count:1,retryIds:[target.id]};
      const session=api.createPracticeSession(foot,loaded,options,()=>0.314159);
      const question=session?.questions[0];assert.equal(question?.target,target.id);
      assert.equal(question.reasoning.key,key);assert.equal(question.reasoning.prompt,concept.prompt);
      assert.deepEqual(copy(question.reasoning.references),copy(concept.references));
      assert.equal(question.choices.length,4);assert.equal(new Set(question.choices).size,4);
      for(const id of question.choices){
        const choice=foot.find(row=>row.id===id);assert(choice);
        assert.equal(choice.laterality,target.laterality);assert.equal(choice.bundle,target.bundle);
        if(id!==target.id)assert(concept.distractors.includes(api.reasoningConceptFor(choice)?.key));
      }
      assert.equal(api.reasoningFeedback(session),undefined);
      const action={sessionId:session.id,index:0};
      const correct=api.practiceReducer(session,{type:'answer',...action,chosen:target.id});
      assert.equal(api.practiceScore(correct),1);assert.equal(api.reasoningFeedback(correct)?.key,key);
      const wrong=question.choices.find(id=>id!==target.id);
      const incorrect=api.practiceReducer(session,{type:'answer',...action,chosen:wrong});
      assert.equal(api.practiceScore(incorrect),0);assert.equal(api.reasoningFeedback(incorrect)?.key,key);
      const done=api.practiceReducer(incorrect,{type:'next',...action});
      assert.deepEqual(copy(api.missedPracticeIds(done.responses)),[target.id]);
      const packet=copy(await api.bodyReviewMaterial(target.id));
      assert(packet?.reasoning);assert.equal(packet.approval,false);
      assert.equal(packet.status,'worksheet-not-submitted');
      assert.equal(packet.reasoning.answerId,target.id);assert.equal(packet.reasoning.readiness,'draft');
      assert.equal(packet.reasoning.prompt,concept.prompt);
      assert.deepEqual(copy(packet.reasoning.references),copy(concept.references));
      assert.deepEqual(copy(await api.parseBodyReviewResponse(packet,target.id)),packet);
      const previousPacket=await old.bodyReviewMaterial(target.id);
      assert.equal(previousPacket.reasoning,null);
      assert.equal(await api.parseBodyReviewResponse(previousPacket,target.id),null);
      const context=await api.bodyReviewContext(target.id);
      const oldContext=await old.bodyReviewContext(target.id);
      assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
      assert.equal(context.materialHash,packet.materialHash);
      for(const mutate of [
        p=>{p.reasoning.answerId=p.reasoning.choices.find(choice=>choice.id!==target.id).id;},
        p=>{p.reasoning.explanation+=' foreign';},
        p=>{p.reasoning.references[0].url='https://foreign.example';},
        p=>{p.reasoning.choices[0].sources[0].sha256='0'.repeat(64);},
        p=>{p.fingerprints.teaching='0'.repeat(64);},
        p=>{p.approval=true;},
      ]){const forged=copy(packet);mutate(forged);assert.equal(await api.parseBodyReviewResponse(forged,target.id),null);}
      let storageCalls=0;
      const stale={catalogScope:oldContext.catalogScope,structureId:target.id,track:'teaching',expectedVersion:0,
        materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching,
        checklistVersion:oldContext.checklistVersion,draft:api.blankBodyReview(oldContext,'teaching')};
      const response=await api.postBodyDecision(new Request('https://atlas.example/api/body-review/decisions',{
        method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer',origin:'https://atlas.example'},
        body:JSON.stringify(stale)}),{prepare(){storageCalls++;throw Error('Stale request reached storage');}});
      assert.equal(response.status,409);assert.equal(storageCalls,0);
    }
  }
});
