import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {headLearningEntries,headLearningSequences} from '../lib/head-atlas-learning.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';
const pons:HeadEntry={id:'cth.bst.pons',label:'Pons — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask',family:'bst',color:[1,0,0],opacity:{fill:.2,outline:.9}};
test('learning sequences only use exact available entries from the pinned study',()=>{
  assert.deepEqual(headLearningEntries([pons],'brainstem','CT',HEAD_LINK_REVISION),[pons]);
  for(const [sequence,modality,pin] of [['unknown','CT',HEAD_LINK_REVISION],['brainstem','MRI',HEAD_LINK_REVISION],['brainstem','CT','0'.repeat(64)]] as const)assert.deepEqual(headLearningEntries([pons],sequence,modality,pin),[]);
  assert.equal(headLearningSequences.length,5);
});
test('guided check delegates to same-study mask practice; quiz blocks groups and links',()=>{
  const viewer=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8'),practice=readFileSync(new URL('../components/HeadAtlasPractice.tsx',import.meta.url),'utf8');
  assert.match(practice,/function startTarget\(target:HeadEntry\)\{\s*return startTargets\(\[target\]\);/);
  assert.match(practice,/const eligible=new Set\(practiceEntries\(study.definition.entries\)\)/);
  assert.match(practice,/filter\(target=>eligible.has\(target\)\)/);
  assert.match(practice,/if\(!selected.length\)return false/);
  assert.match(viewer,/groupLabels=\{!quizActive&&groupLabels\}/);
  assert.match(viewer,/opacity=\{quizActive\?1:overlayOpacity\}/);
  assert.match(viewer,/quizActive\?\(sliceSelection\?\[sliceSelection\]:\[\]\):visibleHeadOverlays/);
});
