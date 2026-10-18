import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HEAD_IMAGE_ONLY_COMPARISON_REVISION} from '../lib/head-image-only-comparison-review.ts';
import {HEAD_INSULA_COMPARISON_REVISION} from '../lib/head-insula-comparison-review.ts';
import {HEAD_ORBITAL_COMPARISON_REVISION} from '../lib/head-orbital-comparison-review.ts';
import {
  IMAGE_ONLY_DECISION_ATTESTATION,IMAGE_ONLY_DECISION_CHECKS,IMAGE_ONLY_DECISION_CONCEPTS,
  PAIRED_DECISION_ATTESTATION,PAIRED_DECISION_CHECKS,PAIRED_DECISION_CONCEPTS,
  blankPairedDecision,currentPairedSemanticAcceptance,pairedDecisionConcept,pairedDecisionContext,
  pairedDecisionStale,parsePairedDecisionContext,parseSavedPairedDecision,validatePairedDecision,
} from '../lib/head-paired-decision-contract.ts';

const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const savedAt='2026-10-10T12:00:00.000Z';

test('all three image-only concepts get separate CT/MRI-only review contexts',async()=>{
  assert.deepEqual(IMAGE_ONLY_DECISION_CONCEPTS,['cerebellum-left-hemisphere','cerebellum-right-hemisphere','cerebellum-vermis']);
  for(const conceptId of IMAGE_ONLY_DECISION_CONCEPTS){
    assert(pairedDecisionConcept(conceptId));
    const context=await pairedDecisionContext(HEAD_LINK_REVISION,conceptId);
    assert.equal(context.packetId,'head-image-only-comparisons');
    assert.equal(context.conceptId,conceptId);
    assert.equal(context.headRevision,HEAD_LINK_REVISION);
    assert.equal(context.comparisonRevision,HEAD_IMAGE_ONLY_COMPARISON_REVISION);
    assert.equal(context.checklistVersion,'image-only-semantic-review-1');
    assert.deepEqual(context.checklist,IMAGE_ONLY_DECISION_CHECKS);
    assert.equal(context.attestation,IMAGE_ONLY_DECISION_ATTESTATION);
    assert.equal(context.decisionScope,'personal-semantic-comparison-only');
    assert.equal(context.patientRegistration,false);
    assert.equal(context.clinicalApproval,false);
    assert.equal(context.publicationApproval,false);
    assert.match(context.checklist[1].label,/partial MRI vermis coverage/);
    assert.match(context.checklist[3].label,/not 3D anatomy/);
    assert.doesNotMatch(context.checklist[0].label,/generic 3D/);
    assert.deepEqual(validatePairedDecision(blankPairedDecision(context),context),blankPairedDecision(context));
  }
  await assert.rejects(pairedDecisionContext('a'.repeat(64),'cerebellum-vermis'));
  await assert.rejects(pairedDecisionContext(HEAD_LINK_REVISION,'cerebellum'));
});

test('image-only acceptance requires exact checks, reviewer, qualification and attestation',async()=>{
  const context=await pairedDecisionContext(HEAD_LINK_REVISION,'cerebellum-vermis');
  const draft=blankPairedDecision(context);
  const accepted={...draft,status:'accepted-semantic' as const,reviewer:'Synthetic reviewer',qualification:'Test fixture only',
    checks:{identity:true,extent:true,comparison:true,limits:true},attested:true};
  assert.deepEqual(validatePairedDecision(accepted,context),accepted);
  for(const edit of [{reviewer:''},{qualification:' '},{attested:false},{checks:{...accepted.checks,identity:false}},
    {checks:{...accepted.checks,extent:false}},{checks:{...accepted.checks,comparison:false}},{checks:{...accepted.checks,limits:false}},
    {checks:{...accepted.checks,extra:true}},{status:'approved'},{clinicalApproval:true}]){
    assert.throws(()=>validatePairedDecision({...accepted,...edit},context));
  }
  assert.throws(()=>validatePairedDecision({...draft,attested:true},context));
  assert.throws(()=>validatePairedDecision({...draft,status:'changes-required',notes:'short'},context));
});

test('recorded image-only events cannot transfer acceptance across concept, packet, revision or wording',async()=>{
  const contexts=await Promise.all(IMAGE_ONLY_DECISION_CONCEPTS.map(id=>pairedDecisionContext(HEAD_LINK_REVISION,id)));
  const context=contexts[0];
  const event=parseSavedPairedDecision({eventSchema:'vm-paired-decision-event-1',context,version:1,savedAt,
    decision:{...blankPairedDecision(context),status:'accepted-semantic',reviewer:'Synthetic reviewer',qualification:'Test fixture only',
      checks:{identity:true,extent:true,comparison:true,limits:true},attested:true}});
  assert(currentPairedSemanticAcceptance(event,context));
  for(const other of contexts.slice(1))assert(!currentPairedSemanticAcceptance(event,other));
  for(const patch of [
    {headRevision:'a'.repeat(64)},{comparisonRevision:'b'.repeat(64)},
    {checklistVersion:'previous-image-review-1'},
    {checklist:context.checklist.map((check,index)=>index?check:{...check,label:'Earlier identity wording'})},
    {attestation:'Earlier personal attestation'},
    {conceptId:'cerebellum-right-hemisphere'},
  ]){
    const historical=clone(event);
    Object.assign(historical.context,patch);
    assert.deepEqual(parseSavedPairedDecision(historical),historical);
    assert(pairedDecisionStale(historical,context));
    assert(!currentPairedSemanticAcceptance(historical,context));
  }
  for(const patch of [{packetId:'head-insula-comparisons'},{packetId:'head-orbital-comparisons'},
    {decisionScope:'clinical-approval'},{patientRegistration:true},{clinicalApproval:true},{publicationApproval:true},
    {catalogScope:'head-ct-bone'},{checklist:[...context.checklist].reverse()}]){
    assert.throws(()=>parsePairedDecisionContext({...context,...patch}));
  }
  const correction=parseSavedPairedDecision({...event,version:2,decision:{...blankPairedDecision(context),status:'changes-required',notes:'Synthetic correction supersedes acceptance.'}});
  assert(!currentPairedSemanticAcceptance(correction,context));
});

test('four prior concept contexts and wording remain unchanged',async()=>{
  assert.deepEqual(PAIRED_DECISION_CONCEPTS,['cortex-left-insula','cortex-right-insula','orbit-left-globe','orbit-right-globe']);
  for(const conceptId of PAIRED_DECISION_CONCEPTS){
    const context=await pairedDecisionContext(HEAD_LINK_REVISION,conceptId);
    assert.equal(context.packetId,conceptId.startsWith('cortex-')?'head-insula-comparisons':'head-orbital-comparisons');
    assert.equal(context.comparisonRevision,conceptId.startsWith('cortex-')?HEAD_INSULA_COMPARISON_REVISION:HEAD_ORBITAL_COMPARISON_REVISION);
    assert.equal(context.checklistVersion,'paired-semantic-review-1');
    assert.deepEqual(context.checklist,PAIRED_DECISION_CHECKS);
    assert.equal(context.attestation,PAIRED_DECISION_ATTESTATION);
  }
});

test('internal save and read keep image-only concept histories separate',async()=>{
  const bundled=await build({entryPoints:['lib/head-paired-decision-api.ts'],bundle:true,write:false,platform:'node',format:'esm',target:'es2022'});
  const {getPairedDecisions,postPairedDecision}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`) as typeof import('../lib/head-paired-decision-api.ts');
  type Row={user_id:string;nested_key:string;structure_id:string;track:string;version:number;payload:string;saved_at:string};
  const rows:Row[]=[];
  const db={
    prepare(sql:string){
      return {
        bind(...args:unknown[]){
          return {
            async all(){
              assert.match(sql,/SELECT user_id,nested_key,structure_id/);
              const [user,key,concept,track,before]=args;
              return {success:true,results:rows.filter(row=>row.user_id===user&&row.nested_key===key&&row.structure_id===concept&&row.track===track&&row.version<(before as number)).sort((a,b)=>b.version-a.version).slice(0,20)};
            },
            async run(){
              assert.match(sql,/INSERT INTO atlas_personal_nested_review_events/);
              const [user_id,nested_key,structure_id,track,version,payload,saved_at,expected]=args as [string,string,string,string,number,string,string,number];
              const previous=Math.max(0,...rows.filter(row=>row.user_id===user_id&&row.nested_key===nested_key&&row.structure_id===structure_id&&row.track===track).map(row=>row.version));
              if(previous!==expected)return {success:true,meta:{changes:0}};
              rows.push({user_id,nested_key,structure_id,track,version,payload,saved_at});
              return {success:true,meta:{changes:1}};
            },
          };
        },
      };
    },
  };
  const binding=db as unknown as Pick<D1Database,'prepare'>;
  const request=(url:string,body?:unknown,user='synthetic-a')=>new Request(`https://review.test${url}`,{
    method:body===undefined?'GET':'POST',headers:{'oai-authenticated-user-id':user,...(body===undefined?{}:{origin:'https://review.test','content-type':'application/json'})},
    ...(body===undefined?{}:{body:JSON.stringify(body)}),
  });
  const context=await pairedDecisionContext(HEAD_LINK_REVISION,'cerebellum-left-hemisphere');
  const decision={...blankPairedDecision(context),status:'accepted-semantic',reviewer:'Synthetic reviewer',qualification:'Test fixture only',checks:{identity:true,extent:true,comparison:true,limits:true},attested:true};
  const payload={context,expectedVersion:0,decision};
  const save=await postPairedDecision(request('/review',payload),binding,HEAD_LINK_REVISION);
  assert.equal(save.status,201,await save.clone().text());
  assert.equal(rows.length,1);
  assert.equal((await postPairedDecision(request('/review',payload),binding,HEAD_LINK_REVISION)).status,409);
  const left=await getPairedDecisions(request('/review?concept=cerebellum-left-hemisphere'),binding,HEAD_LINK_REVISION);
  assert.equal(left.status,200);
  assert.equal(((await left.json()) as {history:unknown[]}).history.length,1);
  for(const conceptId of IMAGE_ONLY_DECISION_CONCEPTS.slice(1)){
    const response=await getPairedDecisions(request(`/review?concept=${conceptId}`),binding,HEAD_LINK_REVISION);
    assert.equal(response.status,200);
    assert.deepEqual(((await response.json()) as {history:unknown[]}).history,[]);
  }
  const otherUser=await getPairedDecisions(request('/review?concept=cerebellum-left-hemisphere',undefined,'synthetic-b'),binding,HEAD_LINK_REVISION);
  assert.deepEqual(((await otherUser.json()) as {history:unknown[]}).history,[]);
  assert.equal((await postPairedDecision(request('/review',{...payload,context:{...context,packetId:'head-insula-comparisons'}}),binding,HEAD_LINK_REVISION)).status,400);
  assert.equal((await postPairedDecision(request('/review',{...payload,context:{...context,attestation:'Tampered wording'}}),binding,HEAD_LINK_REVISION)).status,409);
  assert.equal(rows.length,1);
});
