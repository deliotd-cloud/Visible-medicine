import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {runOriginalRole} from './deepbrain-foot-roles.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalRootSha='d42378e9cc4ecac90ec12ba2faa52cdfda667e9d38fc653c3350aec740807c60';
const source=path.join(path.dirname(fileURLToPath(import.meta.url)),'atlas-deep-brain-practice.test.ts');
const baseline='F:/VisibleMedicine/staging/20261025-original-reader-worktrees';
const currentNative='F:/VisibleMedicine/atlas';
const historicalNative='G:/VisibleMedicine-temp/proposals/20261031-release-partition8-repair/historical-native';
const historicalHead='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const historicalTree='e9165d7122361f809a267af1414b337b69097fe2';
const expected={
  VM_DBFOOT_BASELINE:baseline,
  VM_DBFOOT_DEEP_WEBSITE:path.join(baseline,'deep-brain/website'),
};
function git(root,...args){return execFileSync('git',['--no-replace-objects','-C',root,...args],{encoding:'utf8',windowsHide:true}).trim();}
function proveCurrentAssertionsRetained(){
  let text=fs.readFileSync(source,'utf8');
  const seams=[
    ["import {runDeepBrainHistoricalRole} from './deep-brain-history-role.mjs';","import {runOriginalRole} from './deepbrain-foot-roles.mjs';"],
    ["await runDeepBrainHistoricalRole();","await runOriginalRole('deep-brain');"],
  ];
  for(const [newText,oldText] of seams){
    assert.equal(text.split(newText).length,2,`One exact deep-brain seam: ${newText}`);
    text=text.replace(newText,oldText);
  }
  assert.equal(sha(Buffer.from(text)),originalRootSha,'All three current cases and original child case retained exactly');
}
export async function runDeepBrainHistoricalRole(){
  proveCurrentAssertionsRetained();
  const dedicated=process.env.VM_DEEP_BRAIN_HISTORY_NATIVE??historicalNative;
  assert.equal(fs.realpathSync(dedicated),fs.realpathSync(historicalNative),'No crossed dedicated historical native context');
  assert.equal(fs.realpathSync(git(historicalNative,'rev-parse','--show-toplevel')),fs.realpathSync(historicalNative));
  assert.equal(git(historicalNative,'rev-parse','HEAD'),historicalHead);
  assert.equal(git(historicalNative,'rev-parse','HEAD^{tree}'),historicalTree);
  assert.equal(git(historicalNative,'status','--porcelain'),'','Historical native must be clean');
  const outer=process.env.VM_DBFOOT_NATIVE;
  if(outer!==undefined){
    assert.equal(fs.realpathSync(outer),fs.realpathSync(currentNative),'No crossed outer current native context');
    const currentPin=JSON.parse(fs.readFileSync(new URL('./fixtures/current-atlas-delivery.json',import.meta.url)));
    assert.equal(git(currentNative,'rev-parse','HEAD'),currentPin.source,'Outer current native must match current delivery');
  }
  const previous={};
  for(const [key,value] of Object.entries(expected)){
    assert.equal(fs.realpathSync(value),path.resolve(value),`Historical context exists: ${key}`);
    const supplied=process.env[key];
    if(supplied!==undefined)assert.equal(fs.realpathSync(supplied),fs.realpathSync(value),`No crossed historical context: ${key}`);
    previous[key]=supplied;
  }
  previous.VM_DBFOOT_NATIVE=outer;
  try{
    for(const [key,value] of Object.entries(expected))process.env[key]=value;
    process.env.VM_DBFOOT_NATIVE=historicalNative;
    const result=await runOriginalRole('deep-brain');
    assert.deepEqual(result.counts,{tests:1,pass:1,fail:0,cancelled:0,skipped:0,todo:0});
    proveCurrentAssertionsRetained();
    return result;
  }finally{
    for(const [key,value] of Object.entries(previous)){
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    }
  }
}
