import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('.',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Each pair is [unique proposed text, exact original text]. Newlines adapt to
// the original file's EOL, so the inverse retains complete LF or CRLF bytes.
const files={
 'atlas-label-keyboard.test.ts':{
  before:'3c96b803580556775d34863291a0043f233c1e663be93dcc4d65a50230269f19',
  after:'34e80eada4c9163021072db22f2a3978c231e0ffbe61e408cc1540835143e4c9',
  undo:[
   ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';", "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
   [" const pin=validateCurrentAtlasDelivery();\n for(const module of ['head-neck','shoulder','lower-limb','female-pelvis'])", " for(const module of ['head-neck','shoulder','lower-limb','female-pelvis'])"],
   ['assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);','assert.equal(manifest.sourceCommit,revision,module);'],
  ],
 },
 'atlas-spinal-disc-function.test.ts':{
  before:'cab066369645fd2647857da4e73d27f7d59eaf18baf9fdf6b9999377abf5b82a',
  after:'597a95e1a8aef11b35790265c4527004a1abdf7cd7c4b8b79190e17470a568ec',
  undo:[
   ["import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
   ["const historicalNonregional='8d4d4abaa3c47259fb31d2c14f920c29f40ef28f';","const historicalNonregional='8d4d4abaa3c47259fb31d2c14f920c29f40ef28f';\nconst currentSource=CURRENT_ATLAS_REVISION;"],
   ["  const pin=validateCurrentAtlasDelivery();\n  const expected={","  const expected={"],
   ["pin.documents['public/atlas-runtime/shoulder/manifest.json']","validateCurrentAtlasDelivery().documents['public/atlas-runtime/shoulder/manifest.json']"],
   ["pin.documents['public/atlas-runtime/female-pelvis/manifest.json']","validateCurrentAtlasDelivery().documents['public/atlas-runtime/female-pelvis/manifest.json']"],
   ["pin.documents['public/atlas-runtime/lower-limb/manifest.json']","validateCurrentAtlasDelivery().documents['public/atlas-runtime/lower-limb/manifest.json']"],
   ['assert.equal(source.sourceCommit,pin.runtimeSources[source.module],source.module);','assert.equal(source.sourceCommit,currentSource,source.module);'],
   ['assert.equal(manifest.sourceCommit,pin.runtimeSources[source.module],source.module);','assert.equal(manifest.sourceCommit,currentSource,source.module);'],
  ],
 },
 'clinical-review-abdominal-eus.test.ts':{
  before:'05068e84a9b628dd1860cf4ffc5de972a4713831b5534abe2dc6fa4970c11275',
  after:'c2951cffd8922fd873c4a63ff347adf760b6b54df1c95cf0f8fb038042449366',
  undo:[['assert.equal(manifest.sourceCommit,admission.runtimeSources[module],module);','assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION,module);']],
 },
 'clinical-review-abdominal-fold-ultrasound.test.ts':{
  before:'2a85632315546a1bc7deac5c2576180127e3d12ed56f16b9272fedb8ee87a6ba',
  after:'f1a688755047d7cb7decb102114891b68fe3bd6e2b86c0d4a93e97a4be7f08af',
  undo:[['assert.equal(manifest.sourceCommit,admission.runtimeSources[module],module);','assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION,module);']],
 },
 'clinical-review-abdominal-spatial-reasoning.test.ts':{
  before:'31cc280bd65f3f7a34dd8d837e89c8c971793e5df047e8611fce539e6254b7de',
  after:'1a5a4c1f2c43d5cdccac4b56837c606478d2d19a1c7d2268379a7fffccdf932e',
  undo:[['assert.equal(manifest.sourceCommit,admission.runtimeSources[module],module);','assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION,module);']],
 },
 'clinical-review-abdominal-vessel-reasoning.test.ts':{
  before:'acbd5e043d741ac3ab94aea8fbbc44acf75d76ddb61ebf8b4382a0a64a09c75a',
  after:'96e62d679ccd8bf7df262dc3cac6ff43cc1d860307b5f7485fe8fbe404f5497a',
  undo:[['assert.equal(manifest.sourceCommit,admission.runtimeSources[module],module);','assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION,module);']],
 },
 'clinical-review-brain-connections-reasoning.test.ts':{
  before:'f75121a0dccc73ef0e906db2e0dd081ea9633ef38b04308288e38b5e094bb349',
  after:'69065c2863e82b5a71d1d23446d00662d295840358162e95ff794442801533ae',
  undo:[['assert.equal(manifest.sourceCommit,admission.runtimeSources[module],module);','assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION,module);']],
 },
 'clinical-review-teaching-heading.test.ts':{
  before:'802d91134bc1cf1f39373cf33cd103dde8a78c92094386ab7051726366014d12',
  after:'622f15137226c1b95b12da244fc1849fa97e4b437371b14322afc3b03236e6ec',
  undo:[['assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);','assert.equal(manifest.sourceCommit,revision,module);']],
 },
 'clinical-review-urinary-tract-tour.test.ts':{
  before:'4c6f812f8aa70219073f79c7972b9b8881e567638e9e721e7ba7fe651eca31d2',
  after:'3353c20def157cdffdd191c099c10b2dfb6673a08dd55b83f5794a3f42097dd6',
  undo:[
   ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
   ["const currentPin=validateCurrentAtlasDelivery();\nassert.equal(currentRevision,currentPin.source);","assert.equal(currentRevision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
   ['assert.equal(manifest.sourceCommit,currentPin.runtimeSources[module],module);','assert.equal(manifest.sourceCommit,revision,module);'],
  ],
 },
};

for(const [name,entry] of Object.entries(files)){
 const original=readFileSync(root+'original/tests/'+name);
 const proposal=readFileSync(root+'proposal/tests/'+name);
 assert.equal(sha(original),entry.before,name+' frozen preimage SHA-256');
 assert.equal(sha(proposal),entry.after,name+' proposed SHA-256');
 assert.deepEqual(readFileSync('F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website/tests/'+name),original,name+' untouched candidate');
 const raw=proposal.toString('utf8');
 assert.deepEqual(Buffer.from(raw,'utf8'),proposal,name+' UTF-8 round trip');
 const eol=raw.includes('\r\n')?'\r\n':'\n';
 assert.equal(raw.replaceAll('\r\n','').includes('\n'),eol==='\n',name+' uniform EOL');
 let reversed=raw;
 for(const [newText,oldText] of entry.undo){
  const from=newText.replaceAll('\n',eol),to=oldText.replaceAll('\n',eol);
  const pos=reversed.indexOf(from);
  assert(pos>=0,name+' inverse text absent: '+from);
  assert.equal(reversed.indexOf(from,pos+from.length),-1,name+' inverse text is not unique: '+from);
  reversed=reversed.slice(0,pos)+to+reversed.slice(pos+from.length);
 }
 assert.deepEqual(Buffer.from(reversed,'utf8'),original,name+' full original bytes');
 console.log('PASS '+name+' '+entry.before+' -> '+entry.after);
}
console.log('PASS nine complete byte inverses');
