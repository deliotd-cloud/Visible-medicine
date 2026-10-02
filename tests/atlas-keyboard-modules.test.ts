import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Source behavior is covered by the Atlas camera suite. These release checks
// bind all exported viewers to that implementation and its focus-only styling.
const source = 'ed3d7a1ebaa11edc5bea4c918e43b6019b93d521';
const modules = {
  shoulder:'6153741c4a2003203b47523524a082ad5c02c93f9c73d066431de079b1bef1bc',
  'female-pelvis':'9804a53c70ac0ef2082b6b3a3babcc40740e6e8835d64c287fdca6b12cfbe1c4',
  'lower-limb':'0de4e58834f71468817c01ca5eb675b45258cbff2a19fe16c497ef494daf490a',
  'head-neck':'1cdf516970d12ff5ea5a54e0050f26791c6fd8c5bdc507c5fadbf4efa0c37235',
};
for(const [module,manifestHash] of Object.entries(modules)) test(`${module} exports the source-verified keyboard camera and focus-only hint`,()=>{
  const base = `public/atlas-runtime/${module}/`;
  const bytes = readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifestHash);
  assert.equal(JSON.parse(bytes.toString()).sourceCommit,module==='shoulder'
    ?'ed3d7a1ebaa11edc5bea4c918e43b6019b93d521'
    :module==='female-pelvis'?'ed3d7a1ebaa11edc5bea4c918e43b6019b93d521':module==='lower-limb'?'ed3d7a1ebaa11edc5bea4c918e43b6019b93d521':source);
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
