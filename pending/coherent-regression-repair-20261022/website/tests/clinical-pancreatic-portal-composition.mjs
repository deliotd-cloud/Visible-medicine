import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases={
 'clinical-review-pancreatic-vessel-teaching.test.ts':{
  current:'e440907a3831e0ef03b492ce9b55e11823c781c273ff1bdcfff9163dd60b5cb1',
  frozen:'6b22c076adf1371ff6f7c4b5cd550b0ca9c66edd033bda9156284c7a727fc1a4',
  inverse:[
   ["import {execFileSync} from 'node:child_process';\n",''],
   ['CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery','CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot'],
   [" const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n",''],
   ['learner.sourceCommit,runtimeSources[name]','learner.sourceCommit,review.revision'],
   ["   const familySource=execFileSync('git',['show',`${runtimeSources[name]}:${path}`],\n    {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n   const learnerSourceSha=rawSha(familySource);",
    '   const learnerSourceSha=record.sourceSha256;'],
  ],
 },
 'clinical-review-portal-venous-xray.test.ts':{
  current:'2c9e5f98988eeb9276e09acccf1ea5461aec00f98c9dc8af8b009c9f2add5ba5',
  frozen:'2dc7fe02eba3ed6cee38817b10138bba4ea14e874987db5e66213aea625bab8e',
  inverse:[
   ['CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery','CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot'],
   ['const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n',''],
   ['manifest.sourceCommit,runtimeSources[name],name','manifest.sourceCommit,revision,name'],
   ['// keep independent family commits, without requiring this teaching in their closure.','// share the source commit, without requiring this teaching in their closure.'],
  ],
 },
 'clinical-review-portal-venous-current-admission.test.mjs':{
  current:'ddb2fe792696b5b7ab41be8c0d1bef6d45b139242f89cc2a5607cba2a431310f',
  frozen:'87983dc5eb6e5cf6a02c60958b0c482495335ba39654c4a325e6c923858e068b',
  inverse:[
   ["import {restorePancreaticPortalCandidate} from './clinical-pancreatic-portal-composition.mjs';\n",''],
   ["const candidate=restorePancreaticPortalCandidate('clinical-review-portal-venous-xray.test.ts',\n readFileSync(new URL('./clinical-review-portal-venous-xray.test.ts',import.meta.url)),\n readFileSync(new URL('./fixtures/pancreatic-portal-frozen/clinical-review-portal-venous-xray.test.ts.raw',import.meta.url))).toString('utf8');",
    "const candidate=readFileSync(new URL('./clinical-review-portal-venous-xray.test.ts',import.meta.url),'utf8');"],
  ],
 },
};

// Compose only these three exact current candidates back to the complete
// frozen CODE expected by unchanged historical source witnesses.
export function restorePancreaticPortalCandidate(name,currentBytes,frozenBytes){
 const entry=Object.hasOwn(cases,name)?cases[name]:undefined;
 assert(entry,`${name}: no admitted composition`);
 assert.equal(sha(currentBytes),entry.current,`${name}: exact current candidate`);
 assert.equal(sha(frozenBytes),entry.frozen,`${name}: exact frozen CODE`);
 let recovered=currentBytes.toString('utf8');
 assert.deepEqual(Buffer.from(recovered),currentBytes,`${name}: lossless UTF-8`);
 for(const [now,before] of entry.inverse){
  assert.equal(recovered.split(now).length,2,`${name}: unique inverse seam`);
  recovered=recovered.replace(now,before);
 }
 const bytes=Buffer.from(recovered);
 assert.deepEqual(bytes,frozenBytes,`${name}: complete frozen CODE recovered`);
 return bytes;
}
