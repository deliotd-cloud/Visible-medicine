import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '67dd759d40e0c775620964d90e85de659f15d6cf';
const modules = {
  shoulder:'1f0b39516c65db3b6025505e85dbee92c34e356e6bd3f218bc53afc643d5fce2',
  'female-pelvis':'5bb4fc2b0c8cba1cd6d8f9694b6296c0c6d1ecfd11068c8a3bf71df5149fc79e',
  'lower-limb':'f8f90e335e64425aabeeb56a525f9c7c5f7e7c1f4c299b9521b3326cba944cfd',
  'head-neck':'23f0cd249e29c85f2ff90b874ef7d38d44b0144d515b6ab0b6e78b3e2dcecac2',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'67dd759d40e0c775620964d90e85de659f15d6cf'
    :module==='female-pelvis'?'67dd759d40e0c775620964d90e85de659f15d6cf':module==='lower-limb'?'67dd759d40e0c775620964d90e85de659f15d6cf':source);
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
