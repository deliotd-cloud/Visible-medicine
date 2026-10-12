import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {regionalTeachingOutputs, checkRegionalTeachingOutputs} from './regional-teaching-snapshots.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const {outputs}=await regionalTeachingOutputs();
const path=[...outputs.keys()].find(path=>path.endsWith('/abdomen.json'));
const original=JSON.parse(outputs.get(path));
function filesystem(files, extra=[]) {
  return {
    async read(path) {
      const key=relative(root,path).replaceAll('\\','/');
      if(!files.has(key))throw Object.assign(Error('Missing snapshot'),{code:'ENOENT'});
      return files.get(key);
    },
    async list(directory) {
      assert.equal(directory,resolve(root,'content/regional-teaching'));
      return [...files.keys()].filter(key=>key.startsWith('content/regional-teaching/')).map(key=>key.split('/').at(-1)).concat(extra);
    },
  };
}
test('normal build freshness checker accepts exactly regenerated complete output',async()=>{
  await checkRegionalTeachingOutputs(outputs,filesystem(outputs));
});
test('normal build freshness checker refuses altered teaching, identities, fields and importer map',async()=>{
  let refused=0;
  for(const mutate of [
    snapshot=>{snapshot.entries[0].lessons.anatomy.body+=' foreign';},
    snapshot=>{snapshot.entries[0].identity+='-foreign';},
    snapshot=>{delete snapshot.entries[0].lessons.quiz.correctAnswer; snapshot.entries[0].lessons.quiz.correctAnswer='foreign';},
    snapshot=>{snapshot.entries.pop();},
    snapshot=>{snapshot.entries.push(snapshot.entries[0]);},
    snapshot=>{snapshot.region='head-neck';},
    snapshot=>{snapshot.undefinedPaths.push(['entries',0,'lessons','quiz','missing']);},
  ]) {
    const files=new Map(outputs),snapshot=structuredClone(original);mutate(snapshot);
    files.set(path,JSON.stringify(snapshot)+'\n');
    await assert.rejects(checkRegionalTeachingOutputs(outputs,filesystem(files)),/Stale regional teaching/);refused++;
  }
  const files=new Map(outputs);files.set('lib/regional-teaching-imports.ts',files.get('lib/regional-teaching-imports.ts')+'// foreign\n');
  await assert.rejects(checkRegionalTeachingOutputs(outputs,filesystem(files)),/Stale regional teaching/);refused++;
  assert.equal(refused,8);
});
test('missing and extra regional files cannot silently disappear from build checks',async()=>{
  const files=new Map(outputs);files.delete(path);
  await assert.rejects(checkRegionalTeachingOutputs(outputs,filesystem(files)),{code:'ENOENT'});
  await assert.rejects(checkRegionalTeachingOutputs(outputs,filesystem(outputs,['foreign.json'])),/Unexpected regional teaching files/);
});
