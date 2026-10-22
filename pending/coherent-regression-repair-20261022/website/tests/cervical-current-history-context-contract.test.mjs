import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {cervicalFamilySeams,restoreCervicalTypedPrior} from './cervical-family-source-adapter.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=name=>readFileSync(new URL('./'+name,import.meta.url));
function inverse(text,reviewed,original,label){
 assert.equal(text.split(reviewed).length,2,label+': one declared seam');
 return text.replace(reviewed,original);
}
const main={
 name:'clinical-review-cervical-disc-tour.test.ts',
 before:'29685d95de9a1efbaa107b739aa2cb4ddb345ba780448c389afac602d29ea37f',
 proposal:'14e140f9979b17a168a70d92baa8e0eca3f8952db886aa3362f44d28577258cc',
 seams:[
  ["import {pathToFileURL} from 'node:url';\n",''],
  [" const currentHistory=(await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)).exactSourceHistoryApi;\n",''],
  [" const source=await currentHistory(deliveryRevision,'regional-tour-review');",
   " const source=await exactSourceHistoryApi(deliveryRevision,'regional-tour-review');"],
  [" const sourceNested=await currentHistory(deliveryRevision,'nested-review-security');",
   " const sourceNested=await exactSourceHistoryApi(deliveryRevision,'nested-review-security');"],
  [" const sourceSpecimen=await exactCervicalHistory(deliveryRevision,'specimen',atlas);",
   " const sourceSpecimen=await exactCervicalHistory(deliveryRevision,'specimen');"],
 ],
};
const helper={
 name:'cervical-exact-history.mjs',
 before:'21a744e77587649dfa71fd3f8496f9126d5e1ee8c52df947fa7796c5b9f5b8dd',
 proposal:'9b10d6935a38500139c40654af997025f210ab12cef05b38e6dc5daba85b6f44',
 seams:[
  ["const defaultAtlas = 'F:/VisibleMedicine/atlas';","const atlas = 'F:/VisibleMedicine/atlas';"],
  ['function gitTree(commit, atlas) {','function gitTree(commit) {'],
  ['  const paths = gitTree(commit, atlas);','  const paths = gitTree(commit);'],
  ['export async function exactCervicalHistory(commit, profile, sourceRoot=defaultAtlas) {\n  const atlas=sourceRoot;',
   'export async function exactCervicalHistory(commit, profile) {'],
 ],
};
function reconstruct(definition,text){
 for(const [reviewed,original] of definition.seams)
  text=inverse(text,reviewed,original,definition.name);
 return text;
}
const typedCurrentSha='36b41c79a10d04fedc0bbb962accf58486ec2542f819e94aca3654d70a42f365';
const typedSeams=[
 ['const actual:ReviewPacket=','const actual='],
 ['exact:ReviewPacket=source.bodyLesson','exact=source.bodyLesson'],
];
function restoreReviewedMain(current){
 assert.equal(sha(current),typedCurrentSha,'Exact current clinical-review source bytes');
 let reviewed=current.toString('utf8');
 for(const [typed,prior] of typedSeams)reviewed=inverse(reviewed,typed,prior,'clinical-review type seam');
 const bytes=Buffer.from(reviewed);
 assert.equal(sha(bytes),main.proposal,'Only the two authenticated type seams changed');
 assert.deepEqual(bytes,read('fixtures/expanded-viewer-test-types/clinical-review-cervical-disc-tour.test.ts.raw'),
  'Reconstructed reviewed source is the preserved full raw fixture');
 return bytes;
}
for(const definition of [main,helper])test(definition.name+' keeps a full pre-repair inverse',()=>{
 const current=read(definition.name);
 const typed=definition===main?restoreCervicalTypedPrior(current):current;
 const bytes=definition===main?restoreReviewedMain(typed):typed,text=bytes.toString('utf8');
 assert.equal(sha(bytes),definition.proposal,'Exact reviewed candidate bytes');
 assert.equal(sha(Buffer.from(reconstruct(definition,text))),definition.before,
  'Every original byte reconstructed after only the declared context seams');
 const proof=definition===main?'assert.equal(changed,13)':'assert(paths.has(expected)';
 assert(text.includes(proof),'Original assertion remains');
 const mutated=text.replace(proof,proof+' /* forged */');
 assert.notEqual(mutated,text);
 assert.notEqual(sha(Buffer.from(reconstruct(definition,mutated))),definition.before,
  'Source mutation must break the inverse');
});
test('clinical-review type adapter refuses missing, duplicate and substituted seams',()=>{
 const current=restoreCervicalTypedPrior(read(main.name)).toString('utf8');
 for(const [typed,prior] of typedSeams){
  assert.equal(current.split(typed).length,2,'One authenticated type seam');
  for(const mutant of [current.replace(typed,prior),current+typed,current.replace(typed,typed+' /* forged */')])
   assert.throws(()=>restoreReviewedMain(Buffer.from(mutant)),'Unreviewed type-source mutation refused');
 }
});
test('cervical family adapter refuses missing, duplicate and substituted seams and helper edits',()=>{
 const current=read(main.name).toString('utf8');
 assert.equal(sha(read('cervical-family-source-adapter.mjs')),
  'bf8b51eb82123898b47f4e3dc8f973e89ad8aceaa8a1baea35136bb6ec6c425f');
 for(const [admitted,prior] of cervicalFamilySeams){
  assert.equal(current.split(admitted).length,2,'One authenticated family seam');
  for(const mutant of [current.replace(admitted,prior),current+admitted,
   current.replace(admitted,admitted+' /* forged */')])
   assert.throws(()=>restoreCervicalTypedPrior(Buffer.from(mutant)),'Unreviewed source mutation refused');
 }
});
test('original cervical theorem fixture remains byte exact',()=>{
 const original=read('fixtures/clinical-review-cervical-disc-tour-before-lifecycle.ts.raw');
 assert.equal(sha(original),'49d1df96cd5aeb5b04b78445b4e56df751e62b1d4c3534b4aae3bbd0d0b0b814');
});
