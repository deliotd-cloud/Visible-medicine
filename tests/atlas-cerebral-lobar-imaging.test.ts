import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
import {verifyMetadataTextCheckout} from './atlas-metadata-text-checkout.mjs';

test('paired cerebral CT/MRI drafts reach learner and exact review worksheets without changing source anatomy',async()=>{
  const revision='88cea927d48729769b96ad8fe680b0872b7e6687';
  const websiteMilestone='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
  const liveSource=CURRENT_ATLAS_REVISION;
  const originalSource='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
  const base='c73aeae9b5f0b21091a97612d9ed54f3dd549c8e';
  const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
  const milestoneBytes=(p:string)=>execFileSync('git',['show',websiteMilestone+':'+p],{maxBuffer:32e6});
  const milestoneJson=(p:string)=>JSON.parse(milestoneBytes(p).toString());
  const prior=(p:string)=>JSON.parse(execFileSync('git',['show',base+':'+p],{encoding:'utf8'}));
  const sha=(s:Uint8Array|string)=>createHash('sha256').update(s).digest('hex');
  const atlas='F:/VisibleMedicine/atlas';
  const sourceAt=(commit:string,path:string)=>execFileSync('git',['-C',atlas,'show',commit+':'+path],{maxBuffer:32e6});
  const learner=milestoneJson('public/atlas-runtime/head-neck/manifest.json');
  const review=milestoneJson('atlas-review/manifest.json');
  assert.equal(learner.sourceCommit,revision);assert.equal(review.revision,'88cea927d48729769b96ad8fe680b0872b7e6687');
  const inputs=milestoneJson('public/atlas-runtime/head-neck/source-inputs.json');
  for(const path of ['content/cerebral-lobar-imaging.ts','content/nested-teaching.ts']){
    const source=review.files.find((f:any)=>f.path===path);assert(source);
    assert.equal(source.sourceSha256,inputs.find((f:any)=>f.path===path)?.sha256);
    assert.equal(source.importedSha256,sha(milestoneBytes('atlas-review/'+path)));
    assert.equal(source.sourceSha256,sha(sourceAt(revision,path)),`${path}: exact feature-epoch Atlas source`);
  }
  const liveReview=json('atlas-review/manifest.json');
  const liveLearner=json('public/atlas-runtime/head-neck/manifest.json');
  const liveInputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  assert.equal(liveReview.revision,liveSource);
  assert.equal(liveLearner.sourceCommit,liveSource);
  for(const path of ['content/cerebral-lobar-imaging.ts','content/nested-teaching.ts']){
    const entry=liveReview.files.find((f:any)=>f.path===path);assert(entry);
    const committed=sourceAt(liveSource,path);
    if(path==='content/cerebral-lobar-imaging.ts')assert.deepEqual(committed,sourceAt(originalSource,path),
      'Original cerebral CT/MRI draft source retained');
    assert.equal(entry.sourceSha256,sha(committed));
    assert.equal(entry.importedSha256,sha(readFileSync('atlas-review/'+path)));
    assert.equal(liveInputs.find((f:any)=>f.path===path)?.sha256,entry.sourceSha256);
  }
  // Validate every current Review import and every learner source input against
  // the committed Atlas graph. Later independent drafts legitimately change the
  // aggregate nested-teaching source, but cannot silently change this feature.
  const allPaths=[...new Set([...liveReview.files.map((f:any)=>f.path),...liveInputs.map((f:any)=>f.path)])];
  const request=allPaths.map(path=>`${liveSource}:${path}\n`).join('');
  const blobs=execFileSync('git',['-C',atlas,'cat-file','--batch'],{input:request,maxBuffer:256e6});
  const sourceHashes=new Map<string,string>();let offset=0;
  const licenseMetadataPath='LICENSES/bodyparts3d-license-evidence.html';
  const sourceObjects=new Map<string,Buffer>();
  for(const path of allPaths){
    const end=blobs.indexOf(10,offset);assert(end>=0,`${path}: Git object header`);
    const header=new TextDecoder().decode(blobs.subarray(offset,end));
    const match=/^[a-f0-9]{40} blob (\d+)$/.exec(header);assert(match,`${path}: committed Git blob`);
    const size=Number(match[1]);assert(Number.isSafeInteger(size)&&size>=0);
    const start=end+1;assert.equal(blobs[start+size],10,`${path}: Git blob boundary`);
    const bytes=blobs.subarray(start,start+size);
    sourceHashes.set(path,sha(bytes));
    sourceObjects.set(path,bytes);
    offset=start+size+1;
  }
  assert.equal(offset,blobs.length,'Complete committed source graph');
  assert.equal(sourceHashes.size,allPaths.length);
  for(const row of liveReview.files){
    assert.equal(row.sourceSha256,sourceHashes.get(row.path),`${row.path}: Review committed source`);
    assert.equal(row.importedSha256,sha(readFileSync('atlas-review/'+row.path)),`${row.path}: Review imported bytes`);
  }
  // Learner metadata fingerprints nine exact raw checkout representations.
  // The independent Review source/import loop above remains byte-exact to Git.
  const checkoutBytes=readFileSync(new URL('./fixtures/current-source-checkout-representations-craniofacial-ct.json',import.meta.url));
  assert.equal(sha(checkoutBytes),'44ef0a3d8a25ed85a173f82a3ce0d4fc12cb96b770143315b94b065a2c448052');
  const checkout=JSON.parse(new TextDecoder().decode(checkoutBytes));
  assert.equal(checkout.schema,'vm-exact-source-input-checkout-representations-1');
  assert.equal(checkout.source,liveSource);
  assert.equal(sha(readFileSync('public/atlas-runtime/head-neck/source-inputs.json')),checkout.sourceInputManifestSha256);
  assert.equal(checkout.records.length,9);
  const policies=new Map<string,any>(checkout.records.map((row:any)=>[row.path,row]));
  assert.equal(policies.size,9);let checkedRepresentations=0;
  assert(!liveReview.files.some((entry:any)=>entry.path===licenseMetadataPath),'License evidence is metadata, not a rewritten Review import');
  for(const row of liveInputs){
    const policy=policies.get(row.path);
    if(policy){
      const committed=sourceObjects.get(row.path);assert(committed);
      verifyMetadataTextCheckout(row,committed,readFileSync(atlas+'/'+row.path),policy);
      checkedRepresentations++;
    }else assert.equal(row.sha256,sourceHashes.get(row.path),`${row.path}: learner committed source`);
  }
  assert.equal(checkedRepresentations,9);
  assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior('lib/atlas-model-inventory.json').models);
  assert.deepEqual(learner.regionalScopes,prior('public/atlas-runtime/head-neck/manifest.json').regionalScopes);
  for(const path of ['atlas-review/content/nested-review-bindings.json','atlas-review/content/nested-teaching-bindings.v1.json'])assert.deepEqual(milestoneJson(path),prior(path));
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(learner[flag],false);
  const built=await build({stdin:{contents:`
    export {nestedReviewRows,nestedReviewMaterial,nestedReviewSelection} from './atlas-review/lib/nested-review-material';
    export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';
    export {clinicalReviewReturn} from './lib/clinical-review-return';
    export {reviewModelHref} from './lib/clinical-review-links';
    export {nestedApprovalProblems,blankNestedReview} from './atlas-review/lib/nested-review';
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64')).catch(e=>{e.stack=e.message;throw e;});
  const group=api.nestedReviewRows.find((g:any)=>g.study==='cerebral');assert(group);
  const landmarks={frontal:/precentral gyrus/,parietal:/postcentral gyrus/,temporal:/Sylvian fissure/,occipital:/calcarine sulcus/};
  let count=0;
  for(const [lobe,landmark] of Object.entries(landmarks))for(const side of ['left','right']){
    const id=`vm:anatomy:body:head-neck:${side}:organ:${side}-${lobe}-lobe`;
    const packet=await api.nestedReviewMaterial(group.key,id);assert(packet,id);count++;
    assert.equal(packet.teaching.concept.id,'cerebral-'+lobe);
    for(const topic of ['ct','mri']){
      const lesson=packet.teaching.topics.find((t:any)=>t.tab===topic);
      assert.equal(lesson.readiness,'draft');assert(lesson.references.length>0);
      assert.match(lesson.note,/specialist review pending/);
      if(topic==='mri')assert.match(lesson.body,landmark);
    }
    for(const topic of ['xray','ultrasound'])assert.equal(packet.teaching.topics.find((t:any)=>t.tab===topic).readiness,'pending');
    assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length>0);
    for(const track of ['geometry','teaching','imaging'])assert(api.nestedApprovalProblems(api.blankNestedReview(packet.context,track),packet.context,track).length);
    assert.equal(await api.nestedReviewSelection(group.key,id,'0'.repeat(64)),null);
    const entry=api.clinicalReviewEntries.find((e:any)=>e.scope==='nested'&&e.id===id);assert(entry);
    const query=Object.fromEntries(new URL(api.reviewModelHref(packet.atlasLink),'https://review.test').searchParams);
    assert.deepEqual(await api.clinicalReviewReturn(query),{href:entry.href,name:entry.name});
  }
  assert.equal(count,8);
});

test('current delivery source admission matches Atlas HEAD',()=>{assert(currentAtlasDeliveryRoot());});
