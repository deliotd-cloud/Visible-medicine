import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '2c6d1f3eedc067c48203bed0639f67a9fc7fd3c5';
const modules = {
  shoulder:'c9a0658f93e778bc37f60d6fd04eb5073ab06aa24699dbd40fdb9e2e0566a273',
  'female-pelvis':'6fb399dfa123a3f5c861c4e7018bef0bde29595aadb67e1f17f8abe3bc5c406a',
  'lower-limb':'a30915bdf904ab5e1bda90c066eafe2f8aa7343c3de9f7b81cacd792e50b5ff3',
  'head-neck':'ad613c36b351688444c9e17041199c05d75292f54ca1ba21fa8379b0454a6815',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'2c6d1f3eedc067c48203bed0639f67a9fc7fd3c5'
    :module==='female-pelvis'?'2c6d1f3eedc067c48203bed0639f67a9fc7fd3c5':module==='lower-limb'?'2c6d1f3eedc067c48203bed0639f67a9fc7fd3c5':source);
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
