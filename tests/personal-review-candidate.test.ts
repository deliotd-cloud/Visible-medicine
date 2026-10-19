import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { candidateDigest, validateCandidate,
  type ClinicalReviewInspectionCandidate, type PersonalReviewCandidate,
} from '../lib/clinical-review-candidate.ts';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
const hash = (digit: string) => digit.repeat(64);
const oldMaterial: Omit<ClinicalReviewInspectionCandidate,'id'> = {
  schema: 'visible-medicine.clinical-review-candidate/1', kind: 'root-body-inspection',
  decisionMode: 'inspection-only', label: 'Frozen inspection', createdAt: '2026-10-18T12:00:00.000Z',
  atlasRevision: 'a'.repeat(40), reviewRevision: hash('b'), rendererRevision: hash('c'),
  selections: [{ structureId:'vm:anatomy:body:test', structureName:'Test', region:'whole-body',
    materialHash:hash('d'), sourceHash:hash('e'), teachingHash:hash('f') }],
  files: [
    {path:'index.html',sha256:hash('1'),bytes:4,contentType:'text/html',storage:'candidate'},
    {path:'viewer/index.html',sha256:hash('2'),bytes:4,contentType:'text/html',storage:'candidate'},
    {path:'worksheet.json',sha256:hash('3'),bytes:4,contentType:'application/json',storage:'candidate'},
  ],
};
const basis = {
  checklistVersion:'frozen-body-1',
  checklists:{geometry:[{id:'identity',label:'Verify shape and source.'}],
    teaching:[{id:'teaching',label:'Verify authored draft.'}],
    imaging:[{id:'image',label:'Verify acquired image.'}]},
  blockers:{geometry:[],teaching:[],imaging:['No validated imaging.']},
  teachingTabs:['anatomy','function'],
};
async function withId<T extends object>(material: T): Promise<T & {id:string}> {
  return {...material,id:await candidateDigest(material)};
}
async function personal(): Promise<PersonalReviewCandidate> {
  return withId({ ...oldMaterial, schema:'visible-medicine.clinical-review-candidate/2' as const,
    kind:'root-body-review' as const,decisionMode:'personal-review' as const,supersedes:null,
    selections:oldMaterial.selections.map(selection=>({...selection,review:structuredClone(basis)})) });
}
async function checked(value: Record<string,unknown>): Promise<void> {
  const {id:ignored,...material}=value;
  await assert.rejects(validateCandidate(await withId(material)));
}

test('schema 1 fixture stays valid and cannot be changed into approvable schema 2 under its ID', async () => {
  const old=await withId(oldMaterial);
  assert.deepEqual(await validateCandidate(old),old);
  await assert.rejects(validateCandidate({...old,decisionMode:'personal-review'}),/identity/);
  await assert.rejects(validateCandidate({...old,schema:'visible-medicine.clinical-review-candidate\/2',
    kind:'root-body-review',decisionMode:'personal-review',supersedes:null,
    selections:old.selections.map(selection=>({...selection,review:basis}))}),/digest/);
  await assert.rejects(validateCandidate({...old,selections:old.selections.map(selection=>({...selection,review:basis}))}),/selections/);
});

test('schema 2 digest binds exact review basis, mode and supersession', async () => {
  const value=await personal();
  assert.deepEqual(await validateCandidate(value),value);
  const edited=structuredClone(value);
  edited.selections[0].review.checklists.geometry[0].label='Different boundary';
  await assert.rejects(validateCandidate(edited),/digest/);
  const changedBasis=await withId((({id,...material})=>material)(edited));
  assert.notEqual(changedBasis.id,value.id);
  await validateCandidate(changedBasis);
  const superseding=await withId({...oldMaterial,schema:value.schema,kind:value.kind,
    decisionMode:value.decisionMode,supersedes:value.id,selections:structuredClone(value.selections)});
  assert.notEqual(superseding.id,value.id);
  const validated=await validateCandidate(superseding);
  assert.equal(validated.decisionMode,'personal-review');
  if(validated.decisionMode==='personal-review') assert.equal(validated.supersedes,value.id);
  await assert.rejects(validateCandidate({...value,supersedes:value.id}),/identity/);
  await assert.rejects(validateCandidate({...value,decisionMode:'inspection-only'}),/identity/);
  await assert.rejects(validateCandidate({...value,kind:'root-body-inspection'}),/identity/);
});

test('schema 2 rejects malformed or ambiguous review basis even with recomputed ID', async () => {
  const value=await personal();
  const mutate=(change:(v:any)=>void)=>{const result=structuredClone(value);change(result);return result;};
  for(const bad of [
    mutate(v=>v.selections[0].review.unexpected=true),
    mutate(v=>v.selections[0].review.checklists.geometry[0].unexpected=true),
    mutate(v=>v.selections[0].review.checklists.geometry.push({...v.selections[0].review.checklists.geometry[0]})),
    mutate(v=>v.selections[0].review.checklists.geometry=[]),
    mutate(v=>v.selections[0].review.checklists.geometry[0].id='bad id'),
    mutate(v=>v.selections[0].review.checklists.geometry[0].id='a'.repeat(81)),
    mutate(v=>v.selections[0].review.checklists.geometry[0].label='L'.repeat(1001)),
    mutate(v=>v.selections[0].review.checklists.geometry=Array.from({length:31},(_,i)=>({id:`check-${i}`,label:`Check ${i}`}))),
    mutate(v=>delete v.selections[0].review.checklists.imaging),
    mutate(v=>v.selections[0].review.blockers.teaching='not an array'),
    mutate(v=>v.selections[0].review.teachingTabs=['anatomy','anatomy']),
    mutate(v=>v.selections[0].review.teachingTabs=['patient-scan']),
    mutate(v=>v.selections.push(structuredClone(v.selections[0]))),
    mutate(v=>v.selections[0].unknown=true),
    mutate(v=>v.unexpected=true),
    mutate(v=>v.supersedes='short'),
  ]) await checked(bad as unknown as Record<string,unknown>);
});
