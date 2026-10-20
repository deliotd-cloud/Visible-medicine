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
const json=p=>JSON.parse(readFileSync(p));
const source='97e75c01f5b65f83a7edd607681cd6fdf50af7b6',tree='f17a39ff7f40d31aa5b0bd2176f923c95c1ea160';

test('previous complete review-form delivery remains byte exact and cannot admit CT source',()=>{
 const bytes=readFileSync('tests/fixtures/current-atlas-delivery-before-corpus-ct-98d7.json');
 assert.equal(sha(bytes),'4f51407c1c206789aa00705bc60d1e7c291f0dfac6f5d9a2226164fe07e3bf36');
 const prior=JSON.parse(bytes);assert.equal(prior.source,'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(prior.reviewIntegration,'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:prior}));
});

test('CT draft reaches actual learner imports and protected Review with unchanged source extent',async()=>{
 const delivery=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();assert.equal(delivery.source,source);assert.equal(delivery.sourceTree,tree);
 const git=p=>execFileSync('git',['show',source+':'+p],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const pins=JSON.parse(git('content/corpus-imaging-ct.pins.json')),transition=JSON.parse(git('content/corpus-imaging-ct.transition.json'));
 assert.equal(hash(pins),'cb70fd388c646a02074c0691dbf819ba2d3f28d08406ba0f0bcb99e0ad7a938d');
 assert.equal(hash(transition),'2e36de68a529538e2fd74343fbd245dff0b673f059364cfac46ddbe596f658b3');
 const identity=pins.entries[0].identity,id=identity.id;assert.equal(identity.fmaId,'FMA19617');assert.deepEqual(identity.sources.map(s=>s.file),['FJ3133']);
 const review=json('atlas-review/manifest.json'),base='public/atlas-runtime/head-neck/',learner=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');
 for(const p of ['content/corpus-imaging.ts','lib/corpus-imaging.ts','content/regional-teaching/pelvis.json']){
  const bytes=git(p),imported=readFileSync('atlas-review/'+p),row=review.files.find(r=>r.path===p);assert(row);
  assert.equal(row.sourceSha256,sha(bytes));assert.equal(row.importedSha256,sha(imported));assert.deepEqual(imported,bytes);
  assert.equal(inputs.find(r=>r.path===p)?.sha256,sha(bytes));
 }
 const built=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 const lesson=api.bodyLesson(identity,'ct');assert.deepEqual(lesson,transition.entries[0].current);assert.equal(lesson.readiness,'draft');
 const rows=json('atlas-review/content/regional-teaching/pelvis.json').entries.filter(row=>JSON.parse(row.identity).id===id);
 assert.equal(rows.length,1);assert.deepEqual(JSON.parse(rows[0].identity),identity);assert.deepEqual(rows[0].lessons.ct,lesson);
 const emitted=emittedTeaching(base,learner.files,true);
 for(const text of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])assert(emitted.includes(text)||emitted.includes(JSON.stringify(text).slice(1,-1)),'Missing reachable CT teaching or source credit');
 const packet=JSON.parse(JSON.stringify(await api.bodyReviewMaterial(id)));assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
 assert.deepEqual(packet.fingerprints,transition.reviewAfter);assert.deepEqual(packet.topics.find(t=>t.tab==='ct'),{tab:'ct',...lesson});assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
 const forged=structuredClone(packet);forged.topics.find(t=>t.tab==='ct').citations[0]='https://forged.invalid/';assert.equal(await api.parseBodyReviewResponse(forged,id),null);
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs'));
 const old=await exactSourceHistoryApi(pins.parentCommit,'review-security'),previous=JSON.parse(JSON.stringify(await old.bodyReviewMaterial(id)));
 assert.deepEqual(previous.fingerprints,transition.reviewBefore);assert.equal(await api.parseBodyReviewResponse(previous,id),null);assert.deepEqual(packet.source,previous.source);
 const context=await api.bodyReviewContext(id),priorContext=await old.bodyReviewContext(id);assert.equal(context.sourceHash,priorContext.sourceHash);assert.notEqual(context.teachingHash,priorContext.teachingHash);assert.equal(context.revisions.imaging,null);
 const storage={calls:0,prepare(){this.calls++;throw Error('Refused synthetic request reached storage');}};
 const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')};
 const request=(value,authenticated=true)=>new Request('https://review.test/api/body-review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json',...(authenticated?{'oai-authenticated-user-id':'synthetic-corpus-ct-delivery'}:{})},body:JSON.stringify(value)});
 for(const change of [{materialHash:priorContext.materialHash},{revisionHash:priorContext.revisions.teaching}])assert.equal((await api.postBodyDecision(request({...decision,...change}),storage)).status,409);
 assert.equal((await api.postBodyDecision(request(decision,false),storage)).status,401);assert.equal(storage.calls,0);
});
