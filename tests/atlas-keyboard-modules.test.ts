import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '732f5f56ff3708b9200b25f18ac3f6f175a438e5';
const modules = {
  shoulder:'1ee71ce249eba02965a10a012a05c1afc8c8a0c3f69b3451eee7b969a37b9fdb',
  'female-pelvis':'dfbba4ad366340cf017597dabc7c61e8313bc17375bf8441c2060361206d1adb',
  'lower-limb':'6d7c7064b1ca3209d84e24cb53d6156fcbe8592aaa09e804464cf7d8820f599b',
  'head-neck':'b84c0742d9daae64f5678c3bc40159f19bb6b755927ea556365c27838abea943',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'732f5f56ff3708b9200b25f18ac3f6f175a438e5'
    :module==='female-pelvis'?'732f5f56ff3708b9200b25f18ac3f6f175a438e5':module==='lower-limb'?'732f5f56ff3708b9200b25f18ac3f6f175a438e5':source);
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
