import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HEAD_CT_BONE_COMPARISON_REVISION} from '../lib/head-ct-bone-comparison-review.ts';
import {HEAD_CT_FACIAL_COMPARISON_REVISION,CT_FACIAL_COMPARISON_CONCEPTS} from '../lib/head-ct-facial-comparison-review.ts';
import {ctBoneDecisionContext,parseCtBoneDecisionContext,blankCtBoneDecision,validateCtBoneDecision,parseSavedCtBoneDecision,ctBoneDecisionStale,currentCtBoneSemanticAcceptance} from '../lib/head-ct-bone-decision-contract.ts';

const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
const savedAt='2026-10-15T10:00:00.000Z';

test('three facial comparisons use an independent decision packet while all six old contexts stay exact',async()=>{
  assert.deepEqual([...CT_FACIAL_COMPARISON_CONCEPTS],['bone-left-zygomatic','bone-right-zygomatic','bone-mandible']);
  assert.notEqual(HEAD_CT_FACIAL_COMPARISON_REVISION,HEAD_CT_BONE_COMPARISON_REVISION);
  for(const concept of CT_FACIAL_COMPARISON_CONCEPTS){
    const c=await ctBoneDecisionContext(HEAD_LINK_REVISION,concept);
    assert.equal(c.conceptId,concept);assert.equal(c.catalogScope,'head-ct-bone-comparisons');
    assert.equal(c.packetId,'head-ct-facial-comparisons');assert.equal(c.comparisonRevision,HEAD_CT_FACIAL_COMPARISON_REVISION);
    assert.equal(c.checklistVersion,'ct-facial-semantic-review-1');
    assert.equal(c.decisionScope,'personal-semantic-comparison-only');
    assert.equal(c.patientRegistration,false);assert.equal(c.clinicalApproval,false);assert.equal(c.publicationApproval,false);
    assert.deepEqual(validateCtBoneDecision(blankCtBoneDecision(c),c),blankCtBoneDecision(c));
  }
  for(const concept of ['bone-left-parietal','bone-right-parietal','bone-left-nasal','bone-right-nasal','bone-occipital','bone-ethmoid']){
    const c=await ctBoneDecisionContext(HEAD_LINK_REVISION,concept);
    assert.equal(c.catalogScope,'head-ct-bone-comparisons');assert.equal(c.packetId,'head-ct-bone-comparisons');
    assert.equal(c.comparisonRevision,HEAD_CT_BONE_COMPARISON_REVISION);
    assert.equal(c.checklistVersion,'ct-bone-semantic-review-1');
  }
  await assert.rejects(ctBoneDecisionContext('stale','bone-mandible'));
  await assert.rejects(ctBoneDecisionContext(HEAD_LINK_REVISION,'bone-left-frontal'));
});

test('facial acceptance is explicit and parser rejects packet-family forgery',async()=>{
  const c=await ctBoneDecisionContext(HEAD_LINK_REVISION,'bone-mandible');
  const blank=blankCtBoneDecision(c);
  const accepted={...blank,status:'accepted-semantic' as const,reviewer:' Synthetic reviewer ',qualification:' Synthetic qualification ',checks:{identity:true,extent:true,comparison:true,limits:true},attested:true};
  assert.equal(validateCtBoneDecision(accepted,c).reviewer,'Synthetic reviewer');
  for(const edit of [
    {reviewer:' '},{qualification:''},{attested:false},{status:'approved'},
    {checks:{...accepted.checks,identity:false}},{checks:{...accepted.checks,extent:false}},
    {checks:{...accepted.checks,comparison:false}},{checks:{...accepted.checks,limits:false}},
    {checks:{...accepted.checks,extra:true}},{clinicalApproval:true},
  ])assert.throws(()=>validateCtBoneDecision({...accepted,...edit},c));
  assert.throws(()=>validateCtBoneDecision({...blank,attested:true},c));
  assert.throws(()=>parseCtBoneDecisionContext({...c,packetId:'head-ct-bone-comparisons'}));
  const old=await ctBoneDecisionContext(HEAD_LINK_REVISION,'bone-occipital');
  assert.throws(()=>parseCtBoneDecisionContext({...old,packetId:'head-ct-facial-comparisons'}));
  const event=parseSavedCtBoneDecision({eventSchema:'vm-ct-bone-decision-event-1',context:c,version:1,savedAt,decision:validateCtBoneDecision(accepted,c)});
  assert(currentCtBoneSemanticAcceptance(event,c));
  for(const edit of [
    (v:typeof event)=>{v.context.headRevision='a'.repeat(64);},
    (v:typeof event)=>{v.context.comparisonRevision='b'.repeat(64);},
    (v:typeof event)=>{v.context.checklistVersion='older';},
    (v:typeof event)=>{v.context.checklist[0].label='Earlier check';},
  ]){const stale=clone(event);edit(stale);assert(ctBoneDecisionStale(stale,c));assert(!currentCtBoneSemanticAcceptance(stale,c));}
  const correction=parseSavedCtBoneDecision({...event,version:2,decision:{...blank,status:'changes-required',notes:'Synthetic correction supersedes acceptance.'}});
  assert(!currentCtBoneSemanticAcceptance(correction,c));
});

test('synthetic decision API refuses stale and forged facial contexts before any storage call',async()=>{
  // Bundle the test-only API in memory because the installed Node strip-only
  // runner cannot load a parameter property in the shared HTTP helper.
  const apiBundle=await build({entryPoints:['lib/head-ct-bone-decision-api.ts'],bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022'});
  const {getCtBoneDecisions,postCtBoneDecision}=await import('data:text/javascript;base64,'+Buffer.from(apiBundle.outputFiles[0].text).toString('base64'));
  const c=await ctBoneDecisionContext(HEAD_LINK_REVISION,'bone-left-zygomatic');
  const decision=blankCtBoneDecision(c);
  let storageCalls=0;
  const forbidden={prepare(){storageCalls++;throw Error('Rejected request reached storage');}} as unknown as Pick<D1Database,'prepare'>;
  const post=async(context:unknown,revision=HEAD_LINK_REVISION,body:Record<string,unknown>={})=>
    postCtBoneDecision(new Request('https://review.test/api/atlas-review/head-ct-bone',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-facial-reviewer'},body:JSON.stringify({context,expectedVersion:0,decision,...body})}),forbidden,revision);
  const get=async(query:string,revision=HEAD_LINK_REVISION)=>
    getCtBoneDecisions(new Request('https://review.test/api/atlas-review/head-ct-bone'+query,{headers:{'oai-authenticated-user-id':'synthetic-facial-reviewer'}}),forbidden,revision);
  for(const [context,revision,status] of [
    [c,'a'.repeat(64),503],
    [{...c,headRevision:'a'.repeat(64)},HEAD_LINK_REVISION,409],
    [{...c,comparisonRevision:'b'.repeat(64)},HEAD_LINK_REVISION,409],
    [{...c,packetId:'head-ct-bone-comparisons'},HEAD_LINK_REVISION,400],
    [{...c,checklistVersion:'ct-bone-semantic-review-1'},HEAD_LINK_REVISION,409],
    [{...c,clinicalApproval:true},HEAD_LINK_REVISION,400],
  ] as const)assert.equal((await post(context,revision)).status,status);
  assert.equal((await post(c,HEAD_LINK_REVISION,{decision:{...decision,status:'accepted-semantic'}})).status,422);
  for(const query of ['?concept=bone-left-zygomatic&concept=bone-left-zygomatic','?concept=bone-left-frontal','?concept=bone-left-zygomatic&before=0'])assert.equal((await get(query)).status,400);
  assert.equal((await get('?concept=bone-left-zygomatic','a'.repeat(64))).status,503);
  assert.equal(storageCalls,0);
});
