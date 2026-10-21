import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const root=fileURLToPath(new URL('..',import.meta.url));
function ignored(paths){
 const result=spawnSync('git',['check-ignore','--no-index','--stdin'],{cwd:root,input:paths.join('\n')+'\n',encoding:'utf8',windowsHide:true});
 assert([0,1].includes(result.status),result.stderr);
 return result.stdout.trim().split(/\r?\n/).filter(Boolean);
}
test('private local storage, environment and runtime caches stay outside source commits',()=>{
 const paths=['.wrangler/state/v3/d1/example.sqlite','.wrangler/state/v3/r2/objects/example','.local/reviews.json','.env','.env.local','node_modules/example','dist/client/example.js','.vinext/server/example.js','example.tsbuildinfo'];
 assert.deepEqual(ignored(paths),paths);
});
test('actual application, tests and safe environment template remain recoverable source',()=>{
 assert.deepEqual(ignored(['.gitignore','app/layout.tsx','scripts/local-r2-persistence.mjs','tests/local-r2-persistence.test.mjs','.env.example']),[]);
});
