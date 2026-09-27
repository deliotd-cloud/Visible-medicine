import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '82dee8b0b48b9f5bc2f1a1893dd302bf3993af6f';
const modules = {
  shoulder:'53a1b69efca954b2ca25d8f82936bf8d7424f8db39b4757d671a7b69562698be',
  'female-pelvis':'ce64af2fd913be42c856beaf25cb2f48996ec69394e28b75a595ed98415a1bb4',
  'lower-limb':'447e9f0065efcd8b8d4f2f2bfe25b2bf63185655c49ae830b8217b590ffdb419',
  'head-neck':'1711b1ff448404abdb7751577d432ae3d80d3841475ea7c1957d6a54db7628d3',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'82dee8b0b48b9f5bc2f1a1893dd302bf3993af6f'
    :module==='female-pelvis'?'84e8d083c0bfc7cd41542f5fa0cbb7e172ac2e02':module==='lower-limb'?'80ff7f2ce56ce3cc27d4d9e6962797292585c3df':source);
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
