import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const originalBytes=readFileSync(new URL('./fixtures/authenticated-api-contract.before-context.txt',import.meta.url));
const original=originalBytes.toString('utf8').replace(/\r\n/g,'\n');
const current=readFileSync(new URL('./authenticated-api-contract.test.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const originalSha='b55cd814ce843d6586c6da5709fe6c8d80995806c0b9bd31714d0d334d245b55';
test('original six authentication bodies remain exact except context-input and stronger refusal assertions',()=>{
 assert.equal(createHash('sha256').update(originalBytes).digest('hex'),originalSha);
 const blocks=text=>text.split(/(?=^test\(')/m).slice(1);
 const before=blocks(original),after=blocks(current);assert.equal(before.length,6);assert.equal(after.length,10);
 const expected=before.map((body,index)=>{
  if(index===0)return body
   .replace('        assert.deepEqual(calls, [], `${name} must refuse before service or bootstrap`);','        assert.deepEqual(calls, [], `${name} must refuse before service or bootstrap`);\n        assert.deepEqual(contextCalls, [], `${name} must refuse before any Studio context database read`);')
   .replace('        assert.deepEqual(calls, [], `${name} mutation must refuse before service`);','        assert.deepEqual(calls, [], `${name} mutation must refuse before service`);\n        assert.deepEqual(contextCalls, [], `${name} mutation must refuse before any Studio context database read`);');
  if(index===1)return body.replace('routes[name].POST(post(name, body))',"routes[name].POST(post(name, name === 'studio' ? {...body, expectedStudioContext} : body))");
  return body;
 });
 for(let index=0;index<6;index++)assert.equal(after[index].trimEnd(),expected[index].trimEnd(),`original authentication body ${index+1}`);
 assert.match(current,/assert\.equal\(refused,360\)/);
});
