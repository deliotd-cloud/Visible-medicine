import assert from 'node:assert/strict';
import test from 'node:test';
import {lectureSavePresentation as present} from '../components/lecture-save-presentation.ts';
const base={busy:false,contextReason:null,uncertain:false,dirty:false,readOnly:false,validDraft:true,savedVersion:4};

test('uncertain response takes precedence over busy, context, and clean signature',()=>{
  const state=present({...base,busy:true,contextReason:'changed',uncertain:true});
  assert.equal(state.state,'uncertain');
  assert.equal(state.label,'Save not confirmed');
  assert.match(state.detail,/may have completed/);
  assert.doesNotMatch(state.detail,/Saved version 4/);
});

test('context failures keep the save claim unavailable',()=>{
  assert.equal(present({...base,contextReason:'changed'}).label,'Studio context changed');
  assert.equal(present({...base,contextReason:'unavailable'}).label,'Studio context unavailable');
});

test('working request never claims a saved version',()=>{
  const state=present({...base,busy:true,dirty:true});
  assert.equal(state.state,'working');
  assert.match(state.detail,/not been confirmed/);
});

test('dirty, invalid, and read-only drafts keep local state explicit',()=>{
  assert.equal(present({...base,dirty:true}).label,'Unsaved changes');
  assert.match(present({...base,dirty:true,validDraft:false}).detail,/Fix the title or invalid fields/);
  assert.match(present({...base,dirty:true,readOnly:true}).detail,/cannot be saved here/);
});

test('only a clean confirmed view names its loaded version',()=>{
  const state=present(base);
  assert.equal(state.label,'Saved version 4');
  assert.match(state.detail,/Publishing is a separate action/);
  assert.match(present({...base,readOnly:true}).detail,/read only/);
  assert.equal(present({...base,dirty:true,validDraft:false,contextReason:'unavailable',uncertain:true}).state,'uncertain');
});
