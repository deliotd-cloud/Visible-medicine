import assert from 'node:assert/strict';
import test from 'node:test';
import { requestReviewInboxPage, REVIEW_INBOX_PAGE_TIMEOUT_MS } from '../lib/review-inbox-request.ts';

const firstPage = '/api/atlas-review/inbox?page=1&batch=2';
const laterPage = `/api/atlas-review/inbox?page=2&revision=${'a'.repeat(64)}&batch=2`;

function fakeClock() {
  let fire: (() => void) | undefined;
  let cancelled = 0;
  let delay: number | undefined;
  return {
    clock: { schedule(callback: () => void, delayMs: number) {
      fire = callback;
      delay = delayMs;
      return () => { cancelled++; fire = undefined; };
    } },
    expire() { assert.ok(fire, 'deadline is active'); fire(); },
    get cancelled() { return cancelled; },
    get delay() { return delay; },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('successful page reads JSON inside one deadline and fixes request policy', async t => {
  const timer = fakeClock();
  const body = { items: ['synthetic'] };
  let request: RequestInfo | URL | undefined;
  let options: RequestInit | undefined;
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    request = input; options = init;
    return Response.json(body);
  });
  const result = await requestReviewInboxPage(laterPage, new AbortController().signal, undefined, timer.clock);
  assert.equal(request, laterPage);
  assert.equal(options?.method, 'GET');
  assert.equal(options?.cache, 'no-store');
  assert.equal(options?.credentials, 'same-origin');
  assert.ok(options?.signal instanceof AbortSignal);
  assert.deepEqual(result.body, body);
  assert.equal(result.response.status, 200);
  assert.equal(timer.delay, REVIEW_INBOX_PAGE_TIMEOUT_MS);
  assert.equal(timer.cancelled, 1);
});

test('hanging fetch expires, aborts its inner request, and allows a late response', async t => {
  const timer = fakeClock();
  const late = deferred<Response>();
  let inner: AbortSignal | null | undefined;
  t.mock.method(globalThis, 'fetch', (_input: RequestInfo | URL, init?: RequestInit) => {
    inner = init?.signal;
    return late.promise;
  });
  const pending = requestReviewInboxPage(firstPage, new AbortController().signal, undefined, timer.clock);
  timer.expire();
  await assert.rejects(pending, /Resume to retry this page/);
  assert.equal(inner?.aborted, true);
  assert.equal(timer.cancelled, 1);
  late.resolve(Response.json({ late: true }));
  await Promise.resolve();
});

test('hanging response body expires under the same deadline', async t => {
  const timer = fakeClock();
  const lateBody = deferred<unknown>();
  const bodyStarted = deferred<void>();
  const response = Response.json({ synthetic: true });
  response.json = () => { bodyStarted.resolve(); return lateBody.promise; };
  let inner: AbortSignal | null | undefined;
  t.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
    inner = init?.signal;
    return response;
  });
  const pending = requestReviewInboxPage(firstPage, new AbortController().signal, undefined, timer.clock);
  await bodyStarted.promise;
  timer.expire();
  await assert.rejects(pending, /Resume to retry this page/);
  assert.equal(inner?.aborted, true);
  assert.equal(timer.cancelled, 1);
  lateBody.reject(new Error('late body rejection'));
  await Promise.resolve();
});

test('caller abort cancels the inner request and deadline promptly', async t => {
  const timer = fakeClock();
  const caller = new AbortController();
  let inner: AbortSignal | null | undefined;
  t.mock.method(globalThis, 'fetch', (_input: RequestInfo | URL, init?: RequestInit) => {
    inner = init?.signal;
    return new Promise<Response>(() => {});
  });
  const pending = requestReviewInboxPage(firstPage, caller.signal, undefined, timer.clock);
  caller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(inner?.aborted, true);
  assert.equal(timer.cancelled, 1);
});

test('pre-aborted caller starts no request or timer', async t => {
  const timer = fakeClock();
  const caller = new AbortController();
  caller.abort();
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({}); });
  await assert.rejects(requestReviewInboxPage(firstPage, caller.signal, undefined, timer.clock), { name: 'AbortError' });
  assert.equal(calls, 0);
  assert.equal(timer.delay, undefined);
});

test('non-OK responses preserve status without consuming error bodies', async t => {
  const timer = fakeClock();
  let status = 401;
  let reads = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    const response = new Response('private error', { status });
    response.json = async () => { reads++; return {}; };
    return response;
  });
  for (status of [401, 403, 409, 500]) {
    const result = await requestReviewInboxPage(firstPage, new AbortController().signal, undefined, timer.clock);
    assert.equal(result.response.status, status);
    assert.equal(result.body, undefined);
  }
  assert.equal(reads, 0);
  assert.equal(timer.cancelled, 4);
});

test('rejects external or altered request URLs before any fetch', async t => {
  const timer = fakeClock();
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({}); });
  for (const url of ['https://elsewhere.invalid/api/atlas-review/inbox?page=1&batch=2',
    '//elsewhere.invalid/api/atlas-review/inbox?page=1&batch=2',
    '/api/atlas-review/inbox?page=1&batch=2&credentials=include',
    '/api/atlas-review/inbox?page=2&batch=2',
    `/api/atlas-review/inbox?page=1&revision=${'a'.repeat(64)}&batch=2`]) {
    await assert.rejects(requestReviewInboxPage(url, new AbortController().signal, undefined, timer.clock), TypeError);
  }
  assert.equal(calls, 0);
  assert.equal(timer.delay, undefined);
});


test('context validation runs before JSON and clears the deadline on failure', async t => {
  const timer = fakeClock(); let reads = 0;
  const response = Response.json({});
  response.json = async () => { reads++; return {}; };
  t.mock.method(globalThis, 'fetch', async () => response);
  const invalid = new Error('invalid context');
  await assert.rejects(requestReviewInboxPage(firstPage, new AbortController().signal, undefined, timer.clock, () => { throw invalid; }), error => error === invalid);
  assert.equal(reads, 0); assert.equal(timer.cancelled, 1);
});

test('JSON parsing failure is observed and cancels the deadline', async t => {
  const timer = fakeClock();
  t.mock.method(globalThis, 'fetch', async () => new Response('not-json', {status: 200}));
  await assert.rejects(requestReviewInboxPage(firstPage, new AbortController().signal, undefined, timer.clock), SyntaxError);
  assert.equal(timer.cancelled, 1);
});
