import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=text=>createHash('sha256').update(text).digest('hex');
const priorSha='0061b458a0b0a4b079264d5d945d871a387fafa997e1b779278de0f016ed54f2';
const currentSha='26175790b1637fa54b7f01a3d11a7bf86356e4982f6973db61cf8babfced18d6';
const hunks=[
  {
    prior:"import {stripConsumerLoader} from './live-learning-consumer-loader-transition.mjs';\n",
    current:"import {stripConsumerLoader} from './live-learning-consumer-loader-transition.mjs';\nimport {restoreMigrationLaterRole} from './head-manual-migration-later-inverse.mjs';\n",
  },
  {
    prior:"    assert.equal(stripConsumerLoader(candidate,seams),fixture,`${name} exact whole-source inverse`);",
    current:[
      "    const historical=name==='head-manual-recovery-migration.test.mjs'",
      '      ?restoreMigrationLaterRole(name,Buffer.from(candidate),Buffer.from(fixture)).toString()',
      '      :candidate;',
      "    assert.equal(stripConsumerLoader(historical,seams),fixture,`${name} exact whole-source inverse`);",
      "    if(name==='head-manual-recovery-migration.test.mjs'){",
      "      assert.deepEqual(seams,[],'The original consumer-loader theorem has no migration seam');",
      "      assert.throws(()=>restoreMigrationLaterRole(name,Buffer.from(candidate+'\\n// forged\\n'),Buffer.from(fixture)));",
      "      assert.throws(()=>restoreMigrationLaterRole(name,Buffer.from(candidate),Buffer.from(fixture+' ')));",
      '    }',
    ].join('\n'),
  },
];

function exactReplace(text,from,to){
  assert.equal(text.split(from).length,2,`Missing or duplicated exact source hunk: ${from.slice(0,80)}`);
  return text.replace(from,to);
}

export function restoreLiveLearningMigrationConsumer(current){
  assert.equal(sha(current),currentSha,'Authenticated complete later consumer source');
  let prior=current;
  for(const hunk of hunks.toReversed())prior=exactReplace(prior,hunk.current,hunk.prior);
  assert.equal(sha(prior),priorSha,'Authenticated complete prior consumer source');
  let forward=prior;
  for(const hunk of hunks)forward=exactReplace(forward,hunk.prior,hunk.current);
  assert.equal(forward,current,'Lossless forward reconstruction');
  return prior;
}
