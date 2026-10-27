import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {transformSync} from 'esbuild';

const source=readFileSync(fileURLToPath(new URL('../lib/optional-learning-read.ts',import.meta.url)),'utf8');
const code=transformSync(source,{loader:'ts',format:'cjs',target:'es2022'}).code;
const module={exports:{}};
new Function('module','exports',code)(module,module.exports);
const {optionalLearningRead}=module.exports;

const transientMessages=[
  'D1_ERROR: Network connection lost.',
  'D1_ERROR: Replica disconnected from primary.',
  'D1_ERROR: D1 DB is overloaded. Requests queued for too long.',
  'D1_ERROR: D1 DB is overloaded. Too many requests queued.',
  'D1_ERROR: Cannot resolve D1 DB due to transient issue on remote node.',
  'D1_ERROR: D1 DB reset because its code was updated.',
];

for(const message of transientMessages){
  test(`returns null for documented transient D1 error: ${message}`,async()=>{
    const failure=new Error(message);
    let calls=0;
    const result=await optionalLearningRead(async()=>{calls++;throw failure;});
    assert.equal(result,null);
    assert.equal(calls,1);
  });
}

test('preserves successful values, including null, empty arrays, and object identity',async()=>{
  const array=[];
  const object={id:'course'};
  for(const value of [null,array,object]){
    let calls=0;
    const result=await optionalLearningRead(async()=>{calls++;return value;});
    assert.strictEqual(result,value);
    assert.equal(calls,1);
  }
});

test('rethrows unrelated errors and non-Errors by identity',async()=>{
  const errors=[
    new Error('D1_ERROR: no such table: progress'),
    new Error('D1_ERROR: UNIQUE constraint failed'),
    new Error('D1_ERROR: FOREIGN KEY constraint failed'),
    new Error('D1_ERROR: unauthorized'),
    new Error('NEXT_REDIRECT'),
    new Error('unknown failure'),
    {message:transientMessages[0]},
    'D1_ERROR: Network connection lost.',
  ];
  for(const failure of errors){
    await assert.rejects(optionalLearningRead(async()=>{throw failure;}),error=>error===failure);
  }
});

test('rejects superficially similar messages and prefixes or suffixes',async()=>{
  const errors=[
    new Error('Network connection lost.'),
    new Error(`prefix ${transientMessages[0]}`),
    new Error(`${transientMessages[0]} suffix`),
    new Error('D1_ERROR: Network connection lost'),
    new Error('D1_ERROR: network connection lost.'),
    new Error('D1_ERROR: Replica disconnected from primary. '),
  ];
  for(const failure of errors){
    await assert.rejects(optionalLearningRead(async()=>{throw failure;}),error=>error===failure);
  }
});

test('rethrows framework, metadata, cause, and custom-name errors unchanged',async()=>{
  const errors=[];
  for(const key of ['digest','status','statusCode','code']){
    const failure=new Error(transientMessages[0]);
    failure[key]=key==='digest'?'NEXT_REDIRECT':503;
    errors.push(failure);
  }
  const withCause=new Error(transientMessages[0],{cause:new Error('inner')});
  errors.push(withCause);
  const customName=new Error(transientMessages[0]);
  customName.name='D1Error';
  errors.push(customName);
  class CustomError extends Error{}
  errors.push(new CustomError(transientMessages[0]));
  for(const failure of errors){
    await assert.rejects(optionalLearningRead(async()=>{throw failure;}),error=>error===failure);
  }
});
