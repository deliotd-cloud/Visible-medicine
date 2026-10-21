import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const tests=dirname(fileURLToPath(import.meta.url));
const fixtures=resolve(tests,'fixtures/body-lecture-links');
const originals=[
  ['lecture-anatomy-integration.test.ts','186b6b79f718a9f8310230b08e0b4c336ce43ad75589e9c5d10fe2ab77657b01',1],
  ['lecture-multi-anatomy-repository.test.ts','ce16f6b5a647e8d8578ca9e738b0cf096d64b449ab7ed19b2d4d413b086d2052',1],
  ['lecture-repository.test.ts','d57df851e97afb4c292f2b80e400b5df9c4f72fc5ecb6aa715b8b2c86aa55c0e',1],
  ['related-lectures.test.ts','eae79ef9264b91359dfeb1819f369d21f06c3515b5fff8f365b4f2c7f2b45c75',2],
];
const digest=value=>createHash('sha256').update(value).digest('hex');

for(const [name,expectedHash,mockCount] of originals)test(`${name} preserves its entire original except the body mock adapter`,()=>{
  const rawBytes=readFileSync(resolve(fixtures,`${name}.raw`));
  assert.equal(digest(rawBytes),expectedHash,'The immutable original test changed');
  const raw=rawBytes.toString('utf8');
  const candidate=readFileSync(resolve(tests,name),'utf8');
  const newline=raw.includes('\r\n')?'\r\n':'\n';
  const importLine=`import * as lectureBody from '../lib/lecture-body-reference.ts';${newline}`;
  const mockLine=`    './lecture-body-reference.ts':lectureBody,${newline}`;
  assert.equal(candidate.split(importLine).length-1,1,'Exactly one body module import is allowed');
  assert.equal(candidate.split(mockLine).length-1,mockCount,'Every declared repository mock must be present');
  const inverse=candidate.replace(importLine,'').replaceAll(mockLine,'');
  assert.equal(inverse,raw,'The complete existing test source and assertions must be preserved');
});
