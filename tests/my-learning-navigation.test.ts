import assert from 'node:assert/strict';
import test from 'node:test';
import { courseDetailsHref, courseWorkbookHref, savedLearningHref } from '../lib/saved-learning-navigation.ts';

const enrolled = [{ slug: 'published-neuro', resumeWorkbookId: 'wb:latest', firstWorkbookId: 'wb:first' }];

test('saved courses resume only through a matching enrolment; known courses retain their own details', () => {
  assert.equal(savedLearningHref({ resourceType: 'course', resourceSlug: 'published-neuro' }, { knownAtlas: false, knownCourse: false, enrolments: enrolled }), '/learn/published-neuro/wb%3Alatest');
  assert.equal(savedLearningHref({ resourceType: 'course', resourceSlug: 'foundations-ct-head' }, { knownAtlas: false, knownCourse: true, enrolments: enrolled }), '/courses/foundations-ct-head');
  assert.equal(savedLearningHref({ resourceType: 'course', resourceSlug: 'other-course' }, { knownAtlas: false, knownCourse: false, enrolments: enrolled }), '/courses');
  assert.equal(savedLearningHref({ resourceType: 'course', resourceSlug: 'published-neuro' }, { knownAtlas: false, knownCourse: false, enrolments: [{ ...enrolled[0], resumeWorkbookId: '../bad' }] }), '/learn/published-neuro/wb%3Afirst');
});

test('known atlas links stay canonical and unknown resources fall back safely', () => {
  assert.equal(savedLearningHref({ resourceType: 'atlas', resourceSlug: 'ct-head' }, { knownAtlas: true, knownCourse: false, enrolments: [] }), '/atlas/ct-head');
  assert.equal(savedLearningHref({ resourceType: 'atlas', resourceSlug: 'future' }, { knownAtlas: false, knownCourse: false, enrolments: [] }), '/atlas');
  assert.equal(savedLearningHref({ resourceType: 'workbook', resourceSlug: 'anything' }, { knownAtlas: false, knownCourse: false, enrolments: [] }), '/my-learning');
});

test('malformed path values cannot become destinations', () => {
  for (const slug of ['../bad', '//evil.test', 'bad?next=evil', 'bad#anchor', '%2f', 'bad space', 'UPPER', '']) {
    assert.equal(courseDetailsHref(slug), null);
    assert.equal(courseWorkbookHref(slug, 'workbook'), null);
    assert.equal(savedLearningHref({ resourceType: 'course', resourceSlug: slug }, { knownAtlas: false, knownCourse: true, enrolments: [{ slug, resumeWorkbookId: 'workbook', firstWorkbookId: null }] }), '/courses');
  }
  for (const workbook of ['../bad', '//evil.test', 'bad?next=evil', 'bad#anchor', '%2f', 'bad space', '']) {
    assert.equal(courseWorkbookHref('published-neuro', workbook), null);
  }
  assert.equal(courseWorkbookHref('published-neuro', 'wb_01:section-2'), '/learn/published-neuro/wb_01%3Asection-2');
  assert.equal(savedLearningHref({ resourceType: 'course', resourceSlug: 'published-neuro' }, { knownAtlas: false, knownCourse: false, enrolments: [{ slug: 'published-neuro', resumeWorkbookId: '../bad', firstWorkbookId: null }] }), '/courses/published-neuro');
});
