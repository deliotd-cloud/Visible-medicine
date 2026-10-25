import assert from 'node:assert/strict';
import test from 'node:test';
import {assertCompleteHraTap} from './hra-context-roles.mjs';
const valid='TAP version 13\nok 1 - original first case\nok 2 - original second case\n1..2\n# tests 2\n# pass 2\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
test('mandatory HRA historical children reject failed, incomplete or contradictory transport',()=>{
  const result={code:0,signal:null};assert.doesNotThrow(()=>assertCompleteHraTap(valid,result));
  for(const bad of [{code:1,signal:null},{code:0,signal:'SIGTERM'},{code:0,signal:null,error:'start failed'}])
    assert.throws(()=>assertCompleteHraTap(valid,bad));
  for(const text of [valid.replace('TAP version 13\n',''),valid+'TAP version 13\n',valid.replace('1..2\n',''),
    valid+'1..2\n',valid.replace('1..2\n','1..1\n'),valid.replace('ok 2 - original second case\n',''),
    valid.replace('ok 2','not ok 2'),valid.replace('ok 2','ok 1'),valid.replace('# pass 2','# pass 1'),
    valid+'# pass 2\n',valid.replace('# todo 0\n',''),valid.replace('# skipped 0','# skipped 1'),
    valid.replace('# todo 0','# todo 1'),valid.replace('ok 2 - original second case','ok 2 - original second case # SKIP'),
    valid+'    not ok 1 - hidden nested failure\n',valid+'    ok 1 - hidden nested point\n',valid+'Bail out! stopped\n',
    valid.replace('# pass 2\n','').replace('1..2\n','# pass 2\n1..2\n')])
    assert.throws(()=>assertCompleteHraTap(text,result));
});
