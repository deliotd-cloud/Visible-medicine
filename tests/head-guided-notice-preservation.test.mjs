import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {guidedNoticeCurrentSha256,guidedNoticePriorSha256,guidedNoticeSeams,restoreHeadGuidedNoticeRole} from './head-guided-notice-test-role.mjs';
import {restoreConsumerAccessLaterRole} from './live-learning-consumer-access-later-inverse.mjs';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const current=()=>read('./head-guided-model.test.ts');
const original=()=>read('./fixtures/head-guided-notice-before/head-guided-model.test.ts.raw');

test('guided notice projection authenticates both full versions and preserves the original access test',()=>{
  assert.equal(sha(current()),guidedNoticeCurrentSha256);
  assert.equal(sha(original()),guidedNoticePriorSha256);
  assert.equal(restoreHeadGuidedNoticeRole(current()),original());
  assert.equal(restoreHeadGuidedNoticeRole(original()),original());
  assert.equal(restoreConsumerAccessLaterRole('head-guided-model.test.ts',current()),restoreConsumerAccessLaterRole('head-guided-model.test.ts',original()));
});

test('guided notice projection rejects missing, duplicated, changed and undeclared source',()=>{
  for(const seam of guidedNoticeSeams){
    assert.throws(()=>restoreHeadGuidedNoticeRole(current().replace(seam.current,'')));
    assert.throws(()=>restoreHeadGuidedNoticeRole(current()+seam.current));
    assert.throws(()=>restoreHeadGuidedNoticeRole(current().replace(seam.current,seam.current+'// changed\n')));
  }
  for(const text of [current()+'\n// forged\n',original()+' ',current().replace("'sign-in','access-denied'","'unavailable','access-denied'"),current().replace("assert.equal(nav().comparisonReady,false)","assert.equal(nav().comparisonReady,true)")])assert.throws(()=>restoreHeadGuidedNoticeRole(text));
});

test('access inverse retains every original assertion with only the exact guided reader addition',()=>{
  const prior=read('./fixtures/head-guided-notice-before/live-learning-consumer-access-later-inverse.mjs.raw');
  assert.equal(sha(prior),'491f8e24f39a281b1a16d34c36856e9626983935dcd5eac3e13af484a688b6ff');
  const seams=["import {restoreHeadGuidedNoticeRole} from './head-guided-notice-test-role.mjs';\n","  if(name==='head-guided-model.test.ts')text=restoreHeadGuidedNoticeRole(text);\n"];
  const inverse=text=>{for(const seam of seams){assert.equal(text.split(seam).length,2);text=text.replace(seam,'');}assert.equal(text,prior);};
  const source=read('./live-learning-consumer-access-later-inverse.mjs');inverse(source);
  for(const seam of seams){assert.throws(()=>inverse(source.replace(seam,'')));assert.throws(()=>inverse(source+seam));}
  assert.throws(()=>inverse(source.replace('assert.equal(sha(prior),role.priorLoaderSha256','assert.notEqual(sha(prior),role.priorLoaderSha256')));
});
