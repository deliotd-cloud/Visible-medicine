/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import ts from 'typescript';

import * as lectureContent from '../lib/lecture-content.ts';
import * as lectureManifest from '../lib/lecture-manifest.ts';
import * as anatomy from '../lib/lecture-anatomy-reference.ts';
import * as collection from '../lib/lecture-anatomy-collection.ts';
import * as lectureBody from '../lib/lecture-body-reference.ts';

const requireNode = createRequire(import.meta.url);
const workbookId = 'workbook:11111111-1111-4111-8111-111111111111';
const slide = {id:'slide-1',title:'Introduction',body:'A bounded education-only lecture slide.',referenceUrl:'https://example.edu/reference'};
const workbook = {id:workbookId,title:'Saved lecture',mode:'lecture' as const,version:2};
const base = {schema:'visible-medicine-lecture-v1',product:'Visible Medicine',intendedPurpose:'education-only',workbook,slides:[slide]};

test('absent anatomy field retains the exact v1 canonical JSON and hash', async () => {
  const record = await lectureManifest.createLectureManifestRecord(base);
  const expected = '{"schema":"visible-medicine-lecture-v1","product":"Visible Medicine","intendedPurpose":"education-only","workbook":{"id":"'+workbookId+'","title":"Saved lecture","mode":"lecture","version":2},"slides":[{"id":"slide-1","title":"Introduction","body":"A bounded education-only lecture slide.","referenceUrl":"https://example.edu/reference"}]}';
  assert.equal(record.manifestJson, expected);
  assert.equal(record.integrityHash, createHash('sha256').update(expected).digest('hex'));
  assert.deepEqual(await lectureManifest.parseAndVerifyLectureManifest(expected, record.integrityHash), record.manifest);
  assert.equal(Object.hasOwn(record.manifest.slides[0], 'anatomyReference'), false);
});

test('anatomy pin survives canonical manifest version, hash and verified readback', async () => {
  const reference = anatomy.createLectureAnatomyReference('brainstem-pons'); assert(reference);
  const record = await lectureManifest.createLectureManifestRecord({...base,slides:[{...slide,anatomyReference:reference}]});
  assert.equal(record.manifest.workbook.version, 2);
  assert.deepEqual(record.manifest.slides[0].anatomyReference, reference);
  assert.equal(record.integrityHash, createHash('sha256').update(record.manifestJson).digest('hex'));
  assert.deepEqual(Object.keys(JSON.parse(record.manifestJson).slides[0].anatomyReference),['kind','conceptId','headRevision','atlasTarget']);
  const readback = await lectureManifest.parseAndVerifyLectureManifest(record.manifestJson,record.integrityHash);
  assert.deepEqual(readback.slides[0].anatomyReference,reference);
  assert(anatomy.resolveLectureAnatomyReference(readback.slides[0].anatomyReference));
  const changed = await lectureManifest.createLectureManifestRecord({...base,slides:[{...slide,anatomyReference:{...reference,atlasTarget:'/atlas/head-neck-3d?concept=other'}}]});
  assert.notEqual(changed.integrityHash,record.integrityHash);
  await assert.rejects(()=>lectureManifest.parseAndVerifyLectureManifest(changed.manifestJson,record.integrityHash));
  const tampered = record.manifestJson.replace('brainstem-pons','brainstem-midbrain');
  await assert.rejects(()=>lectureManifest.parseAndVerifyLectureManifest(tampered,record.integrityHash));
});

test('invalid reference is refused while a structurally valid stale published pin remains readable', async () => {
  const reference = anatomy.createLectureAnatomyReference('brainstem-pons'); assert(reference);
  for (const invalid of [{...reference,atlasTarget:'https://evil.invalid/'},{...reference,extra:'forged'}]) {
    assert.throws(()=>lectureContent.validateLectureSlides([{...slide,anatomyReference:invalid}]));
    await assert.rejects(()=>lectureManifest.createLectureManifestRecord({...base,slides:[{...slide,anatomyReference:invalid}]}));
  }
  const stale = {...reference,headRevision:'a'.repeat(64)};
  const frozen = await lectureManifest.createLectureManifestRecord({...base,slides:[{...slide,anatomyReference:stale}]});
  const readback = await lectureManifest.parseAndVerifyLectureManifest(frozen.manifestJson,frozen.integrityHash);
  assert.deepEqual(readback.slides[0].anatomyReference,stale);
  assert.equal(anatomy.resolveLectureAnatomyReference(readback.slides[0].anatomyReference),null);
});

function compileRepository(mocks:Record<string,unknown>) {
  const source = readFileSync(new URL('../lib/lecture-repository.ts',import.meta.url),'utf8');
  const code = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const module = {exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((name:string)=>name in mocks?mocks[name]:requireNode(name),module,module.exports);
  return module.exports;
}

for(const conceptId of ['brainstem-pons','cerebellum-vermis'])test(`${conceptId} stale draft pin blocks review and publish before any DB mutation; course access stays separate`,async()=>{
  const reference = anatomy.createLectureAnatomyReference(conceptId); assert(reference);
  const stale = {...reference,headRevision:'a'.repeat(64)};
  const row = {id:workbookId,title:'Saved lecture',version:2,status:'draft',course_id:'course-1',course_title:'Clinical anatomy',author_id:'author-1',organization_id:'org-1',slides_json:JSON.stringify([{...slide,anatomyReference:stale}]),review_hash:null};
  let batches = 0;
  const DB = {prepare(sql:string){return {bind(..._args:unknown[]){return {first:async()=>sql.includes('FROM workbooks w JOIN modules')?row:null};}};},async batch(){batches++;return []}};
  const auth = {userId:'author-1',displayName:'Author One'};
  const repository = compileRepository({
    'cloudflare:workers':{env:{DB}},
    '@/db/bootstrap':{ensureEducationUser:async(user:{userId:string})=>({roles:user.userId===auth.userId?['instructor']:['learner']}),appendAudit:async()=>{}},
    '@/db/platform':{getPlatformSnapshot:async()=>({organization:{id:'org-1'},entitlement:{studioAccess:true}})},
    '@/lib/workbook-access':{canAccessPublishedWorkbook:async()=>false},
    '@/lib/lecture-content':lectureContent,
    '@/lib/lecture-manifest':lectureManifest,
    './lecture-anatomy-reference.ts':anatomy,
    './lecture-anatomy-collection.ts':collection,
    './lecture-body-reference.ts':lectureBody,
  });
  await assert.rejects(()=>repository.mutateLecture(auth,workbookId,{action:'request-review',id:workbookId,expectedVersion:2}),
    (error:any)=>error.status===422 && /anatomy link has changed/i.test(error.message));
  row.status='approved';
  await assert.rejects(()=>repository.mutateLecture(auth,workbookId,{action:'publish',id:workbookId,expectedVersion:2}),
    (error:any)=>error.status===422 && /anatomy link has changed/i.test(error.message));
  assert.equal(batches,0);
  await assert.rejects(()=>repository.getPublishedLecture({userId:'learner-1',displayName:'Learner'},workbookId),
    (error:any)=>error.status===403);
});

test('image-only references survive canonical manifest readback without changing legacy slide shape',async()=>{
 for(const conceptId of ['cerebellum-left-hemisphere','cerebellum-right-hemisphere','cerebellum-vermis']){
  const reference=anatomy.createLectureAnatomyReference(conceptId);assert(reference);
  const record=await lectureManifest.createLectureManifestRecord({...base,slides:[{...slide,anatomyReference:reference}]});
  const parsed=await lectureManifest.parseAndVerifyLectureManifest(record.manifestJson,record.integrityHash);
  assert.deepEqual(parsed.slides[0].anatomyReference,reference);
  assert(anatomy.resolveLectureAnatomyReference(parsed.slides[0].anatomyReference));
  assert.equal(Object.hasOwn(parsed.slides[0].anatomyReference!,'atlasTarget'),false);
  const changed=record.manifestJson.replace(conceptId,'brainstem-pons');
  await assert.rejects(()=>lectureManifest.parseAndVerifyLectureManifest(changed,record.integrityHash));
 }
});
