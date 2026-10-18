import assert from 'node:assert/strict';
import test from 'node:test';
import {
  lectureLocationMatches,
  lectureRequestReturnPath,
  lectureRoutePath,
  lectureSlideHref,
  parseLectureSlideRequest,
  resolveLectureSlideRequest,
  type PublishedLectureNavigation,
} from '../lib/lecture-slide-navigation.ts';

const revision = 'a'.repeat(64);
const otherRevision = 'b'.repeat(64);
const slides = [{ id: 'intro' }, { id: 'second-2' }];
const navigation: PublishedLectureNavigation = {
  workbookId: 'lecture:1', courseSlug: 'head-and-neck', revision,
  request: { kind: 'requested', slideId: 'second-2', revision },
};

test('slide request requires one well-formed paired ID and publication hash', () => {
  assert.deepEqual(parseLectureSlideRequest({ unrelated: 'keep' }), { kind: 'none' });
  assert.deepEqual(parseLectureSlideRequest({ lectureSlide: 'second-2', lectureRevision: revision, unrelated: ['a', 'b'] }), navigation.request);
  assert.deepEqual(parseLectureSlideRequest(new URLSearchParams(`lectureSlide=second-2&lectureRevision=${revision}&unrelated=x`)), navigation.request);
  for (const params of [
    { lectureSlide: 'second-2' }, { lectureRevision: revision },
    { lectureSlide: ['intro', 'second-2'], lectureRevision: revision },
    { lectureSlide: ['intro'], lectureRevision: revision },
    { lectureSlide: 'intro', lectureRevision: [revision] },
    { lectureSlide: 'intro', lectureRevision: [revision, revision] },
    { lectureSlide: [], lectureRevision: revision },
    { lectureSlide: 'slide/1', lectureRevision: revision },
    { lectureSlide: ' second-2', lectureRevision: revision },
    { lectureSlide: 'second-2', lectureRevision: revision.toUpperCase() },
    { lectureSlide: 'second-2', lectureRevision: 'short' },
  ]) assert.deepEqual(parseLectureSlideRequest(params), { kind: 'invalid' });
  assert.deepEqual(parseLectureSlideRequest(new URLSearchParams(`lectureSlide=intro&lectureSlide=second-2&lectureRevision=${revision}`)), { kind: 'invalid' });
  assert.deepEqual(parseLectureSlideRequest(new URLSearchParams(`lectureSlide=intro&lectureRevision=${revision}&lectureRevision=${revision}`)), { kind: 'invalid' });
});

test('source-bound links use exact direct/course routes and encode workbook IDs', () => {
  const courseHref = lectureSlideHref(navigation, 'second-2');
  assert.equal(courseHref, `/learn/head-and-neck/lecture%3A1?lectureSlide=second-2&lectureRevision=${revision}`);
  assert.equal(lectureRoutePath('lecture:1', 'head-and-neck'), '/learn/head-and-neck/lecture%3A1');
  assert.equal(lectureSlideHref({ ...navigation, courseSlug: undefined }, 'intro'), `/learn/lectures/lecture%3A1?lectureSlide=intro&lectureRevision=${revision}`);
  assert.deepEqual(parseLectureSlideRequest(new URL(courseHref!, 'https://test.invalid').searchParams), navigation.request);
  for (const invalid of [
    { ...navigation, workbookId: 'bad/id' },
    { ...navigation, courseSlug: 'Bad Course' },
    { ...navigation, revision: 'stale' },
  ]) assert.equal(lectureSlideHref(invalid, 'intro'), null);
  assert.equal(lectureSlideHref(navigation, 'bad/id'), null);
});

test('resolution rejects stale, missing, malformed and duplicate publications explicitly', () => {
  assert.deepEqual(resolveLectureSlideRequest(navigation.request, revision, slides), { kind: 'ready', index: 1 });
  assert.deepEqual(resolveLectureSlideRequest({ kind: 'none' }, revision, slides), { kind: 'ready', index: 0 });
  assert.deepEqual(resolveLectureSlideRequest({ kind: 'requested', slideId: 'second-2', revision: otherRevision }, revision, slides), { kind: 'unavailable', reason: 'stale-revision' });
  assert.deepEqual(resolveLectureSlideRequest({ kind: 'requested', slideId: 'gone', revision }, revision, slides), { kind: 'unavailable', reason: 'missing-slide' });
  assert.deepEqual(resolveLectureSlideRequest({ kind: 'invalid' }, revision, slides), { kind: 'unavailable', reason: 'invalid-link' });
  for (const publication of [[], [{ id: 'intro' }, { id: 'intro' }], [{ id: 'bad/id' }]]) {
    assert.deepEqual(resolveLectureSlideRequest(navigation.request, revision, publication), { kind: 'unavailable', reason: 'invalid-publication' });
  }
  assert.deepEqual(resolveLectureSlideRequest(navigation.request, 'bad', slides), { kind: 'unavailable', reason: 'invalid-publication' });
});

test('sign-in return carries a bounded invalid marker and route matching is exact', () => {
  assert.equal(lectureRequestReturnPath('lecture:1', 'head-and-neck', navigation.request), lectureSlideHref(navigation, 'second-2'));
  assert.equal(lectureRequestReturnPath('lecture:1', undefined, { kind: 'none' }), '/learn/lectures/lecture%3A1');
  for (const request of [
    { kind: 'invalid' } as const,
    { kind: 'requested', slideId: 'bad/id', revision } as const,
    { kind: 'requested', slideId: 'intro', revision: 'bad' } as const,
  ]) {
    const returnPath = lectureRequestReturnPath('lecture:1', 'head-and-neck', request);
    assert.equal(returnPath, '/learn/head-and-neck/lecture%3A1?lectureSlide=invalid&lectureRevision=invalid');
    assert.deepEqual(parseLectureSlideRequest(new URL(returnPath, 'https://test.invalid').searchParams), { kind: 'invalid' });
  }
  assert.equal(lectureLocationMatches(navigation, { pathname: '/learn/head-and-neck/lecture%3A1' }), true);
  for (const pathname of [
    '/learn/lectures/lecture%3A1', '/learn/head-and-neck/lecture%3A2',
    '/learn/head-and-neck/lecture%3A1/extra', '/studio/workbooks/lecture%3A1',
    '/learn/head-and-neck/lecture%ZZ', '/learn/head-and-neck/lecture%2F1',
    '/learn/head-and-neck/lecture%5C1',
  ]) assert.equal(lectureLocationMatches(navigation, { pathname }), false);
});
