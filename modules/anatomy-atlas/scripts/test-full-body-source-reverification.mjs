// Public-source evidence consistency and current asset readback, not rights,
// privacy, clinical accuracy or permission to publish held paths.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const catalogueBytes=await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json',import.meta.url));
const catalog=JSON.parse(catalogueBytes);
const witnessBytes=await readFile(new URL('../LICENSES/BODYPARTS3D_V4_SOURCE_REVERIFICATION_20261007.json',import.meta.url));
const witness=JSON.parse(witnessBytes);
const witnessSha='3a7e2b5ffd520afe90cc221c83c2cb05fbad5560cbc719abf4604dcc9c64d999';
const sorted=rows=>[...rows].sort((a,b)=>a.key.localeCompare(b.key,'en'));

function verify(record) {
  assert.equal(record.schema,'vm-bodyparts-source-reverification/1');
  assert.equal(record.sourceVersion,'4.0');
  assert.equal(record.license,'CC-BY-4.0');
  assert.equal(record.credit,catalog.credit);
  assert.equal(record.catalogSha256,sha(catalogueBytes));
  const bundles=catalog.bundles.filter(b=>b.id.endsWith('-recovery'));
  assert.equal(bundles.length,19);
  assert.deepEqual(record.derivedBundles,bundles.map(b=>({id:b.id,path:'public'+b.url,sha256:b.sha256,bytes:b.bytes})));
  const structures=catalog.structures.filter(s=>bundles.some(b=>b.id===s.bundle));
  assert.equal(record.structures,159);assert.equal(structures.length,159);
  const sources=structures.flatMap(s=>s.sources.map(f=>({key:`${s.sourceTree}/${f.file}`,sha256:f.sha256})));
  assert.equal(sources.length,251);
  assert.deepEqual(sorted(record.selectedSources.map(({key,sha256})=>({key,sha256}))),sorted(sources));
  assert.equal(new Set(record.selectedSources.map(s=>s.key)).size,251);
  for(const row of record.selectedSources){
    assert.match(row.key,/^(isa|partof)\/FJ[0-9]+[A-Z]?$/);
    assert.match(row.sha256,/^[a-f0-9]{64}$/);
    assert(Number.isSafeInteger(row.bytes)&&row.bytes>0);
    assert.match(row.crc32,/^[a-f0-9]{8}$/);
    assert.equal(row.archiveEntry.split('/').at(-1),row.key.split('/')[1]+'.obj');
  }
  assert.deepEqual(Object.keys(record.archives).sort(),['isa','partof']);
  for(const tree of ['isa','partof']){
    const a=record.archives[tree];
    assert.equal(a.url,catalog.sources[tree]);
    assert.equal(a.url,`https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/${tree}_BP3D_4.0_obj_99.zip`);
    assert.match(a.sha256,/^[a-f0-9]{64}$/);assert.match(a.etag,/^"[^"\r\n]+"$/);
    assert(Number.isSafeInteger(a.bytes)&&a.bytes>0);
    assert.equal(a.selectedLocalHeadersChecked,record.selectedSources.filter(s=>s.key.startsWith(tree+'/')).length);
    assert.equal(a.retainedArchive,false);
  }
  for(const field of ['sourceAdmission','privacyClearance','clinicalApproval','deliveredNoticeVerified'])assert.equal(record.verification[field],false);
  assert.equal(record.verification.selectedSourceHashesMatch,true);
  assert.equal(record.verification.conditionalWholeArchiveStreams,true);
  assert.equal(record.verification.rawArchivesRetained,false);
}

test('dated public-source witness is immutable and agrees with the exact current v4 catalogue',()=>{
  assert.equal(sha(witnessBytes),witnessSha);
  verify(witness);
});

test('all 19 derived GLB bytes still match the reverified catalogue lineage',async()=>{
  for(const row of witness.derivedBundles){
    const bytes=await readFile(new URL('../'+row.path,import.meta.url));
    assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256);
  }
});

test('source/hash/scope changes and inferred admission refuse',()=>{
  for(const mutate of [
    r=>r.selectedSources.pop(),
    r=>r.selectedSources[0].sha256='0'.repeat(64),
    r=>r.selectedSources[0].key='isa/FJ0',
    r=>r.derivedBundles[0].sha256='0'.repeat(64),
    r=>r.catalogSha256='0'.repeat(64),
    r=>r.archives.isa.url='https://example.invalid/mesh.zip',
    r=>r.verification.sourceAdmission=true,
    r=>r.verification.privacyClearance=true,
    r=>r.verification.clinicalApproval=true,
    r=>r.verification.deliveredNoticeVerified=true,
  ]){const changed=structuredClone(witness);mutate(changed);assert.throws(()=>verify(changed));}
});
