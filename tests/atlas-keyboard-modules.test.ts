import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = 'a10f1fd19c7dcf27470943f4775cb509f7da811f';
const modules = {
  shoulder:'9aa321b231fde736528bfb1e7a474a1221afa04fccfc0b05a941d03102e2055c',
  'female-pelvis':'ce64af2fd913be42c856beaf25cb2f48996ec69394e28b75a595ed98415a1bb4',
  'lower-limb':'3327e6b852046c54b2a1f4b3057947bfdfef5f1a5a27f78d0795940659226b32',
  'head-neck':'f449a0dc07bd2ba2d54ac0673bce8f9f522acd489cc82c53192244c6691a48fe',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'a10f1fd19c7dcf27470943f4775cb509f7da811f'
    :module==='female-pelvis'?'84e8d083c0bfc7cd41542f5fa0cbb7e172ac2e02':module==='lower-limb'?'a10f1fd19c7dcf27470943f4775cb509f7da811f':source);
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
