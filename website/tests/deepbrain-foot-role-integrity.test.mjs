import assert from 'node:assert/strict';
import test from 'node:test';
import {assertCompleteOriginal} from './deepbrain-foot-roles.mjs';

const tap=n=>'TAP version 13\n'+Array.from({length:n},(_,i)=>`ok ${i+1} - original ${i+1}\n`).join('')+`1..${n}\n# tests ${n}\n# pass ${n}\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n`;
test('complete original one/two-case evidence refuses transport errors, failed points, skips and forged or incomplete footers',()=>{
 for(const n of [1,2]){
  const text=tap(n),ok={code:0,signal:null};assert.equal(assertCompleteOriginal(ok,text,n).pass,n);
  for(const result of [{code:1,signal:null},{code:0,signal:'SIGTERM'},{code:0,signal:null,error:'ENOENT'},{code:null,signal:null}])assert.throws(()=>assertCompleteOriginal(result,text,n));
  for(const invalid of [text.replace('ok 1','not ok 1'),text+'    not ok 1 - nested failure\n',text.replace('original 1','original 1 # SKIP hidden'),text.replace('original 1','original 1 # TODO hidden'),text.replace('# fail 0','# fail 1'),text.replace('# cancelled 0','# cancelled 1'),text.replace('# skipped 0','# skipped 1'),text.replace('# todo 0','# todo 1'),text.replace('TAP version 13\n',''),text.replace('ok 1 - original 1\n',''),text.replace(`1..${n}\n`,''),text+`1..${n}\n`,text+`# pass ${n}\n`,text.replace(`# tests ${n}\n`,''),text+'Bail out!\n'])assert.throws(()=>assertCompleteOriginal(ok,invalid,n));
 }
});
