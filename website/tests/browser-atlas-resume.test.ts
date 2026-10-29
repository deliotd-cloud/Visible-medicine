import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {HEAD_LEARNING_BOOKMARK_KEY,createHeadLearningBookmark,resolveHeadLearningBookmark} from '../lib/head-learning-bookmark.ts';
import {HEAD_STUDY_PLAN_KEY} from '../lib/head-study-plan.ts';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import.ts';
import {resolveBrowserAtlasResume} from '../lib/browser-atlas-resume.ts';

test('canonical storage names and exact resolved tour links',()=>{
  assert.equal(HEAD_LEARNING_BOOKMARK_KEY,'vm.head-learning-bookmark.v1');
  assert.equal(HEAD_STUDY_PLAN_KEY,'vm.head-study-plan.v1');
  const component=readFileSync(new URL('../components/BrowserAtlasResume.tsx',import.meta.url),'utf8');
  assert(component.includes(`const bookmarkKey='${HEAD_LEARNING_BOOKMARK_KEY}'`));
  assert(component.includes(`const planKey='${HEAD_STUDY_PLAN_KEY}'`));
  const saved=createHeadLearningBookmark({sequenceId:'brainstem',conceptId:'brainstem-pons'});
  assert(saved);
  const navigation=resolveHeadLearningBookmark(saved);
  assert(navigation);
  const state=resolveBrowserAtlasResume(JSON.stringify(saved),JSON.stringify({schema:1,headRevision:HEAD_MANIFEST_SHA256,conceptIds:['brainstem-pons']}));
  assert.deepEqual(state.tour,{kind:'ready',sequenceLabel:navigation.sequenceLabel,step:navigation.index+1,
    total:navigation.total,label:navigation.label,links:navigation.current});
  assert.deepEqual(state.plan,{kind:'ready',count:1});
});

test('empty, stale, malformed and extended values fail closed without raw data leakage',()=>{
  assert.deepEqual(resolveBrowserAtlasResume(null,null),{tour:{kind:'empty'},plan:{kind:'empty'}});
  const bookmark=createHeadLearningBookmark({sequenceId:'brainstem',conceptId:'brainstem-pons'});
  assert(bookmark);
  const bad=[
    ['{private patient}',JSON.stringify({schema:1,headRevision:HEAD_MANIFEST_SHA256,conceptIds:['brainstem-pons'],scanPath:'private-scan'})],
    [JSON.stringify({...bookmark,sequenceRevision:'stale'}),JSON.stringify({schema:1,headRevision:'stale',conceptIds:['brainstem-pons']})],
    [JSON.stringify({...bookmark,url:'https://evil.invalid'}),'{private scan}'],
  ];
  for(const [tour,plan] of bad){
    const state=resolveBrowserAtlasResume(tour,plan);
    assert.deepEqual(state,{tour:{kind:'unavailable'},plan:{kind:'unavailable'}});
    assert(!JSON.stringify(state).includes('private'));
    assert(!JSON.stringify(state).includes('evil.invalid'));
  }
});
