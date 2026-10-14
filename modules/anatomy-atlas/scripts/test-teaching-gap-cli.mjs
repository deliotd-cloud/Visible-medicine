import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const run = args => JSON.parse(execFileSync(process.execPath, ['scripts/report-teaching-gaps.mjs', ...args], {
  cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 16e6,
}));
test('real resolver inventory, filters and limits preserve full-scope totals', () => {
  const all = run([]);
  const filtered = run(['--region=thorax', '--topic=ultrasound', '--readiness=pending', '--limit=2']);
  assert.equal(all.scope, 'root-body');
  assert.equal(all.placementCount, all.structureCount * all.topics.length);
  assert.equal(Object.values(all.totals).reduce((a,b) => a+b,0), all.placementCount);
  assert.equal(all.rows.length, all.placementCount-all.totals.draft);
  assert.equal(all.matchingRows, all.rows.length);
  const expected = all.rows.filter(row => row.region === 'thorax' && row.topic === 'ultrasound' && row.readiness === 'pending');
  assert.deepEqual(filtered.rows, expected.slice(0,2));
  assert.equal(filtered.matchingRows, expected.length);
  for (const key of ['totals','byRegion','byTopic','evidence']) assert.deepEqual(filtered[key],all[key]);
  for (const key of ['resolverSha256','catalogSha256','displayedStructuresSha256','inventorySha256','runnerSha256']) assert.match(all.evidence[key],/^[a-f0-9]{64}$/);
  for (const row of all.rows) assert.deepEqual(Object.keys(row).sort(), ['fmaId','id','name','readiness','region','system','topic']);
  // Teaching can fill a previously pending bucket. Keep the thorax assertions
  // above, but exercise actual truncation using a current bucket with >2 rows.
  const buckets = new Map();
  for (const row of all.rows) {
    const key = `${row.region}:${row.topic}:${row.readiness}`;
    buckets.set(key, [...(buckets.get(key) ?? []), row]);
  }
  const overflow = [...buckets.values()].find(rows => rows.length > 2);
  assert(overflow, 'Current inventory must provide a non-draft truncation sample');
  const first = overflow[0];
  const limited = run([`--region=${first.region}`, `--topic=${first.topic}`, `--readiness=${first.readiness}`, '--limit=2']);
  assert(overflow.length > 2);
  assert.deepEqual(limited.rows, overflow.slice(0,2));
  assert.equal(limited.matchingRows, overflow.length);
  for (const key of ['totals','byRegion','byTopic','evidence']) assert.deepEqual(limited[key],all[key]);
});
test('invalid options fail closed and help succeeds without a report', () => {
  for (const args of [['--limit=0'],['--limit=1.5'],['--limit=9007199254740992'],['--topic=ct','--topic=mri'],['--unknown=yes'],['--region='],['--topic=unknown']]) {
    const result = spawnSync(process.execPath, ['scripts/report-teaching-gaps.mjs', ...args], {cwd:root,encoding:'utf8',windowsHide:true});
    assert.notEqual(result.status,0,args.join(' '));
    assert.equal(result.stdout,'');
  }
  const help = spawnSync(process.execPath, ['scripts/report-teaching-gaps.mjs','--help'], {cwd:root,encoding:'utf8',windowsHide:true});
  assert.equal(help.status,0);
  assert.match(help.stdout,/root-body teaching only/);
});
