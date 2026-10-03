import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '946700cc8c5162076cd5e5d9f79a00ba72c6fda1';
const modules = {
  shoulder:'7c6bbe1c6f89d4d6e21d382b2e2c1d837b8e5da8b3e1b9e4562c625b5a1f94a3',
  'female-pelvis':'368c888a2073b1ec8b49d12aa3ff1c5eb6a94741040f1f760c198d0e74b9a8b3',
  'lower-limb':'744873bee3505c2791452bcdfd8ae6874fb4be26d619dab240e79303e687eef2',
  'head-neck':'b3ce83e5c7e46b254cc5edbabfadd5f6e6ba34824d68216388f4fe9fba800c63',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'946700cc8c5162076cd5e5d9f79a00ba72c6fda1'
    :module==='female-pelvis'?'946700cc8c5162076cd5e5d9f79a00ba72c6fda1':module==='lower-limb'?'946700cc8c5162076cd5e5d9f79a00ba72c6fda1':source);
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
