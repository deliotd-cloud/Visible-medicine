import assert from 'node:assert/strict';import test from 'node:test';import{readFileSync}from'node:fs';import{restoreLaterPracticeExitViewer}from'./head-practice-exit-later-viewer.mjs';
test('later practice viewer projection is exact and refuses old, changed and foreign viewers',()=>{
 const current=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8'),prior=restoreLaterPracticeExitViewer(current);
 assert.notEqual(prior,current);assert.throws(()=>restoreLaterPracticeExitViewer(prior));assert.throws(()=>restoreLaterPracticeExitViewer(current+'\n// foreign'));
 const changed=current.replace('window.confirm(', 'window.alert(');assert.notEqual(changed,current);assert.throws(()=>restoreLaterPracticeExitViewer(changed));
});
