import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {CURRENT_ATLAS_REVISION, validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const original = readFileSync(new URL('./fixtures/atlas-spinal-muscle-xray.original.txt', import.meta.url));
const admitted = readFileSync(new URL('./fixtures/atlas-spinal-muscle-xray.current-admitted.mjs.raw', import.meta.url));
const reviewedPatch = readFileSync(new URL('./fixtures/atlas-spinal-muscle-xray.later-transition.patch.raw', import.meta.url));
const active = readFileSync(new URL('./fixtures/atlas-spinal-muscle-xray-before-lifecycle.mjs.raw', import.meta.url));
const originalHash = '0ce0e885d7bc80bf2888d03a281a9395761d3657bd860d9ad4f3d1df791e5212';
const admittedHash = '5834efdacb2a38d559c98c7a5deb2faab93610296ea7c05e42edc574010f0410';
const activeHash = '8280e9d6e879906ee8e206caa02acdd0718d3fb06e36c1ba77aae1a179b4f7e5';
const reviewedPatchHash = '51219faa1dea15fda282f1ce17fa6ccbb5cd6c9d53de652229ca6d0f3eb217c7';
const before = "assert.equal(source.source, '589263554141ba94548f9073327d4e51674bc33b', 'exact current Atlas epoch');";
const after = "assert.equal(source.source, CURRENT_ATLAS_REVISION, 'exact current Atlas epoch');";
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function verifyAdmission(originalBytes, admittedBytes) {
  assert.equal(sha(originalBytes), originalHash, 'Exact pre-repair historical proof');
  const text = originalBytes.toString('utf8');
  assert.deepEqual(Buffer.from(text, 'utf8'), originalBytes, 'Lossless UTF-8 original');
  assert.equal(text.split(before).length - 1, 1, 'Unique current-admission substitution');
  const expected = Buffer.from(text.replace(before, after), 'utf8');
  assert.equal(sha(admittedBytes), admittedHash, 'Reviewed original current-admission postimage');
  assert.deepEqual(admittedBytes, expected,
    'Every other historical epoch, source input, emitted, negative and clinical assertion remains byte-exact');
}

test('spinal X-ray historical proof has only one current-admission substitution', () => {
  verifyAdmission(original, admitted);
  assert.throws(() => verifyAdmission(Buffer.from(original.toString('utf8').replace('const priorSource', 'const alteredPriorSource')), admitted));
  assert.throws(() => verifyAdmission(original, Buffer.from(admitted.toString('utf8').replace('const priorSource', 'const alteredPriorSource'))));
});

// Apply one reviewed, pinned unified diff to the exact admitted file. This
// checks every retained line as well as every added and removed line.
function applyReviewedPatch(baseBytes,patchBytes){
  assert.equal(sha(baseBytes),admittedHash,'Exact current-admission predecessor');
  assert.equal(sha(patchBytes),reviewedPatchHash,'Exact reviewed later-transition diff');
  const patch=patchBytes.toString('utf8').split('\n');
  const path='tests/atlas-spinal-muscle-xray.test.mjs';
  assert.equal(patch[0],`diff --git a/${path} b/${path}`);
  assert.match(patch[1],/^index [a-f0-9]+\.\.[a-f0-9]+ 100644$/);
  assert.equal(patch[2],`--- a/${path}`);
  assert.equal(patch[3],`+++ b/${path}`);
  const base=baseBytes.toString('utf8').split('\n'),out=[];
  let cursor=0,i=4,hunks=0;
  while(i<patch.length&&patch[i]){
    const head=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(patch[i++]);
    assert.ok(head,'Only bounded unified diff hunks are allowed');
    const oldStart=Number(head[1])-1,oldCount=Number(head[2]??1);
    const newStart=Number(head[3])-1,newCount=Number(head[4]??1);
    assert.ok(oldStart>=cursor&&oldStart<base.length);
    out.push(...base.slice(cursor,oldStart));cursor=oldStart;
    assert.equal(out.length,newStart,'Hunk new position');
    let consumed=0,produced=0;
    while(i<patch.length&&patch[i]&&!patch[i].startsWith('@@')){
      const line=patch[i++],mode=line[0],value=line.slice(1);
      assert.ok(mode===' '||mode==='-'||mode==='+','Unexpected patch line');
      if(mode!=='+') { // context and removal must match exact predecessor text
        assert.equal(base[cursor++],value,'Pinned predecessor line');consumed++;
      }
      if(mode!=='-'){out.push(value);produced++;}
    }
    assert.equal(consumed,oldCount,'Exact old hunk extent');
    assert.equal(produced,newCount,'Exact new hunk extent');
    hunks++;
  }
  assert.ok(hunks>0);
  assert.ok(patch.slice(i).every(line=>line===''),'No unreviewed trailing patch data');
  out.push(...base.slice(cursor));
  return Buffer.from(out.join('\n'),'utf8');
}

function verifyExpanded(admittedBytes,patchBytes,activeBytes){
  const expected=applyReviewedPatch(admittedBytes,patchBytes);
  assert.equal(sha(activeBytes),activeHash,'Reviewed expanded transition postimage');
  assert.deepEqual(activeBytes,expected,'All expanded assertions equal reviewed exact diff');
}

test('spinal later transitions preserve the original admitted proof and exact reviewed diff',()=>{
  verifyAdmission(original,admitted);
  verifyExpanded(admitted,reviewedPatch,active);
  const changed=(from,to)=>Buffer.from(active.toString('utf8').replace(from,to));
  for(const [from,to] of [
    ['assert.equal(preserved, 9836)','assert.equal(preserved, 9818)'],
    ['same(footAtCommit.bodyLesson(structure,tab),evidenceRow.previous',
      'same(footAtCommit.bodyLesson(structure,tab),evidenceRow.modifiedPrevious'],
    ['assert.equal(historicalLesson.readiness,\'pending\',`${structure.id} MRI predecessor pending`)',
      'assert.equal(historicalLesson.readiness,\'draft\',`${structure.id} MRI predecessor pending`)'],
    ['tamper refused','tamper accepted'],
    ['clinicalApproval: false','clinicalApproval: true'],
  ]){
    assert.ok(active.toString('utf8').includes(from),`Negative control exists: ${from}`);
    assert.throws(()=>verifyExpanded(admitted,reviewedPatch,changed(from,to)),`Reject ${from}`);
  }
  assert.throws(()=>verifyExpanded(Buffer.from(admitted.toString('utf8').replace('const priorSource','const alteredPriorSource')),reviewedPatch,active));
  assert.throws(()=>verifyExpanded(admitted,Buffer.from(reviewedPatch.toString('utf8').replace('9836','9818')),active));
});

test('spinal X-ray current admission follows the closed delivery contract', () => {
  const pin = validateCurrentAtlasDelivery();
  assert.equal(pin.source, CURRENT_ATLAS_REVISION);
  const stale = structuredClone(pin);
  stale.source = '589263554141ba94548f9073327d4e51674bc33b';
  assert.throws(() => validateCurrentAtlasDelivery({pin: stale}));
});
