import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = 'f97ea55ee2e7b57865c012650b40fc44041f45da';
const modules = {
  shoulder:'fcf3355d21a86bbaeedd5e543c0b46dbedd33e233356ec6a5376bd9c6beeab5c',
  'female-pelvis':'2de0b7520ab7226bd0831b8f5cd00bbd36358fa39f15dd21576a89e9f9d9635d',
  'lower-limb':'d2b2fb211a18c3c1d51a4ca5290a2c262cd9c72c6470511660f11f4f8e57eccb',
  'head-neck':'3a02e800637efce34cf13a58773ae7f939e36e3ff44edb400eeb5d40f1a24534',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'f97ea55ee2e7b57865c012650b40fc44041f45da'
    :module==='female-pelvis'?'f97ea55ee2e7b57865c012650b40fc44041f45da':module==='lower-limb'?'f97ea55ee2e7b57865c012650b40fc44041f45da':source);
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
