import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('cervical and hallux orientation ships exact source, draft wording and no imaging connection',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'a3c561888fe760f3e3620737439203c7eeffe1f89fa25ce77cf5b6aa8d044474');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'64c1afa92b21c432b1c7f7817d67a616f3e129d3');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-content.ts','cbeea7d702b85b87dec6a536a10bc2f64ed35c8695674ee514fe989477f008a4'],
    ['content/back-bone-teaching.ts','09580e7ee30c2c4dd951bde5a53b6c93168d43d3cab3ede337b88a102db7854d'],
    ['content/hallux-xray.ts','e6bd2b81a637f4bf170631d035b98aa7be96de11f101086364939d5579505311'],
    ['lib/hallux-xray.ts','87f3bb780aeb9c25ca308059cae5207891ef69e5e6b5dc0616528f0ccc5eb699'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const files=manifest.files as {path:string;sha256:string}[];
  const contains=(pattern:RegExp,markers:string[])=>{
    const matches=files.filter(f=>pattern.test(f.path));assert.equal(matches.length,1);
    const chunk=readFileSync(base+matches[0].path);assert.equal(sha(chunk),matches[0].sha256);
    for(const marker of markers)assert(chunk.toString().includes(marker),marker);
  };
  contains(/\/slider-[^/]+\.js$/,['Trace the hallux proximal phalanx','Follow the hallux distal phalanx','This source has no middle hallux phalanx']);
  contains(/\/back-layers-study-[^/]+\.js$/,['C1 has no vertebral body','dens as part of C2','spinolaminar contour across C3','C7 in relation to T1','skull base above the C1 ring']);
  contains(/\/um-knee-study-[^/]+\.js$/,['specialist review pending','No patient images, scan alignment or measured pathology']);
  assert(!inputs.some(f=>/\.before\.json|\.transition\.json|\.local\//.test(f.path)));
  assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});
