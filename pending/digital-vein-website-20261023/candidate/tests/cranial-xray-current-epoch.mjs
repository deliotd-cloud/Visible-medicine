// Test-only admission: historical identity and unchanged feature bytes are
// proved separately from the independently verified current delivery.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const website=fileURLToPath(new URL('../',import.meta.url));
export const cranialXrayPriorSource='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const priorTree='e9165d7122361f809a267af1414b337b69097fe2';
export const cranialXrayFeaturePaths=Object.freeze([
  'content/cerebral-arterial-quiz-pins.json',
  'public/models/bodyparts3d/cranial-arteries/catalog.json',
  'content/intracranial-arterial-xray.ts',
  'lib/intracranial-arterial-xray.ts',
]);

export function assertCranialXrayDeliveryEpoch(candidate){
  const current=validateCurrentAtlasDelivery();
  assert.deepEqual(candidate,current,'Only the independently verified current delivery');
  const atlas=currentAtlasDeliveryRoot();
  const git=(...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:8e6,
    env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(git('rev-parse',cranialXrayPriorSource+'^{tree}').toString().trim(),priorTree,
    'Original 6d7 source retains its complete exact historical tree');
  assert.equal(git('merge-base',cranialXrayPriorSource,current.source).toString().trim(),cranialXrayPriorSource,
    'Original feature delivery precedes the checked current source');
  for(const path of cranialXrayFeaturePaths){
    const original=git('show',cranialXrayPriorSource+':'+path);
    const now=git('show',current.source+':'+path);
    assert.deepEqual(now,original,path+': complete historical feature source retained');
    assert.deepEqual(readFileSync(atlas+'/'+path),now,path+': exact working source');
    assert.equal(readFileSync(website+'/atlas-review/'+path).toString().replaceAll('\r\n','\n'),
      now.toString().replaceAll('\r\n','\n'),path+': complete imported source retained');
  }
  return current.source;
}
