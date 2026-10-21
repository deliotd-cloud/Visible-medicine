import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,'tests',path));
const candidateRoot=process.env.VM_CONTRACT_CANDIDATE_ROOT??join(root,'tests');
const candidate=path=>readFileSync(join(candidateRoot,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const exact=(text,from,to)=>{
 assert.equal(text.split(from).length-1,1,`One declared inverse seam: ${from.slice(0,80)}`);
 return text.replace(from,to);
};
const a247='a2475a37201bdd5fdd12f5849fc8ee043412d02f';
const source='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
const oldTree='97957a35788028b319df4f5d60c68a95e71320d7';
const newTree='6da62962106cfab9419b09618547a9da5e3aafc6';
const archived='fixtures/tongue-palate-a247/';
const witnesses={
 'current-atlas-delivery.test.mjs':'1532458ddfd22831733e0c3076dba98c816ce55c771dd3c1b8b95cc5a511909f',
 'ui-teaching-current-delivery.test.mjs':'145913ad5f183cf7c4274213b7096f4fb50bf55812706c453ad10f6a7a690bbb',
 'ui-teaching-lifecycle-contract.test.mjs':'4a6bc385a02ecf32ba174316af23a99e3b4fc5721415eee58b42c036fc2302c7',
 'ui-teaching-admission-contract.test.mjs':'9efa11a04cae1dfdbc59e512ca8dd14749c930c181062de908a94dec47db1fb3',
};

function rewindDelivery(text){
 text=exact(text,`assert.equal(CURRENT_ATLAS_REVISION,'${source}');`,
  `assert.equal(CURRENT_ATLAS_REVISION,'${a247}');`);
 text=exact(text,`assert.equal(pin.sourceTree,'${newTree}');`,
  `assert.equal(pin.sourceTree,'${oldTree}');`);
 text=exact(text,'assert.equal(sourceFiles,1548);assert.equal(inputs,1685);assert(artifacts>100);',
  'assert.equal(sourceFiles,1545);assert.equal(inputs,1682);assert(artifacts>100);');
 text=exact(text,
  "const text=original.toString(),current=read('tests/fixtures/tongue-palate-a247/current-atlas-delivery.test.mjs.raw').toString(),prefix=current.slice(0,current.indexOf(\"\\ntest('complete f509\"));",
  "const text=original.toString(),current=read('tests/current-atlas-delivery.test.mjs').toString(),prefix=current.slice(0,current.indexOf(\"\\ntest('complete f509\"));");
 text=exact(text,
  "assert.equal(read('tests/fixtures/tongue-palate-a247/ui-teaching-current-delivery.test.mjs.raw').toString(),ui.toString().replace('assert.equal(delivery.reviewSourceFiles, 1538);','assert.equal(delivery.reviewSourceFiles, 1545);').replace('assert.equal(inputs.inputs.length, 1668);','assert.equal(inputs.inputs.length, 1682);'),'Only two observed a247-count seams change; whole original behavioral bodies remain exact');",
  "assert.equal(read('tests/ui-teaching-current-delivery.test.mjs').toString(),ui.toString().replace('assert.equal(delivery.reviewSourceFiles, 1538);','assert.equal(delivery.reviewSourceFiles, 1545);').replace('assert.equal(inputs.inputs.length, 1668);','assert.equal(inputs.inputs.length, 1682);'),'Only two observed current-count seams change; whole original behavioral bodies remain exact');");
 text=exact(text,
  "const current=read('tests/fixtures/tongue-palate-a247/current-atlas-delivery.test.mjs.raw').toString();",
  "const current=read('tests/current-atlas-delivery.test.mjs').toString();");
 return text;
}
function rewindUi(text){
 text=exact(text,'assert.equal(delivery.reviewSourceFiles, 1548);',
  'assert.equal(delivery.reviewSourceFiles, 1545);');
 text=exact(text,'assert.equal(inputs.inputs.length, 1685);',
  'assert.equal(inputs.inputs.length, 1682);');
 return text;
}
function rewindLifecycle(text){
 text=exact(text,"const candidateSha = '78919d9a82605a2c24bb4a490e0a5e5cc04549d15e2990107c3c7618dfec2189';",
  "const candidateSha = '145913ad5f183cf7c4274213b7096f4fb50bf55812706c453ad10f6a7a690bbb';");
 text=exact(text,"'  assert.equal(delivery.reviewSourceFiles, 1548);\\n',",
  "'  assert.equal(delivery.reviewSourceFiles, 1545);\\n',");
 text=exact(text,"'  assert.equal(inputs.inputs.length, 1685);\\n',",
  "'  assert.equal(inputs.inputs.length, 1682);\\n',");
 text=exact(text,"const count = replaceOnce(current, '  assert.equal(inputs.inputs.length, 1685);',",
  "const count = replaceOnce(current, '  assert.equal(inputs.inputs.length, 1682);',");
 return text;
}
function rewindAdmission(text){
 text=exact(text,[
  ' const live=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();',
  ' assert.equal(live.source,CURRENT_ATLAS_REVISION);',
  ` assert.equal(live.source,'${source}');`,
  ` assert.equal(live.sourceTree,'${newTree}');`,
  " const priorBytes=read('fixtures/tongue-palate-a247/current-atlas-delivery.json.raw');",
  " assert.equal(sha(priorBytes),'e5815a25fbf2c62e6f428dd25652f185cd3d16e2c56741686de12f3f13863939');",
  ' const pin=JSON.parse(priorBytes);',
  " assert.throws(()=>validateCurrentAtlasDelivery({pin}),'Prior delivery must not admit 6036');",
 ].join('\n'),
  ' const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();\n assert.equal(pin.source,CURRENT_ATLAS_REVISION);');
 text=exact(text,
  "admitDelivery(read('fixtures/tongue-palate-a247/current-atlas-delivery.test.mjs.raw').toString(),pin)",
  "admitDelivery(read('current-atlas-delivery.test.mjs').toString(),pin)");
 text=exact(text,
  " execFileSync('git',['merge-base','--is-ancestor',pin.source,live.source],{cwd:history,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n",
  '');
 text=exact(text,[
  ' const live=validateCurrentAtlasDelivery();',
  " const pin=JSON.parse(read('fixtures/tongue-palate-a247/current-atlas-delivery.json.raw'));",
  " const delivery=read('fixtures/tongue-palate-a247/current-atlas-delivery.test.mjs.raw').toString();",
 ].join('\n'),
  " const pin=validateCurrentAtlasDelivery();\n const delivery=read('current-atlas-delivery.test.mjs').toString();");
 text=exact(text,'pin:{...live,reviewIntegration:', 'pin:{...pin,reviewIntegration:');
 text=exact(text,"pin:{...live,documents:{...live.documents,'atlas-review/manifest.json':",
  "pin:{...pin,documents:{...pin.documents,'atlas-review/manifest.json':");
 return text;
}
const rewind={
 'current-atlas-delivery.test.mjs':rewindDelivery,
 'ui-teaching-current-delivery.test.mjs':rewindUi,
 'ui-teaching-lifecycle-contract.test.mjs':rewindLifecycle,
 'ui-teaching-admission-contract.test.mjs':rewindAdmission,
};

test('the 6036 contract candidates rewind only declared seams to all four byte-exact a247 witnesses',()=>{
 for(const [file,hash] of Object.entries(witnesses)){
  const old=read(`${archived}${file}.raw`);
  assert.equal(sha(old),hash,`${file}: immutable a247 witness`);
  const prior=file==='current-atlas-delivery.test.mjs'
   ?candidate('fixtures/tongue-palate-current-atlas-delivery-6036.mjs.raw')
   :file==='ui-teaching-admission-contract.test.mjs'
    ?candidate('fixtures/tongue-palate-ui-teaching-admission-6036.mjs.raw')
   :file==='ui-teaching-current-delivery.test.mjs'
   ?read('fixtures/current-delivery-before-inbox485/ui-teaching-current-delivery.test.mjs.raw')
   :file==='ui-teaching-lifecycle-contract.test.mjs'
    ?candidate('fixtures/ui-teaching-lifecycle-contract.test.mjs.raw')
    :candidate(file);
  if(file==='current-atlas-delivery.test.mjs')assert.equal(sha(prior),'6233c1028f9478b2bb4d7733a5b48c5427e69990fec8e5bfed106d77b3f615a6','Exact scoped 6036 delivery source');
  if(file==='ui-teaching-admission-contract.test.mjs')assert.equal(sha(prior),'5b78e5dd86c3a7372ad6931e2a966647065ae19e0576e5f6e332ebee7aed904f','Exact scoped 6036 admission source');
  if(file==='ui-teaching-current-delivery.test.mjs')assert.equal(sha(prior),'78919d9a82605a2c24bb4a490e0a5e5cc04549d15e2990107c3c7618dfec2189','Exact 87ed UI source');
  if(file==='ui-teaching-lifecycle-contract.test.mjs')assert.equal(sha(prior),'dcb00033b133b94f52750c513b11704604abbff6b33625691dba7d32b82578b5','Exact prior lifecycle source');
  const current=prior.toString();
  assert.equal(rewind[file](current),old.toString(),`${file}: entire prior contract reconstructed`);
 }
});

test('a forged current count or historical refusal breaks the inverse proof',()=>{
 const current=candidate('fixtures/tongue-palate-current-atlas-delivery-6036.mjs.raw').toString();
 assert.equal(sha(Buffer.from(current)),'6233c1028f9478b2bb4d7733a5b48c5427e69990fec8e5bfed106d77b3f615a6','Exact historical 6036 refusal source');
 const forgedCount=exact(current,'assert.equal(inputs,1685);','assert.equal(inputs,1684);');
 assert.throws(()=>rewindDelivery(forgedCount));
 const forgedRefusal=exact(current,"['patient data admission','public/atlas-runtime/shoulder/manifest.json',d=>{d.patientDataIncluded=true;}],",
  "['patient data admission','public/atlas-runtime/shoulder/manifest.json',d=>{d.patientDataIncluded=false;}],");
 assert.notEqual(rewindDelivery(forgedRefusal),read(`${archived}current-atlas-delivery.test.mjs.raw`).toString());
});
