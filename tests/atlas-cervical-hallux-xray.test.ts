import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

test('cervical and hallux orientation ships exact source, draft wording and no imaging connection',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'b3ce83e5c7e46b254cc5edbabfadd5f6e6ba34824d68216388f4fe9fba800c63');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'946700cc8c5162076cd5e5d9f79a00ba72c6fda1');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-content.ts','f890730222a09735274f16534f4c7a79db85bd0453a87e27d1ce1a907f2e0a38'],
    ['content/back-bone-teaching.ts','590d53eecda100df1444eeb227bf434c6441c3f9d93d8060f041848adcef4861'],
    ['content/hallux-xray.ts','e6bd2b81a637f4bf170631d035b98aa7be96de11f101086364939d5579505311'],
    ['lib/hallux-xray.ts','87f3bb780aeb9c25ca308059cae5207891ef69e5e6b5dc0616528f0ccc5eb699'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const files=manifest.files as {path:string;sha256:string}[];
  const contains=(pattern:RegExp,markers:string[])=>{
    const matches=files.filter(f=>pattern.test(f.path));assert.equal(matches.length,1);
    const chunk=readFileSync(base+matches[0].path);assert.equal(sha(chunk),matches[0].sha256);
    for(const marker of markers)assert(chunk.toString().includes(marker),marker);
  };
  const teaching=emittedTeaching(base,files);
  for(const marker of ['Trace the hallux proximal phalanx','Follow the hallux distal phalanx','This source has no middle hallux phalanx'])assert(teaching.includes(marker),marker);
  contains(/\/back-layers-study-[^/]+\.js$/,['C1 has no vertebral body','dens as part of C2','spinolaminar contour across C3','C7 in relation to T1','skull base above the C1 ring']);
  contains(/\/um-knee-study-[^/]+\.js$/,['specialist review pending','No patient images, scan alignment or measured pathology']);
  assert(!inputs.some(f=>/\.before\.json|\.transition\.json|\.local\//.test(f.path)));
  assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});
