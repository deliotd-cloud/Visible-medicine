import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const websiteRoot=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,websiteRoot));
const json=path=>JSON.parse(read(path));
const copy=value=>JSON.parse(JSON.stringify(value));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
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
const load=async(resolveDir)=>{
 const result=await build({stdin:{contents:entry,resolveDir,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
};

test('current source and emitted delivery bind all twelve paired midfoot identities',()=>{
 const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 const review=json('atlas-review/manifest.json'),inputs=json('atlas-review/integration-inputs.json');
 const runtime=json('public/atlas-runtime/head-neck/manifest.json');
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(review.revision,pin.source);assert.equal(inputs.sourceCommit,pin.source);assert.equal(runtime.sourceCommit,pin.source);assert.equal(viewer.sourceCommit,pin.source);
 assert.equal(viewer.personalRecordsIncluded,false);assert.equal(runtime.patientDataIncluded,false);
 const runtimeInputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 for(const path of paths){
  const authored=execFileSync('git',['show',pin.source+':'+path],{cwd:sourceRoot,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}),row=review.files.find(item=>item.path===path);assert(row,path);
  const imported=read('atlas-review/'+path),input=inputs.inputs.find(item=>item.path==='atlas-review/'+path);assert(input,path);
  const adapted=path.endsWith('.ts')?Buffer.from(authored.toString().replace(/(['"])@\//g,'$1@/atlas-review/')):authored;
  assert.equal(row.sourceSha256,sha(authored),path);assert.deepEqual(imported,adapted,path);
  assert.equal(row.importedSha256,sha(imported),path);assert.equal(input.sha256,sha(imported),path);
  assert.equal(runtimeInputs.find(item=>item.path===path)?.sha256,sha(authored),path);
 }
 const emitted=emittedTeachingSearch('public/atlas-runtime/head-neck/',runtime.files);
 const displayed=emittedTeachingSearch('public/atlas-review-viewer/',viewer.files);
 const pins=json('atlas-review/content/midfoot-relationships-reasoning-pins.json');assert.equal(pins.entries.length,12);
 for(const [index,key] of keys.entries()){
  const pair=pins.entries.filter(item=>item.key===key);assert.equal(pair.length,2,key);
  assert.deepEqual(pair.map(item=>[item.identity.fmaId,item.identity.sources[0].file]),expectedPairs[index]);
  assert.deepEqual(pair.map(item=>item.identity.laterality),['right','left']);
  for(const {identity} of pair)for(const output of [emitted,displayed])
   for(const value of [key,identity.id,identity.fmaId,identity.sources[0].file])
    assert(output.includes(value)||output.includes(JSON.stringify(value).slice(1,-1)),`Emitted ${value}`);
 }
});

test('current imported midfoot practice and worksheet parser retain exact source, four same-side choices and revision refusals',async()=>{
  const api=await load(process.cwd());
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const loaded=catalog.bundles.map(bundle=>bundle.id);
  const pins=json('atlas-review/content/midfoot-relationships-reasoning-pins.json');
  assert.equal(pins.entries.length,12);
  for(const key of keys){
    const concept=api.reasoningConcepts.find(item=>item.key===key);assert(concept);
    assert.equal(concept.readiness,'draft');assert.equal(concept.revision,1);
    assert.equal(concept.region,'foot');assert.equal(concept.sourceTissue,'bone');
    assert.deepEqual(copy(concept.sourceRegions),['foot']);
    const entries=pins.entries.filter(item=>item.key===key);
    assert.deepEqual(copy(concept.bindings),entries.map(({identity})=>({fma:identity.fmaId,side:identity.laterality,file:identity.sources[0].file})));
    for(const {identity} of entries){
      const target=catalog.structures.find(row=>row.id===identity.id);
      assert.deepEqual(copy(target),identity);
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
      const context=await api.bodyReviewContext(target.id);
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
      const stale={catalogScope:context.catalogScope,structureId:target.id,track:'teaching',expectedVersion:0,
        materialHash:'0'.repeat(64),revisionHash:context.revisions.teaching,
        checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')};
      const response=await api.postBodyDecision(new Request('https://atlas.example/api/body-review/decisions',{
        method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer',origin:'https://atlas.example'},
        body:JSON.stringify(stale)}),{prepare(){storageCalls++;throw Error('Stale request reached storage');}});
      assert.equal(response.status,409);assert.equal(storageCalls,0);
    }
  }
});
