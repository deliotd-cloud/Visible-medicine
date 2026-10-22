import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {nextSixFamilyNames,restoreNextSixCurrentSource} from './next-six-family-source-adapter.mjs';

const names=[
 'clinical-review-dorsal-hand-ultrasound.test.ts',
 'clinical-review-facial-bone-xray.test.ts',
 'clinical-review-foot-variant-quiz.test.ts',
 'clinical-review-foot-venous-arch-imaging.test.ts',
 'clinical-review-diaphragm-tour.test.ts',
 'clinical-review-digestive-tract-tour.test.ts',
];
const originalSha256={
 'clinical-review-dorsal-hand-ultrasound.test.ts':'9115c849edae3dfe75d56b48cf570b776d5ea64c15a2d66694c4387f5f754979',
 'clinical-review-facial-bone-xray.test.ts':'e75157f3ca0a2b3cd63923579af811a29bfa43213a4d4cd0910414c9a5ae7c23',
 'clinical-review-foot-variant-quiz.test.ts':'e1a0c9c142d24a145c978680a88f4fc664b7cb6ae088311f342897552aebead5',
 'clinical-review-foot-venous-arch-imaging.test.ts':'72b6bbfaf7ee3148279d12fbab52ad4fb9da4a932ed04f587259353b052df7c8',
 'clinical-review-diaphragm-tour.test.ts':'4b04932ac051d674109a10a5329f1bbc7b56bb62a2008063c2056721e91504a1',
 'clinical-review-digestive-tract-tour.test.ts':'53c3e6ae8a1f1ebe54d7ed8d47392291aa2e1fd99fe1ad516825cd3d2df5b283',
};
const seam={
 'clinical-review-dorsal-hand-ultrasound.test.ts':"const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck','shoulder']});",
 'clinical-review-facial-bone-xray.test.ts':"const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck']});",
 'clinical-review-foot-variant-quiz.test.ts':"const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck','shoulder']});",
 'clinical-review-foot-venous-arch-imaging.test.ts':"const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck','shoulder']});",
 'clinical-review-diaphragm-tour.test.ts':"const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck']});",
 'clinical-review-digestive-tract-tour.test.ts':"const currentRevision=admitPreservedClinicalReview({revision,sourceHashes:sourcePaths,learnerModules:['head-neck']});",
};
const lf=value=>value.replace(/\r\n/g,'\n');
function reconstruct(name,text){
 let candidate=lf(text);
 const admissionImport="import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';\n";
 assert.equal(candidate.split(admissionImport).length,2,name+': one admission import');
 candidate=candidate.replace(admissionImport,'');
 const inserted=' '+seam[name]+'\n';
 assert.equal(candidate.split(inserted).length,2,name+': one exact admission call');
 candidate=candidate.replace(inserted,'');
 if(name==='clinical-review-diaphragm-tour.test.ts'){
  const hashes="const sourceHashes={\n 'lib/diaphragm-tour.ts':'61af6ed913ccf3ea5f5bc282b23dbd824a431812d6e106c1baeeaf3e24892d3c',\n 'content/diaphragm-tour-pins.json':'901cd21e2630c495892a32f29a16aab67b700477113494a0c31d014a19f101cf',\n 'lib/regional-tours.ts':'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',\n} as const;\n";
  assert.equal(candidate.split(hashes).length,2,name+': exact historical source hashes');
  candidate=candidate.replace(hashes,'');
 }
 assert.match(candidate,/currentRevision/,name+': declared manifest seams');
 candidate=candidate.replaceAll('currentRevision','revision');
 return candidate;
}
for(const name of names)test(name+' preserves original assertions except explicit admission seams',()=>{
 const originalBytes=readFileSync(new URL('./fixtures/next-six-admissions/'+name+'.raw',import.meta.url));
 assert.equal(createHash('sha256').update(originalBytes).digest('hex'),originalSha256[name],name+': exact original bytes');
 const original=lf(originalBytes.toString('utf8'));
 const latest=readFileSync(new URL('./'+name,import.meta.url));
 const admitted=nextSixFamilyNames.includes(name)?restoreNextSixCurrentSource(name,latest):latest;
 const candidate=lf(admitted.toString('utf8'));
 assert.equal(reconstruct(name,candidate),original);
 const altered=candidate.replace('assert.equal(packet.approval,false)', 'assert.equal(packet.approval,true)');
 if(altered!==candidate)assert.notEqual(reconstruct(name,altered),original,'Altered approval must fail reconstruction');
 const badSeam=candidate.replace(seam[name],seam[name].replace('revision,','revision:"forged",'));
 assert.notEqual(badSeam,candidate);
 assert.throws(()=>reconstruct(name,badSeam),'Altered admission must fail reconstruction');
});
test('two family-source adapters reject unreviewed source and helper edits',()=>{
 const helper=readFileSync(new URL('./next-six-family-source-adapter.mjs',import.meta.url));
 assert.equal(createHash('sha256').update(helper).digest('hex'),
  '3db6a794dd946ccca85227e0faa3f24d617ac19d574ea92154369c4d04b1e8ec');
 for(const name of nextSixFamilyNames){
  const current=readFileSync(new URL('./'+name,import.meta.url),'utf8');
  const seam='assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);';
  assert.equal(current.split(seam).length,2,'One family manifest seam: '+name);
  for(const mutant of [current.replace(seam,''),current+seam,current.replace(seam,seam+' /* forged */')])
   assert.throws(()=>restoreNextSixCurrentSource(name,Buffer.from(mutant)),
    'Missing, duplicate or substituted source refused: '+name);
 }
 assert.throws(()=>restoreNextSixCurrentSource('not-an-admitted-source',Buffer.alloc(0)));
});
