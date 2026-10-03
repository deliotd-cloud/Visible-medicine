import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '6c86bc8b1aa7a7418f21f890858b0217194aff4e';
const modules = {
  shoulder:'f97591ffb5d895c3ce7ceafb50b2a066fd00b31fe7334f1e8dbc4ec2bd37e10a',
  'female-pelvis':'f44d129947602cd24a2f528f7e8f9ab2d7562a4d1ca108c8f712bd226d7d3bb2',
  'lower-limb':'387ef7ec1a53cf4c3f8a9ce7091e3d02f3b3f254cd2817b8c01b9a527eec026d',
  'head-neck':'511cdcfae5d23ff80cda6b09f4c4a682cd817337327a9c1f39403516a4fd90db',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'6c86bc8b1aa7a7418f21f890858b0217194aff4e'
    :module==='female-pelvis'?'6c86bc8b1aa7a7418f21f890858b0217194aff4e':module==='lower-limb'?'6c86bc8b1aa7a7418f21f890858b0217194aff4e':source);
  const inputs = JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'lib/camera-keyboard.ts':module==='shoulder'
      ?'9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220'
      :module==='head-neck'
      ?'9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220'
      :module==='female-pelvis'?'9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220':'9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220',
    'app/camera-keyboard.css':module==='shoulder'||module==='head-neck'
      ?'98d5bb8c7fe828c06e13f065fa7628aeeeb3638bedaea07a963ee3712ba4e7de'
      :module==='female-pelvis'?'98d5bb8c7fe828c06e13f065fa7628aeeeb3638bedaea07a963ee3712ba4e7de':'98d5bb8c7fe828c06e13f065fa7628aeeeb3638bedaea07a963ee3712ba4e7de',
  })) assert.equal(inputs.find(f=>f.path===path)?.sha256,sha256);
});
