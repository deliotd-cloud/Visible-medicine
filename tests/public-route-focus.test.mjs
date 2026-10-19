import assert from 'node:assert/strict';
import test from 'node:test';
import {isPublicFocusPath,shouldFocusPublicRoute} from '../lib/public-route-focus.ts';

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
