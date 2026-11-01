import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as clinical from '../lib/head-hippocampal-clinical.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as availability from '../lib/head-link-availability.ts';
import * as lesson from '../atlas-review/content/hippocampal-teaching.ts';
import {blankHeadTeachingDraft,headTeachingDraftContext,headTeachingDraftStale,parseSavedHeadTeachingDraft} from '../lib/head-teaching-review-contract.ts';

const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const oldRevision='1205ab6db13804b874cb89ad680b0819a6ab4d90985f3f622f746daea5549057';
const source=readFileSync('lib/head-hippocampal-clinical.ts','utf8');
function isolated({teaching=lesson,lookup=links.headConceptById}={}){
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const imports={
  '../atlas-review/content/hippocampal-teaching.ts':teaching,
  './head-atlas-links.ts':{...links,headConceptById:lookup},
  './head-link-availability.ts':availability,
 };
 const mod={exports:{}};new Function('require','module','exports',code)(name=>{
  assert(Object.hasOwn(imports,name),`unexpected import ${name}`);return imports[name];
 },mod,mod.exports);return mod.exports;
}

test('current complete lesson binds a new static packet revision without clinical approval',async()=>{
 const packet=clinical.hippocampalClinicalPacket();
 assert.equal(lesson.hippocampalConcepts.length,1);
 assert.equal(packet.sourceTeaching.concepts[0].imaging.ultrasound.readiness,'draft');
 assert.match(packet.sourceTeaching.concepts[0].modelLimit,/ultrasound orientation is draft/);
 assert.equal(sha(packet),clinical.HIPPOCAMPAL_CLINICAL_REVISION);
 assert.notEqual(clinical.HIPPOCAMPAL_CLINICAL_REVISION,oldRevision);
 assert.equal(await clinical.verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),clinical.HIPPOCAMPAL_CLINICAL_REVISION);
 assert.equal(await clinical.verifiedHippocampalClinicalRevision('stale'),null);
 for(const key of ['clinicalApproval','publicationApproval','patientRegistration'])assert.equal(packet.content[key],false);
 const historical=readFileSync('tests/fixtures/head-teaching-before-guided/source/atlas-review/content/hippocampal-teaching.ts.raw','utf8');
 assert.doesNotMatch(historical,/ultrasound: cerebralDetailUltrasound\.hippocampus/);
 assert.match(historical,/X-ray and ultrasound lessons remain pending/);
 const oldCode=ts.transpileModule(historical,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const oldModule={exports:{}};new Function('require','module','exports',oldCode)(name=>{throw Error('Unexpected historical dependency: '+name);},oldModule,oldModule.exports);
 const oldLesson=oldModule.exports;
 const restoredLesson=structuredClone(lesson.hippocampalConcepts);
 delete restoredLesson[0].imaging.ultrasound;
 restoredLesson[0].modelLimit=restoredLesson[0].modelLimit.replace('X-ray remains pending; ultrasound orientation is draft.','X-ray and ultrasound lessons remain pending.');
 assert.deepEqual(restoredLesson,oldLesson.hippocampalConcepts);
 assert.deepEqual(lesson.hippocampalTeachingReferences,oldLesson.hippocampalTeachingReferences);
 const priorPacket=isolated({teaching:oldLesson});
 assert.equal(sha(priorPacket.hippocampalClinicalPacket()),oldRevision,'exact historical lesson accounts for the entire revision change');
 assert.equal(await priorPacket.verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null);
});

test('current content, ultrasound payload, references and sided bindings remain fail closed',async()=>{
 const contentChanged=isolated();contentChanged.hippocampalClinicalContent.notes[0].text+=' changed';
 assert.equal(await contentChanged.verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null);
 const ultrasound=structuredClone({hippocampalConcepts:lesson.hippocampalConcepts,hippocampalTeachingReferences:lesson.hippocampalTeachingReferences});ultrasound.hippocampalConcepts[0].imaging.ultrasound.body+=' changed';
 assert.equal(await isolated({teaching:ultrasound}).verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null);
 const references=structuredClone({hippocampalConcepts:lesson.hippocampalConcepts,hippocampalTeachingReferences:lesson.hippocampalTeachingReferences});references.hippocampalTeachingReferences.hippocampalMRI.url='https://example.invalid/altered';
 assert.equal(await isolated({teaching:references}).verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null);
 const wrongBinding=isolated({lookup:id=>{const binding=links.headConceptById(id);return binding&&id==='limbic-left-hippocampus'?{...binding,ctHref:'/wrong-target'}:binding;}});
 assert.equal(await wrongBinding.verifiedHippocampalClinicalRevision(links.HEAD_LINK_REVISION),null);
});

test('a draft bound to the previous packet revision is stale under the current context',async()=>{
 const current=await headTeachingDraftContext(links.HEAD_LINK_REVISION,'hippocampal-clinical');
 assert.equal(current.packetRevision,clinical.HIPPOCAMPAL_CLINICAL_REVISION);
 const prior={...current,packetRevision:oldRevision};
 const saved={eventSchema:'vm-head-teaching-draft-event-1',context:prior,version:1,savedAt:'2026-10-11T12:00:00.000Z',draft:blankHeadTeachingDraft(prior)};
 assert.deepEqual(parseSavedHeadTeachingDraft(saved),saved,'valid historical draft, not a malformed fixture');
 assert.equal(headTeachingDraftStale(saved,prior),false);
 assert.equal(headTeachingDraftStale(saved,current),true);
 assert.equal(current.clinicalApproval,false);assert.equal(current.publicationApproval,false);
});
