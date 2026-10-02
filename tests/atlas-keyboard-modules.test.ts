import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '6c156e8b4cead4a24cc19ea2cc5a53e77ba8e06e';
const modules = {
  shoulder:'33156b199fa29a3f0ee71d7a8352fd0e7b6c3e39039a1b29130577d8020a8dd5',
  'female-pelvis':'185bbe8b56b0146f8f5a44f5a7b5706ff6c02cd900abea8485567f27811610c0',
  'lower-limb':'cb7add9cb30cdae531ecd9d888ada9c0f6d2ba637c51f70853d5adfced2e4349',
  'head-neck':'e0bdfa8e0a0a802474c8558d0dff5bcd36ea7daf20cbed0fd8d3f4bf9408fa5e',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'6c156e8b4cead4a24cc19ea2cc5a53e77ba8e06e'
    :module==='female-pelvis'?'6c156e8b4cead4a24cc19ea2cc5a53e77ba8e06e':module==='lower-limb'?'6c156e8b4cead4a24cc19ea2cc5a53e77ba8e06e':source);
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
