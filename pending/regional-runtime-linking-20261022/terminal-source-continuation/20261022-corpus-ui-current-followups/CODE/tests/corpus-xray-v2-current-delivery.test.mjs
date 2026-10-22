import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),hash=v=>sha(JSON.stringify(v));
const json=p=>JSON.parse(readFileSync(p)),wire=v=>JSON.parse(JSON.stringify(v));
const visible=(code,v)=>code.includes(v)||code.includes(JSON.stringify(v).slice(1,-1));
test('corpus Xray v2 reaches the exact learner and protected Review; old/forged teaching cannot be saved',{timeout:180000},async()=>{
 const delivery=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();assert.equal(delivery.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 const git=path=>execFileSync('git',['show',delivery.source+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const git190=path=>execFileSync('git',['show','190a63238eadcf906abe89dcbb6a67c88afe70b9:'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 for(const path of ['content/corpus-spongiosum-xray-v2.pins.json','content/corpus-spongiosum-xray-v2.transition.json','content/corpus-spongiosum-xray-v2.ts','lib/corpus-spongiosum-xray-v2.ts','content/regional-teaching/pelvis.json'])
  assert.deepEqual(git(path),git190(path),path+': exact corpus source survives from historical 190 to bound current Git');
 const pins=JSON.parse(git('content/corpus-spongiosum-xray-v2.pins.json')),transition=JSON.parse(git('content/corpus-spongiosum-xray-v2.transition.json'));assert.equal(hash(pins),'aae71b14d295558ed8b584a97969729677d37a718b5b497c47aca2846b8d26a2');assert.equal(hash(transition),'9f1bccc097f147be0908f9fee4675564607be2f7b4839c3bf077aaeb5e47eff4');
 const identity=pins.entries[0].identity,id=identity.id;assert.equal(identity.fmaId,'FMA19617');assert.equal(identity.sources[0].file,'FJ3133');
 const base='public/atlas-runtime/head-neck/',learner=json(base+'manifest.json'),inputs=json(base+'source-inputs.json'),review=json('atlas-review/manifest.json');
 for(const path of ['content/corpus-spongiosum-xray-v2.ts','lib/corpus-spongiosum-xray-v2.ts','content/regional-teaching/pelvis.json']){const bytes=git(path),imported=readFileSync('atlas-review/'+path),row=review.files.find(r=>r.path===path);assert(row);assert.equal(row.sourceSha256,sha(bytes));assert.equal(row.importedSha256,sha(imported));assert.deepEqual(bytes,imported);assert.equal(inputs.find(r=>r.path===path)?.sha256,sha(bytes));}
 const built=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {corpusSpongiosumXrayLesson} from './atlas-review/lib/corpus-spongiosum-xray-v2';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));assert.deepEqual(catalog.structures.filter(s=>s.id===id),[identity]);
 const lesson=api.bodyLesson(identity,'xray');assert.deepEqual(lesson,transition.entries[0].current);assert.deepEqual(lesson,api.corpusSpongiosumXrayLesson(identity,'xray'));assert.equal(lesson.readiness,'draft');assert(lesson.note.includes('no glans'));assert(lesson.note.includes('paid-lecture access remain independent'));
 const rows=json('atlas-review/content/regional-teaching/pelvis.json').entries.filter(row=>JSON.parse(row.identity).id===id);assert.equal(rows.length,1);assert.deepEqual(JSON.parse(rows[0].identity),identity);assert.deepEqual(rows[0].lessons.xray,lesson);
 const emitted=emittedTeaching(base,learner.files,true);for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])assert(visible(emitted,value),'Missing reachable corpus teaching or reuse credit');
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const {boundLiveAtlasHistory}=await import('./atlas-bound-live-history.mjs');
 const authoredRevision='bd5465ee3b94c66c3d5701e7749099d07e8f40d3';
 const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(delivery.source);
 const gitAuthored=path=>execFileSync('git',['show',authoredRevision+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const earlierPelvis=JSON.parse(gitAuthored('content/regional-teaching/pelvis.json'));
 const currentPelvis=JSON.parse(git('content/regional-teaching/pelvis.json'));
 const rowIn=table=>{const matches=table.entries.filter(row=>JSON.parse(row.identity).id===id);assert.equal(matches.length,1);return matches[0];};
 const authoredRow=rowIn(earlierPelvis),boundRow=rowIn(currentPelvis);assert.equal(authoredRow.identity,boundRow.identity);
 for(const tab of Object.keys(boundRow.lessons).filter(tab=>tab!=='ct'))assert.deepEqual(boundRow.lessons[tab],authoredRow.lessons[tab],tab+': unchanged corpus lesson across bd and current');
 assert.equal(authoredRow.lessons.ct.readiness,'pending');assert.equal(boundRow.lessons.ct.readiness,'draft');
 assert.deepEqual(authored.bodyLesson(identity,'ct'),authoredRow.lessons.ct);assert.deepEqual(bound.bodyLesson(identity,'ct'),boundRow.lessons.ct);assert.deepEqual(api.bodyLesson(identity,'ct'),boundRow.lessons.ct);
 const authoredPacket=wire(await authored.bodyReviewMaterial(id)),boundPacket=wire(await bound.bodyReviewMaterial(id));
 assert.equal(authoredPacket.approval,false);assert.equal(authoredPacket.status,'worksheet-not-submitted');assert.deepEqual(authoredPacket.fingerprints,transition.reviewAfter,'Complete authored bd packet retains its exact historical transition fingerprint');
 assert.deepEqual(authoredPacket.topics.find(t=>t.tab==='xray'),{tab:'xray',...lesson});
 const packet=wire(await api.bodyReviewMaterial(id));assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');assert.deepEqual(packet,boundPacket,'Whole current Review packet equals independent Git-backed current replay');
 assert.equal(packet.fingerprints.source,authoredPacket.fingerprints.source);assert.equal(packet.fingerprints.checklist,authoredPacket.fingerprints.checklist);assert.notEqual(packet.fingerprints.teaching,authoredPacket.fingerprints.teaching);
 assert.deepEqual(packet.topics.find(t=>t.tab==='xray'),{tab:'xray',...lesson});assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);assert.equal(await api.parseBodyReviewResponse(authoredPacket,id),null,'Prior authored packet cannot be accepted as current');
 const old=await exactSourceHistoryApi(pins.parentCommit,'review-security');
 const prior=wire(await old.bodyReviewMaterial(id));assert.deepEqual(prior.fingerprints,transition.reviewBefore);assert.equal(await api.parseBodyReviewResponse(prior,id),null);assert.deepEqual(packet.source,prior.source);
 const altered=wire(packet);altered.topics.find(t=>t.tab==='xray').citations[0]='https://forged.invalid/';assert.equal(await api.parseBodyReviewResponse(altered,id),null);
 const context=await api.bodyReviewContext(id),oldContext=await old.bodyReviewContext(id),authoredContext=await authored.bodyReviewContext(id);assert.equal(context.sourceHash,oldContext.sourceHash);assert.equal(context.sourceHash,authoredContext.sourceHash);assert.notEqual(context.teachingHash,oldContext.teachingHash);assert.notEqual(context.teachingHash,authoredContext.teachingHash);assert.equal(context.revisions.imaging,null);
 const storage={calls:0,prepare(){this.calls++;throw Error('Refused corpus submission reached synthetic storage');}};
 const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')};
 const save=value=>api.postBodyDecision(new Request('https://review.test/api/body-decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CORPUS_REVIEWER'},body:JSON.stringify(value)}),storage);
 for(const fields of [{materialHash:oldContext.materialHash},{revisionHash:oldContext.revisions.teaching},{materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching},{materialHash:authoredContext.materialHash},{revisionHash:authoredContext.revisions.teaching},{materialHash:authoredContext.materialHash,revisionHash:authoredContext.revisions.teaching}])assert.equal((await save({...decision,...fields})).status,409);
 const forged=wire(decision);forged.draft.checks.foreign=true;assert.equal((await save(forged)).status,422);assert.equal(storage.calls,0);
 const bad=structuredClone(identity);bad.sources[0].sha256='0'.repeat(64);assert.equal(api.corpusSpongiosumXrayLesson(bad,'xray'),undefined);
 for(const tab of ['anatomy','function','ct','mri','ultrasound','pathology','clinical','quiz'])assert.equal(api.corpusSpongiosumXrayLesson(identity,tab),undefined);
});

test('whole bd corpus contract remains an exact archived source and refuses current admission',()=>{
 const bytes=readFileSync(new URL('./fixtures/tour-discovery-corpus-bd5465ee.mjs.raw',import.meta.url));assert.equal(sha(bytes),'90d7a670937e05a5a607c813e3a712e62b19a9d0ea608f64841f6d167e2858ef');
 const old=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.json',import.meta.url)));
 assert.equal(old.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 const previous=readFileSync(new URL('./fixtures/corpus-xray-v2-current-delivery-before-epoch-20261021.mjs.raw',import.meta.url));assert.equal(sha(previous),'a31204d0bd516fdfc47b3f03ffd97a5996345f0bce5272da8c175e34c3cf3905');
 const current=previous.toString();
 const appendix="\ntest('whole bd corpus contract remains an exact archived source and refuses current admission'";
 const cut=current.indexOf(appendix);assert(cut>0&&current.lastIndexOf(appendix)===cut);
 const body=current.slice(0,cut).replace("assert.equal(delivery.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');","assert.equal(delivery.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');");
 assert.equal(body,bytes.toString(),'Every original learner, Review, refusal and source assertion survives the one current-source seam');
});
