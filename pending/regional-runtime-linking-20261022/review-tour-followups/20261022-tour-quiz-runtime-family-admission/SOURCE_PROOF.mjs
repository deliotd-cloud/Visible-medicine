import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const tick=String.fromCharCode(96);
const runtimePath='public/atlas-runtime/'+String.fromCharCode(36)+'{module}/manifest.json';
const rows=[
  {
    name:'clinical-review-quiz-disclosure.test.ts',
    rawSha:'5b74d78eb8080e18231b17bef7a0fd3cee7db237dcb6afef58aa862c7d044a0b',
    codeSha:'4629e27ef0a622a14cf3fd1eaef3bd1f939c17b725d39bba89992c17dfd7b683',
    edits:[
      [
        ' const currentRevision=admitCurrentDisclosure();\n for(const module of',
        ' const currentRevision=admitCurrentDisclosure();\n const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n for(const module of',
      ],
      [
        'assert.equal(m.sourceCommit,currentRevision);assert.equal(m.clinicalApproved,false);',
        'assert.equal(m.sourceCommit,runtimeSources[module]);assert.equal(m.clinicalApproved,false);',
      ],
    ],
  },
  {
    name:'clinical-review-tour-speed.test.ts',
    rawSha:'e497da23a851402c9dd0988e5b2aeda899d868242a8be6586e03828ae0fdd974',
    codeSha:'455136653f2735cd0be1ca2ab2e52baf96b7efbd996fb79971154d6b781ed09e',
    edits:[[
      'assert.equal(json('+tick+runtimePath+tick+').sourceCommit,source);',
      'assert.equal(json('+tick+runtimePath+tick+').sourceCommit,pin.runtimeSources[module]);',
    ]],
  },
  {
    name:'clinical-review-specimen-continuous-playback.test.ts',
    rawSha:'3076ac33f3096b47f09dbf9364f92687d74d8ffb5899b4c612e8134f3db1ba1c',
    codeSha:'d1ef90c77d79b7ddb2b7013576f7a1c68a636b825dfd5179204d476b5a02a072',
    edits:[
      [
        "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';",
        "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
      ],
      [
        " assert.equal(stops,73);\r\n for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){",
        " assert.equal(stops,73);\r\n const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\r\n for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){",
      ],
      [
        'assert.equal(manifest.sourceCommit,liveCommit,name);',
        'assert.equal(manifest.sourceCommit,runtimeSources[name],name);',
      ],
    ],
  },
];
const witness={
  name:'specimen-playback-whole-source-inverse.test.mjs',
  rawSha:'8962aac6ed256b5e41ebfe2136dee07c28f02311cdf5d4ca90abcd823a2238d0',
  codeSha:'1fcd5d8fdd44974d9cc9dbe407325eff7ff75cb41cfda0d10e32ebf8967fcd47',
};
function once(source,before,after,label){
  assert(before.length>0&&after.length>0,label+': nonempty hunk');
  const index=source.indexOf(before);
  assert(index>=0,label+': exact hunk found');
  assert.equal(source.indexOf(before,index+before.length),-1,label+': unique hunk');
  return source.slice(0,index)+after+source.slice(index+before.length);
}
function readPair(row){
  const raw=readFileSync(new URL('./RAW/tests/'+row.name,import.meta.url));
  const code=readFileSync(new URL('./CODE/tests/'+row.name,import.meta.url));
  assert.equal(sha(raw),row.rawSha,row.name+': exact V5 preimage');
  assert.equal(sha(code),row.codeSha,row.name+': exact proposal');
  return {raw,code};
}
function refuseMutation(row,code){
  const changed=Buffer.from(code);
  changed[Math.floor(changed.length/2)]^=1;
  assert.notEqual(sha(changed),row.codeSha);
  assert.throws(()=>assert.equal(sha(changed),row.codeSha),row.name+': mutated proposal refused');
}
for(const row of rows){
  const {raw,code}=readPair(row);
  let forward=raw.toString('utf8');
  for(const [index,[before,after]] of row.edits.entries())
    forward=once(forward,before,after,row.name+': forward '+index);
  assert.deepEqual(Buffer.from(forward,'utf8'),code,row.name+': no undeclared edits');
  let restored=code.toString('utf8');
  for(const [index,[before,after]] of [...row.edits].reverse().entries())
    restored=once(restored,after,before,row.name+': inverse '+index);
  assert.deepEqual(Buffer.from(restored,'utf8'),raw,row.name+': complete original buffer inverse');
  refuseMutation(row,code);
  for(const [index,[before,after]] of row.edits.entries()){
    const altered=once(code.toString('utf8'),after,(after[0]==='X'?'Y':'X')+after.slice(1),row.name+': mutate seam '+index);
    assert.throws(()=>once(altered,after,before,row.name+': inverse mutated seam '+index));
  }
  console.log(row.name+': '+row.edits.length+' exact hunks, full-byte inverse, mutation refusal');
}

// This dependent historical witness retains its original four-hunk inverse verbatim.
// Its new adapter is pinned by a full-source hash and a complete raw-byte inverse.
{
  const {raw,code}=readPair(witness);
  const old=raw.toString('utf8'),updated=code.toString('utf8');
  const required=[
    "const proposalSha256 = '3076ac33f3096b47f09dbf9364f92687d74d8ffb5899b4c612e8134f3db1ba1c'",
    "const inverseSha256 = '82cefd21ea512d477afe334076f3d4880d79d222ed970b3ec4e5e99e98eb6d77'",
    "assert.throws(() => invert(mutated, inverse.hunks), 'an undeclared edit is refused')",
  ];
  for(const marker of required){
    assert.equal(old.split(marker).length,2,'original witness marker once');
    assert.equal(updated.split(marker).length,2,'retained witness marker once');
  }
  assert.match(updated,/function invertCurrentFamily\(source\)/);
  assert.match(updated,/sha\(priorProposalBytes\), proposalSha256/);
  assert.match(updated,/invert\(normalize\(priorProposalBytes\), inverse\.hunks\)/);
  let left=0;
  while(left<old.length&&left<updated.length&&old[left]===updated[left])left++;
  let right=0;
  while(right<old.length-left&&right<updated.length-left&&
    old[old.length-1-right]===updated[updated.length-1-right])right++;
  assert(left>0&&right>0,'both unchanged witness boundaries retained');
  const originalSpan=old.slice(left,old.length-right);
  const currentSpan=updated.slice(left,updated.length-right);
  assert(originalSpan.length>0&&currentSpan.length>0,'declared witness adapter span');
  const restored=updated.slice(0,left)+originalSpan+updated.slice(updated.length-right);
  assert.deepEqual(Buffer.from(restored,'utf8'),raw,'dependent witness complete original buffer inverse');
  assert.equal(sha(Buffer.from(restored,'utf8')),witness.rawSha);
  refuseMutation(witness,code);
  const changed=updated.slice(0,left)+currentSpan+'X'+updated.slice(updated.length-right);
  assert.throws(()=>assert.equal(sha(Buffer.from(changed,'utf8')),witness.codeSha),
    'dependent witness undeclared adapter edit refused');
  console.log(witness.name+': exact pinned adapter span, full-byte inverse, mutation refusal');
}
