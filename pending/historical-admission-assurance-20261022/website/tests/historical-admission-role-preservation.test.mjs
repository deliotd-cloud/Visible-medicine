import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restorePreNeckPin2381,restorePreNeckDelivery2381,restorePreNeckHeadTeaching2381,restorePrePresentationViewer2381} from './zero-registration-current-roles-inverse.mjs';
import {restorePracticeExitViewer} from './head-practice-exit-inverse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>readFileSync(new URL('../'+p,import.meta.url));
const witnesses=[
  {
    "name": "native-focus-review-binding.test.mjs",
    "before": "d16ab332cf960809365ed3378abd5ff9b84ba72472f2b24a691508f2cc9a9e23",
    "after": "cafe5272f1f0ba724f14486e4221786569e7655ccd846a1d0b5a5d8be9ba3746",
    "seams": [
      [
        "assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');",
        "assert.equal(pin.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');"
      ],
      [
        "assert.equal(pin.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');",
        "assert.equal(pin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');"
      ],
      [
        "assert.equal(pin.reviewSourceFiles,1558);",
        "assert.equal(pin.reviewSourceFiles,1562);"
      ],
      [
        "assert.equal(binding.inputs.length,1724);",
        "assert.equal(binding.inputs.length,1729);"
      ]
    ]
  },
  {
    "name": "posterior-fossa-coverage.test.mjs",
    "before": "ccc80bccd2b2f0f456ec71951e2c92017766fc8a19479bf5318bdda9441eab20",
    "after": "c84ece35d9ae5a2761741368d44382b09c808fa9d26db25dc9a2b005040a7f35",
    "seams": [
      [
        "\"assert.equal(coverageRevision,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');\",\"assert.equal(coverageRevision,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');\"",
        "\"assert.equal(coverageRevision,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');\",\"assert.equal(coverageRevision,'2381efe43b75f8a7fb768a069eecd7268c508dac');\""
      ],
      [
        "assert.equal(coverageRevision,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');",
        "assert.equal(coverageRevision,'2381efe43b75f8a7fb768a069eecd7268c508dac');"
      ]
    ]
  },
  {
    "name": "salpingopharyngeus-integration-register.test.mjs",
    "before": "70cc28e5445300730d5d98845024b4eb6f0970572bb0206809d79000c3a78d3e",
    "after": "de145f116bbf8feb0c125458fb3f78aee565504ac14ce4c13f01606df38df13a",
    "seams": [
      [
        "assert.equal(current.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');",
        "assert.equal(current.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');"
      ]
    ]
  },
  {
    "name": "studio-lineage-integration.test.mjs",
    "before": "bbee89861f319613982193bf101cff3838bba9d2a5ba2f5cf230064eaea6993e",
    "after": "e502e68931ed135efbeea055e58176d00e9e9febf783741649108b6376dcd69f",
    "seams": [
      [
        "assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');",
        "assert.equal(pin.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');"
      ],
      [
        "assert.equal(pin.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');",
        "assert.equal(pin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');"
      ],
      [
        "assert.equal(pin.reviewSourceFiles,1558);",
        "assert.equal(pin.reviewSourceFiles,1562);"
      ]
    ]
  }
];
test('four complete original live-source roots retain every assertion outside exact current-role seams',()=>{
 for(const row of witnesses){const before=read('tests/fixtures/four-live-before/'+row.name+'.raw'),after=read('tests/'+row.name);assert.equal(sha(before),row.before);assert.equal(sha(after),row.after);
  const inverseSeams=row.name==='posterior-fossa-coverage.test.mjs'?row.seams:[...row.seams].reverse();
  let inverse=after.toString();for(const[from,to]of inverseSeams){assert.equal(inverse.split(to).length,2);inverse=inverse.replace(to,from);}assert.equal(inverse,before.toString());}
});
for(const[name,fn,a,b]of [
 ['pin',restorePreNeckPin2381,'tests/fixtures/current-atlas-delivery.json','tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json'],
 ['whole delivery test',restorePreNeckDelivery2381,'tests/current-atlas-delivery.test.mjs','tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw'],
])test(name+' rejects changed current and historical source bytes',()=>{const current=read(a),before=read(b);assert.deepEqual(fn(current,before),before);
 for(const[left,right]of [[Buffer.concat([current,Buffer.from(' ')]),before],[current,Buffer.concat([before,Buffer.from(' ')])],[before,current]])assert.throws(()=>fn(left,right));});
test('historical teaching and viewer inverses reject altered current inputs',()=>{
 const teaching=read('atlas-review/content/regional-teaching/head-neck.json'),viewer=read('components/HeadAtlasViewer.tsx');
 assert.equal(sha(restorePreNeckHeadTeaching2381(teaching)),'e6a486cc4ab9745eae110615b340fa1797bb0e6e0b72195f083bec766543da25');
 assert.equal(sha(restorePrePresentationViewer2381(viewer,restorePracticeExitViewer)),'a9b7c4b3d8f4febab394e983ace55df020cbcc84dc33daa8b2af6e7abd90fd1b');
 assert.throws(()=>restorePreNeckHeadTeaching2381(Buffer.concat([teaching,Buffer.from(' ')])));
 assert.throws(()=>restorePrePresentationViewer2381(Buffer.concat([viewer,Buffer.from(' ')]),restorePracticeExitViewer));
});
