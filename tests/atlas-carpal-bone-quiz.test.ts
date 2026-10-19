import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {carpalQuizHostProof} from './atlas-carpal-bone-quiz-proof.ts';
import {circleWillisMilestoneBytes,withoutCarpalQuizNotice} from './atlas-carpal-bone-quiz-history.ts';
import {carpalQuizMilestoneBytes,withoutThoracicQuizNotice} from './atlas-thoracic-bone-quiz-history.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const revision='49db4337ad84bee7d1823050f5b90ed43cf647c1';
const milestone=(p:string)=>carpalQuizMilestoneBytes(p);
const json=(p:string)=>JSON.parse(milestone(p).toString());
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const added=['content/carpal-bone-quiz-pins.json','content/carpal-bone-quiz.ts','lib/carpal-bone-quiz.ts'];

test('carpal questions reach contained learner and protected review with unchanged models/access',()=>{
 const review=json('atlas-review/manifest.json'),prior=JSON.parse(circleWillisMilestoneBytes('atlas-review/manifest.json').toString());
 assert.equal(review.revision,revision);assert.equal(review.files.length,957);assert.deepEqual(review.packages,prior.packages);
 assert.deepEqual(review.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),added);
 assert.deepEqual(review.files.filter((f:any)=>prior.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['LICENSES/THIRD_PARTY_NOTICES.md','app/body-content.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']);
 for(const f of review.files)assert.equal(sha(milestone('atlas-review/'+f.path)),f.importedSha256,f.path);
 const pins=json('atlas-review/content/carpal-bone-quiz-pins.json');assert.equal(pins.entries.length,16);
 for(const name of ['head-neck','shoulder','lower-limb','protected']){
  const folder=name==='protected'?'public/atlas-review-viewer/':'public/atlas-runtime/'+name+'/';
  const manifest=json(folder+'manifest.json'),old=JSON.parse(circleWillisMilestoneBytes(folder+'manifest.json').toString());
  assert.equal(manifest.sourceCommit,revision);assert.equal(manifest[name==='protected'?'personalRecordsIncluded':'patientDataIncluded'],false);
  for(const f of manifest.files)assert.equal(sha(milestone(folder+f.path)),f.sha256,f.path);
  if(name==='protected')assert.equal(manifest.websiteIntegrationSha256,review.websiteIntegrationSha256);
  else{
   for(const flag of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.deepEqual(manifest[flag],old[flag]);
   assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),old.files.filter((f:any)=>f.path.startsWith('models/')));
   assert.equal(json(folder+'source-inputs.json').length,({'head-neck':930,shoulder:616,'lower-limb':100} as Record<string,number>)[name]);
  }
  const noticePath=folder+(name==='protected'?'THIRD_PARTY_NOTICES.txt':'LICENSES/THIRD_PARTY_NOTICES.md');
  const previousNotice=circleWillisMilestoneBytes(noticePath).toString();
  const expectedNotice=name==='protected'?previousNotice.replace('Atlas source: '+prior.revision,'Atlas source: '+revision):previousNotice;
  assert.equal(withoutCarpalQuizNotice(milestone(noticePath).toString()),expectedNotice);
 }
 // Delivery checks supplement, not replace, the actual resolver/review proof.
 for(const folder of ['public/atlas-runtime/head-neck/','public/atlas-runtime/shoulder/','public/atlas-review-viewer/']){
  const m=json(folder+'manifest.json');const code=m.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>milestone(folder+f.path).toString()).join('\n').replace(/\\u([0-9a-fA-F]{4})/g,(_:string,h:string)=>String.fromCharCode(parseInt(h,16)));
  for(const entry of pins.entries){
   assert(code.includes(entry.identity.id));assert(code.includes(entry.identity.fmaId));
  }
  for(const text of ['Can an initially normal wrist X-ray rule out a suspected scaphoid fracture?','Carpal quick check','Hamate hook'])assert(code.includes(text),folder+text);
 }
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(circleWillisMilestoneBytes('lib/atlas-model-inventory.json').toString()).models);
});

test('16 source-bound draft quizzes preserve other topics/nested content and reject stale review before storage',async()=>{
 const proof=await carpalQuizHostProof();assert.equal(proof.selections,1104);assert.equal(proof.changedTopics,16);
 assert.equal(proof.unchangedTopics,9920);assert.equal(proof.reviewPackets,16);assert.equal(proof.rejectedPackets,656);
 assert.equal(proof.staleRejectedBeforeStorage,1120);assert.equal(proof.clinicalApproval,false);
 let nested=0;const {api,before}=proof;assert.deepEqual(api.nestedReviewRows,before.nestedReviewRows);
 for(const group of api.nestedReviewRows)for(const row of group.surfaces){
  const current=await api.nestedReviewMaterial(group.key,row.id),old=await before.nestedReviewMaterial(group.key,row.id);
  assert.deepEqual(current.source,old.source);assert.deepEqual(current.teaching,old.teaching);
  assert.equal(current.context.revisions.imaging,null);nested++;
 }
 assert.equal(nested,108);
});

test('carpal notice replay preserves earlier credits/suffixes and rejects altered/duplicate/foreign append',()=>{
 const current=milestone('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString(),old=circleWillisMilestoneBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString();
 assert.equal(withoutCarpalQuizNotice(current),old);assert.equal(withoutCarpalQuizNotice(old),old);
 const suffix='\nAdditional dependency notice\n',prefix='# Clinical Review third-party notices\n\nAtlas source: '+revision+'\n\n';
 assert.equal(withoutCarpalQuizNotice(prefix+current+suffix),prefix+old+suffix);
 assert.throws(()=>withoutCarpalQuizNotice('Foreign prefix\n'+current));
 assert.throws(()=>withoutCarpalQuizNotice(prefix.replace(revision,'0'.repeat(40))+current));
 assert.throws(()=>withoutCarpalQuizNotice(current.replace('Eight original questions','Altered original questions')));
 assert.throws(()=>withoutCarpalQuizNotice(current.replace('# Third-party notices','# Other-party notices')),'Equal-length alteration of earlier credits');
 assert.throws(()=>withoutCarpalQuizNotice(current+'\n## Carpal-bone structure checks — 2 October 2026\n'));
});

test('current carpal import and notice projection retain exact source pins, earlier credits and later suffixes',()=>{
 const feature='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
 const featureTree='1bd327fb20a52b35bec584675c457173c548e24b';
 const live=CURRENT_ATLAS_REVISION,sourceRoot=currentAtlasDeliveryRoot(),pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,live);
 assert.equal(execFileSync('git',['rev-parse',feature+'^{tree}'],{cwd:sourceRoot,encoding:'utf8'}).trim(),featureTree);
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));assert.equal(review.revision,live);
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 for(const path of added){
  const source=execFileSync('git',['--no-replace-objects','show',live+':'+path],{cwd:sourceRoot,maxBuffer:32e6});
  const historical=execFileSync('git',['--no-replace-objects','show',feature+':'+path],{cwd:sourceRoot,maxBuffer:32e6});
  assert.deepEqual(source,historical,path+': immutable carpal teaching held');
  const entry=review.files.find((f:any)=>f.path===path);assert(entry,path);
  assert.equal(entry.sourceSha256,sha(source));assert.equal(entry.importedSha256,sha(readFileSync('atlas-review/'+path)));
  assert.deepEqual(inputs.filter((f:any)=>f.path===path),[{path,sha256:sha(source)}]);
 }
 const sourceNotice=execFileSync('git',['--no-replace-objects','show',live+':LICENSES/THIRD_PARTY_NOTICES.md'],{cwd:sourceRoot,maxBuffer:32e6});
 const featureNotice=execFileSync('git',['--no-replace-objects','show',feature+':LICENSES/THIRD_PARTY_NOTICES.md'],{cwd:sourceRoot,maxBuffer:32e6});
 assert.notDeepEqual(sourceNotice,featureNotice,'Later rights notices remain visible in current source');
 assert.deepEqual(readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md'),sourceNotice);
 const notice=sourceNotice.toString().replaceAll('\r',''),projected=withoutCarpalQuizNotice(notice);
 const marker='\n## Carpal-bone structure checks — 2 October 2026\n',start=notice.indexOf(marker),end=notice.indexOf('\n## ',start+marker.length);
 assert(start>=0&&end>start);assert.equal(sha(Buffer.from(notice.slice(start,end))),'34786ade34eddd161388daabd2fc77ac5c55436c76697a78275172066dc312f5');
 // The thoracic projection removes its own immutable block first. The complete
 // carpal prefix and every later independent credit/suffix survive unchanged.
 const thoracicProjected=withoutThoracicQuizNotice(notice);
 assert.equal(projected,thoracicProjected.slice(0,start)+thoracicProjected.slice(start+(end-start)));
 const suffix='\nIndependent later dependency notice\n',prefix='# Clinical Review third-party notices\n\nAtlas source: '+live+'\n\n';
 assert.equal(withoutCarpalQuizNotice(prefix+notice+suffix),prefix+projected+suffix);
 assert.throws(()=>withoutCarpalQuizNotice(notice.replace('# Third-party notices','# Other-party notices')));
});


test('current carpal bindings refuse forged committed source, Review import and learner metadata',()=>{
 const sourceRoot=currentAtlasDeliveryRoot(),live=CURRENT_ATLAS_REVISION;
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 for(const path of added){
  const committed=execFileSync('git',['--no-replace-objects','show',live+':'+path],{cwd:sourceRoot,maxBuffer:32e6});
  const imported=readFileSync('atlas-review/'+path);
  const verify=(manifest:any,learnerInputs:any,bytes:Buffer=imported)=>{
   const entry=manifest.files.find((file:any)=>file.path===path);assert(entry);
   assert.equal(entry.sourceSha256,sha(committed),'committed source');
   assert.equal(entry.importedSha256,sha(bytes),'Review import');
   assert.deepEqual(learnerInputs.filter((file:any)=>file.path===path),[{path,sha256:sha(committed)}],'learner input');
  };
  verify(review,inputs);
  const forgedSource=structuredClone(review);forgedSource.files.find((file:any)=>file.path===path).sourceSha256='0'.repeat(64);
  assert.throws(()=>verify(forgedSource,inputs),/committed source/);
  const forgedImport=structuredClone(review);forgedImport.files.find((file:any)=>file.path===path).importedSha256='0'.repeat(64);
  assert.throws(()=>verify(forgedImport,inputs),/Review import/);
  const changed=Buffer.from(imported);changed[0]^=1;assert.throws(()=>verify(review,inputs,changed),/Review import/);
  const forgedInput=structuredClone(inputs);forgedInput.find((file:any)=>file.path===path).sha256='0'.repeat(64);
  assert.throws(()=>verify(review,forgedInput),/learner input/);
 }
});
