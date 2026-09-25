import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('regional export binds paired popliteal studies and guarded Search handoff',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'d732f0b519f5e9a61fca4460cd6e57dc918d9755');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/atlas-workspace.tsx':'0f0995358609a589e7f02a0911195419f206ba407a2cfa1d6a6d0d82b06dc24c',
    'app/body-explorer.tsx':'e62b3b74cbbd348d3589c4b6d43d972970129b34a8ad7b4e0a66648a35f861ba',
    'content/popliteal-vessel-study-pins.json':'d0f4f1875c2f3a9b281a90c8d6675f063c7427d4648cda7b3961106ad71eb1f8',
    'content/popliteal-vessel-study.ts':'abc5e21efacfde75edb96b34e3a7e218968983d323f078f5381fe3c950a366f3',
    'lib/popliteal-vessel-study.ts':'836b58cea4a797392e18e38975091ebb8e8918d8302c6e1ab0ee9caa5463f14b',
    'lib/study-close-up-label.ts':'1ad423aaaff68a9c40c8fd33af58bc2f8457460cb70b4d6922e2856dac025438',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const bytes=readFileSync(base+file.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    return bytes.toString();
  }).join('\n');
  for(const marker of ['knee-popliteal-vessel-pair','Knee: popliteal artery and vein',
    'This study could not be opened with the current source data.',
    'This result is no longer available in the current atlas view.',
    'Whole surfaces extend beyond the view'])assert.ok(runtime.includes(marker),marker);
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
});
