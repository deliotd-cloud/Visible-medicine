import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {focusHeadLearningContent} from '../lib/head-atlas-focus.ts';

test('learning focus scrolls only the information pane, then focuses without page scrolling',()=>{
  const actions:unknown[]=[];
  const element={closest:(selector:string)=>{actions.push(selector);return{scrollTo:(options:unknown)=>actions.push(options)};},focus:(options:unknown)=>actions.push(options)};
  focusHeadLearningContent(element as unknown as HTMLElement);
  assert.deepEqual(actions,['.imaging-workspace-info',{top:0,behavior:'instant'},{preventScroll:true}]);
});
test('missing focus target or missing pane is safe and never uses a window scrolling fallback',()=>{
  focusHeadLearningContent(null);
  let focused=false;
  const element={closest:()=>null,focus:(options:unknown)=>{assert.deepEqual(options,{preventScroll:true});focused=true;}};
  focusHeadLearningContent(element as unknown as HTMLElement);assert.equal(focused,true);
});
test('guided lifecycle supplies accessible heading and sequence focus destinations',()=>{
  const guided=readFileSync(new URL('../components/HeadAtlasGuidedLearning.tsx',import.meta.url),'utf8');
  const viewer=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert.match(guided,/<h3 ref=\{headingRef\} tabIndex=\{-1\}/);
  assert.match(guided,/if\(study&&step>=0\)focusHeadLearningContent\(headingRef.current\)/);
  assert.match(guided,/focusHeadLearningContent\(sequenceRef.current\)/);
  // Return/replacement behavior is exercised through the real Viewer callbacks
  // in head-image-history.test.ts, rather than pinning a retired state variable.
  assert.match(viewer,/infoLabel="Anatomy learning panel"/);
});
