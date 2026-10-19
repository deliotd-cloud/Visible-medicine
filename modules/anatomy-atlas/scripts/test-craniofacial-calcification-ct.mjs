import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
assert.equal(process.argv.length,2,'No alternate admission flags');
const baseline='46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd',sha=b=>createHash('sha256').update(b).digest('hex'),hash=value=>sha(Buffer.from(JSON.stringify(value)));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
const pinPath='content/craniofacial-calcification-ct-pins.json',transitionPath='content/craniofacial-calcification-ct.transition.json';
const pins=JSON.parse(readFileSync(pinPath)),record=JSON.parse(readFileSync(transitionPath));assert.equal(pins.sourceCommit,baseline);assert.equal(record.baseline,baseline);assert.equal(record.pinsSha256,sha(readFileSync(pinPath)));
const before=await exactSourceHistoryApi(baseline,'review-security'),working=git('rev-parse','HEAD')===baseline;
const entry="export {bodyLesson,bodyContent} from './app/body-content';export {bodyContentRecords} from './lib/content-export';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export {contentTabs} from './lib/content-types';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';";
const compiled=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const live=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
let introduction=null,feature=live;
if(!working){introduction=git('log','--diff-filter=A','--format=%H','--','lib/craniofacial-calcification-ct.ts').split(/\r?\n/).at(-1);assert.match(introduction,/^[a-f0-9]{40}$/);assert.equal(git('rev-parse',introduction+'^'),baseline);assert.equal(git('merge-base',introduction,'HEAD'),introduction);assert.equal(sha(Buffer.from(execFileSync('git',['show',introduction+':'+pinPath]))),sha(readFileSync(pinPath)),'Immutable source pins');assert.equal(sha(Buffer.from(execFileSync('git',['show',introduction+':'+transitionPath]))),sha(readFileSync(transitionPath)),'Immutable transition');feature=await exactSourceHistoryApi(introduction,'review-security');}
const raw=JSON.parse(execFileSync('git',['show',baseline+':'+pins.catalogPath],{maxBuffer:32e6})),catalog=feature.bodyDisplayCatalog(raw),oldCatalog=before.bodyDisplayCatalog(raw);
assert.deepEqual(catalog,oldCatalog);assert.equal(catalog.structures.length,1104);assert.equal(sha(Buffer.from(execFileSync('git',['show',baseline+':'+pins.catalogPath],{maxBuffer:32e6}))),record.catalogSha256);
for(const key of ['structures','dissectionProfiles','regionalTours','contentTabs'])assert.deepEqual(feature[key],before[key],key+' unchanged');
assert.equal(hash({structures:before.structures,profiles:before.dissectionProfiles,tours:before.regionalTours}),record.previousRecipesAndToursSha256);
const targets=new Set(pins.entries.map(e=>e.identity.id)),changes=new Map(record.changes.map(row=>[row.id,row]));assert.equal(targets.size,4);assert.equal(changes.size,4);
const oldAll=[],newAll=[];let changed=0,preserved=0;
for(const structure of catalog.structures)for(const tab of feature.contentTabs){const previous=before.bodyLesson(structure,tab),current=feature.bodyLesson(structure,tab);oldAll.push({id:structure.id,tab,lesson:previous});newAll.push({id:structure.id,tab,lesson:current});if(targets.has(structure.id)&&tab==='ct'){const expected=changes.get(structure.id);assert.deepEqual(previous,expected.previous);assert.deepEqual(current,expected.current);assert.equal(previous.readiness,'pending');assert.equal(current.readiness,'draft');changed++;}else{assert.deepEqual(current,previous,structure.id+':'+tab);preserved++;}}
assert.deepEqual([changed,preserved],[4,9932]);assert.equal(hash(oldAll),record.previousCorpusSha256);assert.equal(hash(newAll),record.currentCorpusSha256);
// The saved raw-base export lagged two already-authored baseline US notes.
// Reconcile those exact fields rather than calling them new feature teaching.
const savedBefore=JSON.parse(execFileSync('git',['show',baseline+':content/exports/body.v2.json'],{maxBuffer:64e6}));
const runtimeBefore=JSON.parse(JSON.stringify(before.bodyContentRecords(raw))),runtimeAfter=JSON.parse(JSON.stringify(feature.bodyContentRecords(raw)));
const savedAfter=JSON.parse(working?readFileSync('content/exports/body.v2.json'):execFileSync('git',['show',introduction+':content/exports/body.v2.json'],{maxBuffer:64e6}));
assert.deepEqual(savedAfter,runtimeAfter,'Complete saved raw-base export matches exact feature runtime');assert.equal(savedBefore.length,1022);assert.equal(runtimeBefore.length,1022);
const catchups=new Set(['vm:anatomy:body:foot:left:vessel:left-superficial-medial-plantar-artery','vm:anatomy:body:foot:right:vessel:right-superficial-medial-plantar-artery']);let reconciled=0;
for(let index=0;index<savedBefore.length;index++){const old=savedBefore[index],expected=runtimeBefore[index];assert.equal(old.id,expected.id);if(catchups.has(old.id)){const refresh=structuredClone(old);refresh.content.ultrasound=expected.content.ultrasound;assert.deepEqual(refresh,expected);assert.equal(old.content.ultrasound.readiness,'pending');assert.equal(expected.content.ultrasound.readiness,'draft');reconciled++;}else assert.deepEqual(old,expected,'No undeclared baseline export mismatch');}
assert.equal(reconciled,2);
const oldPins=JSON.parse(execFileSync('git',['show',baseline+':content/body-review-display-pins.json'],{maxBuffer:16e6})),newPins=JSON.parse(working?readFileSync('content/body-review-display-pins.json'):execFileSync('git',['show',introduction+':content/body-review-display-pins.json'],{maxBuffer:16e6}));
assert.equal(newPins.pins.length,oldPins.pins.length);let changedDisplayPins=0;
for(const old of oldPins.pins){const current=newPins.pins.find(p=>p.structureId===old.structureId);assert(current);if(targets.has(old.structureId)){assert.notEqual(current.sha256,old.sha256);changedDisplayPins++;}else assert.deepEqual(current,old,'Unrelated Review display pin');}assert.equal(changedDisplayPins,4);
let rejectedPackets=0,staleDecisions=0,storageCalls=0;
for(const id of targets){const old=await before.bodyReviewMaterial(id),packet=await feature.bodyReviewMaterial(id);assert.deepEqual(await feature.parseBodyReviewResponse(packet,id),packet);assert.equal(await feature.parseBodyReviewResponse(old,id),null);assert.deepEqual(packet.topics.find(t=>t.tab==='ct'),{tab:'ct',...changes.get(id).current});
 for(const mutate of [p=>p.topics.find(t=>t.tab==='ct').body+=' foreign',p=>p.topics.find(t=>t.tab==='ct').citations=['https://invalid.test/'],p=>p.source.structure.sources[0].sha256='0'.repeat(64),p=>p.topics.find(t=>t.tab==='ct').readiness='approved']){const altered=structuredClone(packet);mutate(altered);assert.equal(await feature.parseBodyReviewResponse(altered,id),null);rejectedPackets++;}
 const previous=await before.bodyReviewContext(id),current=await feature.bodyReviewContext(id);assert.equal(current.sourceHash,previous.sourceHash);assert.notEqual(current.revisions.teaching,previous.revisions.teaching);
 const request={catalogScope:current.catalogScope,structureId:id,track:'teaching',expectedVersion:0,materialHash:previous.materialHash,revisionHash:previous.revisions.teaching,checklistVersion:current.checklistVersion,draft:feature.blankBodyReview(current,'teaching')};
 const response=await feature.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CRANIOFACIAL_CT'},body:JSON.stringify(request)}),{prepare(){storageCalls++;throw Error('Stale request reached storage');}});assert.equal(response.status,409);staleDecisions++;
}
assert.equal(storageCalls,0);console.log(JSON.stringify({baseline,introduction,working,changedPlacements:changed,preservedPlacements:preserved,changedDisplayPins,rejectedPackets,staleDecisionRefusalsBeforeStorage:staleDecisions,storageCalls,geometryChanged:false,clinicalApproval:false,websiteImported:false}));
