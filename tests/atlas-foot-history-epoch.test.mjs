import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {epochBytes,epochImportPlugin,epochReadFileSync,preFootWebsiteEpoch,readFileSync,spinalWebsiteEpoch,preSpinalWebsiteEpoch} from './atlas-foot-prior-epoch.mjs';

const gitBytes=(revision,path)=>execFileSync('git',['show',revision+':'+path],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
test('default historical replay remains exactly the saved pre-foot delivery after adding spinal epochs',()=>{
 for(const path of ['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json','atlas-review/content/body-review-display-pins.json','public/atlas-runtime/head-neck/manifest.json']){
  assert.deepEqual(epochBytes(path),gitBytes(preFootWebsiteEpoch,path));
  assert.deepEqual(readFileSync(path),epochReadFileSync(preFootWebsiteEpoch)(path));
 }
 let implicit,explicit;
 epochImportPlugin().setup({onLoad(_options,callback){implicit=callback;}});
 epochImportPlugin(preFootWebsiteEpoch).setup({onLoad(_options,callback){explicit=callback;}});
 for(const path of ['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json','atlas-review/content/body-review-display-pins.json']){
  const args={path:resolve(path)};
  assert.deepEqual(implicit(args),explicit(args));
  assert.equal(implicit(args).contents,gitBytes(preFootWebsiteEpoch,path).toString());
 }
 assert.equal(implicit({path:resolve('lib/atlas-delivery-policy.ts')}),undefined);
});
test('historical replay admits only fixed complete epochs and confined generated paths',()=>{
 for(const epoch of [preFootWebsiteEpoch,spinalWebsiteEpoch,preSpinalWebsiteEpoch]){
  const reader=epochReadFileSync(epoch),path='atlas-review/app/body-content.ts';
  assert.deepEqual(reader(path),gitBytes(epoch,path));
 }
 assert.throws(()=>epochImportPlugin('HEAD'),/Unrecognised website history epoch/);
 assert.throws(()=>epochReadFileSync('HEAD'),/Unrecognised website history epoch/);
 for(const path of ['atlas-review/../package.json','/atlas-review/manifest.json','atlas-review\\manifest.json','private/decisions.json'])assert.throws(()=>epochBytes(path));
});
