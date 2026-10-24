import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-upper-vascular-reasoning',prep=json(stage+'/PREPARED.json'),root=prep.atlas;
const parentReceipt='F:/VisibleMedicine/staging/20261024-tour-explore-focus/SOURCE_BOUND.json';
assert.equal(hash(parentReceipt),'135d808650bd4646cbcd0216fc4d028f8daca35a9502f2258d26fc982016fc04');
const sealed=json(parentReceipt);assert.equal(sealed.atlasHead,prep.head);
for(const r of prep.files)assert.equal(sealed.sourceRows.find(row=>row.path===r.path)?.sha256,r.sha256,r.path);
const parentSnapshot='F:/VisibleMedicine/staging/20261024-tour-explore-focus/candidate-snapshot-v2.json';
assert.equal(hash(parentSnapshot),sealed.evidence.find(r=>r.path==='candidate-snapshot-v2.json').sha256);
fs.copyFileSync(parentSnapshot,stage+'/baseline-snapshot.json',fs.constants.COPYFILE_EXCL);
const a=json(stage+'/baseline-snapshot.json'),b=json(stage+'/candidate-snapshot.json');
const targets=new Set(json(root+'/content/upper-vascular-reasoning-pins.json').entries.map(e=>e.identity.id));
assert.equal(a.rows.length,1104);assert.equal(b.rows.length,1104);assert.equal(a.catalog,b.catalog);
assert.equal(a.concepts.length,222);assert.equal(b.concepts.length,232);assert.deepEqual(b.concepts.slice(0,222),a.concepts);
let changed=0,oldSessions=0;
for(const old of a.rows){
 const now=b.rows.find(r=>r.id===old.id);assert(now);
 for(const key of ['source','topics','topicCount','tours','checklist','approval','status'])assert.deepEqual(now[key],old[key],old.id+':'+key);
 assert.equal(now.approval,false);
 if(targets.has(old.id)){assert.notEqual(now.reasoning,old.reasoning);assert.notEqual(now.fingerprints.teaching,old.fingerprints.teaching);assert.equal(old.hasQuestion,false);assert.equal(now.hasQuestion,true);changed++;}
 else{assert.deepEqual(now,old,old.id);if(old.hasQuestion)oldSessions++;}
}
assert.equal(changed,20);assert.equal(oldSessions,404);assert.equal(b.rows.reduce((n,r)=>n+r.topicCount,0),9936);
const oldPins=json(prep.parent+'/content/body-review-display-pins.json'),newPins=json(root+'/content/body-review-display-pins.json');
const pinChanges=newPins.pins.filter(r=>oldPins.pins.find(o=>o.structureId===r.structureId)?.sha256!==r.sha256).map(r=>r.structureId);
assert.deepEqual(new Set(pinChanges),targets);
for(const p of ['content/review-revisions.json','package-lock.json'])assert.equal(hash(root+'/'+p),hash(prep.parent+'/'+p));
const normalized=p=>fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
const inverse=normalized(root+'/lib/reasoning-questions.ts')
 .replace("import { upperVascularReasoningConcepts, upperVascularReasoningSourceMatches } from './upper-vascular-reasoning';\n",'')
 .replace('  ...upperVascularReasoningConcepts,\n','').replace(' || upperVascularReasoningSourceMatches(s, c.key)','');
assert.equal(inverse,normalized(prep.parent+'/lib/reasoning-questions.ts'),'Whole dispatcher inverse');
assert.equal(normalized(root+'/package.json').replace('    "upper-vascular-reasoning:test": "node scripts/pin-upper-vascular-reasoning.mjs --check && node --test scripts/test-upper-vascular-reasoning.mjs",\n',''),normalized(prep.parent+'/package.json'),'Whole package inverse');
let validator=normalized(root+'/scripts/validate-reasoning-practice.mjs');
validator=validator.split('\n').filter(line=>!line.includes('const upperVascularKeys=')&&!line.includes('All preceding222 definitions/order remain exact')&&!line.includes('same(api.reasoningConcepts.slice(222)')&&!line.includes('const upperVessel =')&&!line.includes('const upperVascularAdded=')&&!line.includes('same(upperVascularAdded,')).join('\n')
 .replace('slice(216,222)','slice(216)').replace('same(api.reasoningConcepts.length, 232);','same(api.reasoningConcepts.length, 222);').replace('same(bound.length, 424);','same(bound.length, 404);')
 .replace("s.region === 'shoulder-arm').length, 54)","s.region === 'shoulder-arm').length, 46)")
 .replace("s.region === 'forearm').length, 46)","s.region === 'forearm').length, 34)")
 .replace(').size, 232);',').size, 222);').replaceAll(' && !upperVessel','').replace(' || upperVessel','')
 .replace(' && !upperVascularKeys.includes(api.reasoningConceptFor(s)?.key)','').replace('+upperVascularAdded','');
assert.equal(validator,normalized(prep.parent+'/scripts/validate-reasoning-practice.mjs'),'Whole original validator inverse, including every historical golden and negative');
const report={at:new Date().toISOString(),parentReceipt,parentReceiptSha256:hash(parentReceipt),parentSnapshotReusedByExactCompleteSourceIdentity:true,all1104SourceTopicTourChecklistPayloadsPreserved:true,all9936LessonsPreserved:true,unchangedTeachingWorksheets:1084,changedTeachingWorksheets:20,previous222DefinitionsAndOrderPreserved:true,previousDefinitionsSha256:createHash('sha256').update(JSON.stringify(a.concepts)).digest('hex'),priorSessionsPreserved:404,newSourceSelections:20,changedDisplayPins:pinChanges,allNineShoulderRevisionsUnchanged:true,dependenciesAndLockfileUnchanged:true,dispatcherPackageAndOriginalValidatorWholeInverseVerified:true,baselineSha256:hash(stage+'/baseline-snapshot.json'),candidateSha256:hash(stage+'/candidate-snapshot.json'),privateDecisionsReadOrMigrated:false,clinicalApproval:false,websiteIntegrationPending:true,previewChanged:false};
fs.writeFileSync(stage+'/PRESERVATION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({changedTeachingWorksheets:20,unchangedTeachingWorksheets:1084,priorSessionsPreserved:404,newSourceSelections:20,wholeOriginalInverse:true}));
