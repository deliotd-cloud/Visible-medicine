// Test-only exact single-topic reversal. Never imported into learner dispatch.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';
import pins from '../content/corpus-imaging-ct.pins.json' with {type:'json'};
import transition from '../content/corpus-imaging-ct.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const pinsHash='cb70fd388c646a02074c0691dbf819ba2d3f28d08406ba0f0bcb99e0ad7a938d';
const transitionHash='2e36de68a529538e2fd74343fbd245dff0b673f059364cfac46ddbe596f658b3';
export function beforeCorpusImagingCt(api,catalog){
 assert.equal(hash(pins),pinsHash,'Corpus CT source pins changed');
 assert.equal(hash(transition),transitionHash,'Corpus CT transition changed');
 assert.equal(pins.parentCommit,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');
 assert.equal(hash(readFileSync(new URL('../'+pins.sourcePath,import.meta.url))),pins.sourceCatalogSha256,'Corpus CT source catalog bytes changed');
 assert(Object.hasOwn(api,'corpusImagingLesson'),'Corpus CT own helper required');
 assert.equal(typeof api.corpusImagingLesson,'function','Corpus CT helper required');
 assert.equal(typeof api.bodyContent,'function','Corpus CT learner contract required');
 assert.equal(typeof api.bodyDisplayCatalog,'function','Corpus CT catalog contract required');
 const display=api.bodyDisplayCatalog(catalog);
 for(const[field,value]of Object.entries({sourceVersion:pins.sourceVersion,license:pins.license,credit:pins.credit,coordinateSystem:pins.coordinateSystem}))assert.deepEqual(display[field],value,'Corpus CT '+field+' changed');
 assert.deepEqual(display.bundles.filter(b=>b.id===pins.bundle.id),[pins.bundle],'Corpus CT bundle changed');
 return replayPinnedTeaching(api,{name:'corpus-imaging-ct',pins,transition,pinsHash,transitionHash,helper:'corpusImagingLesson',optionalHelper:false},catalog);
}
