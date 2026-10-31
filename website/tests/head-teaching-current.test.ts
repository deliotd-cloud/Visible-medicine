import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadCurrentTeaching} from './head-teaching-current-source.mjs';

test('current navigator opens a review item including a guided sequence without submitting a review',()=>{
 const f=loadCurrentTeaching();
 const targets=[{id:'head-guided-sequence-brainstem',label:'Guided · Brainstem orientation'}];
 const html=renderToStaticMarkup(React.createElement(f.Navigator,{targets}));
 assert.match(html,/name="head-review-target"/);assert.match(html,/>Review item</);
 assert.match(html,/>Open item</);assert.match(html,/value="head-guided-sequence-brainstem"/);
 assert.doesNotMatch(html,/Open summary|<input|<iframe|<img/);
 f.verify();
});
test('current Review keeps exact read-only teaching and addressable guided drafts; stale source withholds notes',()=>{
 const f=loadCurrentTeaching();
 const html=renderToStaticMarkup(React.createElement(f.Review,{revision:f.revision}));
 assert.match(html,/read-only/);assert.match(html,/no recorded sign-off/);
 assert.match(html,/<nav aria-label="Head review sections"/);
 assert.match(html,/>Source comparisons<\/a>/);
 assert.doesNotMatch(html,/>Back to source comparisons<\/a>/);
 for(const note of f.teaching.headTeachingContent.notes){
  assert(html.includes(note.anatomy.text));assert(html.includes(note.function.text));assert(html.includes(note.task));
 }
 for(const sequence of f.learning.headLearningSequences)assert(html.includes('id="head-guided-sequence-'+sequence.id+'"'));
 assert(html.includes(f.learning.HEAD_LEARNING_REVISION));assert(html.includes(f.teaching.HEAD_TEACHING_REVISION));
 const stale=renderToStaticMarkup(React.createElement(f.Review,{revision:'stale'}));
 assert.match(stale,/current head source does not match/);
 assert(!stale.includes(f.teaching.headTeachingContent.notes[0].anatomy.text));
 assert.doesNotMatch(stale,/Inspect CT target/);
 assert(f.page.indexOf('await authorizeClinicalReview()')<f.page.indexOf('const sequenceTargets='));
 assert(f.page.includes('...sequenceTargets(headLearningSequences,HEAD_LEARNING_REVISION)'));
 f.verify();
});
