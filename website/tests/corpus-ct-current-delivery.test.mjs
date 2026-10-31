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
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const reviewDigest=v=>sha(canonical(JSON.parse(JSON.stringify(v))));
const json=p=>JSON.parse(readFileSync(p));
const source='97e75c01f5b65f83a7edd607681cd6fdf50af7b6',tree='f17a39ff7f40d31aa5b0bd2176f923c95c1ea160';
const pelvisPath='content/regional-teaching/pelvis.json';
const historicalPelvis={oid:'63cf2581c39b2dc6e8791bb18ed7142a889d9158',size:453011,sha256:'176079df8d51596766de8855647c7c0c0972f959a314e6e7033df57e8538cbf7'};
const successorPelvis={oid:'c11e7cfd8dd81f40f3432a56f21c7b88286f868f',size:455820,sha256:'daba0809536af23a26b94eab271412a2638b03a1c8e4765c2e5315670f4940f6'};
const git=(atlas,...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:600_000,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
function sourceBytes(atlas,commit,path,pin){
 const oid=git(atlas,'rev-parse',commit+':'+path).toString().trim();
 if(pin)assert.equal(oid,pin.oid,'Exact Git object: '+path);
 const size=Number(git(atlas,'cat-file','-s',oid).toString().trim());
 assert(Number.isSafeInteger(size)&&size>=0&&size<600_000,'Bounded historical blob: '+path);
 if(pin)assert.equal(size,pin.size,'Exact Git blob size: '+path);
 const bytes=git(atlas,'cat-file','blob',oid);
 assert.equal(bytes.length,size,'Complete Git blob: '+path);
 assert.equal(createHash('sha1').update(Buffer.from('blob '+size+'\0')).update(bytes).digest('hex'),oid,'Git object identity: '+path);
 if(pin)assert.equal(sha(bytes),pin.sha256,'Exact source bytes: '+path);
 return bytes;
}
const corpusRow=(document,id)=>document.entries.find(row=>JSON.parse(row.identity).id===id);

test('original CT admission test remains byte exact; current delivery is independently bound',()=>{
 const bytes=readFileSync('tests/fixtures/corpus-ct-delivery-original-97e75.mjs.raw');
 assert.equal(sha(bytes),'288450978d8c168a5e78ab85ebf05957eeafd5d0935c8b6160cf70c7506b4b00');
 assert(bytes.toString().includes('assert.equal(delivery.source,source);assert.equal(delivery.sourceTree,tree);'));
 const atlas=currentAtlasDeliveryRoot(),delivery=validateCurrentAtlasDelivery();
 assert.equal(git(atlas,'rev-parse',source+'^{tree}').toString().trim(),tree);
 git(atlas,'merge-base','--is-ancestor',source,delivery.source);
 // The immutable CT admission epoch is not the queue optimization's delivery
 // epoch. Compare the actual CT semantics below; do not accept arbitrary files
 // merely because the current manifest was regenerated.
 for(const p of ['content/corpus-imaging-ct.pins.json','content/corpus-imaging-ct.transition.json','content/corpus-imaging.ts','lib/corpus-imaging.ts']){
  const original=sourceBytes(atlas,source,p);
  assert.deepEqual(sourceBytes(atlas,delivery.source,p),original,'CT source changed since original admission: '+p);
 }
 const original=JSON.parse(sourceBytes(atlas,source,pelvisPath,historicalPelvis));
 const current=JSON.parse(sourceBytes(atlas,delivery.source,pelvisPath,successorPelvis));
 assert.equal(original.entries.length,40);assert.equal(current.entries.length,40);
 assert.deepEqual(current.entries.map(row=>row.identity),original.entries.map(row=>row.identity),'Regional teaching membership and order');
 const pins=JSON.parse(sourceBytes(atlas,source,'content/corpus-imaging-ct.pins.json'));
 const id=pins.entries[0].identity.id;
 assert.deepEqual(corpusRow(original,id)?.lessons.ct,corpusRow(current,id)?.lessons.ct,'Original CT lesson survives the authenticated successor');
});

test('previous complete review-form delivery remains byte exact and cannot admit CT source',()=>{
 const bytes=readFileSync('tests/fixtures/current-atlas-delivery-before-corpus-ct-98d7.json');
 assert.equal(sha(bytes),'4f51407c1c206789aa00705bc60d1e7c291f0dfac6f5d9a2226164fe07e3bf36');
 const prior=JSON.parse(bytes);assert.equal(prior.source,'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(prior.reviewIntegration,'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:prior}));
});

test('CT draft reaches actual learner imports and protected Review with unchanged source extent',async()=>{
 const delivery=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();
 assert.equal(json('atlas-review/manifest.json').revision,delivery.source);
 const original=p=>sourceBytes(atlas,source,p);
 const current=p=>sourceBytes(atlas,delivery.source,p,p===pelvisPath?successorPelvis:undefined);
 const pins=JSON.parse(original('content/corpus-imaging-ct.pins.json')),transition=JSON.parse(original('content/corpus-imaging-ct.transition.json'));
 assert.equal(hash(pins),'cb70fd388c646a02074c0691dbf819ba2d3f28d08406ba0f0bcb99e0ad7a938d');
 assert.equal(hash(transition),'2e36de68a529538e2fd74343fbd245dff0b673f059364cfac46ddbe596f658b3');
 const identity=pins.entries[0].identity,id=identity.id;assert.equal(identity.fmaId,'FMA19617');assert.deepEqual(identity.sources.map(s=>s.file),['FJ3133']);
 const review=json('atlas-review/manifest.json'),base='public/atlas-runtime/head-neck/',learner=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');
 for(const p of ['content/corpus-imaging.ts','lib/corpus-imaging.ts',pelvisPath]){
  const bytes=current(p),imported=readFileSync('atlas-review/'+p),row=review.files.find(r=>r.path===p);assert(row);
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
 assert.deepEqual(corpusRow(JSON.parse(original(pelvisPath)),id)?.lessons.ct,lesson,'Original CT lesson remains byte exact');
 const rows=json('atlas-review/content/regional-teaching/pelvis.json').entries.filter(row=>JSON.parse(row.identity).id===id);
 assert.equal(rows.length,1);assert.deepEqual(JSON.parse(rows[0].identity),identity);assert.deepEqual(rows[0].lessons.ct,lesson);
 const emitted=emittedTeaching(base,learner.files,true);
 for(const text of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])assert(emitted.includes(text)||emitted.includes(JSON.stringify(text).slice(1,-1)),'Missing reachable CT teaching or source credit');
 const packet=JSON.parse(JSON.stringify(await api.bodyReviewMaterial(id)));assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
 // The CT admission hash is historical: later authenticated teaching edits change
 // the whole-structure teaching fingerprint, while CT and source scope stay fixed.
 assert.equal(packet.fingerprints.source,transition.reviewAfter.source);
 assert.equal(packet.fingerprints.checklist,transition.reviewAfter.checklist);
 assert.notEqual(packet.fingerprints.teaching,transition.reviewAfter.teaching);
 const scope={schema:packet.schema,kind:packet.kind,structureId:packet.structureId};
 assert.deepEqual(scope,{schema:'vm-body-review-worksheet-3',kind:'body-display-catalog',structureId:id});
 assert.equal(packet.fingerprints.teaching,reviewDigest({scope:{...scope,schema:'vm-body-review-worksheet-2'},topics:packet.topics,reasoning:packet.reasoning,...(packet.guidedTours.length?{guidedTours:packet.guidedTours}:{})}));
 assert.equal(packet.materialHash,reviewDigest({scope,fingerprints:packet.fingerprints}));
 assert.deepEqual(packet.topics.find(t=>t.tab==='ct'),{tab:'ct',...lesson});assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
 const forged=structuredClone(packet);forged.topics.find(t=>t.tab==='ct').citations[0]='https://forged.invalid/';assert.equal(await api.parseBodyReviewResponse(forged,id),null);
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs'));
 const admissionSource=await exactSourceHistoryApi(source,'review-security');
 const admission=JSON.parse(JSON.stringify(await admissionSource.bodyReviewMaterial(id)));
 assert.deepEqual(admission.fingerprints,transition.reviewAfter,'Original CT admission Review packet remains exact');
 assert.deepEqual(admission.topics.find(t=>t.tab==='ct'),{tab:'ct',...lesson});
 const currentSource=await exactSourceHistoryApi(delivery.source,'review-security');
 const sourced=JSON.parse(JSON.stringify(await currentSource.bodyReviewMaterial(id)));
 assert.deepEqual(packet.fingerprints,sourced.fingerprints,'Current Review fingerprints match exact Git source replay');
 assert.deepEqual(packet.topics,sourced.topics,'Current Review topics match exact Git source replay');
 const old=await exactSourceHistoryApi(pins.parentCommit,'review-security'),previous=JSON.parse(JSON.stringify(await old.bodyReviewMaterial(id)));
 assert.deepEqual(previous.fingerprints,transition.reviewBefore);assert.equal(await api.parseBodyReviewResponse(previous,id),null);assert.deepEqual(packet.source,previous.source);
 const context=await api.bodyReviewContext(id),priorContext=await old.bodyReviewContext(id);assert.equal(context.sourceHash,priorContext.sourceHash);assert.notEqual(context.teachingHash,priorContext.teachingHash);assert.equal(context.revisions.imaging,null);
 const storage={calls:0,prepare(){this.calls++;throw Error('Refused synthetic request reached storage');}};
 const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')};
 const request=(value,authenticated=true)=>new Request('https://review.test/api/body-review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json',...(authenticated?{'oai-authenticated-user-id':'synthetic-corpus-ct-delivery'}:{})},body:JSON.stringify(value)});
 for(const change of [{materialHash:priorContext.materialHash},{revisionHash:priorContext.revisions.teaching}])assert.equal((await api.postBodyDecision(request({...decision,...change}),storage)).status,409);
 assert.equal((await api.postBodyDecision(request(decision,false),storage)).status,401);assert.equal(storage.calls,0);
});
