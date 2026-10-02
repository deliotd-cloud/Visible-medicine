import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = 'acd99b11e279a0525f1488456c0a8adf2abb2cf7';
const modules = {
  shoulder:'4f0b6c4a1159b9ab43a308e3f297ec0f2e168927c92115446284dfdee77329e2',
  'female-pelvis':'ce64af2fd913be42c856beaf25cb2f48996ec69394e28b75a595ed98415a1bb4',
  'lower-limb':'c86132486b2874597d5ac4764653870ca3e2d0347f7a2df4f380578368a8efd9',
  'head-neck':'3b042ba359638f591e8775dd76f026e6c1f52798fa415d1a5e407b13c06dfcbe',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'acd99b11e279a0525f1488456c0a8adf2abb2cf7'
    :module==='female-pelvis'?'84e8d083c0bfc7cd41542f5fa0cbb7e172ac2e02':module==='lower-limb'?'acd99b11e279a0525f1488456c0a8adf2abb2cf7':source);
  const inputs = JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'lib/camera-keyboard.ts':module==='shoulder'
      ?'9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220'
      :module==='head-neck'
      ?'9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220'
      :module==='female-pelvis'?'49fc891102a943037311097439e4b80ac5c7eb0a18d1c0468672c39f888f8047':'9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220',
    'app/camera-keyboard.css':module==='shoulder'||module==='head-neck'
      ?'98d5bb8c7fe828c06e13f065fa7628aeeeb3638bedaea07a963ee3712ba4e7de'
      :module==='female-pelvis'?'546be3cb74dc907c2652d4b177352303d123275bfed6b6946c740750467cefb8':'98d5bb8c7fe828c06e13f065fa7628aeeeb3638bedaea07a963ee3712ba4e7de',
  })) assert.equal(inputs.find(f=>f.path===path)?.sha256,sha256);
});
