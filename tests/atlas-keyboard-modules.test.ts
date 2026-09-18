import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '84e8d083c0bfc7cd41542f5fa0cbb7e172ac2e02';
const modules = {
  shoulder:'9e9b955cfc99189b22ba462480184c712b1715b5b125436b896fa83bc6c9b604',
  'female-pelvis':'ce64af2fd913be42c856beaf25cb2f48996ec69394e28b75a595ed98415a1bb4',
  'lower-limb':'f9bf6d620ac4bbdbb9c2e2f47b005cdaa78aff8f6f3feabf5b08400b4f63d246',
  'head-neck':'74d70714d59b54161ef48a2eaa1f8cdd790beffc03c63e4fae2673d3a2ff36c9',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='head-neck'?'2d68ad0aa45aa270f2b0a114be82003ea6d1b9c8':source);
  const inputs = JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'lib/camera-keyboard.ts':'49fc891102a943037311097439e4b80ac5c7eb0a18d1c0468672c39f888f8047',
    'app/camera-keyboard.css':'546be3cb74dc907c2652d4b177352303d123275bfed6b6946c740750467cefb8',
  })) assert.equal(inputs.find(f=>f.path===path)?.sha256,sha256);
});
