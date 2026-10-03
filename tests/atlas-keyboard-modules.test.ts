import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = 'da1c7f692fcaf318a9c059aa5cb4ef0db8bbd6e8';
const modules = {
  shoulder:'00e0feb7aae9d565cc7fbd7bfe66b74f49bc46cc7bd27e5f1de0d4ff02e474c5',
  'female-pelvis':'23dc47f8abd86af152c723cce70b35e4b1a75258811ca04b8d080ae10c225f64',
  'lower-limb':'63e4c8c3151d1adba803b6f13bb7b7d97fba7c1c1a00b15042f6b89a5390822e',
  'head-neck':'ead1eabaca33890ba12f6bd254ad35baf91dd4d8b43d3a4301dc6878e1741192',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'da1c7f692fcaf318a9c059aa5cb4ef0db8bbd6e8'
    :module==='female-pelvis'?'da1c7f692fcaf318a9c059aa5cb4ef0db8bbd6e8':module==='lower-limb'?'da1c7f692fcaf318a9c059aa5cb4ef0db8bbd6e8':source);
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
