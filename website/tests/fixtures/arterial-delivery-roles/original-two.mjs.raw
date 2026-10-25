import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import test from 'node:test';

const proposal=fileURLToPath(new URL('./atlas-arterial-evidence-limits.test.mjs',import.meta.url));
const preimage=fileURLToPath(new URL('./fixtures/atlas-arterial-evidence-limits.preimage.mjs.raw',import.meta.url));
const website='F:/VisibleMedicine/website';
const atlas='F:/VisibleMedicine/atlas';
const read=path=>readFileSync(path);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const oldLine1='assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);';
const oldLine2='assert.equal(row.sourceCommit,CURRENT_ATLAS_REVISION);';
const newLine1='assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);';
const newLine2='assert.equal(row.sourceCommit,pin.runtimeSources[name]);';
const marker="\ntest('original arterial Website contract survives the exact pre-MRA feature retention adapter'";
const source='0ac11ca2eb8effe47f2b6927f7987a9a36c7e3a2';
const feature='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
const historical='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const current='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
const {validateCurrentAtlasDelivery}=await import(pathToFileURL(website+'/tests/current-atlas-delivery.mjs').href);

test('staged arterial epoch edits preserve the complete original inverse',()=>{
  const staged=read(proposal).toString(),before=read(preimage).toString();
  assert.equal(sha(read(preimage)),'f2c10d8ced49d7049860487cc202c12ed3725b96863cdea1e3b74745588aede6');
  assert.equal(staged.split(marker).length,2);
  assert.equal(before.split(marker).length,2);
  const stagedPrefix=staged.slice(0,staged.indexOf(marker));
  const beforePrefix=before.slice(0,before.indexOf(marker));
  assert.equal(stagedPrefix.split(newLine1).length,2);
  assert.equal(stagedPrefix.split(newLine2).length,2);
  assert.equal(stagedPrefix.replace(newLine1,oldLine1).replace(newLine2,oldLine2),beforePrefix);
  const original=read(website+'/tests/fixtures/atlas-arterial-evidence-limits.before-mra-6036.mjs.raw');
  assert.equal(sha(original),'d44aca96fd00b8b4ee926434acde3423ba2ca9d67197db3410f2e54908605627');
  const replacement="    same(git(atlas,'show',`6036a7a59dcc1fd75eee4a23af34ca2a568d86b6:${path}`),git(atlas,'show',`${source}:${path}`),`Feature source retained ${path}`);";
  const previous="    same(committed,git(atlas,'show',`${source}:${path}`),`Feature source retained ${path}`);";
  assert.equal(stagedPrefix.replace(newLine1,oldLine1).replace(newLine2,oldLine2)
    .replace(replacement,previous),original.toString());
});

test('strict current family roles, history and wrong-family refusal',()=>{
  const pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,current);
  assert.deepEqual(pin.runtimeSources,{'head-neck':current,shoulder:historical,
    'lower-limb':historical,'female-pelvis':historical});
  assert.equal(git('rev-parse','HEAD'),current);
  assert.equal(git('merge-base',historical,current),historical);
  assert.equal(git('merge-base',feature,historical),feature);
  assert.equal(git('merge-base',source,feature),source);
  const inventory=JSON.parse(read(website+'/lib/atlas-model-inventory.json'));
  for(const name of Object.keys(pin.runtimeSources)){
    const base=website+'/public/atlas-runtime/'+name+'/';
    const manifest=JSON.parse(read(base+'manifest.json'));
    const expected=pin.runtimeSources[name];
    assert.equal(manifest.sourceCommit,expected);
    assert.equal(inventory.sources.find(row=>row.module===name).sourceCommit,expected);
    const wrong=structuredClone(pin);wrong.runtimeSources[name]=name==='head-neck'?historical:current;
    assert.throws(()=>validateCurrentAtlasDelivery({pin:wrong}));
  }
});
