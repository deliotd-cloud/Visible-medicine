import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {main} from '../scripts/run-website-tests.mjs';

const local=fileURLToPath(new URL('../.local/raw-source-fixtures/',import.meta.url));
mkdirSync(local,{recursive:true});
function fixture(body="import test from 'node:test';test('synthetic stable',()=>{});\n") {
  const root=mkdtempSync(join(local,'source-'));
  mkdirSync(join(root,'tests','fixtures'),{recursive:true});
  writeFileSync(join(root,'package.json'),'{"type":"module"}\n');
  writeFileSync(join(root,'tests','probe.test.mjs'),body);
  return root;
}
async function capture(root,run=false) {
  const previous=console.log; let summary;
  console.log=line=>{summary=JSON.parse(line);};
  try {
    const code=await main(['--root',root,...(run?['--run']:[])]);
    return {code,manifest:JSON.parse(readFileSync(join(summary.output,'manifest.json'))),receipt:JSON.parse(readFileSync(join(summary.output,'receipt.json')))};
  } finally {console.log=previous;}
}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('exact UTF-8 .raw proofs below tests/fixtures are inventoried, but not executable entries',async()=>{
  const root=fixture(),bytes=Buffer.from('original\r\nsource\n','utf8');
  writeFileSync(join(root,'tests','fixtures','proof.ts.raw'),bytes);
  const result=await capture(root);
  assert.deepEqual(result.manifest.entries,['tests/probe.test.mjs']);
  assert.deepEqual(result.manifest.files.find(row=>row.path==='tests/fixtures/proof.ts.raw'),{path:'tests/fixtures/proof.ts.raw',sha256:sha(bytes)});
  assert.equal(result.receipt.launched,false);
  assert.equal(result.manifest.sourceScope.rawTextFixturePolicy.nonText,'fail-closed');
});

test('successful child cannot claim a stable pass after changing a raw source proof',async()=>{
  const root=fixture("import test from 'node:test';import {appendFileSync} from 'node:fs';test('proof drift',()=>appendFileSync('tests/fixtures/proof.raw','changed\\n'));\n");
  writeFileSync(join(root,'tests','fixtures','proof.raw'),'original\n');
  const result=await capture(root,true);
  assert.equal(result.receipt.child.exitCode,0);assert.equal(result.code,1);
  assert.equal(result.receipt.testInputDrift,true);assert.equal(result.receipt.passingClaim,false);
  assert.equal(result.receipt.unskippedPassingClaim,false);
});

test('adding a textual raw source proof during a successful child run is detected',async()=>{
  const root=fixture("import test from 'node:test';import {writeFileSync} from 'node:fs';test('proof addition',()=>writeFileSync('tests/fixtures/added.raw','original\\n'));\n");
  const result=await capture(root,true);
  assert.equal(result.receipt.child.exitCode,0);assert.equal(result.code,1);
  assert.equal(result.receipt.testInputDrift,true);assert.equal(result.receipt.passingClaim,false);
});

test('NUL or invalid UTF-8 raw fixtures fail before listing or launch',async()=>{
  for(const bytes of [Buffer.from([65,0,66]),Buffer.from([0xc3,0x28])]) {
    const root=fixture();writeFileSync(join(root,'tests','fixtures','invalid.raw'),bytes);
    await assert.rejects(main(['--root',root,'--run']),/NUL in raw text fixture|Invalid UTF-8 raw text fixture/);
  }
});

test('oversized raw fixtures fail before listing or launch',async()=>{
  const root=fixture();writeFileSync(join(root,'tests','fixtures','oversized.raw'),Buffer.alloc(16*1024*1024+1,65));
  await assert.rejects(main(['--root',root]),/Oversized raw text fixture/);
});

test('the exception never admits raw scans outside fixtures, models or private/credential state',async()=>{
  const root=fixture();mkdirSync(join(root,'lib'));mkdirSync(join(root,'public','atlas-runtime'),{recursive:true});
  for(const name of ['PrIvAtE','Scan-Data','Mask-Data','Credentials'])mkdirSync(join(root,'tests','fixtures',name));
  for(const file of ['lib/scan.raw','tests/outside.raw','public/atlas-runtime/scan.raw','tests/fixtures/PrIvAtE/hidden.raw','tests/fixtures/Scan-Data/hidden.raw','tests/fixtures/Mask-Data/hidden.raw','tests/fixtures/Credentials/hidden.raw','tests/fixtures/.env.private.raw','tests/fixtures/model.glb'])writeFileSync(join(root,file),Buffer.from([0,1,2]));
  writeFileSync(join(root,'tests','fixtures','allowed.RAW'),'source\n');
  const result=await capture(root);
  assert.deepEqual(result.manifest.files.filter(row=>row.path.toLowerCase().endsWith('.raw')).map(row=>row.path),['tests/fixtures/allowed.RAW']);
  assert(!result.manifest.files.some(row=>row.path.endsWith('.glb')));
});
