import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const saved='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const old=(path:string)=>execFileSync('git',['show',`${saved}:${path}`],{maxBuffer:32e6});

test('cervical and hallux orientation ships exact source, draft wording and no imaging connection',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=old(base+'manifest.json');
  assert.equal(sha(bytes),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  const inputs=JSON.parse(old(base+'source-inputs.json').toString()) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-content.ts','4df58aeec6728cefb67332fd9578f9c4e66ec204ec92d10690b9bd9b75b019d8'],
    ['content/back-bone-teaching.ts','590d53eecda100df1444eeb227bf434c6441c3f9d93d8060f041848adcef4861'],
    ['content/hallux-xray.ts','e6bd2b81a637f4bf170631d035b98aa7be96de11f101086364939d5579505311'],
    ['lib/hallux-xray.ts','87f3bb780aeb9c25ca308059cae5207891ef69e5e6b5dc0616528f0ccc5eb699'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const files=manifest.files as {path:string;sha256:string}[];
  const contains=(pattern:RegExp,markers:string[])=>{
    const matches=files.filter(f=>pattern.test(f.path));assert.equal(matches.length,1);
    const chunk=old(base+matches[0].path);assert.equal(sha(chunk),matches[0].sha256);
    for(const marker of markers)assert(chunk.toString().includes(marker),marker);
  };
  const teaching=emittedTeaching(base,files,true,old);
  for(const marker of ['Trace the hallux proximal phalanx','Follow the hallux distal phalanx','This source has no middle hallux phalanx'])assert(teaching.includes(marker),marker);
  contains(/\/back-layers-study-[^/]+\.js$/,['C1 has no vertebral body','dens as part of C2','spinolaminar contour across C3','C7 in relation to T1','skull base above the C1 ring']);
  contains(/\/um-knee-study-[^/]+\.js$/,['specialist review pending','No patient images, scan alignment or measured pathology']);
  assert(!inputs.some(f=>/\.before\.json|\.transition\.json|\.local\//.test(f.path)));
  assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});

test('current cervical and hallux import retains committed source, emitted bytes and no imaging connection',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const featureSource='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
  const featureTree='1bd327fb20a52b35bec584675c457173c548e24b';
  const source=CURRENT_ATLAS_REVISION,sourceRoot=currentAtlasDeliveryRoot(),pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,source);
  assert.equal(execFileSync('git',['rev-parse',featureSource+'^{tree}'],{cwd:sourceRoot,encoding:'utf8'}).trim(),featureTree);
  assert.equal(manifest.sourceCommit,source);assert.equal(review.revision,source);
  for(const path of ['app/body-content.ts','content/back-bone-teaching.ts','content/hallux-xray.ts','lib/hallux-xray.ts']){
    const input=inputs.find(row=>row.path===path);
    const imported=review.files.find((row:{path:string})=>row.path===path);
    assert.ok(input&&imported,path);
    assert.equal(input.sha256,imported.sourceSha256,path);
    assert.equal(imported.importedSha256,sha(readFileSync('atlas-review/'+path)),path);
    const committed=execFileSync('git',['show',`${source}:${path}`],{cwd:sourceRoot});
    const feature=execFileSync('git',['show',`${featureSource}:${path}`],{cwd:sourceRoot});
    assert.equal(input.sha256,sha(committed),path);
    if(path==='app/body-content.ts')assert.notDeepEqual(committed,feature,'host changed after historical feature');
    else assert.deepEqual(committed,feature,path+': immutable hallux teaching held');
  }
  for(const file of manifest.files as {path:string;sha256:string}[])assert.equal(sha(readFileSync(base+file.path)),file.sha256,file.path);
  assert.ok(!manifest.files.some((row:{path:string})=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(row.path)));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});


test('current cervical and hallux import refuses forged source, Review and learner metadata',()=>{
 const sourceRoot=currentAtlasDeliveryRoot(),source=CURRENT_ATLAS_REVISION;
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 for(const path of ['app/body-content.ts','content/back-bone-teaching.ts','content/hallux-xray.ts','lib/hallux-xray.ts']){
  const committed=execFileSync('git',['show',source+':'+path],{cwd:sourceRoot});
  const imported=readFileSync('atlas-review/'+path);
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
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
