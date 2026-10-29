import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Exact inverse of the partition additions. Each hunk occurs once; unexpected edits fail closed.
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const originalSha256 = '3c50f53df57f193439ccaa6bbf0a6eb9ed4383efc1a91b8f3b97be65eba36528';
const partitionedSha256 = 'a21056ff27adca9b1dffb34e6308e0ea36a71943ae024eea1856c5f7f38cb278';
const patches = [
  {
    "original": "import { createWriteStream, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';\n",
    "partitioned": "import { createReadStream, createWriteStream, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';\n"
  },
  {
    "original": "function inventory(root) {\n",
    "partitioned": "export function inventory(root) {\n"
  },
  {
    "original": "function parse(argv) {\n  let run = false, root = scriptRoot, modeSeen = false, rootSeen = false;\n",
    "partitioned": "export function parse(argv) {\n  let run = false, root = scriptRoot, modeSeen = false, rootSeen = false, partition = null;\n"
  },
  {
    "original": "",
    "partitioned": "    else if (argv[i] === '--partition' && partition === null && /^([1-9]\\d*)\\/([1-9]\\d*)$/.test(argv[i + 1] ?? '')) {\n      const [, index, count] = /^([1-9]\\d*)\\/([1-9]\\d*)$/.exec(argv[++i]);\n      partition = { index: Number(index), count: Number(count) };\n      if (!Number.isSafeInteger(partition.index) || !Number.isSafeInteger(partition.count) || partition.index > partition.count)\n        throw new Error('Invalid --partition INDEX/COUNT');\n    }\n"
  },
  {
    "original": "  return { run, root };\n",
    "partitioned": "  if (partition && !run) throw new Error('--partition requires --run');\n  return { run, root, partition };\n}\nexport function environmentFingerprint() {\n  const relevant = Object.keys(process.env).filter(key => /^(?:VM_|ATLAS_SOURCE_REPO$|NODE_OPTIONS$|NODE_PATH$|GIT_|TZ$|LANG$|LC_)/i.test(key)).sort();\n  return { sha256: sha(JSON.stringify(relevant.map(key => [key, process.env[key]]))) };\n}\nexport async function nodeIdentity() {\n  const digest = createHash('sha256');\n  for await (const chunk of createReadStream(process.execPath)) digest.update(chunk);\n  return { version: process.version, binarySha256: digest.digest('hex') };\n}\nexport function partitionExecution(execution, partition) {\n  if (!partition || execution.error) return execution;\n  const selectedRoots = execution.executedRoots.filter((_, position) => position % partition.count === partition.index - 1);\n  if (!selectedRoots.length) throw new Error('Partition has no executed roots');\n  return { ...execution, partition: { ...partition, universe: [...execution.executedRoots], selectedRoots },\n    args: [...testArgs.slice(0, -2), ...selectedRoots] };\n"
  },
  {
    "original": "  const { run, root } = parse(argv);\n",
    "partitioned": "  const { run, root, partition } = parse(argv);\n"
  },
  {
    "original": "  const execution = run ? await executionPlan(before, output, {probe}) : {\n",
    "partitioned": "  const fullExecution = run ? await executionPlan(before, output, {probe}) : {\n"
  },
  {
    "original": "",
    "partitioned": "  const execution = partitionExecution(fullExecution, partition);\n"
  },
  {
    "original": "",
    "partitioned": "    ...(partition ? { partition: execution.partition, runnerSha256: sha(readFileSync(fileURLToPath(import.meta.url))),\n      environment: environmentFingerprint(), node: await nodeIdentity() } : {}),\n"
  },
  {
    "original": "    testInputDrift: drift, publicPreviewAssetDrift, publicPreviewAssets: manifest.publicPreviewAssets, passingClaim,\n    counts,unskippedPassingClaim,claimScope:'Child exit and stable named inputs only. Website runs also require the admitted public preview set; generic test roots do not acquire that asset claim. Skipped/todo or unavailable-platform checks remain separate coverage limits; no clinical or release approval.',\n    finishedAt: new Date().toISOString() };\n",
    "partitioned": "    testInputDrift: drift, publicPreviewAssetDrift, publicPreviewAssets: manifest.publicPreviewAssets,\n    passingClaim: partition ? false : passingClaim,\n    counts,unskippedPassingClaim: partition ? false : unskippedPassingClaim,\n    claimScope:partition ? 'Partition only: no whole-suite passing claim. Combine every authenticated partition before claiming complete test roots; no clinical or release approval.' : 'Child exit and stable named inputs only. Website runs also require the admitted public preview set; generic test roots do not acquire that asset claim. Skipped/todo or unavailable-platform checks remain separate coverage limits; no clinical or release approval.',\n    finishedAt: new Date().toISOString(),\n    ...(partition ? { partition: execution.partition ?? partition, partitionPassingClaim: passingClaim,\n      partitionUnskippedPassingClaim: unskippedPassingClaim, runnerSha256: manifest.runnerSha256,\n      environment: manifest.environment, node: manifest.node,\n      evidenceSha256: Object.fromEntries(['manifest.json','started.json','child.log','child.tap', ...(execution.mirror?.capability?.log ? [execution.mirror.capability.log] : [])]\n        .filter(name => existsSync(join(output, name))).map(name => [name, sha(readFileSync(join(output, name)))])) } : {}) };\n"
  },
  {
    "original": "    publicPreviewAssetDrift, passingClaim: receipt.passingClaim,counts,unskippedPassingClaim }));\n",
    "partitioned": "    publicPreviewAssetDrift, passingClaim: receipt.passingClaim,counts,\n    unskippedPassingClaim:receipt.unskippedPassingClaim,\n    ...(partition ? {partition,partitionUnskippedPassingClaim:receipt.partitionUnskippedPassingClaim}: {}) }));\n"
  }
];
const baselineSha256 = '9dc062a40d1a92c45c4d0d45ab02957b4f54a32af9d96f9e84ce06601d828a7a';
// Exact inverse from the later raw-text/spinal runner to the authenticated history-test epoch.
const baselinePatches = [
  {
    "original": "",
    "later": "const spinal = Object.freeze({ target: 'tests/atlas-spinal-muscle-xray.test.mjs',\n  targetSha256: '887c9e268da834c19d3774faa9ba8f44ac6d95cf7fdc47c4d01cc38fc6937308',\n  bridge: 'tests/spinal-historical-replay.test.mjs',\n  bridgeSha256: '603d5d0e6bf876c1688cfd07e4d475b9e7b2c72462dd067b8052762e786d30fb',\n  fixture: 'tests/fixtures/atlas-spinal-muscle-xray-887c-historical.mjs.raw',\n  fixtureSha256: '887c9e268da834c19d3774faa9ba8f44ac6d95cf7fdc47c4d01cc38fc6937308' });\n"
  },
  {
    "original": "async function probeMirrorGlob(output, executable = process.execPath) {\n",
    "later": "async function probeMirrorGlob(output, {glob=mirror.mjsGlob,drop=[mirror.target],executable=process.execPath}={}) {\n"
  },
  {
    "original": "  writeFileSync(join(root, mirror.target), \"import test from 'node:test'; test('probe-drop',()=>{});\\n\");\n",
    "later": "  for(const target of drop)writeFileSync(join(root,target), \"import test from 'node:test'; test('probe-drop',()=>{});\\n\");\n"
  },
  {
    "original": "  const args = ['--test', mirror.mjsGlob];\n",
    "later": "  const args = ['--test', glob];\n"
  },
  {
    "original": "",
    "later": "export function spinalHistoricalRole(before){\n const target=before.files.find(file=>file.path===spinal.target);\n if(!target)return {present:false,active:false};\n const bridge=before.files.find(file=>file.path===spinal.bridge);\n const fixture=before.files.find(file=>file.path===spinal.fixture);\n const checks={target:target.sha256===spinal.targetSha256,\n  bridge:before.entries.includes(spinal.bridge)&&bridge?.sha256===spinal.bridgeSha256,\n  fixture:fixture?.sha256===spinal.fixtureSha256};\n return {present:true,active:Object.values(checks).every(Boolean),checks,\n  target:spinal.target,via:spinal.bridge,sourceRole:'authenticated-historical-389-replay',\n  error:Object.values(checks).every(Boolean)?null:\n   'Spinal historical role input mismatch: exact theorem, bridge and frozen fixture are required'};\n}\n"
  },
  {
    "original": "",
    "later": "  const historical=spinalHistoricalRole(before);\n"
  },
  {
    "original": "  if (wrapper?.sha256 !== mirror.wrapperSha256 || !before.entries.includes(mirror.wrapper) || !before.entries.includes(mirror.target)) return defaultPlan;\n",
    "later": "  const glotticEligible=wrapper?.sha256===mirror.wrapperSha256&&before.entries.includes(mirror.wrapper)&&before.entries.includes(mirror.target);\n  if(historical.error)return {...defaultPlan,spinalHistorical:historical,error:historical.error};\n  if(!glotticEligible&&!historical.present)return {...defaultPlan,spinalHistorical:historical};\n  const drop=[...(glotticEligible?[mirror.target]:[]),...(historical.active?[spinal.target]:[])];\n  const glob=`tests/!(${drop.map(path=>path.slice('tests/'.length,-'.test.mjs'.length)).join('|')}).test.mjs`;\n"
  },
  {
    "original": "  try { capability = await probe(output); }\n",
    "later": "  try { capability = await probe(output,{glob,drop}); }\n"
  },
  {
    "original": "  if (!capability.supported) return { ...defaultPlan, mirror: { eligible: true, active: false, reason: 'CLI exclusion probe failed; original globs retained', capability } };\n  return { args: [...testArgs.slice(0, -1), mirror.mjsGlob],\n    executedRoots: before.entries.filter(path => path !== mirror.target),\n    coveredByImport: [{ path: mirror.target, via: mirror.wrapper, wrapperSha256: mirror.wrapperSha256 }],\n    mirror: { eligible: true, active: true, capability } };\n",
    "later": "  if(!capability.supported){\n    const reason='CLI exclusion probe failed';\n    return { ...defaultPlan,spinalHistorical:historical,\n      ...(historical.active?{error:`Spinal historical role: ${reason}`}:{}),\n      mirror:{eligible:glotticEligible,active:false,reason:reason+'; original globs retained',capability} };\n  }\n  return {args:[...testArgs.slice(0,-1),glob],\n    executedRoots:before.entries.filter(path=>!drop.includes(path)),\n    coveredByImport:[...(glotticEligible?[{path:mirror.target,via:mirror.wrapper,wrapperSha256:mirror.wrapperSha256}]:[]),\n      ...(historical.active?[{path:spinal.target,via:spinal.bridge,wrapperSha256:spinal.bridgeSha256,\n        sourceRole:historical.sourceRole}]:[])],\n    mirror:{eligible:glotticEligible,active:glotticEligible,capability},\n    spinalHistorical:historical};\n"
  },
  {
    "original": "export async function main(argv = process.argv.slice(2)) {\n",
    "later": "export async function main(argv = process.argv.slice(2), {probe=probeMirrorGlob}={}) {\n"
  },
  {
    "original": "  const execution = run ? await executionPlan(before, output) : {\n",
    "later": "  const execution = run ? await executionPlan(before, output, {probe}) : {\n"
  },
  {
    "original": "    mirror: { eligible: false, active: false, reason: 'list mode does not execute tests' } };\n",
    "later": "    mirror: { eligible: false, active: false, reason: 'list mode does not execute tests' },\n    spinalHistorical:{...spinalHistoricalRole(before),plannedOnly:true} };\n"
  },
  {
    "original": "  const result = run ? await launch(root, output, {onSpawn(child) {\n",
    "later": "  const result = run && !execution.error ? await launch(root, output, {onSpawn(child) {\n"
  },
  {
    "original": "  if (run) {\n",
    "later": "  if (run && !execution.error) {\n"
  },
  {
    "original": "  const counts=run?testCounts(join(output,'child.log')):null;\n",
    "later": "  const counts=run&&!execution.error?testCounts(join(output,'child.log')):null;\n"
  },
  {
    "original": "    launched: run, child: result, testInputDrift: drift, publicPreviewAssetDrift, publicPreviewAssets: manifest.publicPreviewAssets, passingClaim,\n",
    "later": "    launched: run&&!execution.error, child: result, executionError:execution.error??null,\n    testInputDrift: drift, publicPreviewAssetDrift, publicPreviewAssets: manifest.publicPreviewAssets, passingClaim,\n"
  },
  {
    "original": "  console.log(JSON.stringify({ output, entryCount: receipt.entryCount, launched: run, childExitCode: result.exitCode, testInputDrift: drift, publicPreviewAssetDrift, passingClaim: receipt.passingClaim,counts,unskippedPassingClaim }));\n  return run && (drift || publicPreviewAssetDrift) ? 1 : result.exitCode;\n",
    "later": "  console.log(JSON.stringify({ output, entryCount: receipt.entryCount, launched: receipt.launched,\n    executionError:receipt.executionError,childExitCode:result.exitCode, testInputDrift: drift,\n    publicPreviewAssetDrift, passingClaim: receipt.passingClaim,counts,unskippedPassingClaim }));\n  return run && (execution.error || drift || publicPreviewAssetDrift) ? 1 : result.exitCode;\n"
  }
];
function replaceOnce(source, oldText, newText) {
  assert.ok(oldText.length > 0, 'empty partition hunk');
  const first = source.indexOf(oldText);
  assert.notEqual(first, -1, 'partition hunk missing');
  assert.equal(source.indexOf(oldText, first + oldText.length), -1, 'partition hunk repeated');
  return source.slice(0, first) + newText + source.slice(first + oldText.length);
}
export function readPrePartitionRunnerForHistoryAssertion(currentPath) {
  const current = readFileSync(currentPath);
  const original = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'website-test-pre-partition-runner.mjs.raw'));
  assert.equal(sha(current), partitionedSha256, 'unexpected current runner bytes');
  assert.equal(sha(original), originalSha256, 'untrusted original runner fixture');
  let inverse = current.toString('utf8');
  for (const { original: before, partitioned: after } of [...patches].reverse())
    inverse = replaceOnce(inverse, after, before);
  assert.deepEqual(Buffer.from(inverse, 'utf8'), original, 'inverse partition transform differs from original source');
  assert.deepEqual(readFileSync(currentPath), current, 'current runner changed during inverse verification');
  let baseline = inverse;
  for (const { original: before, later: after } of [...baselinePatches].reverse())
    baseline = replaceOnce(baseline, after, before);
  assert.equal(sha(Buffer.from(baseline, 'utf8')), baselineSha256, 'historical runner epoch mismatch');
  return baseline;
}
