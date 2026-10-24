import assert from 'node:assert/strict';
import test from 'node:test';
import {shouldConfirmHeadPracticeLink,type HeadPracticeLinkInput} from '../lib/head-practice-navigation.ts';

const currentHref='https://example.test:8443/atlas/ct-head?concept=pons#slice';
const input=(href:string,overrides:Partial<HeadPracticeLinkInput>={}):HeadPracticeLinkInput=>({
  currentHref,href,button:0,defaultPrevented:false,...overrides,
});

test('ordinary primary and keyboard-generated clicks guard a replaced document',()=>{
  for(const href of ['/atlas/mri-head','../mri-head','?concept=medulla',
    'https://other.test/atlas/ct-head?concept=pons',
    'https://example.test:8444/atlas/ct-head?concept=pons']){
    assert.equal(shouldConfirmHeadPracticeLink(input(href)),true,href);
  }
  assert.equal(shouldConfirmHeadPracticeLink(input('/atlas/mri-head',{button:0})),true,
    'keyboard-generated click uses button zero');
});

test('already handled, auxiliary and modified clicks do not prompt',()=>{
  const href='/atlas/mri-head';
  assert.equal(shouldConfirmHeadPracticeLink(input(href,{defaultPrevented:true})),false);
  for(const button of [-1,1,2])assert.equal(shouldConfirmHeadPracticeLink(input(href,{button})),false);
  for(const key of ['metaKey','ctrlKey','shiftKey','altKey'] as const)
    assert.equal(shouldConfirmHeadPracticeLink(input(href,{[key]:true})),false,key);
  assert.equal(shouldConfirmHeadPracticeLink(input(href,{download:true})),false);
});

test('only current-tab browsing targets are eligible',()=>{
  for(const target of ['', '_self','_top','_parent','_SELF'])
    assert.equal(shouldConfirmHeadPracticeLink(input('/atlas/mri-head',{target})),true,target);
  for(const target of ['_blank','_BLANK','study-window','_unfamiliar'])
    assert.equal(shouldConfirmHeadPracticeLink(input('/atlas/mri-head',{target})),false,target);
});

test('same document, hash changes and equivalent canonical URLs do not prompt',()=>{
  for(const href of ['', '#other','?concept=pons#other',
    '/atlas/ct-head?concept=pons',
    'https://example.test:8443/atlas/ct-head?concept=pons#another'])
    assert.equal(shouldConfirmHeadPracticeLink(input(href)),false,href);
  assert.equal(shouldConfirmHeadPracticeLink(input('https://example.test:8443/atlas/ct-head?concept=pons',{
    currentHref:'https://example.test:8443/atlas/ct-head?concept=pons#another',
  })),false);
});

test('non-HTTP and malformed destinations or current URLs are ineligible',()=>{
  for(const href of ['javascript:void(0)','mailto:team@example.test','data:text/plain,scan',
    'file:///atlas/mri-head','http://%'])
    assert.equal(shouldConfirmHeadPracticeLink(input(href)),false,href);
  for(const invalidCurrent of ['not a URL','file:///atlas/ct-head','javascript:void(0)'])
    assert.equal(shouldConfirmHeadPracticeLink(input('/atlas/mri-head',{currentHref:invalidCurrent})),false,invalidCurrent);
});
