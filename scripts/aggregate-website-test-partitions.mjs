#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { lstatSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { environmentFingerprint, executionPlan, inventory, nodeIdentity } from './run-website-tests.mjs';
import { assertWebsiteTestHistory } from './website-test-history-preflight.mjs';
import { verifyPublicPreviewAssets } from './public-preview-preflight.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const fail = message => { throw new Error(`Partition aggregation: ${message}`); };
function regular(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`nonregular evidence: ${path}`);
  return readFileSync(path);
}
function summary(bytes, prefix) {
  const fields = {};
  const lines = bytes.toString('utf8').replace(/\u001b\[[0-9;]*m/g, '').split(/\r?\n/);
  for (const line of lines) {
    const match = new RegExp(`^${prefix} (tests|pass|fail|cancelled|skipped|todo) (\\d+)$`).exec(line);
    if (match) fields[match[1]] = Number(match[2]);
  }
  if (!['tests','pass','fail','cancelled','skipped','todo'].every(key => Number.isSafeInteger(fields[key])))
    fail('incomplete child summary');
  if (fields.tests <= 0 || fields.tests !== fields.pass || ['fail','cancelled','skipped','todo'].some(key => fields[key] !== 0))
    fail('child summary is empty, failed, skipped or TODO');
  return fields;
}
function tapResults(bytes, counts) {
  const lines = bytes.toString('utf8').split(/\r?\n/);
  const plans = lines.flatMap((line, index) => {
    const match = /^1\.\.(\d+)$/.exec(line);
    return match ? [{ index, size: Number(match[1]) }] : [];
  });
  if (plans.length !== 1 || !Number.isSafeInteger(plans[0].size) || plans[0].size < 1)
    fail('missing or ambiguous terminal TAP plan');
  const results = lines.slice(0, plans[0].index).flatMap(line => {
    const match = /^(ok|not ok) (\d+)(?:\s|$)/.exec(line);
    return match ? [{ status: match[1], index: Number(match[2]) }] : [];
  });
  if (results.length !== plans[0].size || results.some((row, i) => row.status !== 'ok' || row.index !== i + 1) ||
      counts.tests < results.length || lines.some(line => /^\s*not ok\b/i.test(line) ||
        /^\s*ok\b.*\s#\s*(?:TODO|SKIP)\b/i.test(line)))
    fail('TAP results do not match terminal plan or contain failing/skipped entries');
  if (lines.slice(plans[0].index + 1).some(line => line && !/^# (?:tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) /.test(line)))
    fail('unexpected content after terminal TAP plan');
}
function load(dir) {
  const stat = lstatSync(dir);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`unsafe receipt directory: ${dir}`);
  const receipt = JSON.parse(regular(join(dir, 'receipt.json')).toString('utf8'));
  const expected = receipt.evidenceSha256;
  if (!expected || typeof expected !== 'object' || Array.isArray(expected)) fail('missing evidence hashes');
  for (const name of ['manifest.json','started.json','child.log','child.tap'])
    if (!/^[a-f0-9]{64}$/.test(expected[name] ?? '') || hash(regular(join(dir, name))) !== expected[name])
      fail(`missing or changed ${name}: ${dir}`);
  const manifest = JSON.parse(regular(join(dir, 'manifest.json')).toString('utf8'));
  const started = JSON.parse(regular(join(dir, 'started.json')).toString('utf8'));
  if (!same(Object.keys(expected).sort(), ['manifest.json','started.json','child.log','child.tap',
    ...(manifest.execution?.mirror?.capability?.log ? [manifest.execution.mirror.capability.log] : [])].sort()))
    fail('unexpected evidence set');
  for (const name of Object.keys(expected)) {
    if (!/^(?:manifest\.json|started\.json|child\.log|child\.tap|glob-probe\.log)$/.test(name) ||
        hash(regular(join(dir, name))) !== expected[name]) fail(`changed evidence: ${name}`);
  }
  if (receipt.schema !== 'vm-complete-test-receipt-1' || manifest.schema !== 'vm-complete-test-manifest-1' ||
      receipt.mode !== 'run' || manifest.mode !== 'run' || resolve(receipt.output) !== dir ||
      receipt.entryCount !== manifest.entryCount || !same(receipt.publicPreviewAssets, manifest.publicPreviewAssets) ||
      !receipt.launched || receipt.executionError !== null || receipt.child?.exitCode !== 0 ||
      receipt.child.signal !== null || receipt.child.startError || receipt.testInputDrift !== false ||
      (manifest.publicPreviewAssets?.required ? receipt.publicPreviewAssetDrift !== false : receipt.publicPreviewAssetDrift !== null) ||
      receipt.passingClaim !== false ||
      receipt.unskippedPassingClaim !== false || receipt.partitionPassingClaim !== true ||
      receipt.partitionUnskippedPassingClaim !== true)
    fail(`invalid execution receipt: ${dir}`);
  if (started.schema !== 'vm-complete-test-start-1' || started.executable !== process.execPath ||
      !Number.isSafeInteger(started.testPid) ||
      started.testPid <= 0 || !same(started.args, manifest.execution.args) ||
      !same(receipt.child.args, manifest.execution.args) || resolve(started.cwd) !== resolve(manifest.root) ||
      started.entrySha256 !== manifest.entrySha256 || started.sourceSha256 !== manifest.sourceSha256)
    fail(`invalid spawn evidence: ${dir}`);
  const spec = summary(regular(join(dir, 'child.log')), 'ℹ');
  const tap = summary(regular(join(dir, 'child.tap')), '#');
  if (!same(spec, tap) || !same(spec, receipt.counts)) fail(`spec/TAP/receipt count mismatch: ${dir}`);
  tapResults(regular(join(dir, 'child.tap')), tap);
  const partition = manifest.partition;
  if (!partition || !same(partition, receipt.partition) || !same(partition, manifest.execution.partition) ||
      !Number.isSafeInteger(partition.index) || !Number.isSafeInteger(partition.count) ||
      partition.index < 1 || partition.count < 1 || partition.index > partition.count ||
      !Array.isArray(partition.universe) || !Array.isArray(partition.selectedRoots) || !partition.selectedRoots.length ||
      !same(partition.universe, manifest.execution.executedRoots) ||
      !same(partition.selectedRoots, partition.universe.filter((_, i) => i % partition.count === partition.index - 1)))
    fail(`invalid partition plan: ${dir}`);
  const args = manifest.execution.args;
  if (!same(args, ['--test','--test-reporter=spec','--test-reporter-destination=stdout',
      '--test-reporter=tap',`--test-reporter-destination=${join(dir, 'child.tap')}`,
      '--experimental-strip-types','--test-concurrency=1', ...partition.selectedRoots]))
    fail(`unexpected child args: ${dir}`);
  if (!same(receipt.environment, manifest.environment) || !same(manifest.environment, environmentFingerprint()) ||
      !same(receipt.node, manifest.node) ||
      receipt.runnerSha256 !== manifest.runnerSha256 ||
      manifest.runnerSha256 !== hash(regular(join(dirname(fileURLToPath(import.meta.url)), 'run-website-tests.mjs'))))
    fail(`runner or environment mismatch: ${dir}`);
  return { dir, receipt, manifest, partition, spec };
}
export async function aggregatePartitionDirs(directories) {
  if (!Array.isArray(directories) || !directories.length) fail('provide partition receipt directories');
  const rows = directories.map(path => load(resolve(path)));
  const first = rows[0].manifest;
  const count = rows[0].partition.count;
  if (rows.length !== count) fail('partition count mismatch');
  const indices = new Set(), roots = new Set();
  for (const row of rows) {
    const m = row.manifest, p = row.partition;
    if (p.count !== count || indices.has(p.index)) fail('duplicate or mismatched partition');
    indices.add(p.index);
    for (const root of p.selectedRoots) {
      if (roots.has(root)) fail('overlapping executed root');
      roots.add(root);
    }
    const comparable = x => ({ root:x.root, entries:x.entries, files:x.files, entryCount:x.entryCount,
      entrySha256:x.entrySha256, sourceSha256:x.sourceSha256, runnerSha256:x.runnerSha256,
      environment:x.environment, node:x.node, publicPreviewAssets:x.publicPreviewAssets,
      execution:{...x.execution, args:null, partition:null} });
    if (!same(comparable(m), comparable(first))) fail('different source, environment or execution plan');
  }
  if (!same([...indices].sort((a,b)=>a-b), Array.from({length:count},(_,i)=>i+1)) ||
      !same([...roots].sort(), [...first.partition.universe].sort())) fail('missing executed root');
  const imported = first.execution.coveredByImport;
  if (!Array.isArray(imported) || imported.some(row => !roots.has(row.via) || roots.has(row.path)) ||
      !same([...roots, ...imported.map(row=>row.path)].sort(), [...first.entries].sort()))
    fail('entries lack complete executed/import role coverage');
  const current = inventory(first.root);
  if (!same(current.entries, first.entries) || !same(current.files, first.files) ||
      hash(JSON.stringify(current.entries)) !== first.entrySha256 ||
      hash(JSON.stringify(current.files)) !== first.sourceSha256) fail('source changed since partitions ran');
  if (!same(first.node, await nodeIdentity())) fail('Node binary or version changed');
  const tempRoot = resolve(tmpdir());
  const probeOutput = resolve(mkdtempSync(join(tempRoot, 'vm-aggregate-plan-')));
  if (!probeOutput.startsWith(tempRoot + sep)) fail('unsafe temporary probe directory');
  let authoritative;
  try { authoritative = await executionPlan(current, probeOutput); }
  finally { rmSync(probeOutput, { recursive:true, force:true }); }
  if (authoritative.error || !same(first.partition.universe, authoritative.executedRoots) ||
      !same(first.execution.coveredByImport, authoritative.coveredByImport) ||
      !same(first.execution.mirror, authoritative.mirror) ||
      !same(first.execution.spinalHistorical, authoritative.spinalHistorical))
    fail('recorded execution/import plan differs from authoritative plan');
  if (first.publicPreviewAssets?.required) {
    if (!same(verifyPublicPreviewAssets(first.root), first.publicPreviewAssets.before)) fail('public assets changed');
  }
  const websiteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (resolve(first.root) === websiteRoot) assertWebsiteTestHistory(first.root);
  return { schema:'vm-partition-aggregate-1', complete:true, root:first.root, partitions:count,
    at:new Date().toISOString(), environment:first.environment, node:first.node,
    evidence:rows.map(row=>({directory:row.dir,receiptSha256:hash(regular(join(row.dir,'receipt.json'))),manifestSha256:hash(regular(join(row.dir,'manifest.json')))})),
    aggregatorSha256:hash(regular(fileURLToPath(import.meta.url))),
    entryCount:first.entryCount, executedRootCount:roots.size,
    counts:rows.reduce((a,row)=>Object.fromEntries(Object.keys(row.spec).map(key=>[key,(a[key]??0)+row.spec[key]])),{}),
    entrySha256:first.entrySha256, sourceSha256:first.sourceSha256, runnerSha256:first.runnerSha256,
    claimScope:'Complete selected test roots and authenticated import roles for one matching source/environment. No clinical, privacy or release approval.' };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await aggregatePartitionDirs(process.argv.slice(2)),null,2)); }
  catch (error) { console.error(String(error)); process.exitCode=1; }
}
