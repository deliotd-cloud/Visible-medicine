import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
import {verifyMetadataTextCheckout} from './atlas-metadata-text-checkout.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=name=>readFileSync(new URL('./fixtures/'+name,import.meta.url));
const read=name=>readFileSync(new URL('./'+name,import.meta.url));
const originalHash='f092a5544724a890a2d43c8f7056d06be1ae2da7d30b5cbcef54002383f3768a';
const candidateHash='15e7fe631d748d679dc8f7329916d051235abab6b22d3ce4da7f95412838b078';
const helperHash='2a809dcdce3e7dc9bd19ff6c9f90d16fef428f9917c369e7953222529fff2998';
const policyHash='44ef0a3d8a25ed85a173f82a3ce0d4fc12cb96b770143315b94b065a2c448052';
const closedSource='3dcdf94a46db44202e72641be9fbcf1274ce5364';
const git=(root,commit,path)=>execFileSync('git',['-C',root,'show',commit+':'+path],{maxBuffer:32e6});

function replaceOnce(source,from,to,eol){
  const before=from.replaceAll('\n',eol),after=to.replaceAll('\n',eol);
  assert.equal(source.split(before).length,2,'Exactly one declared adapter');
  return source.replace(before,after);
}

function verifyCandidate(candidate,original){
  assert.equal(sha(original),originalHash,'Exact pre-6036 checkout test archive');
  assert.equal(sha(candidate),candidateHash,'Reviewed cerebral checkout candidate');
  let inverse=candidate.toString('utf8');
  assert(Buffer.from(inverse,'utf8').equals(candidate),'Candidate is lossless UTF-8');
  const eol=inverse.includes('\r\n')?'\r\n':'\n';
  inverse=replaceOnce(inverse,
    "    const closedExport=readFileSync(new URL('./fixtures/closed59-raw-metadata/'+policy.path+'.raw',import.meta.url));\n    verifyMetadataTextCheckout(row,sourceAt(closedSource,policy.path),closedExport,policy);",
    "    verifyMetadataTextCheckout(row,sourceAt(closedSource,policy.path),readFileSync(atlas+'/'+policy.path),policy);",eol);
  inverse=replaceOnce(inverse,[
    "      const working=Buffer.from(readFileSync(atlas+'/'+row.path));",
    '      assert.equal(row.sha256,sha(working),`${row.path}: current learner export matches current working bytes`);',
    '      assert.equal(sha(committed),sourceHashes.get(row.path),`${row.path}: current committed source`);',
    "      const text=working.toString('utf8');",
    "      assert(Buffer.from(text,'utf8').equals(working),`${row.path}: current metadata is valid UTF-8`);",
    "      assert(!text.includes('\\0')&&!text.replaceAll('\\r\\n','').includes('\\r'),`${row.path}: current metadata has no bare CR or NUL`);",
    "      assert(Buffer.from(text.replaceAll('\\r\\n','\\n'),'utf8').equals(committed),`${row.path}: current working representation matches committed source`);",
  ].join('\n'),"      verifyMetadataTextCheckout(row,committed,readFileSync(atlas+'/'+row.path),policy);",eol);
  assert(Buffer.from(inverse,'utf8').equals(original),'Whole old test recovers through only two adapters');
}

function verifyCurrent(row,committed,working){
  assert.equal(row.sha256,sha(working),'Current learner manifest binds working bytes');
  const text=working.toString('utf8');
  assert(Buffer.from(text,'utf8').equals(working),'Current metadata is lossless UTF-8');
  assert(!text.includes('\0')&&!text.replaceAll('\r\n','').includes('\r'),'Current metadata has no NUL or bare CR');
  assert(Buffer.from(text.replaceAll('\r\n','\n'),'utf8').equals(committed),'Current checkout matches current committed source');
}

test('the historical cerebral proof changes only through two declared checkout adapters',()=>{
  assert.equal(sha(read('atlas-metadata-text-checkout.mjs')),helperHash,'Strict original helper unchanged');
  const original=fixture('atlas-cerebral-lobar-imaging.before-6036-checkout.test.ts.raw');
  const candidate=read('atlas-cerebral-lobar-imaging.test.ts');
  verifyCandidate(candidate,original);
  for(const [before,after] of [
    ['assert.equal(checkedRepresentations,9)','assert.equal(checkedRepresentations,8)'],
    ['assert.equal(count,8);','assert.equal(count,0);'],
  ]){
    const changed=candidate.toString('utf8').replace(before,after);
    assert.notEqual(changed,candidate.toString('utf8'));
    assert.throws(()=>verifyCandidate(Buffer.from(changed),original),assert.AssertionError);
  }
});

test('nine closed raw exports remain exact and refuse corruption or LF normalization',()=>{
  const policyBytes=fixture('current-source-checkout-representations-craniofacial-ct.json');
  assert.equal(sha(policyBytes),policyHash,'Frozen closed-source policy unchanged');
  const policy=JSON.parse(policyBytes);
  assert.equal(policy.source,closedSource);
  assert.equal(policy.records.length,9);
  assert.equal(new Set(policy.records.map(row=>row.path)).size,9);
  const closedManifest=fixture('closed59-documents/public/atlas-runtime/head-neck/source-inputs.json');
  assert.equal(sha(closedManifest),policy.sourceInputManifestSha256);
  const closedRows=JSON.parse(closedManifest);
  const atlas=currentAtlasDeliveryRoot();
  let total=0;
  for(const record of policy.records){
    const row=closedRows.find(item=>item.path===record.path);
    assert(row,record.path);
    const raw=fixture('closed59-raw-metadata/'+record.path+'.raw');
    assert.throws(()=>fixture('closed59-raw-metadata/'+record.path),{code:'ENOENT'},'Raw metadata is data, not compilable source');
    const committed=git(atlas,closedSource,record.path);
    assert.equal(verifyMetadataTextCheckout(row,committed,raw,record),true,record.path);
    total+=raw.length;
    const corrupted=Buffer.from(raw);corrupted[0]^=1;
    assert.throws(()=>verifyMetadataTextCheckout(row,committed,corrupted,record),assert.AssertionError);
    const normalized=Buffer.from(raw.toString('utf8').replaceAll('\r\n','\n'));
    assert(!normalized.equals(raw),'The frozen raw export contains CRLF');
    assert.throws(()=>verifyMetadataTextCheckout(row,committed,normalized,record),assert.AssertionError);
    assert.throws(()=>verifyMetadataTextCheckout({...row,sha256:'0'.repeat(64)},committed,raw,record),assert.AssertionError);
    const attribute=execFileSync('git',['check-attr','text','--','tests/fixtures/closed59-raw-metadata/'+record.path+'.raw'],{encoding:'utf8'});
    assert.match(attribute,/\btext: unset\s*$/,'Git must preserve exact archived bytes');
  }
  assert.equal(total,198326,'Nine exact raw export bytes');
  assert.match(readFileSync('.gitattributes','utf8'),/^tests\/fixtures\/closed59-raw-metadata\/\*\* -text\r?$/m,'Explicit archive checkout rule');
});

test('nine current exports bind the current manifest and committed Atlas revision',()=>{
  const policy=JSON.parse(fixture('current-source-checkout-representations-craniofacial-ct.json'));
  const rows=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
  const atlas=currentAtlasDeliveryRoot();
  assert.equal(CURRENT_ATLAS_REVISION,execFileSync('git',['-C',atlas,'rev-parse','HEAD'],{encoding:'utf8'}).trim());
  for(const record of policy.records){
    const row=rows.find(item=>item.path===record.path);assert(row,record.path);
    const committed=git(atlas,CURRENT_ATLAS_REVISION,record.path);
    const working=readFileSync(atlas+'/'+record.path);
    verifyCurrent(row,committed,working);
    const changed=Buffer.from(working);changed[0]^=1;
    assert.throws(()=>verifyCurrent(row,committed,changed),assert.AssertionError);
    assert.throws(()=>verifyCurrent({...row,sha256:'0'.repeat(64)},committed,working),assert.AssertionError);
    const wrong=Buffer.from(committed);wrong[0]^=1;
    assert.throws(()=>verifyCurrent(row,wrong,working),assert.AssertionError);
  }
});
