// Closed website53 evidence; manual recovery never admits this epoch as current.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {validateRevision53Supplement} from './closed53-source-supplement.mjs';
import {readExactGit53TextBatch,REVISION53_ATLAS_TREE,
 validateRevision53Completion} from './closed53-complete-source.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const site=new URL('../',import.meta.url);
const bytes=readFileSync(new URL('./fixtures/head-manual-recovery-53/epoch.json',import.meta.url));
assert.equal(sha(bytes),'963b7b46ee4215f91a47cf133a77a0d597613dea416b124c76f4d530dedfc11f');
export const revision53=JSON.parse(bytes);
assert.equal(revision53.schema,'vm-closed-delivery-json-text-epoch-1');
assert.equal(revision53.source,'6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb');
assert.equal(revision53.review,'533ddf192b09b191aef129223f0d10d87c9c18ba669d963b43d09f76ff6a2fc4');
assert.deepEqual(revision53.changedPriorInputs,['components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLinkedModel.tsx']);
assert.equal(revision53.files.length,26);
const records=new Map(revision53.files.map(row=>[row.path,row]));
assert.equal(records.size,26);
const supplementBytes=readFileSync(new URL('./fixtures/head-manual-recovery-53/supplement.json',import.meta.url));
assert.equal(sha(supplementBytes),'2031cd6e889c11563b5e95800d4e3f1763e6ed9d3f9b7a87dd864e026855ad6e');
const supplement=validateRevision53Supplement(JSON.parse(supplementBytes),bytes);
for(const [path,row] of supplement.records)records.set(path,row);
assert.equal(records.size,37);
const closureBytes=readFileSync(new URL('./fixtures/head-manual-recovery-53/website-text-closure.json',import.meta.url));
const closure=validateRevision53Completion(bytes,records,closureBytes);
const atlasPaths=new Set(closure.atlasRows.map(row=>row.path));
let atlasText;
function immutableAtlas53Text(){
 if(atlasText)return atlasText;
 const root=checkedAtlasHistoryRepo(revision53.source);
 const tree=execFileSync('git',['-C',root,'rev-parse',revision53.source+'^{tree}'],{
  encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
 }).trim();
 assert.equal(tree,REVISION53_ATLAS_TREE,'Exact historical Atlas6ba tree');
 atlasText=readExactGit53TextBatch(['-C',root],revision53.source,closure.atlasRows);
 return atlasText;
}

export function readRevision53(path){
  assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..'));
  const row=records.get(path);
  if(!row){
    const backup=closure.backup.get(path);
    if(backup)return Buffer.from(backup);
    if(closure.declared.has(path)){
      assert(atlasPaths.has(path),'Declared historical53 input lacks a closed source: '+path);
      const source=immutableAtlas53Text().get(path);
      assert(source,'Missing exact Atlas6ba text: '+path);
      return Buffer.from(source);
    }
    return readFileSync(new URL(path,site));
  }
  const frozen=Buffer.from(row.text,'utf8');
  assert.equal(frozen.length,row.bytes);assert.equal(sha(frozen),row.sha256,path+' frozen53');
  return frozen;
}

assert.equal(sha(readFileSync(new URL('./fixtures/closed56-validator/tests/current-atlas-delivery.mjs',import.meta.url))),'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62','Frozen schema1 validator changed');
export function validateRevision53Delivery(options={}){
  assert(Object.keys(options).every(key=>key==='pin'),'Historical53 scope is fixed');
  return validateHistoricalAtlasDelivery({pin:options.pin??JSON.parse(readRevision53('tests/fixtures/current-atlas-delivery.json')),read:readRevision53});
}
