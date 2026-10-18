import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const old='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const header="import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\n";
const cases=[["clinical-review-orbital-muscle-quiz.test.ts","55837339b82567d4ae100e7ad39178d67317583bc05bfea8c7d5f24644e94b22","learner.sourceCommit"],["clinical-review-orbital-nerve-quiz.test.ts","8d8a942e90872c16be43ee30661c6a5ce551383c8415ac1d2c5b9f74ac2f56d0","learner.sourceCommit"],["clinical-review-plantar-muscle-quiz.test.ts","a7acfbbbe296f6b401684ffd8848fd20f7b120fd5af00aebe7779c00564573fa","learner.sourceCommit"],["clinical-review-shoulder-arm-artery-quiz.test.ts","00d8aa79d992c80a6b67db842a880d95ab8f7acc6277316eabfedbc71a738863","learner.sourceCommit"],["clinical-review-shoulder-arm-muscle-quiz.test.ts","a007af19279362a1e557688d5521063eb1e00d6ef8d997be38f9c424bba60b79","learner.sourceCommit"],["clinical-review-spinal-bone-quiz.test.ts","89338ae43efef5c64fa11cae2c757ad110156bcfb358791b1788364b4597dda7","learner.sourceCommit"],["clinical-review-spinal-muscle-quiz.test.ts","e7ef5819f4bef0786bf05df3f7e7930dd5e2def4e168d936fafeecc25df4aacf","learner.sourceCommit"],["clinical-review-spine-muscle-quiz.test.ts","2dd3f2a7e527cff399d3beb44de9a7ef16310252bd4eb88e4b5ac30d0dd96ca4","learner.sourceCommit"],["clinical-review-superior-temporal-mri.test.ts","9b1ee2710765ac951fcf9a78c59b2a2c71c55f3f2a7da9f68a8a49f2e61b20be","review.revision"],["clinical-review-suprascapular-arterial-ct.test.ts","af1439da39a768a7f0ef2846de591766fdcc599baddf6faf90dd116b4466a94f","learner.sourceCommit"],["clinical-review-tentorium-imaging.test.ts","96a58b9be9e8ddc4c4650dc14a27674e894d7dadd9d266f60414a5528d35c175","review.revision"],["clinical-review-thigh-deep-muscle-quiz.test.ts","2bc3745a0ccb513edf60c0662eaadf5fcd2660b61e6df44f49345f698d6ebb90","learner.sourceCommit"],["clinical-review-thoracic-small-vessel-mri.test.ts","96af615da8eaeae0c4878679301aa3bd6cbe4531db035ee3a22902cd3fd8025b","learner.sourceCommit"],["clinical-review-thoracic-vessel-quiz.test.ts","b9f99a4565773c36593a7c5fababa524b2456723f76cf1cf221d4b6f5904421d","learner.sourceCommit"],["clinical-review-trunk-core-quiz.test.ts","07a8f75794548fe5549294167f9ee6da151a27dd9afc993bde75c0eb9dce5316","learner.sourceCommit"],["clinical-review-trunk-muscle-quiz.test.ts","315c0abe63ec1799338c9982cae291480db271552c4ac780bad14ffd45593ef5","learner.sourceCommit"],["clinical-review-upper-arm-reasoning.test.ts","b0f871ddf20ac6049ea276b6ce4e5c15177fe3561a1edd448b9a5e102c27e52a","learner.sourceCommit"],["clinical-review-upper-limb-bone-reasoning.test.ts","dd6578c126f12fbf7c41aec44b7c560184d8bac009e1001287f47213af21971c","learner.sourceCommit"],["clinical-review-ventricular-ultrasound.test.ts","c0dfc4925de31405d19f1f2329a9200db4fbb6fb3d527257e1d2a50923866ea9","review.revision"]];

function derive(original,field){
 assert.equal(original.split(old).length-1,1,'one old current pin');
 assert.equal(original.includes('\r'),false,'LF original');
 const source=`assert.equal(${field},'${old}');`;
 assert.equal(original.split(source).length-1,1,'one exact source assertion');
 return header+original.replace(source,`assert.equal(${field},CURRENT_ATLAS_REVISION);`);
}

function prove(name,originalSha,field,postimage){
 const fixture=readFileSync(join(here,'fixtures','clinical-current-pins',`${name}.txt`));
 assert.equal(sha(fixture),originalSha,`${name} original SHA`);
 const expected=derive(fixture.toString('utf8'),field);
 assert.equal(postimage,expected,`${name} whole-file transform`);
 return expected;
}

test('all 19 current-only clinical pins preserve whole original bodies',()=>{
 assert.equal(cases.length,19);
 for(const [name,originalSha,field] of cases){
  const actual=readFileSync(join(here,name),'utf8');
  prove(name,originalSha,field,actual);
 }
});

test('clinical approval tamper is refused',()=>{
 const [name,originalSha,field]=cases[0];
 const actual=readFileSync(join(here,name),'utf8');
 assert.match(actual,/assert\.equal\(packet\.approval,false\);/);
 const tampered=actual.replace('assert.equal(packet.approval,false);','assert.equal(packet.approval,true);');
 assert.notEqual(tampered,actual);
 assert.throws(()=>prove(name,originalSha,field,tampered),/whole-file transform/);
});

test('clinical answer assertion tamper is refused',()=>{
 const [name,originalSha,field]=cases[0];
 const actual=readFileSync(join(here,name),'utf8');
 assert.match(actual,/assert\.equal\(lesson\.bullets\.filter\(\(answer:string\)=>answer===lesson\.correctAnswer\)\.length,1\);/);
 const tampered=actual.replace('answer===lesson.correctAnswer','answer!==lesson.correctAnswer');
 assert.notEqual(tampered,actual);
 assert.throws(()=>prove(name,originalSha,field,tampered),/whole-file transform/);
});
