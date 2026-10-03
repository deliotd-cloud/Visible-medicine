import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '2413ff790069d5bfa6c2c507d67ebfa2a5b3fe51';
const modules = {
  shoulder:'d25456884287b33302591bae3c974747cabe0c215d551ba05fbc6d45ad3a3d8d',
  'female-pelvis':'118a0164c4b0a09b6267bbeb9a305ef1cae238b72261eb945909477cd2a226c6',
  'lower-limb':'b744328dbb37b7631b31a0518581f4ed9e4287fe21c9cb7b330b403ff5453098',
  'head-neck':'7a3f87be967083d661ab7303d08bc08f5ba995bde4c27d6414574eb58247fae9',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'2413ff790069d5bfa6c2c507d67ebfa2a5b3fe51'
    :module==='female-pelvis'?'2413ff790069d5bfa6c2c507d67ebfa2a5b3fe51':module==='lower-limb'?'2413ff790069d5bfa6c2c507d67ebfa2a5b3fe51':source);
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
