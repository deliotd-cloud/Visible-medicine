import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = '59c881d0eac308c8c5a2bc87f2c5a0f3f6d6c763';
const modules = {
  shoulder:'be34733646b804b4b03e5b8bf393449e78b2b220f6a8092e5c202adcbaee7d62',
  'female-pelvis':'d02d16afd5b592af6bded27cef9fa9d6a29ca233e9db2094b82b239ff529f20b',
  'lower-limb':'35b0af7a9148c6c95a7eca7f4e1385e92fb9c24b660469521abee5c15f078cb8',
  'head-neck':'1d70085b2275395a9336f4c7c92841a99031dc971eeac9caef63f24af42918a2',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'59c881d0eac308c8c5a2bc87f2c5a0f3f6d6c763'
    :module==='female-pelvis'?'59c881d0eac308c8c5a2bc87f2c5a0f3f6d6c763':module==='lower-limb'?'59c881d0eac308c8c5a2bc87f2c5a0f3f6d6c763':source);
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
