import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=[
  {
    "name": "corpus-xray-v2-current-delivery.test.mjs",
    "before": "28be69bc03dd3b78665ccf5947fb2fd33077654ed6a26bf03bad6bf9c3e6207e",
    "after": "738db1aa3510dc96366398578fea0b5c4fe173a6f59b63d187b38be82191ef7e",
    "seams": [
      [
        "assert.equal(delivery.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');",
        "assert.equal(delivery.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');"
      ]
    ]
  },
  {
    "name": "craniofacial-ct-current-delivery.test.mjs",
    "before": "2de47b24e78247eb1aa1d60d5d8763a35a79e3f5cc3ab3e136fef6c726490ecc",
    "after": "d12881fb54d1c052d5f598f53ab4ccd03fb078604f2685a3728eebac7126ea5e",
    "seams": [
      [
        "const source='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree='e9165d7122361f809a267af1414b337b69097fe2';",
        "const source='2381efe43b75f8a7fb768a069eecd7268c508dac',tree='db21ed3dee259c390878450b3495468996a3af85';"
      ],
      [
        "assert.equal(delivery.reviewSourceFiles,1558);",
        "assert.equal(delivery.reviewSourceFiles,1562);"
      ],
      [
        "assert.equal(inputs.inputs.length,1724);",
        "assert.equal(inputs.inputs.length,1729);"
      ]
    ]
  }
];
const sha=b=>createHash('sha256').update(b).digest('hex');
function restore(row,source){for(const[from,to]of [...row.seams].reverse()){assert.equal(source.split(to).length,2,'Exact declared current seam');source=source.replace(to,from);}return source;}
test('both complete original release roots survive only their enumerated current source roles',()=>{
 for(const row of rows){const before=readFileSync(new URL('./fixtures/corpus-cranio-before/'+row.name+'.raw',import.meta.url)),current=readFileSync(new URL('./'+row.name,import.meta.url));
  assert.equal(sha(before),row.before);assert.equal(sha(current),row.after);assert.equal(restore(row,current.toString()),before.toString(),'Whole original historical/refusal/teaching assertions remain');}
});
test('changed historical or current source assertions cannot pass the whole-original witness',()=>{
 for(const row of rows){const before=readFileSync(new URL('./fixtures/corpus-cranio-before/'+row.name+'.raw',import.meta.url)).toString(),current=readFileSync(new URL('./'+row.name,import.meta.url)).toString();
  const altered=current.replace(row.seams[0][1],row.seams[0][1]+'/* forged */');
  assert.throws(()=>assert.equal(restore(row,altered),before));
  assert.throws(()=>assert.equal(restore(row,current+'\n/* foreign assertion */'),before));}
});
