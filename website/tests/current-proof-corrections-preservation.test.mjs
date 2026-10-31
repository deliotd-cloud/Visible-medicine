import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {pathToFileURL} from 'node:url';
import {assertExactLineDelta} from './release16-preservation-line-delta.mjs';
const sourceBase=process.env.VM_PRESERVATION_SOURCE_TESTS?pathToFileURL(process.env.VM_PRESERVATION_SOURCE_TESTS+'/'):new URL('./',import.meta.url);
const {readRevision49}=await import(new URL('./historical-deep-plantar-delivery-49.mjs',sourceBase));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=name=>readRevision49('tests/'+name);
const rows=[
 {name:'atlas-cerebral-lobar-imaging.test.ts',before:'6c1b1772dac7cf8c26e4bedf304dba8ce2ef1a19535bc059f062a1146cddb720',after:'346d331502f4295e450529cabb29bb366c179f53cdc8012683aa71b81cd9ef16'},
 {name:'atlas-intracranial-arterial-ultrasound.test.mjs',before:'40ccdc8f1a234171c5b3c26f66fcd14107dfca843ca906a1f2ae557b91177302',after:'ea5d9ff5c989be5eb5b4ddb211487fb0e594754339c214acde5da6f99974279b',current:'be62fa493b5e4c3bcb951233cb432a874a25119fa4e92b7bea25e91c9dd55c39'},
];
function verify(row,raw,active){
 assert.equal(sha(raw),row.before,'Exact prior admitted proof');
 let reviewed=active;
 if(row.current){
  assert.equal(sha(active),row.current,'Exact current multi-source binding proof');
  reviewed=readFileSync(new URL('./fixtures/intracranial-us-ea5d.test.mjs.raw',import.meta.url));
  assertExactLineDelta(reviewed,active,[
   '854a599c0e39c5f95ddb599aa718020cdad4dfda9f003186808785da3a913c35',
   '2708bdc6d602ed79ae7990dadcbdaefac3c4fbd6eecf6d1cfc63053644d089f5',
   '0f17de1ae12418936ea977fa8f03634c27d16a656fb2b940b5f502e9e1663147',
   'c1b3b81bf19f233580b20e617f027e2aa6bab520f51b660f40fd2edd39d1756f',
   '652bd46207c3c96379fc26aa08da129d61fa8ef28211fb25c1af27e9ac65d85f',
   '8700053aa87ead36b01e3385f5526cc3c9efec99ffcae6fd288007d4eafb5e74',
  ],'Intermediate correction to current multi-source proof');
  const currentText=active.toString('utf8');
  for(const anchor of ["validateHistoricalAtlasDelivery({pin: historicalPin, read: historicalRead})",
   'verifyCurrentCommittedBinding({path: row.path, sha256: sha(checkoutCommit)}, checkoutCommit, working)',
   'sourceBlob(current.runtimeSources[region], row.path)'])assert(currentText.includes(anchor),anchor);
 }
 assert.equal(sha(reviewed),row.after,'Exact reviewed correction, not a new clinical baseline');
 const before=raw.toString('utf8'),after=reviewed.toString('utf8');
 if(row.name.startsWith('atlas-intracranial')){
  const anchor="sha(execFileSync('git', ['-C', currentRoot, 'show', current.source + ':' + path], {windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}}))";
  assert.equal(before.split(anchor).length-1,1);
  const catalog="JSON.parse(execFileSync('git', ['-C', currentRoot, 'show', current.source + ':public/models/bodyparts3d/full-body/catalog.json']))";
  assert.equal(before.split(catalog).length-1,1);
  assert.equal(after,before.replace(anchor,'sha(currentBlob(path))').replace(catalog,"JSON.parse(currentBlob('public/models/bodyparts3d/full-body/catalog.json'))"),
   'Only reuse the existing bounded exact-object reader for both large reads');
 }else{
  const marker="  assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior('lib/atlas-model-inventory.json').models);";
  assert.equal(before.split(marker).length-1,1);assert.equal(after.split(marker).length-1,1);
  assert.equal(after.slice(after.indexOf(marker)),before.slice(before.indexOf(marker)),
   'Anatomy, historical worksheets, clinical flags and stale-review refusals remain byte-exact');
  assert(after.includes("assert.equal(sha(checkoutBytes),'39691c1dec4dbd1b2dc2d9c38c43002f93dcd4c132c06e6229493c6c6ba24b97')"));
  assert(after.includes('assert.equal(checkedRepresentations,9)'));
  assert(after.includes('verifyMetadataTextCheckout(row,committed,readFileSync(atlas+\'/\'+row.path),policy)'));
 }
}
test('exact prior proofs and narrowly reviewed current metadata/cache corrections are retained',()=>{
 for(const row of rows)verify(row,read('fixtures/current-proof-corrections/'+row.name+'.raw'),read(row.name));
});
test('metadata, cache and clinical refusal tampering is refused by the same checker',()=>{
 for(const [index,before,after]of [
  [0,"assert.equal(checkedRepresentations,9)","assert.equal(checkedRepresentations,8)"],
  [0,"assert.equal(count,8);","assert.equal(count,0);"],
  [1,"sha(currentBlob(path))","sha(Buffer.from('unbound'))"],
  [1,"status, 409,","status, 200,"],
 ]){
  const row=rows[index],raw=read('fixtures/current-proof-corrections/'+row.name+'.raw'),active=read(row.name).toString('utf8');
  assert(active.includes(before),before);
  assert.throws(()=>verify(row,raw,Buffer.from(active.replace(before,after))),assert.AssertionError);
 }
});
test('the nine checkout representations remain an exact closed, source-bound exception list',()=>{
 const verifyFixture=bytes=>{
  assert.equal(sha(bytes),'39691c1dec4dbd1b2dc2d9c38c43002f93dcd4c132c06e6229493c6c6ba24b97');
  const value=JSON.parse(bytes);assert.equal(value.source,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');
  assert.equal(value.sourceInputManifestSha256,'07223d8a888769c3e615ddc245afe777a926ed658d7a8276fc50fde524d87e57');
  assert.equal(value.records.length,9);assert.equal(new Set(value.records.map(row=>row.path)).size,9);
 };
 const bytes=read('fixtures/current-source-checkout-representations.json');verifyFixture(bytes);
 for(const change of [value=>{value.records[0].crlfPairs++;},value=>{value.records.pop();},value=>{value.records[0].path='another-path';}]){
  const value=JSON.parse(bytes);change(value);assert.throws(()=>verifyFixture(Buffer.from(JSON.stringify(value))),assert.AssertionError);
 }
});
test('original historical preservation checkers change only the intermediate proof URL',()=>{
 for(const [guard,name,hash]of [
  ['cerebral-history-preservation.test.mjs',rows[0].name,'55044f7efeacd34bad2900a3d8941f507fa47857eb6b79d75b4dc6dd665093f8'],
  ['intracranial-history-preservation.test.mjs',rows[1].name,'1350d20fbb1794392ca3638ae54629299d5fc924268bc0f8c564a8b8d6e21152'],
 ]){
  const active=read(guard).toString('utf8'),url='./fixtures/current-proof-corrections/'+name+'.raw';
  assert.equal(active.split(url).length-1,1);
  assert.equal(sha(Buffer.from(active.replace(url,'./'+name))),hash,'Every historical assertion remains unchanged');
 }
});
