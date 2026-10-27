import difflib, hashlib, json
from pathlib import Path

stage = Path('F:/VisibleMedicine/staging/20261027-review-filter-scroll')
site = stage / 'website'
parent = Path('F:/VisibleMedicine/staging/20261027-course-preview-focus/website')
sha = lambda b: hashlib.sha256(b).hexdigest()
paths = ['components/ClinicalReviewInbox.tsx', 'tests/clinical-review-inbox-workbench.test.mjs']
records = []
for name in paths:
    before = (parent / name).read_bytes()
    after = (site / name).read_bytes()
    a, b = before.decode().splitlines(keepends=True), after.decode().splitlines(keepends=True)
    groups = list(difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_grouped_opcodes(4))
    operations = []
    for group in groups:
        i, j = group[0][1], group[-1][2]
        k, l = group[0][3], group[-1][4]
        old, new = ''.join(a[i:j]), ''.join(b[k:l])
        assert before.decode().count(old) == 1 and after.decode().count(new) == 1
        operations.append({'from': old, 'to': new})
    restored = after.decode()
    for op in reversed(operations):
        assert restored.count(op['to']) == 1
        restored = restored.replace(op['to'], op['from'], 1)
    assert restored.encode() == before
    records.append({'path': name, 'beforeSha256': sha(before), 'afterSha256': sha(after), 'operations': operations})

fixture = {'schema': 'vm-review-filter-source-role/1', 'purpose': 'Exact earlier source reconstruction for historical diff assertions only. Current behavior runs on actual current source.', 'records': records}
raw = (json.dumps(fixture, indent=2) + '\n').encode()
target = site / 'tests/fixtures/review-filter-scroll-transition.json'
with target.open('xb') as f: f.write(raw)
adapter = '''import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha = value => createHash('sha256').update(value).digest('hex');
const raw = readFileSync(new URL('./fixtures/review-filter-scroll-transition.json', import.meta.url));
assert.equal(sha(raw), 'FIXTURE_SHA');
const {records} = JSON.parse(raw);
/** Historical diff tests only. All interaction tests still execute current product code. */
export function beforeFilterScrollSource(path, current) {
  const record = records.find(item => item.path === path);
  if (!record) return current;
  if (sha(current) === record.beforeSha256) return current;
  assert.equal(sha(current), record.afterSha256, 'Only exact sealed filter-scroll source can reconstruct history');
  let source = current.toString();
  for (const {from, to} of [...record.operations].reverse()) {
    assert.equal(source.split(to).length, 2, 'One exact historical transition');
    source = source.replace(to, from);
  }
  assert.equal(sha(source), record.beforeSha256, 'Historical assertions retain their original source');
  return typeof current === 'string' ? source : Buffer.from(source);
}
'''.replace('FIXTURE_SHA', sha(raw))
with (site / 'tests/review-filter-scroll-source-role.mjs').open('x', newline='') as f: f.write(adapter)

def change(name, old, new):
    p = site / name
    s = p.read_bytes().decode()
    assert s.count(old) == 1, name
    p.write_bytes(s.replace(old, new).encode())

change('tests/inbox-deferred-return-source-role.mjs', "import fs from 'node:fs';", "import {beforeFilterScrollSource} from './review-filter-scroll-source-role.mjs';\nimport fs from 'node:fs';")
change('tests/inbox-deferred-return-source-role.mjs', 'export function priorInboxSource(current){assert.equal', "export function priorInboxSource(current){current=beforeFilterScrollSource('components/ClinicalReviewInbox.tsx',current);assert.equal")
change('tests/review-pager-inbox-history.mjs', "import {priorPagerInboxSource}", "import {beforeFilterScrollSource} from './review-filter-scroll-source-role.mjs';\nimport {priorPagerInboxSource}")
change('tests/review-pager-inbox-history.mjs', 'const raw=read(path);', 'const raw=beforeFilterScrollSource(path,read(path));')
change('tests/clinical-review-inbox-return-pager-focus.test.mjs', "test('proposal reconstructs the original component after removing three pager-focus seams'", "test('historical pager proposal reconstructs its original component after removing three pager-focus seams'")
change('tests/clinical-review-inbox-short-desktop.test.mjs', "test('actual inbox behavior, IDs, focus/navigation and server/access contracts are unchanged'", "test('historical short-desktop proposal preserved inbox behavior, IDs, focus/navigation and server/access contracts'")
change('tests/clinical-review-inbox-short-desktop.test.mjs', "test('every original workbench assertion survives the precise title clarification'", "test('historical short-desktop workbench preserves every original assertion through its title clarification'")

tests = '''import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {beforeFilterScrollSource} from './review-filter-scroll-source-role.mjs';
const sha = b => createHash('sha256').update(b).digest('hex');
const {records} = JSON.parse(readFileSync(new URL('./fixtures/review-filter-scroll-transition.json', import.meta.url)));
for (const row of records) {
  test('exact historical source projection and tamper rejection: ' + row.path, () => {
    const current = readFileSync(new URL('../' + row.path, import.meta.url));
    assert.equal(sha(current), row.afterSha256);
    const before = beforeFilterScrollSource(row.path, current);
    assert.equal(sha(before), row.beforeSha256);
    assert.equal(beforeFilterScrollSource(row.path, before), before);
    assert.equal(sha(beforeFilterScrollSource(row.path, current.toString())), row.beforeSha256);
    assert.throws(() => beforeFilterScrollSource(row.path, Buffer.concat([current, Buffer.from(' ')])), /Only exact sealed/);
  });
}
test('unrelated source is never rewritten by the historical adapter', () => {
  const source = Buffer.from('unchanged contract');
  assert.equal(beforeFilterScrollSource('lib/clinical-review-inbox-contract.ts', source), source);
});
'''
with (site / 'tests/clinical-review-inbox-filter-history.test.mjs').open('x', newline='') as f: f.write(tests)
print(json.dumps({'fixtureSha256': sha(raw), 'records': [{k:v for k,v in r.items() if k!='operations'} for r in records]}))
