// Test-only single-cell reversal. Never import into learner dispatch.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';
import pins from '../content/corpus-spongiosum-xray-v2.pins.json' with {type:'json'};
import transition from '../content/corpus-spongiosum-xray-v2.transition.json' with {type:'json'};
const pinsHash='aae71b14d295558ed8b584a97969729677d37a718b5b497c47aca2846b8d26a2';
const transitionHash='9f1bccc097f147be0908f9fee4675564607be2f7b4839c3bf077aaeb5e47eff4';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function beforeCorpusSpongiosumXrayV2(api,catalog){
  assert.equal(sha(JSON.stringify(pins)),pinsHash,'Corpus X-ray v2 pins changed');
  assert.equal(sha(JSON.stringify(transition)),transitionHash,'Corpus X-ray v2 transition changed');
  assert.equal(pins.parentCommit,'f5097af8493701d64a8e2a2b5797df380f3b348a');
  assert.equal(sha(readFileSync(new URL('../'+pins.sourcePath,import.meta.url))),pins.sourceCatalogSha256,'Corpus source catalog bytes changed');
  assert(Object.hasOwn(api,'corpusSpongiosumXrayLesson'),'Corpus X-ray v2 own helper required');
  assert.equal(typeof api.corpusSpongiosumXrayLesson,'function','Corpus X-ray v2 helper required');
  assert.equal(typeof api.bodyContent,'function','Corpus X-ray v2 learner contract required');
  assert.equal(typeof api.bodyDisplayCatalog,'function','Corpus X-ray v2 source contract required');
  const display=api.bodyDisplayCatalog(catalog);
  for(const[field,value]of Object.entries({sourceVersion:pins.sourceVersion,license:pins.license,credit:pins.credit,coordinateSystem:pins.coordinateSystem}))assert.deepEqual(display[field],value,`Corpus X-ray v2 ${field} changed`);
  assert.deepEqual(display.bundles.filter(b=>b.id===pins.bundle.id),[pins.bundle],'Corpus X-ray v2 bundle changed');
  return replayPinnedTeaching(api,{name:'corpus-spongiosum-xray-v2',pins,transition,pinsHash,transitionHash,helper:'corpusSpongiosumXrayLesson',optionalHelper:false},catalog);
}
