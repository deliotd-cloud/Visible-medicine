import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read=path=>readFileSync(new URL(path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const original=read('./fixtures/head-disclosure-before-role-batch-20261021.mjs.raw');
const candidate=read('./head-disclosure-current-delivery.test.mjs').toString();
const oldStarts=["\ntest('same-Atlas pre-disclosure","\ntest('normal Review binds","\nfor(const target of ['lib/head-disclosure-keyboard.ts'","\ntest('portable real-helper regression"];
const newStarts=["\ntest('bd5465 pre-disclosure","\ntest('current 190 Review binds","\nfor(const target of ['lib/head-disclosure-keyboard.ts'","\ntest('portable real-helper regression"];
const oldCount="const oldCount='assert.equal(inputs.inputs.length, 1679);',newCount='assert.equal(inputs.inputs.length, 1680);';\n";
const expectedNewBlockSha256=[
 'b939bcabe9f518d008050a7f1022b48d3dfcf6637b4b19cd6f2520138703b144',
 '2d143916b602197bf369cda2f5397456a6cf3b5b5c9bc32a92227f5ca90c41dc',
 'ff7d043ee060c51a121219e83a74936168a096747d9837f3496f9809b3927b41',
 'd9432a6b1fa81dcdf2fa62844fe15abec4c922de483bb06beaf4efc300367b6c',
];

function sections(source,starts){
 const indexes=starts.map(marker=>{const first=source.indexOf(marker);assert(first>=0,`Missing section marker: ${marker}`);assert.equal(source.lastIndexOf(marker),first,`Duplicate section marker: ${marker}`);return first;});
 for(let i=1;i<indexes.length;i++)assert(indexes[i]>indexes[i-1],'Section order changed');
 return [source.slice(0,indexes[0]),...indexes.map((index,i)=>source.slice(index,indexes[i+1]??source.length))];
}

function verify(whole,archive=original){
 assert.equal(sha(archive),'18779c2339edf00e4e03f5f1ea35c4d92293b2c5401c64d01558e4aae279ebde','Authentic complete pre-role test bytes');
 const old=sections(archive.toString(),oldStarts),next=sections(whole,newStarts);
 assert.equal(old[0].split(oldCount).length-1,1,'One declared historical count variable');
 assert.equal(next[0],old[0],'All imports, helpers and undeclared prefix assertions remain byte exact');
 for(let i=1;i<next.length;i++)assert.equal(sha(Buffer.from(next[i])),expectedNewBlockSha256[i-1],`Only exact declared ${['historical role','current role','async verifier','portable fixture path'][i-1]} seam is allowed`);
 assert(next[1].includes("assert.equal(old.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3')"));
 assert(next[1].includes("assert.equal(sha(preRole),'de76cd029107bb874bb6664c08568f7a8944e6fd96283870d6080cf73c331d82')"));
 assert(next[1].includes('assert.equal(provedUiTransition.replace(newCount,oldCount),historicalUi'));
 assert(next[2].includes('assert.equal(binding.inputs.length,1710)'));
 assert(next[2].includes("assert.equal(now.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9')"));
 assert(next[3].includes('await assert.rejects(run('));
 assert(next[3].includes('assert.equal(lateCalls,0)'));
 assert(next[4].includes("new URL('./fixtures/head-viewer-before-roving.tsx.raw',import.meta.url)"));
 const inverse=next[0]+old.slice(1).join('');
 assert.equal(inverse,archive.toString(),'Every original assertion, including negatives, reconstructs as one complete file');
 const forward=old[0]+next.slice(1).join('');
 assert.equal(forward,whole,'The exact declared replacements forward reconstruct the current candidate');
 return true;
}

test('entire original head-disclosure proof survives only the four declared exact seams',()=>{
 assert.equal(verify(candidate),true);
});

test('unknown assertion changes in current, historical, verifier, or prefix source are refused',()=>{
 for(const [from,to]of [
  ['assert.equal(binding.inputs.length,1710)','assert.equal(binding.inputs.length,1709)'],
  ["assert.equal(old.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3')","assert.equal(old.source,'0'.repeat(40))"],
  ['assert.equal(lateCalls,0)','assert.equal(lateCalls,1)'],
  ["import {createHash} from 'node:crypto';","import {createHashes} from 'node:crypto';"],
 ]){assert.equal(candidate.split(from).length-1,1,from);assert.throws(()=>verify(candidate.replace(from,to)),{code:'ERR_ASSERTION'});}
 const changed=Buffer.from(original.toString().replace("assert.equal(intercepted,1)","assert.equal(intercepted,0)"));
 assert.notEqual(sha(changed),sha(original));assert.throws(()=>verify(candidate,changed),{code:'ERR_ASSERTION'});
});
