import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { candidateDigest, type PersonalReviewCandidate } from '../lib/clinical-review-candidate.ts';
import { frozenReviewContext, makeFrozenReviewEvent, parseFrozenDecisionPage,
  parseFrozenReviewEvent, validateFrozenReviewEvent } from '../lib/frozen-review-contract.ts';
import { blankBodyReview } from '../atlas-review/lib/body-review-decisions.ts';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
const h = (char: string) => char.repeat(64);
const clone = <T>(value: T): T => structuredClone(value);
async function candidate(label: string, rendererRevision = h('c')): Promise<PersonalReviewCandidate> {
  const material: Omit<PersonalReviewCandidate,'id'> = {
    schema: 'visible-medicine.clinical-review-candidate/2', kind: 'root-body-review',
    decisionMode: 'personal-review', supersedes: null, label,
    createdAt: '2026-10-18T12:00:00.000Z', atlasRevision: 'a'.repeat(40),
    reviewRevision: h('b'), rendererRevision,
    selections: [{ structureId: 'vm:anatomy:body:test', structureName: 'Test', region: 'whole-body',
      materialHash: h('d'), sourceHash: h('e'), teachingHash: h('f'),
      review: { checklistVersion: 'frozen-1',
        checklists: { geometry: [{id:'shape',label:'Check shape.'}],
          teaching: [{id:'text',label:'Check text.'}], imaging: [{id:'scan',label:'Check image.'}] },
        blockers: {geometry:[],teaching:[],imaging:[]}, teachingTabs: ['anatomy'] } }],
    files: [
      {path:'index.html',sha256:h('1'),bytes:4,contentType:'text/html',storage:'candidate'},
      {path:'viewer/index.html',sha256:h('2'),bytes:4,contentType:'text/html',storage:'candidate'},
      {path:'worksheet.json',sha256:h('3'),bytes:4,contentType:'application/json',storage:'candidate'},
    ],
  };
  return {...material,id:await candidateDigest(material)};
}
const now = '2026-10-18T12:01:00.000Z';
const approved = (context: Awaited<ReturnType<typeof frozenReviewContext>>, track: 'geometry'|'teaching'|'imaging') => ({
  ...blankBodyReview(context,track),status:'approved' as const,reviewer:'Reviewer', qualification:'Radiologist',
  scope:'Exact source-bound worksheet', checks:Object.fromEntries(context.checklists[track].map(c=>[c.id,true])),
  evidence:[{title:'Source',url:'https://example.org/source',note:''}],attested:true,
});
const page = (candidate: PersonalReviewCandidate, context: Awaited<ReturnType<typeof frozenReviewContext>>) => ({
  schema:'vm-frozen-body-decision-page-1',scope:'private-to-signed-in-account-and-institution',
  candidate,context,reviews:[],history:[],track:'geometry',nextBefore:null,
});

test('same selection in two candidates cannot inherit approval or revisions', async () => {
  const first = await candidate('First'), second = await candidate('Second');
  const a = await frozenReviewContext(first,'vm:anatomy:body:test');
  const b = await frozenReviewContext(second,'vm:anatomy:body:test');
  assert.notEqual(a.revisions.geometry,b.revisions.geometry);
  assert.notEqual(a.revisions.teaching,b.revisions.teaching);
  assert.notEqual(a.contextHash,b.contextHash);
  const event = makeFrozenReviewEvent(approved(a,'geometry'),a,'geometry',1,now);
  assert.throws(()=>validateFrozenReviewEvent(event,b),/context/);
  await assert.rejects(parseFrozenDecisionPage({...page(second,b),reviews:[event]},second.id,b.structureId),/context/);
});

test('renderer revision changes both geometry and teaching approval identities', async () => {
  const first = await candidate('Same'), second = await candidate('Same',h('9'));
  const a = await frozenReviewContext(first,'vm:anatomy:body:test');
  const b = await frozenReviewContext(second,'vm:anatomy:body:test');
  assert.notEqual(a.revisions.geometry,b.revisions.geometry);
  assert.notEqual(a.revisions.teaching,b.revisions.teaching);
  assert.equal(a.revisions.imaging,null);
  assert.ok(a.blockers.imaging.length);
  assert.throws(()=>makeFrozenReviewEvent(approved(a,'imaging'),a,'imaging',1,now));
});

test('inspection-only descriptor and malformed events fail closed', async () => {
  const value = await candidate('Review');
  const inspection: any = {...value,schema:'visible-medicine.clinical-review-candidate/1',
    kind:'root-body-inspection',decisionMode:'inspection-only',selections:value.selections.map(({review,...rest})=>rest)};
  delete inspection.supersedes;
  const {id:ignored,...material}=inspection;
  inspection.id=await candidateDigest(material);
  await assert.rejects(frozenReviewContext(inspection,value.selections[0].structureId),/Inspection-only/);
  const context=await frozenReviewContext(value,value.selections[0].structureId);
  const event=makeFrozenReviewEvent(blankBodyReview(context,'geometry'),context,'geometry',1,now);
  assert.throws(()=>parseFrozenReviewEvent({...event,extra:1}),/envelope/);
  assert.throws(()=>parseFrozenReviewEvent({...event,review:{...event.review,extra:1}}),/fields/);
  assert.throws(()=>validateFrozenReviewEvent({...event,review:{...event.review,material:{...event.review.material,sourceHash:h('0')}}},context),/context/);
  assert.throws(()=>validateFrozenReviewEvent({...event,review:{...event.review,checklist:[{id:'wrong',label:'Wrong'}]}},context));
  assert.throws(()=>validateFrozenReviewEvent({...event,review:{...event.review,savedAt:'2026-10-18T12:01:00Z'}},context),/context/);
});

test('page rejects descriptor, context, mixed records and history cursor/order', async () => {
  const c=await candidate('Review'), context=await frozenReviewContext(c,c.selections[0].structureId);
  const base=page(c,context);
  const event=makeFrozenReviewEvent(blankBodyReview(context,'geometry'),context,'geometry',1,now);
  await parseFrozenDecisionPage({...base,reviews:[event],history:[event]},c.id,context.structureId);
  for(const altered of [
    {...base,candidate:{...c,label:'Tampered'}},
    {...base,context:{...context,rendererHash:h('0')}},
    {...base,reviews:[event,event]},
    {...base,history:[event,event]},
    {...base,history:[{...event,review:{...event.review,track:'teaching'}}]},
    {...base,history:[event],nextBefore:1},
  ]) await assert.rejects(parseFrozenDecisionPage(altered,c.id,context.structureId));
});
