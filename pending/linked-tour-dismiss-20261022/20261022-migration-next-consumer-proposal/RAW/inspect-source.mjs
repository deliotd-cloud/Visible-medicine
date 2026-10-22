import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {restoreLiveLearningMigrationConsumer} from '../CODE/tests/live-learning-migration-consumer-inverse.mjs';

const sha=text=>createHash('sha256').update(text).digest('hex');
const read=url=>readFileSync(new URL(url,import.meta.url),'utf8');
const prior=read('./tests/atlas-runtime-expansion-adoption-proof.test.mjs.raw');
const current=read('../CODE/tests/atlas-runtime-expansion-adoption-proof.test.mjs');
assert.equal(sha(prior),'8e260374718c266b434234478ed32d14b91402bfdfb878e7126b62ad06777784');
assert.equal(sha(current),'21292691505e9db1aae22bb1b2ea3efb7e92c5d6e2d6a533ca747908bf63a502');
const hunks=[
  ["import test from 'node:test';\n","import test from 'node:test';\nimport {restoreLiveLearningMigrationConsumer} from './live-learning-migration-consumer-inverse.mjs';\n"],
  ["  let now=source(name);","  let now=restoreLiveLearningMigrationConsumer(source(name));"],
  ["  assert.equal((source(name).match(/hash:'[a-f0-9]{64}'/g)||[]).length,9);",
    "  assert.equal((source(name).match(/hash:'[a-f0-9]{64}'/g)||[]).length,9);\n  for(const changed of [source(name)+'\\n// forged\\n',source(name).replace('The original consumer-loader theorem','The altered consumer-loader theorem')]){\n    assert.throws(()=>restoreLiveLearningMigrationConsumer(changed));\n  }"],
];
function replaceExact(text,from,to){
  assert.equal(text.split(from).length,2,'One exact hunk occurrence');
  return text.replace(from,to);
}
let reconstructed=prior;
for(const [before,after] of hunks)reconstructed=replaceExact(reconstructed,before,after);
assert.equal(reconstructed,current,'All original expansion assertions survive complete forward reconstruction');
for(const [before,after] of hunks.toReversed())reconstructed=replaceExact(reconstructed,after,before);
assert.equal(reconstructed,prior,'Complete expansion proof preimage survives inverse');
const livePrior=read('./tests/live-learning-consumer-loader-preservation.test.mjs.raw');
const liveCurrent=read('../../20261022-head-manual-migration-history-proof/CODE/tests/live-learning-consumer-loader-preservation.test.mjs');
assert.equal(sha(livePrior),'0061b458a0b0a4b079264d5d945d871a387fafa997e1b779278de0f016ed54f2');
assert.equal(restoreLiveLearningMigrationConsumer(liveCurrent),livePrior);
for(const changed of [liveCurrent+'\n// forged\n',liveCurrent.replace('The original consumer-loader theorem','The altered consumer-loader theorem')])
  assert.throws(()=>restoreLiveLearningMigrationConsumer(changed));
console.log('PASS: complete expansion and live-learning source inverses; altered-source refusals');
