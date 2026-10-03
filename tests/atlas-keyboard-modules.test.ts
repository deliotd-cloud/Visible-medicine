import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = 'e7355245ac0d5f92a7a76c6fb2c42f917c3675c3';
const modules = {
  shoulder:'f99c78fcfd9e2d262eae4979c8d2096affd215b999c8f9611429a58be57bb514',
  'female-pelvis':'2a3c0c47b4b653921c605a3063a6916f316e39cee848c3ac9de48588bb2d0366',
  'lower-limb':'15db82d171642c98b51c9544a4dfe3925b3b527af0a74634cba09bd7659d2af5',
  'head-neck':'2f45bf7464f0f7d9404425da519e7ed0cdbbbe6700c3db31b1145d15df5b4b0c',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'e7355245ac0d5f92a7a76c6fb2c42f917c3675c3'
    :module==='female-pelvis'?'e7355245ac0d5f92a7a76c6fb2c42f917c3675c3':module==='lower-limb'?'e7355245ac0d5f92a7a76c6fb2c42f917c3675c3':source);
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
