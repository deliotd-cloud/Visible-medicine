import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {restoreFrozenCandidate} from './clinical-orbital-neonatal-composition.mjs';
import {restorePancreaticPortalCandidate} from './clinical-pancreatic-portal-composition.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=[
 {name:'clinical-review-model-inspection.test.mjs',before:'c1f906808fdf36a4dc76209df0a47f53e575235f02cfc531adbdafb931e3579a',
  after:'f1fc322c26f68ad264148f36436f0a13a4d034324dbb193a1d0fe24b09f4c627',inverse:[
   ['const state=[];let cursor=0;const navigation=[];','const state=[];let cursor=0;'],
   ["      if(name==='next/navigation')return{useRouter:()=>({push:href=>navigation.push(href)})};\n",''],
   ['return{context,navigation,render(component,props)', 'return{context,render(component,props)'],
   ["  assert.deepEqual(h.navigation,[],'Model inspection does not trigger approved-next navigation');\n",''],
  ]},
 {name:'clinical-review-orbital-sensory-mri.test.ts',before:'1127b1186b5339a0a4be8d21ca1361cb61a338c93083c571f0e2705b61e86e64',
  after:'0fa989b29a130f39264b192358545f9b9d56d602a84c215e82bc76bb875ea28b',inverse:[
   ["import {execFileSync} from 'node:child_process';\n",''],
   ["import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';\nimport {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n",''],
   ["const historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst revision=CURRENT_ATLAS_REVISION;",
    "const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';"],
   [" const atlas=currentAtlasDeliveryRoot();\n assert.equal(checkedAtlasHistoryRepo(historicalRevision),atlas);\n const git=(commit:string,path:string)=>execFileSync('git',['show',`${commit}:${path}`],\n  {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n for(const [path,digest] of Object.entries(sourceHashes)){\n  assert.equal(sha(git(historicalRevision,path)),digest,`${path}: immutable first delivery`);\n  assert.deepEqual(git(revision,path),git(historicalRevision,path),`${path}: source retained in current delivery`);\n }\n",''],
  ]},
 {name:'clinical-review-pancreatic-vessel-teaching.test.ts',before:'6c0240e376991077706fb4ffddd2fab6fc53631259fade28bdc0b36f8be5e81e',
  after:'6b22c076adf1371ff6f7c4b5cd550b0ca9c66edd033bda9156284c7a727fc1a4',inverse:[
   ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n",''],
   [" const atlas=currentAtlasDeliveryRoot();\n assert.equal(review.revision,CURRENT_ATLAS_REVISION);",
    " assert.match(review.revision,/^[a-f0-9]{40}$/);"],
   ["   const source=readFileSync(atlas+'/'+path);\n   assert.equal(rawSha(source),record.sourceSha256,`${path}: checked current Atlas source`);\n   const learnerSourceSha=record.sourceSha256;",
    "   let learnerSourceSha=record.sourceSha256;"],
   ["    // Preserve the earlier Windows CRLF representation as explicit historical\n    // evidence; source190 learner inputs now record the exact LF Git bytes.",
    "    // The exact existing pin JSON is LF in Git/Review and CRLF in the Windows\n    // runtime checkout. Convert only this known representation, not content."],
   ["    assert.equal(rawSha(Buffer.from(text.replaceAll('\\n','\\r\\n'))),\n     '735ff50192908a217378920c0f2875b83611ab2d579e41d9a75ea2b6fab370e1',\n     'Exact prior CRLF representation retained');\n    assert.equal(rawSha(source),'5daaecd50fae68d64ef88d39237b6700b9f2bac3fa84f1a4792cbc05b3228d61',\n     'Current LF source pin');",
    "    learnerSourceSha=rawSha(Buffer.from(text.replaceAll('\\n','\\r\\n')));"],
  ]},
];

for(const entry of cases)test(entry.name+' restores every original byte after exact epoch inverse',()=>{
 const original=readFileSync(new URL('./fixtures/'+entry.name+'.raw',import.meta.url));
 const delivered=readFileSync(new URL('./'+entry.name,import.meta.url));
 const proposed=entry.name==='clinical-review-orbital-sensory-mri.test.ts'
  ?restoreFrozenCandidate(entry.name,delivered,readFileSync(new URL('./fixtures/orbital-neonatal-frozen/'+entry.name+'.raw',import.meta.url)))
  :entry.name==='clinical-review-pancreatic-vessel-teaching.test.ts'
   ?restorePancreaticPortalCandidate(entry.name,delivered,readFileSync(new URL('./fixtures/pancreatic-portal-frozen/'+entry.name+'.raw',import.meta.url)))
  :delivered;
 assert.equal(sha(original),entry.before,'Original whole-source pin');
 assert.equal(sha(proposed),entry.after,'Proposed whole-source pin');
 let restored=proposed.toString('utf8');
 assert.deepEqual(Buffer.from(restored),proposed,'Lossless proposed UTF-8');
 for(const [after,before] of entry.inverse){
  assert.equal(restored.split(after).length,2,'One exact inverse seam');
  restored=restored.replace(after,before);
 }
 assert.deepEqual(Buffer.from(restored),original,'Whole original assertion source preserved');
});
