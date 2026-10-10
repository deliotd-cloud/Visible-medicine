import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import { structures } from '../app/anatomy-data.ts';
import { matchesShoulderSearch, shoulderSearchOptions } from '../lib/shoulder-search.ts';

const before = JSON.stringify(structures);
const options = shoulderSearchOptions(structures);
const search = query => options.filter(option => matchesShoulderSearch(option, query));
const names = query => search(query).map(option => option.label);

test('canonical shoulder search preserves all nine identities and source data', () => {
  assert.equal(structures.length, 9);
  assert.equal(options.length, structures.length);
  assert.deepEqual(options.map(({ value, label }) => ({ value, label })),
    structures.map(({ id, name }) => ({ value: id, label: name })));
  assert.equal(new Set(options.map(option => option.value)).size, 9);
  assert.equal(JSON.stringify(structures), before, 'Search does not mutate anatomy data');
  assert.deepEqual(search(''), options);
  assert.deepEqual(search('   '), options);
  assert.deepEqual(names('no such shoulder structure'), []);
});

test('exact names, Unicode, case and spacing produce the intended single result', () => {
  assert.deepEqual(names('Supraspinatus'), ['Supraspinatus']);
  assert.deepEqual(names('  SUPRASPINÁTUS  '), ['Supraspinatus']);
  assert.deepEqual(names('biceps    long   head'), ['Biceps · long head']);
  assert.deepEqual(names('glenoid scapula'), ['Scapula'], 'All query words must match');
  assert.deepEqual(names('glenoid clavicle'), []);
});

test('authored aliases, Latin and stable IDs are searchable', () => {
  assert.deepEqual(names('glenoid'), ['Scapula']);
  assert.deepEqual(names('acromion'), ['Scapula']);
  assert.deepEqual(names('biceps tendon'), ['Biceps · long head']);
  assert.deepEqual(names('biceps-long-head'), ['Biceps · long head']);
  assert.deepEqual(names('caput longum musculi bicipitis brachii'), ['Biceps · long head']);
  assert.deepEqual(names('VM-SHO-R-BON-SCAP'), ['Scapula']);
  assert.deepEqual(names('vm:anatomy:upper-limb:shoulder:right:bone:scapula'), ['Scapula']);
});

test('production combobox delegates filtering and renders the filtered collection accessibly', () => {
  const source = readFileSync('app/shoulder-explorer.tsx', 'utf8');
  const ast = ts.createSourceFile('shoulder-explorer.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const elements = [];
  const visit = node => {
    if (ts.isJsxElement(node)) elements.push(node);
    ts.forEachChild(node, visit);
  };
  visit(ast);
  const tag = node => node.openingElement.tagName.getText(ast);
  const combobox = elements.find(node => tag(node) === 'Combobox' && node.getText(ast).includes('searchOptions'));
  assert(combobox, 'Shoulder search combobox exists');
  const filter = combobox.openingElement.attributes.properties.find(attribute =>
    ts.isJsxAttribute(attribute) && attribute.name.text === 'filter');
  assert(filter && ts.isJsxExpression(filter.initializer));
  assert.equal(filter.initializer.expression.getText(ast), 'matchesShoulderSearch');
  const list = elements.find(node => tag(node) === 'ComboboxList' &&
    node.pos > combobox.pos && node.end < combobox.end);
  assert(list, 'ComboboxList belongs to shoulder search');
  assert(list.children.some(child => ts.isJsxExpression(child) &&
    child.expression && ts.isArrowFunction(child.expression)),
  'ComboboxList must render the filtered-items callback');
  assert(!list.children.some(child => child.getText(ast).includes('searchOptions.map(')),
    'Static full-list mapping would bypass filtering');
  for (const label of [
    'Find a shoulder structure',
    'Show structure suggestions',
    'Clear structure search',
  ]) assert(combobox.getText(ast).includes(`aria-label="${label}"`), `Explicit control name: ${label}`);
});
