import assert from 'node:assert/strict';
import { containedModelPreflight, modelAccessPreflight, modelPreflightSignature } from '../lib/model-access-preflight.ts';

const origin = 'https://visible.example';
const path = '/atlas-runtime/head-neck/models/bodyparts3d-v3/head.glb?v=abcdefabcdef';
const exact = origin + path;
const calls = [];
const bundles = [{ id: 'head', url: path, sha256: 'a'.repeat(64) }];
const signature = modelPreflightSignature('/atlas-runtime/head-neck', 'source/head', bundles, { head: 0 });
assert.equal(signature, modelPreflightSignature('/atlas-runtime/head-neck', 'source/head',
  bundles.map(bundle => ({ ...bundle })), { head: 0 }), 'equivalent fresh arrays do not re-probe');
assert.equal(signature, modelPreflightSignature('/atlas-runtime/head-neck', 'source/head',
  bundles, undefined), 'initial and zero retry are equivalent');
for (const variant of [
  modelPreflightSignature('/atlas-runtime/body', 'source/head', bundles, { head: 0 }),
  modelPreflightSignature('/atlas-runtime/head-neck', 'source/other-region', bundles, { head: 0 }),
  modelPreflightSignature('/atlas-runtime/head-neck', 'source/head', [{ ...bundles[0], url: path + '2' }], { head: 0 }),
  modelPreflightSignature('/atlas-runtime/head-neck', 'source/head', [{ ...bundles[0], sha256: 'b'.repeat(64) }], { head: 0 }),
  modelPreflightSignature('/atlas-runtime/head-neck', 'source/head', bundles, { head: 1 }),
]) assert.notEqual(variant, signature, 'source, bundle or explicit retry creates a new epoch');
assert.equal(signature, modelPreflightSignature('/atlas-runtime/head-neck', 'source/head',
  bundles, { head: 0 }), 'selection-only changes are absent from the probe signature');
const reply = (status, url = exact, more = {}) => async (requested, options) => {
  calls.push({ requested, options });
  return { status, url, redirected: false, type: 'basic', ...more };
};

assert.equal(await modelAccessPreflight(path, origin, undefined, reply(401)), 'sign-in');
assert.equal(await modelAccessPreflight(path, origin, undefined, reply(403)), 'access-denied');
assert.deepEqual(calls[0].requested, exact);
assert.deepEqual(Object.fromEntries(['method', 'cache', 'credentials', 'mode', 'redirect']
  .map(key => [key, calls[0].options[key]])), {
  method: 'HEAD', cache: 'no-store', credentials: 'same-origin',
  mode: 'same-origin', redirect: 'manual',
});
for (const response of [
  reply(200), reply(405), reply(404), reply(302),
  reply(401, origin + '/different'), reply(403, 'https://other.example' + path),
  reply(401, exact, { redirected: true }), reply(403, exact, { type: 'opaqueredirect' }),
  reply(401, exact, { type: 'opaque' }),
  reply(401, exact, { get url() { throw Error('hostile URL getter'); } }),
  reply(403, exact, { get status() { throw Error('hostile status getter'); } }),
  reply('401'), async () => { throw Error('offline'); },
]) assert.equal(await modelAccessPreflight(path, origin, undefined, response), 'proceed');

const before = calls.length;
for (const unsafe of ['', '//other.example/model.glb', 'https://other.example/model.glb',
  path + '#fragment', '/atlas-runtime/../bad.glb']) {
  assert.equal(await modelAccessPreflight(unsafe, origin, undefined, reply(401)), 'proceed');
}
assert.equal(calls.length, before, 'invalid or non-contained URL made no request');
assert.equal(await containedModelPreflight('', path, origin, undefined, reply(401)), 'proceed');
assert.equal(await containedModelPreflight(undefined, path, origin, undefined, reply(401)), 'proceed');
assert.equal(await containedModelPreflight('/atlas-runtime/head-neck', null, origin,
  undefined, reply(401)), 'proceed');
assert.equal(calls.length, before, 'standalone or empty scene made no request');

const controller = new AbortController();
const pending = modelAccessPreflight(path, origin, controller.signal,
  async () => new Promise(() => {}), 1000);
controller.abort();
assert.equal(await pending, 'proceed', 'cancelled response cannot deny');
assert.equal(await modelAccessPreflight(path, origin, undefined,
  async () => new Promise(() => {}), 5), 'proceed', 'timeout cannot deny');
assert.equal(await modelAccessPreflight(path, origin, undefined, reply(200)), 'proceed',
  'a fresh retry may proceed after denial; GET remains independently authorized');
console.log('model-access-preflight: exact denials, unknown outcomes, cancellation, timeout, retry passed');
