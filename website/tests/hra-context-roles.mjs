// Test-only boundaries for current Review rows and whole historical HRA roots.
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {execFileSync, spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {finished} from 'node:stream/promises';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const site = fileURLToPath(new URL('../', import.meta.url));
const fdaKey = 'fda-shoulder-fc9f3e56';
const fdaFrame = 'fda-shoulder-fc9f3e56:unitless-normalized-source-assembly';
const fdaIds = [
  'vm:reference:fda-shoulder-fc9f3e56:ac-ligament',
  'vm:reference:fda-shoulder-fc9f3e56:humeral-cartilage',
  'vm:reference:fda-shoulder-fc9f3e56:labrum',
  'vm:reference:fda-shoulder-fc9f3e56:clavicle',
  'vm:reference:fda-shoulder-fc9f3e56:humerus-source',
  'vm:reference:fda-shoulder-fc9f3e56:scapula',
];
const catalogPath = 'atlas-review/public/models/fda-shoulder-draft/catalog.json';
const catalogSha = '56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44';
function catalog() {
  const bytes = fs.readFileSync(path.join(site, catalogPath));
  assert.equal(sha(bytes), catalogSha, 'Exact independent FDA catalogue');
  const data = JSON.parse(bytes.toString('utf8'));
  assert.equal(data.specimenId, fdaKey);
  assert.equal(data.status, 'draft-independent-reference');
  assert.equal(data.clinicalApproval, false);
  assert.equal(data.measurementEnabled, false);
  assert.equal(data.display.unitsPerMillimetre, null);
  assert.equal(data.registeredToBodyParts3D, false);
  assert.deepEqual(data.structures.map(s => s.id), fdaIds);
  assert.deepEqual(data.held.map(s => s.sourcePart), ['Gcart']);
  return data;
}
export function assertCurrentFdaContext(api, row, surface, before, after, seen) {
  if (row.key !== fdaKey) return false;
  const data = catalog();
  assert.equal(row.name, 'FDA shoulder · independent unitless draft');
  assert(fdaIds.includes(surface.id), surface.id);
  assert(!seen.has(surface.id), 'Duplicate independent FDA context');
  seen.add(surface.id);
  assert.deepEqual(after.source, before.source, 'Independent FDA source unchanged');
  assert.equal(after.context.sourceHash, before.context.sourceHash);
  assert.deepEqual(after.teaching, before.teaching, 'FDA teaching unchanged by HRA teaching contrast');
  assert.equal(after.context.teachingHash, before.context.teachingHash);
  assert.deepEqual(after.context.blockers, before.context.blockers);
  assert.deepEqual(after.context.checklists, before.context.checklists);
  assert.equal(after.atlasLink, before.atlasLink);
  assert.equal(after.atlasPath, before.atlasPath);
  assert.equal(after.context.specimenKey, fdaKey);
  assert.equal(after.context.sourceFrame, fdaFrame);
  assert.equal(after.context.structureId, surface.id);
  assert.equal(after.context.checklistVersion, 'fda-unitless-specimen-review-1');
  assert.equal(after.source.sourceFrame, fdaFrame);
  assert.equal(after.source.catalogue.specimenId, data.specimenId);
  assert.equal(after.source.catalogue.clinicalApproval, false);
  assert.equal(after.source.structure.id, surface.id);
  assert.equal(after.source.structure.validation.clinicalApproval, false);
  assert.equal(after.source.structure.validation.unitCalibration, false);
  assert.equal(after.source.structure.validation.imagingRegistration, null);
  assert.equal(after.atlasPath, '/specimens/fda-shoulder');
  assert(after.atlasLink.startsWith('/specimens/fda-shoulder?referenceRevision='));
  assert.equal(after.teaching.lesson, null);
  assert(after.teaching.topics.length > 0);
  assert(after.teaching.topics.every(topic => topic.body === null && topic.references.length === 0));
  assert.deepEqual(after.context.teachingTabs, []);
  assert.equal(after.context.revisions.teaching, null);
  assert.equal(after.context.revisions.imaging, null);
  assert(after.context.blockers.geometry.length > 0);
  assert(after.context.blockers.teaching.length > 0);
  assert(after.context.blockers.imaging.length > 0);
  const draft = api.blankSpecimenReview(after.context, 'geometry');
  assert.equal(draft.status, 'draft');
  assert.equal(draft.attested, false);
  assert(Object.values(draft.checks).every(value => value === false));
  return true;
}
export function assertCurrentHraPopulation(rows, seen, contexts) {
  catalog();
  const groups = rows.filter(row => row.key === fdaKey);
  assert.equal(groups.length, 1, 'One independent FDA source group');
  assert.deepEqual(groups[0].surfaces.map(s => s.id), fdaIds);
  assert.deepEqual([...seen].sort(), [...fdaIds].sort(), 'Every FDA context reviewed exactly once');
  const historicalPopulation = rows.filter(row => row.key !== fdaKey).reduce((n, row) => n + row.surfaces.length, 0);
  assert.equal(historicalPopulation, 356, 'All other Review contexts preserved');
  assert.equal(contexts, historicalPopulation + fdaIds.length, 'Current adapter enumerates every source context');
  return {historicalPopulation, addedFda: fdaIds.length, currentPopulation: contexts};
}

const originals = {
  renal: {
    commit: 'afca2757914d0fc35af577fe1d736caf8549a99f', tree: '02eb0f50d815f96f3be3c98139abb14834eddd56',
    root: 'tests/atlas-hra-renal-topic-completion.test.ts', blob: 'b058f6775af956b706667250ea71651b16e65aab',
    rootSha256: 'c46edcd72c2b2352beb2871b986925def26db328e10b29ae2e8ade70b9d63efa',
    manifest: 'ea426dbfa883f1de0355a9be2b121bc056753551',
    learner: '3344cf2476f6617ce76c280c2602f024a7f9d175', inputs: 'b5c3a5fc444bb7e71287fb514009692e3e825b09',
    modelInventory: '2ee2c2f3612f8646839ebe6089209bcfbc232a34',
    atlasReads: [
      '944f57b801471c3b005a64ec83314188b2f06cf5:content/hra-renal-clinical.ts',
      'fc5457b6dbc12cb6ce702c2fc272d0bcb6cc59fc:content/hra-renal-clinical.ts',
      '944f57b801471c3b005a64ec83314188b2f06cf5:content/body-renderer-revision.json',
      'fc5457b6dbc12cb6ce702c2fc272d0bcb6cc59fc:content/body-renderer-revision.json',
    ],
  },
  pelvic: {
    commit: '1512df5abcfe30c19b098904e678dadcab12239a', tree: '082f94867a4eb565db6eaa6118dd841d359e6eb1',
    root: 'tests/atlas-hra-pelvic-topic-completion.test.ts', blob: 'e406e9f9d8075f39bfe2570ff8354c9d40214367',
    rootSha256: '270a5c22ff0f5e7e46aa497a98bba941b277e4cf4508e04951fd509d3426c7d4',
    manifest: '87afe37e12938cb130c52c4ebe92dab8a47b346d',
    learner: '425a01bcadfc19abac7b7b4798ed18f4765531df', inputs: '5808b636266b4cf5e8c2c0485a90d5f7eac6bd7e',
    modelInventory: '5014856219104a6a4624d2a9f3dc88f1ae11057b',
    atlasReads: [
      '33566ee21aa65ed1a370a5e7653337048656a13e:content/hra-pelvic-teaching.ts',
      '944f57b801471c3b005a64ec83314188b2f06cf5:content/hra-pelvic-teaching.ts',
      '33566ee21aa65ed1a370a5e7653337048656a13e:content/body-renderer-revision.json',
      '944f57b801471c3b005a64ec83314188b2f06cf5:content/body-renderer-revision.json',
    ],
  },
};
function absoluteEnv(name) {
  const value = process.env[name];
  assert(value && path.isAbsolute(value), name + ' must name an absolute local path');
  return fs.realpathSync(value);
}
function verifyPreparation(role, worktree) {
  const receiptPath = absoluteEnv('VM_HRA_PREPARATION');
  const receiptBytes = fs.readFileSync(receiptPath);
  assert.equal(sha(receiptBytes),'e52e9d04f5644ac0d338a9999eb24b2b088ef607d1bed9d167fcc0415bae3dee',
    'Exact local original-reader preparation');
  const receipt = JSON.parse(receiptBytes.toString('utf8'));
  const target = receipt.targets.find(item => item.role === role);
  assert(target && receipt.targets.length === 2);
  assert.equal(fs.realpathSync(target.site),worktree);
  assert.equal(target.revision,originals[role].commit);
  assert.equal(target.tree,originals[role].tree);
  assert.equal(target.root,originals[role].root);
  assert.equal(target.rootBlob,originals[role].blob);
  assert.equal(target.rootSha256,originals[role].rootSha256);
  assert.equal(target.cases,2);
  assert.deepEqual(target.atlasReads,originals[role].atlasReads);
  assert.equal(target.compilerVersion,'0.28.2');
  assert.equal(target.compilerLockIdentityMatchesCurrentPhysicalDependencies,true);
  assert.equal(fs.realpathSync(path.join(worktree,'node_modules')),fs.realpathSync(receipt.dependencies));
  for (const row of receipt.dependencyRows) {
    assert(!path.isAbsolute(row.path) && !row.path.includes('..'));
    assert.equal(sha(fs.readFileSync(path.join(receipt.dependencies,row.path))),row.sha256,row.path);
  }
}
function childEnv(native) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    /^(path|systemroot|windir|comspec|pathext|temp|tmp|os|processor_architecture|number_of_processors)$/i.test(key)));
  return {...env, NODE_OPTIONS:'--max-old-space-size=256', GOMEMLIMIT:'64MiB', GOMAXPROCS:'1',
    RAYON_NUM_THREADS:'1', GIT_NO_REPLACE_OBJECTS:'1', GIT_OPTIONAL_LOCKS:'0', ATLAS_SOURCE_REPO:native};
}
function git(root, env, ...args) {
  return execFileSync('git', ['--no-replace-objects','-C',root,...args],
    {env, windowsHide:true, maxBuffer:32e6}).toString('utf8').trim();
}
function verifyOriginal(role, worktree, native) {
  const c = originals[role], env = childEnv(native);
  assert(c, 'Known original HRA role');
  verifyPreparation(role,worktree);
  assert.notEqual(worktree, fs.realpathSync(site), 'Original needs its own Website checkout');
  assert.equal(fs.realpathSync(git(worktree,env,'rev-parse','--show-toplevel')),worktree);
  assert.equal(git(worktree,env,'rev-parse','HEAD'),c.commit);
  assert.equal(git(worktree,env,'rev-parse','HEAD^{tree}'),c.tree);
  assert.equal(git(worktree,env,'status','--porcelain','--untracked-files=all'),'','Original checkout clean');
  const rows = [
    [c.root,c.blob],
    ['atlas-review/lib/specimen-review-material.ts','b41dd4e4015be4e2ab4a2c976ea04236efa1e9e3'],
    ['atlas-review/lib/specimen-review.ts','50b3fce343ef0f0d77ae77cab9ffcec0e20f00d8'],
    ['atlas-review/lib/specimen-review-api.ts','98cc65b46e0e43b22463b11f532cb07800a2d334'],
    ['atlas-review/manifest.json',c.manifest],
    ['public/atlas-runtime/head-neck/manifest.json',c.learner],
    ['public/atlas-runtime/head-neck/source-inputs.json',c.inputs],
    ['lib/atlas-model-inventory.json',c.modelInventory],
  ];
  for (const [name,blob] of rows) {
    assert.equal(git(worktree,env,'rev-parse',c.commit+':'+name),blob,name+' Git object');
    const item = path.join(worktree,name), stat = fs.lstatSync(item);
    assert(stat.isFile() && !stat.isSymbolicLink(),name+' plain checkout file');
    assert(fs.readFileSync(item).equals(execFileSync('git',['--no-replace-objects','-C',worktree,'show',c.commit+':'+name],
      {env, windowsHide:true, maxBuffer:32e6})),name+' exact historical bytes');
    if (name === c.root) assert.equal(sha(fs.readFileSync(item)),c.rootSha256,'Whole original root SHA256');
  }
  assert.equal(fs.realpathSync(git(native,env,'rev-parse','--show-toplevel')),native);
  assert.equal(git(native,env,'rev-parse','HEAD'),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
  assert.equal(git(native,env,'rev-parse','HEAD^{tree}'),'e9165d7122361f809a267af1414b337b69097fe2');
  assert.equal(git(native,env,'status','--porcelain','--untracked-files=all'),'','Native Atlas clean');
  for (const revision of role === 'renal'
    ? ['944f57b801471c3b005a64ec83314188b2f06cf5','fc5457b6dbc12cb6ce702c2fc272d0bcb6cc59fc']
    : ['33566ee21aa65ed1a370a5e7653337048656a13e','944f57b801471c3b005a64ec83314188b2f06cf5'])
    assert.equal(git(native,env,'rev-parse',revision+'^{commit}'),revision);
  for (const read of c.atlasReads) assert.match(git(native,env,'rev-parse',read),/^[a-f0-9]{40}$/,
    'Exact historical Atlas read exists: '+read);
  return c;
}
export function assertCompleteHraTap(stdout, result) {
  assert.equal(result.error, undefined, 'Child start and IO');
  assert.equal(result.signal, null);
  assert.equal(result.code, 0);
  assert.equal([...stdout.matchAll(/^TAP version 13\r?$/gm)].length,1);
  assert(!/^\s*not ok\b/im.test(stdout));
  assert(!/^\s+ok\b/im.test(stdout),'No hidden nested test points');
  assert(!/^\s*(?:not )?ok\b[^\r\n]*#\s*(?:SKIP|TODO)\b/im.test(stdout));
  assert(!/^\s*Bail out!/im.test(stdout));
  const points = [...stdout.matchAll(/^ok (\d+)(?:\s|$)/gm)];
  assert.deepEqual(points.map(match => Number(match[1])),[1,2]);
  const plans = [...stdout.matchAll(/^1\.\.(\d+)\r?$/gm)];
  assert.equal(plans.length,1);assert.equal(Number(plans[0][1]),2);
  for (const [name,expected] of Object.entries({tests:2,pass:2,fail:0,cancelled:0,skipped:0,todo:0})) {
    const footer = [...stdout.matchAll(new RegExp('^# '+name+' (\\d+)\\r?$','gm'))];
    assert.equal(footer.length,1,name+' footer');assert.equal(Number(footer[0][1]),expected,name);
    assert(footer[0].index > plans[0].index,name+' footer follows plan');
  }
  assert(plans[0].index > points[1].index,'Plan follows all points');
}
export async function runOriginalHraRole(role) {
  const worktree = absoluteEnv(role === 'renal' ? 'VM_HRA_RENAL_WEBSITE' : 'VM_HRA_PELVIC_WEBSITE');
  const native = absoluteEnv('VM_HRA_NATIVE_ATLAS');
  const c = verifyOriginal(role,worktree,native);
  const dir = path.join(site,'.local','hra-originals',new Date().toISOString().replace(/[:.]/g,'-')+'-'+role+'-'+randomUUID());
  fs.mkdirSync(dir,{recursive:true});
  const out = fs.createWriteStream(path.join(dir,'child.tap'),{flags:'wx'});
  const err = fs.createWriteStream(path.join(dir,'child.stderr.log'),{flags:'wx'});
  const ioErrors = [];
  for (const stream of [out,err]) stream.on('error',error => ioErrors.push(String(error)));
  const args = ['--max-old-space-size=256','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',c.root];
  const child = spawn(process.execPath,args,{cwd:worktree,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe'],env:childEnv(native)});
  child.stdout.pipe(out);child.stderr.pipe(err);
  for (const stream of [child.stdout,child.stderr]) stream.on('error',error => ioErrors.push(String(error)));
  const result = await new Promise(resolve => {
    let error;child.once('error',e => {error = String(e)});
    child.once('close',(code,signal) => resolve({code,signal,...(error ? {error} : {})}));
  });
  try {await Promise.all([finished(out),finished(err)])} catch(error) {ioErrors.push(String(error))}
  let stabilityError,transportError;
  try {verifyOriginal(role,worktree,native)} catch(error) {stabilityError=String(error)}
  try {assertCompleteHraTap(fs.readFileSync(path.join(dir,'child.tap'),'utf8'),result)} catch(error) {transportError=String(error)}
  fs.writeFileSync(path.join(dir,'terminal.json'),JSON.stringify({role,commit:c.commit,rootBlob:c.blob,
    result,ioErrors,stabilityError:stabilityError??null,transportError:transportError??null,
    passing:!ioErrors.length&&!stabilityError&&!transportError},null,2)+'\n',{flag:'wx'});
  assert(!ioErrors.length&&!stabilityError&&!transportError,'Original HRA child incomplete; local evidence: '+dir);
}
