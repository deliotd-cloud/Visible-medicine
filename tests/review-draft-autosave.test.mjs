import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const source = readFileSync(fileURLToPath(new URL('../lib/review-draft-autosave.ts', import.meta.url)), 'utf8');
const websiteRequire = createRequire('F:/VisibleMedicine/staging/20261020-combined-website-ui/website/package.json');
const ts = websiteRequire('typescript');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}});
const module = {exports: {}};
new Function('module', 'exports', compiled.outputText)(module, module.exports);
const {mayAutosaveDraft, reviewDraftStamp, reviewerFromAuthorizedHistory, rememberReviewerForContext, reviewerForContext, createReviewDraftAutosave} = module.exports;

test('autosave permits only a dirty, current, unattested draft', () => {
  const ready = {status: 'draft', attested: false, dirty: true, loaded: true, currentHistory: true, busy: false, uncertain: false, reloadRequired: false};
  assert.equal(mayAutosaveDraft(ready), true);
  for (const patch of [
    {status: 'accepted-semantic'}, {status: 'changes-required'}, {status: 'approved'},
    {attested: true}, {dirty: false}, {loaded: false}, {currentHistory: false},
    {busy: true}, {uncertain: true}, {reloadRequired: true},
  ]) assert.equal(mayAutosaveDraft({...ready, ...patch}), false);
});

test('stamp binds exact source, track, version and draft fingerprint', () => {
  const base = reviewDraftStamp({source: 'a', track: 'topology'}, 4, {notes: 'draft'});
  assert.notEqual(base, reviewDraftStamp({source: 'b', track: 'topology'}, 4, {notes: 'draft'}));
  assert.notEqual(base, reviewDraftStamp({source: 'a', track: 'presentation'}, 4, {notes: 'draft'}));
  assert.notEqual(base, reviewDraftStamp({source: 'a', track: 'topology'}, 5, {notes: 'draft'}));
  assert.notEqual(base, reviewDraftStamp({source: 'a', track: 'topology'}, 4, {notes: 'edited'}));
});

test('debounce cancels stale edits, manual saves and unmount; never retries', () => {
  const timers = new Map();
  let next = 0, saves = 0, current = 'v1';
  const clock = (callback) => {const id = ++next; timers.set(id, callback); return id;};
  const cancelClock = (id) => timers.delete(id);
  const fire = (id) => {const callback = timers.get(id); timers.delete(id); callback?.();};
  const debounce = createReviewDraftAutosave(100, clock, cancelClock);
  debounce.schedule('v1', stamp => stamp === current, () => saves++);
  const first = next;
  debounce.schedule('v2', stamp => stamp === current, () => saves++);
  fire(first);
  assert.equal(saves, 0);
  current = 'v3';
  fire(next);
  assert.equal(saves, 0);
  debounce.schedule('v3', stamp => stamp === current, () => saves++);
  debounce.cancel(); // manual save or unmount
  fire(next);
  assert.equal(saves, 0);
  debounce.schedule('v3', stamp => stamp === current, () => saves++);
  fire(next);
  assert.equal(saves, 1);
  fire(next);
  assert.equal(saves, 1);
});

test('reviewer details require current parsed history and never include other fields', () => {
  const record = {reviewer: 'Reviewer', qualification: 'Radiologist', scope: 'not reusable', checks: {x: true}};
  assert.deepEqual(reviewerFromAuthorizedHistory(record, true, false), {reviewer: 'Reviewer', qualification: 'Radiologist'});
  assert.equal(reviewerFromAuthorizedHistory(record, false, false), null);
  assert.equal(reviewerFromAuthorizedHistory(record, true, true), null);
  assert.equal(reviewerFromAuthorizedHistory(null, true, false), null);
});

test('remembered reviewer fields are isolated by the exact authenticated context token', () => {
  rememberReviewerForContext(null, {reviewer: 'Never cached', qualification: 'None'});
  assert.equal(reviewerForContext(null), null);
  const record = {reviewer: 'Reviewer A', qualification: 'Radiologist', notes: 'not retained'};
  rememberReviewerForContext('account-A-institution-A', record);
  assert.deepEqual(reviewerForContext('account-A-institution-A'), {reviewer: 'Reviewer A', qualification: 'Radiologist'});
  assert.equal(reviewerForContext('account-B-institution-A'), null);
  assert.equal(reviewerForContext('account-A-institution-B'), null);
  const copy = reviewerForContext('account-A-institution-A');
  copy.reviewer = 'Mutation';
  assert.equal(reviewerForContext('account-A-institution-A').reviewer, 'Reviewer A');
});
