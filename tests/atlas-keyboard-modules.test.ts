import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = 'e3e292f234d4e9e9c96903a67703f9ec92678626';
const modules = {
  shoulder:'b0f518141a963c6e7157004099255134d895ec6b6a467bda7c8737d9e2c3dfb1',
  'female-pelvis':'c31978ccec3703a2c7ea8bd74c56dcda72fd3f15e6d476d9a7b696c3164e0496',
  'lower-limb':'bf3eced442dcc6751299aa6346275c74dc2750c289e1b98de62ee8d448c55882',
  'head-neck':'b79bb548346d8d67ffa42836478494d03ef5b4ea7bdb8bd2eeac8525a0b69026',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'e3e292f234d4e9e9c96903a67703f9ec92678626'
    :module==='female-pelvis'?'e3e292f234d4e9e9c96903a67703f9ec92678626':module==='lower-limb'?'e3e292f234d4e9e9c96903a67703f9ec92678626':source);
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
