import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { teachingHeading } from '../lib/teaching-heading.ts';

test('collapses only consecutive exact selected-structure segments at the start', () => {
  const name = 'Left scapula';
  assert.equal(teachingHeading('Left scapula · Left scapula · Anatomy', name),
    'Left scapula · Anatomy');
  assert.equal(teachingHeading('Left scapula · Left scapula · Left scapula · Course · draft', name),
    'Left scapula · Course · draft');
  assert.equal(teachingHeading('Left scapula · Left scapula · draft · Left scapula', name),
    'Left scapula · draft · Left scapula');
});

test('leaves distinct names, substructures, laterality, case and punctuation intact', () => {
  const name = 'Left scapula';
  for (const title of [
    'Left scapula · Right scapula · Anatomy',
    'Left scapula · Left scapular spine · Anatomy',
    'Left scapula · Scapula · Anatomy',
    'Left scapula · left scapula · Anatomy',
    'Left scapula · Left scapula: Anatomy',
    'Left scapula· Left scapula · Anatomy',
    'Left scapula ·Left scapula · Anatomy',
    'Left scapula - Left scapula · Anatomy',
    'Anatomy · Left scapula · Left scapula',
  ]) assert.equal(teachingHeading(title, name), title, title);
});

test('preserves empty input, exact remainder and repeated words without separator', () => {
  assert.equal(teachingHeading('', 'Left scapula'), '');
  assert.equal(teachingHeading('Left scapula · Left scapula · Anatomy', ''),
    'Left scapula · Left scapula · Anatomy');
  assert.equal(teachingHeading('Left scapula Left scapula · draft', 'Left scapula'),
    'Left scapula Left scapula · draft');
  assert.equal(teachingHeading('Left scapula · Left scapula · MRI  orientation · draft  ', 'Left scapula'),
    'Left scapula · MRI  orientation · draft  ');
  assert.equal(teachingHeading('Left scapula · Left scapula', 'Left scapula'),
    'Left scapula · Left scapula');
});

test('body explorer formats only the visible eyebrow after retrieving its lesson', async () => {
  const source = await readFile(new URL('../app/body-explorer.tsx', import.meta.url), 'utf8');
  assert.match(source, /import\s*\{\s*teachingHeading\s*\}\s*from\s*['"]@\/lib\/teaching-heading['"]/);
  assert.match(source, /const content = bodyContent\(selected, value\);[\s\S]*?<div className="eyebrow">\{teachingHeading\(content\.title, selected\.name\)\}<\/div>/);
  assert.match(source, /<p>\{content\.body\}<\/p>/);
  assert.doesNotMatch(source, /content\.title\s*=/);
});
