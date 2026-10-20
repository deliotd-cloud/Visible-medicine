import assert from 'node:assert/strict';
import test from 'node:test';
import {isPublicFocusPath,shouldFocusPublicRoute,shouldFocusStudioPrimaryRoute} from '../lib/public-route-focus.ts';

const transition={from:'/atlas',to:'/atlas/guided-learning',linkPath:'/atlas/guided-learning',ageMs:50,active:'body'};

test('only a committed link to a new ordinary public pathname transfers focus',()=>{
  assert.equal(shouldFocusPublicRoute(transition),true);
  assert.equal(shouldFocusPublicRoute({...transition,active:'origin'}),true);
  assert.equal(shouldFocusPublicRoute({...transition,from:null}),false,'initial load');
  assert.equal(shouldFocusPublicRoute({...transition,to:'/atlas',linkPath:'/atlas'}),false,'same path rerender or query/hash only');
  assert.equal(shouldFocusPublicRoute({...transition,linkPath:'/courses'}),false,'unrelated committed route');
  assert.equal(shouldFocusPublicRoute({...transition,from:'/workspace'}),false,'private origin');
  assert.equal(shouldFocusPublicRoute({...transition,ageMs:-1}),false,'invalid transition age');
  assert.equal(shouldFocusPublicRoute({...transition,ageMs:10_000}),false,'stale link');
  assert.equal(shouldFocusPublicRoute({...transition,active:'elsewhere'}),false,'destination or user focus wins');
});

test('Studio primary focus has a separate exact four-destination policy, without widening public scope',()=>{
  for(const to of ['/studio/workspace','/studio/courses','/studio/workbooks','/studio/publishing']){
    const move={from:'/studio/courses/one',to,linkPath:to,ageMs:50,active:'body'};
    assert(shouldFocusStudioPrimaryRoute(move),to);
    assert(shouldFocusStudioPrimaryRoute({...move,active:'origin'}),to);
    assert.equal(shouldFocusPublicRoute(move),false,to);
    assert.equal(isPublicFocusPath(to),false,to);
  }
});

test('Studio primary policy refuses unlinked loads, auth redirects, viewers and nonprimary author destinations',()=>{
  const move={from:'/studio/workspace',to:'/studio/publishing',linkPath:'/studio/publishing',ageMs:50,active:'body'};
  for(const from of [null,'/studio','/workspace','/workspace/atlas-review','/atlas','/my-learning','/learn/course'])
    assert.equal(shouldFocusStudioPrimaryRoute({...move,from}),false,String(from));
  for(const to of ['/studio/courses/one','/studio/publishing-other','/studio/releases/one/preview','/workspace/clinical-review-inbox','/signin-with-chatgpt','/atlas/3d'])
    assert.equal(shouldFocusStudioPrimaryRoute({...move,to,linkPath:to}),false,to);
  assert.equal(shouldFocusStudioPrimaryRoute({...move,from:move.to}),false,'same pathname');
  assert.equal(shouldFocusStudioPrimaryRoute({...move,linkPath:null}),false,'no explicit link');
  assert.equal(shouldFocusStudioPrimaryRoute({...move,linkPath:'/studio/courses'}),false,'unrelated route commit');
});

test('Studio focus expires and yields to user focus just like public focus',()=>{
  const move={from:'/studio/workspace',to:'/studio/publishing',linkPath:'/studio/publishing',ageMs:50,active:'body'};
  for(const ageMs of [-1,10_000,Infinity,NaN])assert.equal(shouldFocusStudioPrimaryRoute({...move,ageMs}),false,String(ageMs));
  assert.equal(shouldFocusStudioPrimaryRoute({...move,active:'elsewhere'}),false);
});

test('viewer, embedded, workspace, authoring, review and auth paths stay outside public focus management',()=>{
  for(const path of ['/atlas/3d','/atlas/ct','/atlas/mri-head','/atlas/shoulder-3d',
    '/atlas/unknown-viewer','/workspace','/workspace/atlas-review','/studio/workspace',
    '/my-learning','/learn/course','/embed/launch','/embed','/account-entry',
    '/account','/auth/callback','/signin-with-chatgpt','/join',
    '/api/auth/callback','/api/atlas-review/source-comparisons','/courses/draft/builder']){
    assert.equal(isPublicFocusPath(path),false,path);
    assert.equal(shouldFocusPublicRoute({...transition,to:path,linkPath:path}),false,path);
  }
  for(const path of ['/','/atlas','/atlas/guided-learning','/courses','/studio','/trust'])
    assert.equal(isPublicFocusPath(path),true,path);
});
