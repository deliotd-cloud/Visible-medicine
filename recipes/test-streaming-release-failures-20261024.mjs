import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {failureCollector,observeTap} from './streaming-release-failures-20261024.mjs';

// Exact previous parser is retained here as the comparison oracle, not repinned.
const legacy=bytes=>bytes.toString().split(/(?=^not ok \d+ - )/m).slice(1).map(block=>{
 const header=block.split('\n')[0],body=block.split(/^  \.\.\.\s*$/m)[0];
 const location=body.match(/^  location: (.*)$/m)?.[1]??null;
 return {title:header.replace(/^not ok \d+ - /,''),location,root:location?.match(/tests(?:\\\\|\\|\/)([^'\n]+?\.test\.(?:mjs|ts))/)?.[1]??null,errorCode:body.match(/^  code: (.*)$/m)?.[1]??null,error:body.match(/^  error: (.*)$/m)?.[1]??null,differences:body.match(/^    [+-].*$/mg)?.slice(0,12)??[]};
});
const parse=text=>{const c=failureCollector();for(const line of text.split('\n'))c.line(line);return c.finish();};
const sample = 'TAP version 13\n# a title\n    not ok 1 - nested is not an outer failure\nnot ok 2 - actual échec\n  ---\n  location: \'F:\\\\app\\\\tests\\\\example.test.ts:3:4\'\n  error: |\n    - old\n    + new\n  code: \'ERR_ASSERTION\'\n  ...\nok 3 - pass\nnot ok 4 - incomplete failure\n  error: \'unfinished\'';

test('streamed failure fields match the exact old parser on LF, CRLF and incomplete blocks',()=>{
  for(const text of [sample,sample.replaceAll('\n','\r\n'),sample+'\n',
    'ok 1 - only pass\n', 'TAP version 13\nnot ok 1 - no diagnostic\nnot ok 2 - another\n',
    sample.replace('  ...','  ...  ')]) assert.deepEqual(parse(text),legacy(Buffer.from(text)));
});
test('the first diagnostic, first fields and original twelve-difference cap remain exact',()=>{
  const text='TAP version 13\nnot ok 1 - many\n  error: first\n  error: second\n  code: A\n  code: B\n'+
    Array.from({length:20},(_,i)=>'    + difference '+i).join('\n')+'\n  ...\n  error: ignored\n    + ignored\n';
  assert.deepEqual(parse(text),legacy(Buffer.from(text))); assert.equal(parse(text)[0].differences.length,12);
});
test('a failure at byte zero is retained rather than silently omitted by the legacy split',()=>{
  const text='not ok 1 - first\n  error: first error\n  ...\nnot ok 2 - second\n';
  assert.equal(legacy(Buffer.from(text)).length,1);
  const actual=parse(text); assert.equal(actual.length,2);
  assert.equal(actual[0].title,'first'); assert.equal(actual[0].error,'first error');
  assert.deepEqual(actual.slice(1),legacy(Buffer.from(text)));
});
test('actual UTF8 file prefix and sha are preserved across chunk boundaries without whole-file buffering',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vm-stream-tap-'));
  const file=path.join(dir,'fixture.tap');
  try {
    const bytes=Buffer.from('x'.repeat(65530)+'é\n'+sample+'\n'); fs.writeFileSync(file,bytes,{flag:'wx'});
    const result=await observeTap(file);
    assert.equal(result.prefixBytes,bytes.length);
    assert.equal(result.prefixSha256,createHash('sha256').update(bytes).digest('hex'));
    assert.deepEqual(result.failures,legacy(bytes)); assert.equal(result.terminalCoverageClaim,false);
  } finally {
    // Exactly the synthetic file and verified temporary directory created here.
    assert(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));
    fs.unlinkSync(file); fs.rmdirSync(dir);
  }
});
