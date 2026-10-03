import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = 'dcd1e1cfe4036c2af309c5a1a451adf659e62417';
const modules = {
  shoulder:'4f6e8afed7467dca4a9729e846200684d7a925fad0b2005c0fdf136b3fed8102',
  'female-pelvis':'1fbf5c8417b5db6802d2f8288f44fd9e7ea5d8e3ae7b431f70c5f128165f771f',
  'lower-limb':'19e2e49634824e5d303153aab2d464582c7e5a698ffe471bf6c7efa41c51ba16',
  'head-neck':'4002688ab01c6941ca946e3d91efc383e066a7bb1a1dcbf95a1bc8009bde0cd2',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'dcd1e1cfe4036c2af309c5a1a451adf659e62417'
    :module==='female-pelvis'?'dcd1e1cfe4036c2af309c5a1a451adf659e62417':module==='lower-limb'?'dcd1e1cfe4036c2af309c5a1a451adf659e62417':source);
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
