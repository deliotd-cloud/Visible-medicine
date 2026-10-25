import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from './workspace-test-build.mjs';

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
test('display region includes shared structures without changing primary ownership or global totals', async () => {
  const all = run([]);
  const displayed = run(['--display-region=shoulder-arm']);
  const primary = run(['--region=shoulder-arm']);
  const limited = run(['--display-region=shoulder-arm','--limit=2']);
  const displayedMri = run(['--display-region=shoulder-arm','--topic=mri','--readiness=pending']);
  const source = JSON.parse(readFileSync(new URL('../public/models/bodyparts3d/full-body/catalog.json', import.meta.url)));
  const compiled = await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog.ts';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
  const api = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const displayedCatalog = api.bodyDisplayCatalog(source);
  assert.equal(createHash('sha256').update(JSON.stringify(displayedCatalog.structures)).digest('hex'),all.evidence.displayedStructuresSha256,'Use the same actual displayed catalogue as the real CLI');
  const rawById = new Map(displayedCatalog.structures.map(structure => [structure.id, structure]));
  const shared = all.rows.filter(row => rawById.get(row.id)?.regions.includes('shoulder-arm') && row.region !== 'shoulder-arm');
  assert(shared.length > 0, 'Current catalog must provide a taught shared structure');
  assert.deepEqual(primary.selectedRegion, {id:'shoulder-arm',meaning:'primary-ownership'});
  assert.deepEqual(displayed.selectedRegion, {id:'shoulder-arm',meaning:'catalog-display-membership'});
  assert.equal(all.selectedRegion, null);
  assert(displayed.matchingRows > primary.matchingRows);
  assert.equal(displayed.matchingRows, displayed.rows.length);
  const expectedMri = displayed.rows.filter(row => row.topic === 'mri' && row.readiness === 'pending');
  assert(expectedMri.some(row => row.region !== 'shoulder-arm'), 'Displayed MRI gaps must include shared anatomy');
  assert.deepEqual(displayedMri.rows, expectedMri);
  assert.equal(displayedMri.matchingRows, expectedMri.length);
  for (const row of shared) assert(displayed.rows.some(candidate => candidate.id === row.id && candidate.topic === row.topic && candidate.region === row.region));
  for (const row of displayed.rows) {
    const raw = rawById.get(row.id);
    if (raw) assert(raw.regions.includes('shoulder-arm'), `Unexpected display member: ${row.id}`);
  }
  assert.deepEqual(limited.rows, displayed.rows.slice(0,2));
  assert.equal(limited.matchingRows, displayed.matchingRows);
  for (const result of [displayed,primary,limited,displayedMri]) for (const key of ['totals','byRegion','byTopic','evidence']) assert.deepEqual(result[key],all[key]);
});
test('invalid options fail closed and help succeeds without a report', () => {
  for (const args of [['--limit=0'],['--limit=1.5'],['--limit=9007199254740992'],['--topic=ct','--topic=mri'],['--unknown=yes'],['--region='],['--topic=unknown'],['--display-region='],['--display-region=unknown'],['--region=thorax','--display-region=shoulder-arm']]) {
    const result = spawnSync(process.execPath, ['scripts/report-teaching-gaps.mjs', ...args], {cwd:root,encoding:'utf8',windowsHide:true});
    assert.notEqual(result.status,0,args.join(' '));
    assert.equal(result.stdout,'');
  }
  const help = spawnSync(process.execPath, ['scripts/report-teaching-gaps.mjs','--help'], {cwd:root,encoding:'utf8',windowsHide:true});
  assert.equal(help.status,0);
  assert.match(help.stdout,/root-body teaching only/);
  assert.match(help.stdout,/--display-region selects catalog display membership/);
});
