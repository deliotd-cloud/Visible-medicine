import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizePracticeLabel,typedLabelIsCorrect} from '../lib/head-atlas-practice.ts';
import {createHeadPracticeSummary,formatHeadPracticeSummary} from '../lib/head-practice-summary.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

function target(label='Left lateral ventricle — regional mask'):HeadEntry{
  return {id:'synthetic.target',label,family:'vnt',representation:'partial_mask',color:[1,0,0],opacity:{fill:.2,outline:.8},
    mask:{file:'synthetic-mask.bin',sha256:'a'.repeat(64),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:[1,1,1],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}};
}

test('typed recall tolerates capitalization, whitespace and punctuation without changing source data',()=>{
  const entry=target(),before=structuredClone(entry);
  for(const answer of ['Left lateral ventricle',' LEFT  LATERAL\nVENTRICLE ','left-lateral ventricle','left lateral ventricle.'])
    assert(typedLabelIsCorrect(entry,answer),answer);
  assert.deepEqual(entry,before);
  assert.equal(normalizePracticeLabel('mid–brain'),'mid brain');
  assert(typedLabelIsCorrect(target('Mid-brain'),'MID BRAIN'));
});

test('typed recall never strips laterality, numbers or anatomical qualifiers',()=>{
  for(const answer of ['Right lateral ventricle','lateral ventricle','left ventricle','left lateral ventricles','left lateral ventricel','L lateral ventricle','ventricule latéral gauche','lateral ventricle left'])
    assert.equal(typedLabelIsCorrect(target(),answer),false,answer);
  assert.equal(typedLabelIsCorrect(target('Third ventricle'),'fourth ventricle'),false);
  assert.equal(typedLabelIsCorrect(target('C1 vertebra'),'C2 vertebra'),false);
  assert.equal(typedLabelIsCorrect(target('Globus pallidus'),'pallidum'),false,'unreviewed synonyms are not invented');
  assert.equal(typedLabelIsCorrect(target('A-B'),'ab'),false,'punctuation never concatenates words');
});

test('empty, punctuation-only and overlong typed answers cannot pass',()=>{
  for(const answer of ['','   ','—...()','Left lateral ventricle'+' '.repeat(201)])assert.equal(typedLabelIsCorrect(target(),answer),false);
  assert.equal(typedLabelIsCorrect(target('regional mask'),'...'),false);
  assert.equal(typedLabelIsCorrect(target(), 'left lateral ventricle💡'),false,'symbols are not punctuation');
});

test('recall completion summary records mode and scores, never free text, source labels or filenames',()=>{
  const entry=target('PRIVATE_SOURCE_LABEL'),submittedText='PRIVATE_TYPED_RESPONSE';
  const args={items:[{entry,outcome:'incorrect' as const,answer:submittedText}],entries:[entry],modality:'CT' as const,revision:HEAD_LINK_REVISION,mode:'recall' as const};
  const summary=createHeadPracticeSummary(args),text=formatHeadPracticeSummary(summary);
  assert.equal(summary.mode,'recall');assert.equal(summary.current.incorrect,1);
  assert.match(text,/Mode: recall/);
  for(const privateText of [entry.label,entry.mask!.file,submittedText]){
    assert(!text.includes(privateText));assert(!JSON.stringify(summary).includes(privateText));
  }
  assert.throws(()=>createHeadPracticeSummary({...args,mode:'unknown' as any}));
});
