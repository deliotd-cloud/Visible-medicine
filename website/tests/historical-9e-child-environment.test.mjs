import test from'node:test';import assert from'node:assert/strict';
import{historical9eChildEnvironment}from'./historical-9e-ui-replay.mjs';
test('historical native child retains only required system settings and refuses inherited runner, loaders, credentials and current source',()=>{
 const input={Path:'C:/synthetic/bin',SystemRoot:'C:/Windows',TEMP:'C:/synthetic/tmp',NODE_TEST_CONTEXT:'child-v8',NODE_OPTIONS:'--test-name-pattern=only --import=foreign.mjs',VM_ATLAS_SOURCE_REPO:'F:/wrong-current',ATLAS_SOURCE_REPO:'F:/wrong-current',DATABASE_URL:'synthetic-remote',OPENAI_API_KEY:'synthetic-not-a-key',VM_REVIEW_ROLE:'synthetic-admin'};
 const before=structuredClone(input),env=historical9eChildEnvironment(input);assert.deepEqual(input,before);assert.notEqual(env,input);assert.equal(env.Path,input.Path);assert.equal(env.SystemRoot,input.SystemRoot);assert.equal(env.TEMP,input.TEMP);
 for(const key of ['NODE_TEST_CONTEXT','DATABASE_URL','OPENAI_API_KEY','VM_REVIEW_ROLE'])assert.equal(Object.hasOwn(env,key),false,key);
 assert.equal(env.NODE_OPTIONS,'--max-old-space-size=256');assert.equal(env.VM_ATLAS_SOURCE_REPO,'F:/VisibleMedicine/staging/20261023-atlas-runtime-materialized/atlas');assert.equal(env.ATLAS_SOURCE_REPO,env.VM_ATLAS_SOURCE_REPO);assert.equal(env.GIT_NO_REPLACE_OBJECTS,'1');assert.equal(env.GIT_OPTIONAL_LOCKS,'0');assert.equal(env.NO_COLOR,'1');assert.equal(Object.keys(env).length,9);
});
