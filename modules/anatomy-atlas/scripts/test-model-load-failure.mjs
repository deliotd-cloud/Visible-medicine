import assert from 'node:assert/strict';
import test from 'node:test';
import {modelLoadAccessNotice, modelLoadFailure} from '../lib/model-load-failure.ts';

const expected = 'http://127.0.0.1:3000/atlas-runtime/head-neck/models/bodyparts3d/cerebral/cerebral.glb?v=abc123';
const path = new URL(expected).pathname + new URL(expected).search;
const wrapper = (status, url = expected, loadUrl = path, reason = status === 401 ? 'Unauthorized' : 'Forbidden') =>
  new Error(`Could not load ${loadUrl}: fetch for "${url}" responded with ${status}: ${reason}`);

test('exact response-shaped 401 and 403 classify only the requested bundle', () => {
  assert.equal(modelLoadFailure({response: {status: 401, url: expected}}, expected), 'sign-in');
  assert.equal(modelLoadFailure({response: {status: 403, url: expected}}, expected), 'access-denied');
  assert.equal(modelLoadFailure({response: {status: '401', url: expected}}, expected), 'unavailable');
  assert.equal(modelLoadFailure({status: 401, url: expected}, expected), 'unavailable');
});

test('observed loader wrapper requires its full response suffix and both URLs', () => {
  assert.equal(modelLoadFailure(wrapper(401), expected), 'sign-in');
  assert.equal(modelLoadFailure(wrapper(403), expected), 'access-denied');
  assert.equal(modelLoadFailure(wrapper(401, expected, expected), expected), 'sign-in');
  for (const error of [
    wrapper(401, expected + '&other=1'),
    wrapper(401, expected.replace('127.0.0.1', 'localhost')),
    wrapper(401, expected.replace('abc123', 'other')),
    wrapper(401, expected.replace('v=abc123', 'v=abc123&role=admin')),
    wrapper(401, expected, path.replace('abc123', 'other')),
    wrapper(401, expected, path, 'Forbidden'),
    wrapper(403, expected, path, 'Unauthorized'),
    new Error(`${wrapper(401).message} extra`),
    new Error(`401 Unauthorized: ${expected}`),
    Object.assign(new Error(`fetch for "${expected}" responded with 401: Unauthorized`), {name: 'HTTPError'}),
    new Error(`Could not load ${path}: fetch for "${expected}" responded with 401`),
  ]) assert.equal(modelLoadFailure(error, expected), 'unavailable');
});

test('mismatched or ambiguous response objects cannot be rescued by messages', () => {
  for (const response of [
    {status: 401, url: expected + '&other=1'},
    {status: 403, url: expected.replace('127.0.0.1', 'localhost')},
    {status: 401, url: path},
    {status: 404, url: expected},
    {status: 500, url: expected},
    {status: 401},
    null,
  ]) assert.equal(modelLoadFailure(Object.assign(wrapper(401), {response}), expected), 'unavailable');
});

test('unrelated, hostile, and invalid errors remain unavailable', () => {
  for (const error of [
    null, undefined, false, 401, '401 Unauthorized',
    {message: wrapper(401).message},
    new Error('Failed to fetch'),
    new Error(`Could not load ${path}: fetch for "${expected}" responded with 404: Not Found`),
    new Error(`Could not load ${path}: fetch for "${expected}" responded with 500: Internal Server Error`),
    new Error('GLTFLoader: Unexpected token in JSON at position 401'),
    new Proxy({}, {has() {throw new Error('hostile');}}),
    Object.defineProperty({}, 'response', {get() {throw new Error('hostile');}}),
    {response: Object.defineProperty({url: expected}, 'status', {get() {throw new Error('hostile');}})},
  ]) assert.equal(modelLoadFailure(error, expected), 'unavailable');
  assert.equal(modelLoadFailure(wrapper(401), '/relative/model.glb'), 'unavailable');
  assert.equal(modelLoadFailure(wrapper(401), expected + '#fragment'), 'unavailable');
});

test('access notice is fixed copy, prioritizes sign-in, and ignores unavailable failures', () => {
  const signIn = {
    message: 'Some model files require sign-in. Sign in to the website hosting this atlas, then check access again. Your view settings are retained.',
    retryLabel: 'Check access again',
  };
  const denied = {
    message: 'The website refused access to some model files. Check your access with the site owner, then check again. Your view settings are retained.',
    retryLabel: 'Check access again',
  };
  assert.equal(modelLoadAccessNotice([]), null);
  assert.equal(modelLoadAccessNotice(['unavailable']), null);
  assert.deepEqual(modelLoadAccessNotice(['access-denied']), denied);
  assert.deepEqual(modelLoadAccessNotice(['sign-in']), signIn);
  assert.deepEqual(modelLoadAccessNotice(['unavailable', 'access-denied', 'sign-in']), signIn);
  assert.deepEqual(modelLoadAccessNotice(['access-denied', 'unavailable']), denied);
});
