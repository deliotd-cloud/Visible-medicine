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
  'head-neck':'107be57173e94572b4205640544f5d3c822bb9b477da588e702e6b1f1dc9b3c4',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='head-neck'?'7b5fae0ffd35a1d2d5e28af62f725ec3c797098e':source);
  const inputs = JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'lib/camera-keyboard.ts':module==='head-neck'
      ?'d26c359d9ccd7820c15099e36f7f6712d7e4a6ecbdc12fa3dc3d83ec8091acf2'
      :'49fc891102a943037311097439e4b80ac5c7eb0a18d1c0468672c39f888f8047',
    'app/camera-keyboard.css':'546be3cb74dc907c2652d4b177352303d123275bfed6b6946c740750467cefb8',
  })) assert.equal(inputs.find(f=>f.path===path)?.sha256,sha256);
});
