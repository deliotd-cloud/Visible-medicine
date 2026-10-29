#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyPublicPreviewAssets } from './public-preview-preflight.mjs';
import { assertWebsiteTestHistory } from './website-test-history-preflight.mjs';

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Effective text/code/metadata inputs only. No binary models, scans, masks, media,
// credentials, private runtime state, node_modules or generated build directories.
const sourceDirs = ['app', 'atlas-review', 'components', 'db', 'docs', 'drizzle', 'hooks', 'lib', 'LICENSES', 'scripts', 'server', 'shared', 'src', 'tests', 'types', 'worker',
  'public/atlas-runtime', 'public/atlas-review-viewer', 'public/fracture-review', 'public/media/atlas'];
const sourceFiles = ['.gitattributes', 'package.json', 'package-lock.json', 'tsconfig.json', 'drizzle.config.ts', 'eslint.config.mjs', 'next.config.js', 'next.config.mjs', 'next.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.ts', '.codex/config.toml', '.openai/hosting.json', 'AGENTS.md', 'README.md', 'env.d.ts', 'public/favicon.svg'];
const sourceExtension = /\.(?:css|csv|html|js|jsx|json|jsonl|md|mjs|mts|sql|svg|toml|ts|tsx|txt|xml|yaml|yml)$/i;
// Historical .raw proofs are text evidence, not global raw-image inputs. Fail
// closed for a non-text/oversized eligible fixture rather than silently omit it.
const rawTextFixture = /^tests\/fixtures\/.+\.raw$/i;
const maxRawTextFixtureBytes = 16 * 1024 * 1024;
const testArgs = Object.freeze(['--test', '--experimental-strip-types', '--test-concurrency=1', 'tests/*.test.ts', 'tests/*.test.mjs']);
// One byte-proven import-only wrapper. A changed wrapper returns to ordinary discovery.
const mirror = Object.freeze({ wrapper: 'tests/atlas-glottic-muscle-imaging.test.ts',
  target: 'tests/atlas-glottic-muscle-imaging.test.mjs',
  wrapperSha256: 'a3d30dd530ad31ccc4e55b60c16cd68bddf421ad77a661340d1bbc414e880e0b',
  mjsGlob: 'tests/!(atlas-glottic-muscle-imaging).test.mjs' });
const spinal = Object.freeze({ target: 'tests/atlas-spinal-muscle-xray.test.mjs',
  targetSha256: '887c9e268da834c19d3774faa9ba8f44ac6d95cf7fdc47c4d01cc38fc6937308',
  bridge: 'tests/spinal-historical-replay.test.mjs',
  bridgeSha256: '603d5d0e6bf876c1688cfd07e4d475b9e7b2c72462dd067b8052762e786d30fb',
  fixture: 'tests/fixtures/atlas-spinal-muscle-xray-887c-historical.mjs.raw',
  fixtureSha256: '887c9e268da834c19d3774faa9ba8f44ac6d95cf7fdc47c4d01cc38fc6937308' });
const excludedDirectoryNames = new Set(['.git', '.local', '.next', '.vinext', '.wrangler', 'dist', 'node_modules', 'private', 'secrets', 'credentials', 'patient-data', 'scan-data', 'mask-data']);
const excludedFileNames = new Set(['id_rsa', 'id_ed25519', 'credentials.json', 'secrets.json']);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const slash = path => path.split(sep).join('/');
export function assertRegularStat(path, stat) {
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Nonregular or symlink input: ${path}`);
  return stat;
}
function regular(path) { return assertRegularStat(path, lstatSync(path)); }
function directory(path) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Nonregular or symlink directory: ${path}`);
}
export function inventory(root) {
  const tests = join(root, 'tests');
  directory(tests);
  const entries = [];
  for (const name of readdirSync(tests)) {
    if (!/\.test\.(?:ts|mjs)$/.test(name)) continue;
    const path = join(tests, name);
    regular(path);
    entries.push(`tests/${name}`);
  }
  entries.sort();
  if (!entries.length) throw new Error('No test entries discovered');
  const all = new Set(entries);
  function walk(base) {
    for (const name of readdirSync(base).sort()) {
      if (excludedDirectoryNames.has(name.toLowerCase()) || excludedFileNames.has(name.toLowerCase()) || name.toLowerCase().startsWith('.env')) continue;
      const path = join(base, name);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw new Error(`Symlink in source inventory: ${path}`);
      if (stat.isDirectory()) walk(path);
      else if (stat.isFile() && sourceExtension.test(name)) all.add(slash(relative(root, path)));
      else if (stat.isFile() && rawTextFixture.test(slash(relative(root, path)))) {
        if (stat.size > maxRawTextFixtureBytes) throw new Error(`Oversized raw text fixture: ${path}`);
        const bytes = readFileSync(path);
        if (bytes.includes(0)) throw new Error(`NUL in raw text fixture: ${path}`);
        try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
        catch { throw new Error(`Invalid UTF-8 raw text fixture: ${path}`); }
        all.add(slash(relative(root, path)));
      }
      else if (stat.isFile()) continue;
      else throw new Error(`Nonregular source input: ${path}`);
    }
  }
  for (const name of sourceDirs) if (existsSync(join(root, name))) { directory(join(root, name)); walk(join(root, name)); }
  for (const name of sourceFiles) if (existsSync(join(root, name))) { regular(join(root, name)); all.add(name); }
  const files = [...all].sort().map(path => ({ path, sha256: sha(readFileSync(join(root, path))) }));
  return { entries, files, sourceScope: { directories: sourceDirs, rootFiles: sourceFiles,
    extensionWhitelist: sourceExtension.source,
    rawTextFixturePolicy: { pathPattern: rawTextFixture.source, maxBytes: maxRawTextFixtureBytes, utf8: 'fatal', nul: 'reject', nonText: 'fail-closed' },
    excludedDirectoryNames: [...excludedDirectoryNames].sort(), excludedFileNames: [...excludedFileNames].sort(), caseInsensitiveExclusions: true,
    limits: 'Text/code/metadata fingerprints in named paths only; excludes binary GLB, scan and mask files, media, credentials, private runtime files, build products and other unlisted paths. Not a complete source/data or clinical certificate.' } };
}
export function parse(argv) {
  let run = false, root = scriptRoot, modeSeen = false, rootSeen = false, partition = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--run' || argv[i] === '--list') {
      if (modeSeen) throw new Error('Specify at most one of --run and --list');
      modeSeen = true;
      run = argv[i] === '--run';
    }
    else if (argv[i] === '--root' && !rootSeen && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      rootSeen = true;
      root = resolve(argv[++i]);
    }
    else if (argv[i] === '--partition' && partition === null && /^([1-9]\d*)\/([1-9]\d*)$/.test(argv[i + 1] ?? '')) {
      const [, index, count] = /^([1-9]\d*)\/([1-9]\d*)$/.exec(argv[++i]);
      partition = { index: Number(index), count: Number(count) };
      if (!Number.isSafeInteger(partition.index) || !Number.isSafeInteger(partition.count) || partition.index > partition.count)
        throw new Error('Invalid --partition INDEX/COUNT');
    }
    else throw new Error(`Unknown or incomplete argument: ${argv[i]}`);
  }
  if (partition && !run) throw new Error('--partition requires --run');
  return { run, root, partition };
}
export function environmentFingerprint() {
  const relevant = Object.keys(process.env).filter(key => /^(?:VM_|ATLAS_SOURCE_REPO$|NODE_OPTIONS$|NODE_PATH$|GIT_|TZ$|LANG$|LC_)/i.test(key)).sort();
  return { sha256: sha(JSON.stringify(relevant.map(key => [key, process.env[key]]))) };
}
export async function nodeIdentity() {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(process.execPath)) digest.update(chunk);
  return { version: process.version, binarySha256: digest.digest('hex') };
}
export function partitionExecution(execution, partition) {
  if (!partition || execution.error) return execution;
  const selectedRoots = execution.executedRoots.filter((_, position) => position % partition.count === partition.index - 1);
  if (!selectedRoots.length) throw new Error('Partition has no executed roots');
  return { ...execution, partition: { ...partition, universe: [...execution.executedRoots], selectedRoots },
    args: [...testArgs.slice(0, -2), ...selectedRoots] };
}
function outputDir(root) {
  directory(root);
  const local = join(root, '.local');
  if (!existsSync(local)) mkdirSync(local);
  directory(local);
  const runs = join(local, 'website-test-runs');
  if (!existsSync(runs)) mkdirSync(runs);
  directory(runs);
  const output = join(runs, `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`);
  mkdirSync(output); // unique, never reuse or clear an existing result
  return output;
}
function save(path, value) { writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' }); }
function testCounts(path) {
  const counts={};
  for(const line of readFileSync(path,'utf8').replace(/\u001b\[[0-9;]*m/g,'').split(/\r?\n/)){
    const match=line.match(/^ℹ (tests|pass|fail|cancelled|skipped|todo) (\d+)$/);
    if(match)counts[match[1]]=Number(match[2]);
  }
  return counts;
}
async function probeMirrorGlob(output, {glob=mirror.mjsGlob,drop=[mirror.target],executable=process.execPath}={}) {
  const root = join(output, 'glob-probe');
  mkdirSync(join(root, 'tests'), { recursive: true });
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n');
  for(const target of drop)writeFileSync(join(root,target), "import test from 'node:test'; test('probe-drop',()=>{});\n");
  writeFileSync(join(root, 'tests', 'keep.test.mjs'), "import test from 'node:test'; test('probe-keep',()=>{});\n");
  const args = ['--test', glob];
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const outcome = await new Promise(resolve => {
    const child = spawn(executable, args, { cwd: root, env, windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '', settled = false;
    const finish = value => { if (!settled) { settled = true; resolve(value); } };
    child.stdout.on('data', chunk => { log += chunk; });
    child.stderr.on('data', chunk => { log += chunk; });
    child.once('error', error => finish({ exitCode: 1, log: log + String(error) }));
    child.once('close', code => finish({ exitCode: code ?? 1, log }));
  });
  writeFileSync(join(output, 'glob-probe.log'), outcome.log, { flag: 'wx' });
  return { supported: outcome.exitCode === 0 && /probe-keep/.test(outcome.log) &&
    !/probe-drop/.test(outcome.log) && /(?:^|\n)[#ℹ] tests 1\r?$/m.test(outcome.log) &&
    /(?:^|\n)[#ℹ] pass 1\r?$/m.test(outcome.log),
    exitCode: outcome.exitCode, args, log: 'glob-probe.log' };
}
export function spinalHistoricalRole(before){
 const target=before.files.find(file=>file.path===spinal.target);
 if(!target)return {present:false,active:false};
 const bridge=before.files.find(file=>file.path===spinal.bridge);
 const fixture=before.files.find(file=>file.path===spinal.fixture);
 const checks={target:target.sha256===spinal.targetSha256,
  bridge:before.entries.includes(spinal.bridge)&&bridge?.sha256===spinal.bridgeSha256,
  fixture:fixture?.sha256===spinal.fixtureSha256};
 return {present:true,active:Object.values(checks).every(Boolean),checks,
  target:spinal.target,via:spinal.bridge,sourceRole:'authenticated-historical-389-replay',
  error:Object.values(checks).every(Boolean)?null:
   'Spinal historical role input mismatch: exact theorem, bridge and frozen fixture are required'};
}
export async function executionPlan(before, output, { probe = probeMirrorGlob } = {}) {
  const defaultPlan = { args: [...testArgs], executedRoots: [...before.entries], coveredByImport: [],
    mirror: { eligible: false, active: false, reason: 'no exact known wrapper and target' } };
  const historical=spinalHistoricalRole(before);
  const wrapper = before.files.find(file => file.path === mirror.wrapper);
  const glotticEligible=wrapper?.sha256===mirror.wrapperSha256&&before.entries.includes(mirror.wrapper)&&before.entries.includes(mirror.target);
  if(historical.error)return {...defaultPlan,spinalHistorical:historical,error:historical.error};
  if(!glotticEligible&&!historical.present)return {...defaultPlan,spinalHistorical:historical};
  const drop=[...(glotticEligible?[mirror.target]:[]),...(historical.active?[spinal.target]:[])];
  const glob=`tests/!(${drop.map(path=>path.slice('tests/'.length,-'.test.mjs'.length)).join('|')}).test.mjs`;
  let capability;
  try { capability = await probe(output,{glob,drop}); }
  catch (error) { capability = { supported: false, error: String(error) }; }
  if(!capability.supported){
    const reason='CLI exclusion probe failed';
    return { ...defaultPlan,spinalHistorical:historical,
      ...(historical.active?{error:`Spinal historical role: ${reason}`}:{}),
      mirror:{eligible:glotticEligible,active:false,reason:reason+'; original globs retained',capability} };
  }
  return {args:[...testArgs.slice(0,-1),glob],
    executedRoots:before.entries.filter(path=>!drop.includes(path)),
    coveredByImport:[...(glotticEligible?[{path:mirror.target,via:mirror.wrapper,wrapperSha256:mirror.wrapperSha256}]:[]),
      ...(historical.active?[{path:spinal.target,via:spinal.bridge,wrapperSha256:spinal.bridgeSha256,
        sourceRole:historical.sourceRole}]:[])],
    mirror:{eligible:glotticEligible,active:glotticEligible,capability},
    spinalHistorical:historical};
}
export async function launch(root, output, { executable = process.execPath, onSpawn, args = testArgs } = {}) {
  const log = createWriteStream(join(output, 'child.log'), { flags: 'wx' });
  args = [...args];
  let child;
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT; // A parent Node test may call this runner; the child is a fresh top-level test process.
  try { child = spawn(executable, args, { cwd: root, env, windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (error) { log.end(); return { exitCode: 1, startError: String(error) }; }
  onSpawn?.(child);
  child.stdout?.pipe(log, { end: false });
  child.stderr?.pipe(log, { end: false });
  const forward = signal => { if (child && !child.killed) child.kill(signal); };
  process.on('SIGINT', forward);
  process.on('SIGTERM', forward);
  const result = await new Promise(resolve => {
    child.once('error', error => resolve({ exitCode: 1, startError: String(error) }));
    child.once('close', (code, signal) => resolve({ exitCode: code ?? (signal ? 1 : 1), signal: signal ?? null }));
  });
  process.off('SIGINT', forward);
  process.off('SIGTERM', forward);
  await new Promise(resolve => log.end(resolve));
  return { ...result, args };
}
export async function main(argv = process.argv.slice(2), {probe=probeMirrorGlob}={}) {
  const { run, root, partition } = parse(argv);
  const before = inventory(root);
  // The exported runner also serves synthetic/generic test roots. Those do not
  // acquire a Website-asset claim. The actual Website root or its inventoried
  // Atlas producer/test always requires the admitted public tile set.
  const publicPreviewAssetsRequired = run && (resolve(root) === scriptRoot ||
    before.files.some(file => file.path === 'lib/atlas-navigation.ts') ||
    before.entries.includes('tests/atlas-navigation.test.ts'));
  const publicPreviewAssetsBefore = publicPreviewAssetsRequired ? verifyPublicPreviewAssets(root) : null;
  if (run && resolve(root) === scriptRoot) assertWebsiteTestHistory(root);
  // This must precede output creation, the Node glob probe and the test child.
  const output = outputDir(root);
  const fullExecution = run ? await executionPlan(before, output, {probe}) : {
    args: [...testArgs], executedRoots: [...before.entries], coveredByImport: [],
    mirror: { eligible: false, active: false, reason: 'list mode does not execute tests' },
    spinalHistorical:{...spinalHistoricalRole(before),plannedOnly:true} };
  const execution = partitionExecution(fullExecution, partition);
  // Native TAP supplies assertion details before terminal spec summaries. Keep
  // both streams local: they can contain private assertion values and paths.
  if (run) execution.args.splice(1, 0,
    '--test-reporter=spec', '--test-reporter-destination=stdout',
    '--test-reporter=tap', `--test-reporter-destination=${join(output, 'child.tap')}`);
  const manifest = { schema: 'vm-complete-test-manifest-1', root, mode: run ? 'run' : 'list', createdAt: new Date().toISOString(), ...before,
    entryCount: before.entries.length, entrySha256: sha(JSON.stringify(before.entries)), sourceSha256: sha(JSON.stringify(before.files)), execution,
    ...(partition ? { partition: execution.partition, runnerSha256: sha(readFileSync(fileURLToPath(import.meta.url))),
      environment: environmentFingerprint(), node: await nodeIdentity() } : {}),
    publicPreviewAssets: run ? { required: publicPreviewAssetsRequired, before: publicPreviewAssetsBefore } : null };
  save(join(output, 'manifest.json'), manifest);
  const result = run && !execution.error ? await launch(root, output, {onSpawn(child) {
    child.once('spawn',()=>save(join(output,'started.json'),{
      schema:'vm-complete-test-start-1',runnerPid:process.pid,testPid:child.pid,
      executable:process.execPath,args:[...execution.args],cwd:root,entrySha256:manifest.entrySha256,
      sourceSha256:manifest.sourceSha256,spawnedAt:new Date().toISOString(),
      limitation:'Spawn evidence only. Revalidate the actual process or terminal receipt before classifying a wait.',
    }));
  }, args: execution.args }) : { exitCode: 0, launched: false };
  let drift = null;
  if (run && !execution.error) {
    try {
      const after = inventory(root);
      drift = JSON.stringify(before.entries) !== JSON.stringify(after.entries) ||
        JSON.stringify(before.files) !== JSON.stringify(after.files);
    } catch (error) { drift = true; result.postRunInventoryError = String(error); }
  }
  let publicPreviewAssetDrift = null;
  if (publicPreviewAssetsRequired) {
    try {
      const after = verifyPublicPreviewAssets(root);
      publicPreviewAssetDrift = JSON.stringify(after) !== JSON.stringify(publicPreviewAssetsBefore);
    } catch (error) { publicPreviewAssetDrift = true; result.postRunPublicPreviewError = String(error); }
  }
  const counts=run&&!execution.error?testCounts(join(output,'child.log')):null;
  const passingClaim=run&&result.exitCode===0&&drift===false&&publicPreviewAssetDrift!==true;
  const unskippedPassingClaim=passingClaim&&counts.tests>0&&counts.tests===counts.pass&&['fail','cancelled','skipped','todo'].every(key=>counts[key]===0);
  const receipt = { schema: 'vm-complete-test-receipt-1', mode: manifest.mode, output, entryCount: before.entries.length,
    launched: run&&!execution.error, child: result, executionError:execution.error??null,
    testInputDrift: drift, publicPreviewAssetDrift, publicPreviewAssets: manifest.publicPreviewAssets,
    passingClaim: partition ? false : passingClaim,
    counts,unskippedPassingClaim: partition ? false : unskippedPassingClaim,
    claimScope:partition ? 'Partition only: no whole-suite passing claim. Combine every authenticated partition before claiming complete test roots; no clinical or release approval.' : 'Child exit and stable named inputs only. Website runs also require the admitted public preview set; generic test roots do not acquire that asset claim. Skipped/todo or unavailable-platform checks remain separate coverage limits; no clinical or release approval.',
    finishedAt: new Date().toISOString(),
    ...(partition ? { partition: execution.partition ?? partition, partitionPassingClaim: passingClaim,
      partitionUnskippedPassingClaim: unskippedPassingClaim, runnerSha256: manifest.runnerSha256,
      environment: manifest.environment, node: manifest.node,
      evidenceSha256: Object.fromEntries(['manifest.json','started.json','child.log','child.tap', ...(execution.mirror?.capability?.log ? [execution.mirror.capability.log] : [])]
        .filter(name => existsSync(join(output, name))).map(name => [name, sha(readFileSync(join(output, name)))])) } : {}) };
  save(join(output, 'receipt.json'), receipt);
  console.log(JSON.stringify({ output, entryCount: receipt.entryCount, launched: receipt.launched,
    executionError:receipt.executionError,childExitCode:result.exitCode, testInputDrift: drift,
    publicPreviewAssetDrift, passingClaim: receipt.passingClaim,counts,
    unskippedPassingClaim:receipt.unskippedPassingClaim,
    ...(partition ? {partition,partitionUnskippedPassingClaim:receipt.partitionUnskippedPassingClaim}: {}) }));
  return run && (execution.error || drift || publicPreviewAssetDrift) ? 1 : result.exitCode;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(code => { process.exitCode = code; }, error => { console.error(String(error)); process.exitCode = 1; });
}
