import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const current=readFileSync(new URL('./studio-draft-scope.test.mjs',import.meta.url),'utf8');
function original(source){
 assert.equal(sha(source),'a84450de92e506488d78abc89a447f4e153e083043cedc4847d26962a8f12be3');
 const now="import {loadStudioDraftDependencies} from './studio-outline-draft-dependency-source.mjs';";
 const before="import {loadStudioDraftDependencies} from './studio-draft-dependency-source.mjs';";
 assert.equal(source.split(now).length,2);const restored=source.replace(now,before);
 assert.equal(sha(restored),'c4a1d318449ee3ff102a0e2ff1f20c6d784a6318a1d59ab9c2487ae7ee12601e');return restored;
}
test('all original draft-scope assertions remain byte-identical apart from the exact loader import',()=>{
 original(current);
 const helper=readFileSync(new URL('./studio-outline-draft-dependency-source.mjs',import.meta.url));
 assert.equal(sha(helper),'0e25e6cde83e320e4a84f9c99d7918867546564f1e7e4fd4c1948ec1ec374603');
});
test('changed recovery assertions and unbound imports cannot pass the source-role proof',()=>{
 const changed=current.replace("scopeModule = compile('lib/studio-draft-scope.ts')","scopeModule = {}");assert.notEqual(changed,current);
 assert.throws(()=>original(changed));assert.throws(()=>original(current+'\n// unrelated\n'));
 assert.throws(()=>original(original(current)));
});
