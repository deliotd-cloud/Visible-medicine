import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '84e8d083c0bfc7cd41542f5fa0cbb7e172ac2e02';
const modules = {
  shoulder:'0818f8b810d6a91c38629b17c2034f051f5d6d5e77b18392dd00d89a523b3221',
  'female-pelvis':'ce64af2fd913be42c856beaf25cb2f48996ec69394e28b75a595ed98415a1bb4',
  'lower-limb':'f9bf6d620ac4bbdbb9c2e2f47b005cdaa78aff8f6f3feabf5b08400b4f63d246',
  'head-neck':'03f52db97af9c81cf0410397482d5bae838cdbf7439935941b65a7f0e50e2ab7',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'98562916526b9530cd3e9c67cc9511fbb09bfbe9'
    :module==='head-neck'?'ce2037fcdd2ff3308095ce34a7d24628f6a864d2':source);
  const inputs = JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'lib/camera-keyboard.ts':module==='shoulder'
      ?'9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220'
      :module==='head-neck'
      ?'d26c359d9ccd7820c15099e36f7f6712d7e4a6ecbdc12fa3dc3d83ec8091acf2'
      :'49fc891102a943037311097439e4b80ac5c7eb0a18d1c0468672c39f888f8047',
    'app/camera-keyboard.css':module==='shoulder'
      ?'98d5bb8c7fe828c06e13f065fa7628aeeeb3638bedaea07a963ee3712ba4e7de'
      :'546be3cb74dc907c2652d4b177352303d123275bfed6b6946c740750467cefb8',
  })) assert.equal(inputs.find(f=>f.path===path)?.sha256,sha256);
});
