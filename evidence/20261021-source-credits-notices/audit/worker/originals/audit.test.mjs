import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDependencies, parseNotice, checkDependencies } from './audit.mjs';

const dep = { name: '@scope/tool', version: '1.2.3', license: '(MIT OR Apache-2.0)' };
const learner = '@scope/tool@1.2.3 ((MIT OR Apache-2.0))\nLICENSE\nCopyright holder\n';

test('retains exact scoped identity and licence expression', () => {
  const dependencies = parseDependencies(JSON.stringify([dep]));
  const notice = parseNotice(learner, 'learner');
  assert.deepEqual(checkDependencies(dependencies, notice), []);
  assert.equal(notice.records[0].license, dep.license);
});

test('missing, wrong version and changed licence fail', () => {
  const dependencies = parseDependencies(JSON.stringify([dep]));
  assert.equal(checkDependencies(dependencies, parseNotice('', 'learner'))[0].code, 'missing-notice');
  assert.deepEqual(checkDependencies(dependencies, parseNotice(learner.replace('1.2.3', '1.2.4'), 'learner')).map(x => x.code), ['missing-notice', 'undeclared-notice']);
  assert.equal(checkDependencies(dependencies, parseNotice(learner.replace('Apache-2.0', 'BSD-3-Clause'), 'learner'))[0].code, 'license-expression-mismatch');
});

test('duplicate and empty notices fail', () => {
  const notice = parseNotice(`${learner}\n${learner.split('\n')[0]}\n`, 'learner');
  assert.deepEqual(notice.problems.map(x => x.code), ['duplicate-notice', 'empty-notice']);
});

test('manifest schema refuses duplicate and malformed package declarations', () => {
  assert.throws(() => parseDependencies(JSON.stringify([dep, dep])), /duplicate/);
  assert.throws(() => parseDependencies(JSON.stringify([{ ...dep, license: '' }])), /invalid/);
  assert.throws(() => parseDependencies(JSON.stringify({ packages: [dep] })), /array/);
});

test('Review package heading stays separate from prose headings', () => {
  const result = parseNotice('## Teaching note — 20 October 2026\ntext\n## @scope/tool 1.2.3 ((MIT OR Apache-2.0))\nCopyright\n', 'review');
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].name, dep.name);
  assert.equal(result.records[0].license, dep.license);
});
