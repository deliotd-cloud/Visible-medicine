import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=[
  {
    "name": "review-navigation-delivery-preservation.test.mjs",
    "seams": [
      [
        "import {beforeCompactDeliveryTest,beforeCompactPin,compactInputs} from './review-frame-history-inverse.mjs';",
        "import {beforeCompactDeliveryTest,beforeCompactPin,compactInputs} from './review-frame-history-inverse.mjs';\nimport {restorePreNeckPin2381,restorePreNeckDelivery2381} from './zero-registration-current-roles-inverse.mjs';"
      ],
      [
        "beforeCompactDeliveryTest(read('tests/current-atlas-delivery.test.mjs').toString())",
        "beforeCompactDeliveryTest(restorePreNeckDelivery2381(read('tests/current-atlas-delivery.test.mjs'),read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw')).toString())"
      ],
      [
        "assert.equal(currentBinding.inputs.length,1724);",
        "assert.equal(currentBinding.inputs.length,1729);"
      ],
      [
        "beforeCompactPin(read('tests/fixtures/current-atlas-delivery.json'))",
        "beforeCompactPin(restorePreNeckPin2381(read('tests/fixtures/current-atlas-delivery.json'),read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json')))"
      ]
    ],
    "before": "326b425f1d529b590eaa345f94a9dd440ed2bcfe5fbbb19dcb918048a002b995",
    "after": "14e5824f2a60c96b4832d7a17416378500fe01d46ac8c7262985ecfa36301119"
  },
  {
    "name": "ui-teaching-current-delivery.test.mjs",
    "seams": [
      [
        "assert.equal(delivery.reviewSourceFiles, 1558);",
        "assert.equal(delivery.reviewSourceFiles, 1562);"
      ],
      [
        "assert.equal(inputs.inputs.length, 1724);",
        "assert.equal(inputs.inputs.length, 1729);"
      ]
    ],
    "before": "8d585dd4af1fa8e5c3ed6256e822cdffa9dbbff0e09428aebeb1bf26961b5ed7",
    "after": "2d654b875fb68520036e2288cad70e08a4a8da885391196f715168f339418a4f"
  },
  {
    "name": "ui-teaching-admission-contract.test.mjs",
    "seams": [
      [
        "assert.equal(live.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');",
        "assert.equal(live.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');"
      ],
      [
        "assert.equal(live.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');",
        "assert.equal(live.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');"
      ],
      [
        "assert.equal(live.reviewIntegration,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a');",
        "assert.equal(live.reviewIntegration,'1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc');"
      ],
      [
        "assert.equal(live.reviewSourceFiles,1558);",
        "assert.equal(live.reviewSourceFiles,1562);"
      ],
      [
        "assert.equal(sha(bindingBytes),'3c159e7d1abecd4735ed5182cd9143a968a15718f6abc6a0faccd504c0c66513','Exact current Review binding document');",
        "assert.equal(sha(bindingBytes),'157d8f90d7cc44a4a5c4a5394b7012dd91e488b95d4d72e9f1e6f2eb4acf59fa','Exact current Review binding document');"
      ],
      [
        "assert.equal(binding.inputs.length,1724);",
        "assert.equal(binding.inputs.length,1729);"
      ]
    ],
    "before": "0d35c3590b0453730d4a484fc2f1c794e44119f5b1eba9c75de075d20cd0ed7b",
    "after": "b57e611a7ee77263da554141708e3d3acc5bd8da2aed2664b19a185f6e41f3ab"
  },
  {
    "name": "tour-discovery-current-delivery.test.mjs",
    "seams": [
      [
        "assert.equal(CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');",
        "assert.equal(CURRENT_ATLAS_REVISION,'2381efe43b75f8a7fb768a069eecd7268c508dac');"
      ],
      [
        "assert.equal(current.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');",
        "assert.equal(current.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');"
      ],
      [
        "assert.equal(current.reviewSourceFiles,1558);",
        "assert.equal(current.reviewSourceFiles,1562);"
      ],
      [
        "assert.equal(inputs.inputs.length,1724);",
        "assert.equal(inputs.inputs.length,1729);"
      ]
    ],
    "before": "6f48857ab2f7e4167348091bdd60fb60d9d3106f399548650aad593660c61956",
    "after": "2c0bc87f3660711894dad3cfe7aa5a638bbe11296c994662c9870a759b9e2fb3"
  }
],sha=b=>createHash('sha256').update(b).digest('hex');
function inverse(row,text){for(const[from,to]of [...row.seams].reverse()){assert.equal(text.split(to).length,2,'Unique exact inverse');text=text.replace(to,from);}return text;}
test('all four complete UI/navigation/tour source bodies preserve every historical and refusal assertion',()=>{
 for(const row of rows){const before=readFileSync(new URL('./fixtures/ui-tour-current-before/'+row.name+'.raw',import.meta.url)),after=readFileSync(new URL('./'+row.name,import.meta.url));assert.equal(sha(before),row.before);assert.equal(sha(after),row.after);assert.equal(inverse(row,after.toString()),before.toString());}
});
test('foreign assertions and changed current-role seams cannot pass the complete original-source proof',()=>{
 for(const row of rows){const before=readFileSync(new URL('./fixtures/ui-tour-current-before/'+row.name+'.raw',import.meta.url)).toString(),after=readFileSync(new URL('./'+row.name,import.meta.url)).toString();
  assert.throws(()=>assert.equal(inverse(row,after+'\n/* forged */'),before));
  assert.throws(()=>assert.equal(inverse(row,after.replace(row.seams[0][1],row.seams[0][1]+'/* forged */')),before));}
});
