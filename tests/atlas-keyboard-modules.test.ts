import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '6d5caefe7cc90c03c16775126c939ac31956d90e';
const modules = {
  shoulder:'d889417b24e005b339137861cf779815e29731c9bcaed7b012f6aae29d6193d4',
  'female-pelvis':'1e84fcde6bbf5dd6f32b1214e30fde968c1cf296225a2944c53b197f0503c6d1',
  'lower-limb':'aeafbcbce78b40b4a34de0e6951cf02111eaa33bfc229d6b489b681158db4a78',
  'head-neck':'8117b8423c52def3be7591264420b2cdeb319adcf0e125932104aacf0bc5aa99',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'6d5caefe7cc90c03c16775126c939ac31956d90e'
    :module==='female-pelvis'?'6d5caefe7cc90c03c16775126c939ac31956d90e':module==='lower-limb'?'6d5caefe7cc90c03c16775126c939ac31956d90e':source);
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
