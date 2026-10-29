import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregatePartitionDirs } from '../scripts/aggregate-website-test-partitions.mjs';
import { main, parse, partitionExecution } from '../scripts/run-website-tests.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const local = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.local');
function fixture(names = ['a','b','c','d'], variant = 'pass') {
  mkdirSync(local, { recursive:true });
  const root = resolve(mkdtempSync(join(local, 'partition-fixture-')));
  assert.ok(root.startsWith(local + sep));
  mkdirSync(join(root, 'tests'));
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n');
  for (const name of names) {
    const mode = variant === name ? 'test.skip' : variant === `todo-${name}` ? 'test.todo' : 'test';
    const body = variant === `fail-${name}` ? "throw new Error('synthetic failure')" : '';
    writeFileSync(join(root, 'tests', `${name}.test.mjs`),
      `import test from 'node:test'; ${mode}('${name}',()=>{${body}});\n`);
  }
  return root;
}
function cleanup(root) {
  assert.ok(resolve(root).startsWith(local + sep));
  rmSync(root, { recursive:true, force:true });
}
async function runPartitions(root, count = 2) {
  const outputs = [];
  for (let index = 1; index <= count; index++) {
    const before = new Set(existsSync(join(root,'.local','website-test-runs')) ?
      readdirSync(join(root,'.local','website-test-runs')) : []);
    const exit = await main(['--run','--root',root,'--partition',`${index}/${count}`]);
    const added = readdirSync(join(root,'.local','website-test-runs')).filter(name => !before.has(name));
    assert.equal(added.length, 1);
    outputs.push({ dir:join(root,'.local','website-test-runs',added[0]), exit });
  }
  return outputs;
}
const readJson = path => JSON.parse(readFileSync(path,'utf8'));
const writeJson = (path,value) => writeFileSync(path,JSON.stringify(value,null,2)+'\n');
function editEvidence(dir, name, edit) {
  const path = join(dir,name);
  const value = readJson(path);
  edit(value);
  writeJson(path,value);
  if (name !== 'receipt.json') {
    const receiptPath = join(dir,'receipt.json');
    const receipt = readJson(receiptPath);
    receipt.evidenceSha256[name] = sha(readFileSync(path));
    writeJson(receiptPath,receipt);
  }
}
async function rejectMutation(dirs, mutate) {
  const names = ['manifest.json','receipt.json','started.json','child.log','child.tap'];
  const snapshots = dirs.map(dir => Object.fromEntries(names.map(name => [name,readFileSync(join(dir,name))])));
  try { mutate(); await assert.rejects(() => aggregatePartitionDirs(dirs)); }
  finally { dirs.forEach((dir,i) => names.forEach(name => writeFileSync(join(dir,name),snapshots[i][name]))); }
}

test('default CLI stays list-only and partitions are whole, deterministic roots', () => {
  assert.equal(parse([]).run,false);
  assert.equal(parse(['--list']).partition,null);
  assert.throws(()=>parse(['--partition','1/2']),/requires --run/);
  for (const bad of ['0/2','3/2','1/0','1/2.5','a/b','9007199254740992/9007199254740992'])
    assert.throws(()=>parse(['--run','--partition',bad]));
  const plan = {args:['original'],executedRoots:['a','b','c','d','e'],coveredByImport:[{path:'imported',via:'b'}]};
  const one = partitionExecution(plan,{index:1,count:2});
  const two = partitionExecution(plan,{index:2,count:2});
  assert.deepEqual(one.partition.selectedRoots,['a','c','e']);
  assert.deepEqual(two.partition.selectedRoots,['b','d']);
  assert.deepEqual([...one.partition.selectedRoots,...two.partition.selectedRoots].sort(),plan.executedRoots);
  assert.deepEqual(plan.args,['original']);
  assert.throws(()=>partitionExecution(plan,{index:6,count:6}),/no executed roots/);
});

test('real synthetic partitions aggregate; missing, duplicate and tampered evidence fail', async () => {
  const root = fixture();
  const originalEnv = process.env.VM_PARTITION_ACCEPTANCE;
  process.env.VM_PARTITION_ACCEPTANCE = 'fixture-fixed';
  try {
    assert.equal(await main(['--list','--root',root]),0);
    assert.equal(await main(['--run','--root',root]),0);
    const rows = await runPartitions(root);
    const dirs = rows.map(row=>row.dir);
    assert.ok(rows.every(row=>row.exit===0));
    const complete = await aggregatePartitionDirs(dirs);
    assert.equal(complete.complete,true);
    assert.equal(complete.executedRootCount,4);
    assert.equal(complete.evidence.length,2);assert.match(complete.aggregatorSha256,/^[a-f0-9]{64}$/);
    const priorOptions=process.env.NODE_OPTIONS;
    try {process.env.NODE_OPTIONS=(priorOptions??'')+' --no-warnings';await assert.rejects(()=>aggregatePartitionDirs(dirs));}
    finally {if(priorOptions===undefined)delete process.env.NODE_OPTIONS;else process.env.NODE_OPTIONS=priorOptions;}
    await assert.rejects(()=>aggregatePartitionDirs([dirs[0]]));
    await assert.rejects(()=>aggregatePartitionDirs([dirs[0],dirs[0]]));
    await rejectMutation(dirs,()=>writeFileSync(join(dirs[0],'child.log'),'tampered\n',{flag:'a'}));
    await rejectMutation(dirs,()=>writeFileSync(join(dirs[0],'manifest.json'),' ',{flag:'a'}));
    await rejectMutation(dirs,()=>editEvidence(dirs[0],'receipt.json',r=>{r.partitionPassingClaim=false;}));
    await rejectMutation(dirs,()=>{
      for (const dir of dirs) {
        editEvidence(dir,'manifest.json',m=>{m.node.binarySha256='0'.repeat(64);});
        editEvidence(dir,'receipt.json',r=>{r.node.binarySha256='0'.repeat(64);});
      }
    });
    await rejectMutation(dirs,()=>{
      writeFileSync(join(dirs[0],'child.tap'),'not ok 99 - forged failure\n',{flag:'a'});
      editEvidence(dirs[0],'receipt.json',r=>{r.evidenceSha256['child.tap']=sha(readFileSync(join(dirs[0],'child.tap')));});
    });
    await rejectMutation(dirs,()=>{
      for (const dir of dirs) {
        editEvidence(dir,'manifest.json',m=>{
          const universe=['tests/b.test.mjs','tests/c.test.mjs','tests/d.test.mjs'];
          const selected=universe.filter((_,i)=>i%2===m.partition.index-1);
          m.partition.universe=universe; m.partition.selectedRoots=selected;
          m.execution.partition=m.partition; m.execution.executedRoots=universe;
          m.execution.coveredByImport=[{path:'tests/a.test.mjs',via:'tests/b.test.mjs',wrapperSha256:'forged'}];
          m.execution.args.splice(7,Infinity,...selected);
        });
        const m=readJson(join(dir,'manifest.json'));
        editEvidence(dir,'started.json',s=>{s.args=m.execution.args;});
        editEvidence(dir,'receipt.json',r=>{r.partition=m.partition; r.child.args=m.execution.args;});
      }
    });
    await rejectMutation(dirs,()=>{
      editEvidence(dirs[0],'manifest.json',m=>{m.execution.args.push('unexpected');});
      editEvidence(dirs[0],'started.json',s=>{s.args.push('unexpected');});
      editEvidence(dirs[0],'receipt.json',r=>{r.child.args.push('unexpected');});
    });
    writeFileSync(join(root,'tests','a.test.mjs'),'// changed after run\n',{flag:'a'});
    await assert.rejects(()=>aggregatePartitionDirs(dirs));
    writeFileSync(join(root,'tests','a.test.mjs'),"import test from 'node:test'; test('a',()=>{});\n");
    process.env.VM_PARTITION_ACCEPTANCE='changed';
    await assert.rejects(()=>aggregatePartitionDirs(dirs));
    process.env.VM_PARTITION_ACCEPTANCE='fixture-fixed';
    assert.equal((await aggregatePartitionDirs(dirs)).complete,true);
  } finally {
    if (originalEnv === undefined) delete process.env.VM_PARTITION_ACCEPTANCE;
    else process.env.VM_PARTITION_ACCEPTANCE=originalEnv;
    cleanup(root);
  }
});

for (const variant of ['b','todo-b','fail-b']) test(`real ${variant} child cannot aggregate`, async () => {
  const root=fixture(['a','b'],variant);
  try {
    const rows=await runPartitions(root);
    await assert.rejects(()=>aggregatePartitionDirs(rows.map(row=>row.dir)));
  } finally { cleanup(root); }
});
