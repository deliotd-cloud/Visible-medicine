// Exact, fixture-bound inverse from the current dental proposal to preserved
// historical spinal test byte sources. No test is disabled or regenerated.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const stages=[
  {name:'tongue-palate',before:'3824e78ca19ff6f1a2745232142b9df53278393afdcf8a2e50cea82e0cd5b865',
    after:'44e3040697f129b5779b4acd0fae30feff9f7e223817ca96addbd23ec025992b',
    patch:'01-tongue-palate.patch.raw',patchSha:'c0b2f371ca8f918a5c5ebebbea0a40039ac9e4c3aa2dc025693c3951d0d0c144'},
  {name:'ileocolic',before:'44e3040697f129b5779b4acd0fae30feff9f7e223817ca96addbd23ec025992b',
    after:'8cb7c6d1d9776f405401fc71a9225b96ceb82427e8da24091017f8211ac15d44',
    patch:'02-ileocolic.patch.raw',patchSha:'ad6e3d2a0d6b331d7e273cc95e81edf1bfed54d85c3c2d222e0bf15194429a78'},
  {name:'corpus-current',before:'8cb7c6d1d9776f405401fc71a9225b96ceb82427e8da24091017f8211ac15d44',
    after:'af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13',
    patch:'03-corpus-current.patch.raw',patchSha:'ff3a9d6a93c7a4053b611e21abad10603bbad42471a8406a9d738f6de97c6519'},
  {name:'corpus-ct',before:'af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13',
    after:'c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa',
    patch:'04-corpus-ct.patch.raw',patchSha:'d9cc55c0486228e18a8b768596a17c578e42caf7d7e4b5e0a98293d0e1210cc2'},
  {name:'ct-save',before:'c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa',
    after:'075354d9e1da283b5209c39478eb89e6f5fc9243441d0cd25701f84f43ea564a',
    patch:'05-ct-save.patch.raw',patchSha:'fe2b28f5b14c26bbffd869965542c9bab13f955cc97ad3f094acc8165bd960ba'},
  {name:'dental',before:'075354d9e1da283b5209c39478eb89e6f5fc9243441d0cd25701f84f43ea564a',
    after:'6c202daf177a84a4cfd210673dd8a3975bc47cd77bcd47754139a9bffd6bdddc',
    patch:'06-dental.patch.raw',patchSha:'dcf154ab70f4b1a0df353d816ab227814471d189179d254f58ffafbeb2e42dcd'},
];

function exactLf(bytes,label){
  const value=bytes.toString('utf8');
  assert.deepEqual(Buffer.from(value,'utf8'),bytes,`${label} lossless UTF-8`);
  assert(!value.includes('\r'),`${label} LF byte source`);
  return value.split('\n');
}

function invertPatch(currentBytes,patchBytes,name){
  const current=exactLf(currentBytes,`${name} postimage`);
  const patch=exactLf(patchBytes,`${name} reviewed patch`);
  assert.match(patch[0],/^diff --git a\/.+ b\/.+$/);
  assert.match(patch[1],/^index [a-f0-9]+\.\.[a-f0-9]+ 100644$/);
  assert.match(patch[2],/^--- a\/.+$/);
  assert.match(patch[3],/^\+\+\+ b\/.+$/);
  let cursor=0,i=4,hunks=0;
  const old=[];
  while(i<patch.length&&patch[i]){
    const head=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(patch[i++]);
    assert.ok(head,`${name} bounded unified hunk`);
    const oldStart=Number(head[1])-1,oldCount=Number(head[2]??1);
    const newStart=Number(head[3])-1,newCount=Number(head[4]??1);
    assert.ok(newStart>=cursor&&newStart<=current.length,`${name} ordered hunk`);
    old.push(...current.slice(cursor,newStart));cursor=newStart;
    assert.equal(old.length,oldStart,`${name} historical hunk position`);
    let consumed=0,produced=0;
    while(i<patch.length&&patch[i]&&!patch[i].startsWith('@@')){
      const line=patch[i++],mode=line[0],value=line.slice(1);
      assert.ok(mode===' '||mode==='-'||mode==='+',`${name} patch line`);
      if(mode!== '-'){
        assert.equal(current[cursor++],value,`${name} exact current line`);
        consumed++;
      }
      if(mode!=='+'){old.push(value);produced++;}
    }
    assert.equal(consumed,newCount,`${name} complete postimage hunk`);
    assert.equal(produced,oldCount,`${name} complete historical hunk`);
    hunks++;
  }
  assert.ok(hunks>0,`${name} has a reviewed change`);
  assert.ok(patch.slice(i).every(line=>line===''),`${name} no trailing patch data`);
  old.push(...current.slice(cursor));
  return Buffer.from(old.join('\n'),'utf8');
}

function inverseStage(bytes,stage){
  assert.equal(sha(bytes),stage.after,`${stage.name} exact postimage`);
  const patch=readFileSync(new URL(`./fixtures/${stage.patch}`,import.meta.url));
  assert.equal(sha(patch),stage.patchSha,`${stage.name} exact reviewed patch bytes`);
  const previous=invertPatch(bytes,patch,stage.name);
  assert.equal(sha(previous),stage.before,`${stage.name} complete original byte preimage`);
  return previous;
}

export function inverseCurrentDental(bytes){
  return inverseStage(bytes,stages.at(-1));
}

export function inverseCurrentToLaterSix(bytes){
  let previous=bytes;
  for(const stage of [...stages].reverse())previous=inverseStage(previous,stage);
  const preserved=readFileSync(new URL('./fixtures/spinal-later-six-current-3824.mjs.raw',import.meta.url));
  assert.equal(sha(preserved),stages[0].before,'preserved exact 3824 historical source');
  assert.deepEqual(previous,preserved,'all current feature inverses restore full later-six source');
  return previous;
}
