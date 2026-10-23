// Whole-file seam inverses, exhaustive public teaching and scope preservation.
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-midfoot-reasoning',atlas=stage+'/atlas',prep=json(stage+'/PREPARED.json');
const read=p=>fs.readFileSync(p,'utf8'),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const git=(...args)=>execFileSync('git',['-C',prep.parent,...args],{encoding:'utf8',windowsHide:true,maxBuffer:32e6,stdio:['pipe','pipe','pipe']}).trim();
assert.equal(git('rev-parse','HEAD'),prep.head);assert.equal(git('rev-parse','HEAD^{tree}'),prep.tree);assert.equal(git('status','--porcelain'),'');
for(const r of prep.files)assert.equal(hash(prep.parent+'/'+r.path),r.sha256,'Prepared baseline drift: '+r.path);
const old=read(prep.parent+'/scripts/validate-reasoning-practice.mjs'),current=read(atlas+'/scripts/validate-reasoning-practice.mjs');
const midfoot="const midfootKeys=['medial-cuneiform','intermediate-cuneiform','lateral-cuneiform','first-metatarsal','second-metatarsal','fourth-metatarsal'].map(k=>'midfoot-relationships-'+k);";
const edits=[
 ["same(api.reasoningConcepts.slice(200).map(c=>c.key),carpalKeys);\nsame(api.reasoningConcepts.length, 204);\nsame(bound.length, 368);", "same(api.reasoningConcepts.slice(200,204).map(c=>c.key),carpalKeys);\nsame(hash(JSON.stringify(api.reasoningConcepts.slice(0,204))), 'f9cf5c0b8792cba0c818cbfaa3ef4044b90e4fb63214699e5dbf9827e50f6376', 'All preceding204 definitions/order remain exact');\n"+midfoot+"\nsame(api.reasoningConcepts.slice(204).map(c=>c.key),midfootKeys);\nsame(api.reasoningConcepts.length, 210);\nsame(bound.length, 380);"],
 ["same(bound.filter((s) => s.region === 'foot').length, 24);","same(bound.filter((s) => s.region === 'foot').length, 36);"],
 ['same(new Set(api.reasoningConcepts.map((c) => c.key)).size, 204);','same(new Set(api.reasoningConcepts.map((c) => c.key)).size, 210);'],
 ['|| carpalKeys.includes(concept.key) ? undefined : concept.key,','|| carpalKeys.includes(concept.key) || midfootKeys.includes(concept.key) ? undefined : concept.key,'],
 ['!carpalKeys.includes(api.reasoningConceptFor(s)?.key));','!carpalKeys.includes(api.reasoningConceptFor(s)?.key) && !midfootKeys.includes(api.reasoningConceptFor(s)?.key));'],
 ['    const expected=Math.min(20,historicalExpected+added+abdominalAdded+brainAdded+spatialAdded+ventricularAdded+upperCervicalAdded+hipAdded+carpalAdded);',"    const midfootAdded=api.practiceQuestionCount(scope,'reason',scope.filter(s=>midfootKeys.includes(api.reasoningConceptFor(s)?.key)).map(s=>s.id));\n    same(midfootAdded,['whole-body','foot'].includes(region)?6:0,'Six midfoot questions retain their exact foot sources and same-side alternatives');\n    const expected=Math.min(20,historicalExpected+added+abdominalAdded+brainAdded+spatialAdded+ventricularAdded+upperCervicalAdded+hipAdded+carpalAdded+midfootAdded);"],
 ['    Math.min(\n      204,','    Math.min(\n      210,'],
];
let forward=old,inverse=current;
for(const [before,after]of edits){assert.equal(forward.split(before).length,2,before);forward=forward.replace(before,after);assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}
assert.equal(forward,current);assert.equal(inverse,old);
let dispatch=read(atlas+'/lib/reasoning-questions.ts');
for(const line of ["import { midfootRelationshipsReasoningConcepts, midfootRelationshipsReasoningSourceMatches } from './midfoot-relationships-reasoning';",'  ...midfootRelationshipsReasoningConcepts,']){assert.equal(dispatch.split(line+'\n').length,2);dispatch=dispatch.replace(line+'\n','');}
const guard=' || midfootRelationshipsReasoningSourceMatches(s, c.key)';assert.equal(dispatch.split(guard).length,2);dispatch=dispatch.replace(guard,'');assert.equal(dispatch,read(prep.parent+'/lib/reasoning-questions.ts'));
const pkg=json(atlas+'/package.json');assert.equal(pkg.scripts['midfoot-relationships-reasoning:test'],'node scripts/pin-midfoot-relationships-reasoning.mjs --check && node --test scripts/test-midfoot-relationships-reasoning.mjs');delete pkg.scripts['midfoot-relationships-reasoning:test'];assert.deepEqual(pkg,json(prep.parent+'/package.json'));
const notices=read(atlas+'/LICENSES/THIRD_PARTY_NOTICES.md'),priorNotices=read(prep.parent+'/LICENSES/THIRD_PARTY_NOTICES.md');assert(notices.startsWith(priorNotices));
let guide=read(atlas+'/docs/REASONING_PRACTICE.md');const start=guide.indexOf('## Midfoot relationships'),end=guide.indexOf('## Proximal carpal relationships',start);assert(start>=0&&end>start);guide=guide.replace(guide.slice(start,end),'');assert.equal(guide,read(prep.parent+'/docs/REASONING_PRACTICE.md'));
const migration={at:new Date().toISOString(),declaredValidatorSeams:edits.length,validatorBeforeSha256:hash(prep.parent+'/scripts/validate-reasoning-practice.mjs'),validatorAfterSha256:hash(atlas+'/scripts/validate-reasoning-practice.mjs'),wholeForwardAndInverse:true,dispatchImportSpreadAndBoneGuardOnly:true,packageScriptOnly:true,dependenciesUnchanged:true,priorProsePreserved:true};
write(stage+'/MIGRATION.json',migration);
const before=json(stage+'/baseline-snapshot.json'),after=json(stage+'/candidate-snapshot.json'),ids=new Set(json(atlas+'/content/midfoot-relationships-reasoning-pins.json').entries.map(e=>e.identity.id));
assert.equal(ids.size,12);assert.equal(before.rows.length,1104);assert.equal(after.rows.length,1104);assert.equal(before.concepts.length,204);assert.equal(after.concepts.length,210);assert.deepEqual(after.concepts.slice(0,204),before.concepts);assert.equal(after.catalog,before.catalog);
let changed=0,unchanged=0,sessions=0,placements=0;
for(const b of before.rows){const a=after.rows.find(r=>r.id===b.id);assert(a);for(const k of ['id','source','topics','topicCount','tours','checklist','approval','status'])assert.deepEqual(a[k],b[k],b.id+':'+k);placements+=a.topicCount;
 if(ids.has(b.id)){assert.equal(b.hasQuestion,false);assert.equal(a.hasQuestion,true);assert.notEqual(a.reasoning,b.reasoning);assert.notEqual(a.fingerprints.teaching,b.fingerprints.teaching);changed++;}
 else {for(const k of ['reasoning','fingerprints','session','hasQuestion','materialHash'])assert.deepEqual(a[k],b[k],b.id+':'+k);unchanged++;}
 if(b.hasQuestion){assert.equal(a.session,b.session);sessions++;}}
assert.equal(changed,12);assert.equal(unchanged,1092);assert.equal(sessions,368);assert.equal(placements,9936);
const oldPins=json(prep.parent+'/content/body-review-display-pins.json'),pins=json(atlas+'/content/body-review-display-pins.json');assert.equal(pins.pins.length,1104);assert.deepEqual(pins.pins.filter(p=>p.sha256!==oldPins.pins.find(b=>b.structureId===p.structureId)?.sha256).map(p=>p.structureId).sort(),[...ids].sort());
const protection={at:new Date().toISOString(),baselineSha256:hash(stage+'/baseline-snapshot.json'),candidateSha256:hash(stage+'/candidate-snapshot.json'),catalogueAndAll9936LessonsUnchanged:true,priorConceptsPreserved:204,priorSessionsPreserved:sessions,changedTeachingWorksheets:changed,unchangedTeachingWorksheets:unchanged,only12DisplayPinsChanged:true,sourceGeometryAndChecklistsUnchanged:true,privateDecisionsRead:false,clinicalApproval:false,previewChanged:false};write(stage+'/PRESERVATION.json',protection);console.log(JSON.stringify(protection));
