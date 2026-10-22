import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const originalSha={
 'clinical-review-circle-willis.test.ts':'4e9fce14575e0e55f4a83c902dd1cac23323cef22504cde2a445f08bba8251ac',
 'clinical-review-coronary-xray.test.ts':'6280a49bb078f06834907ef9f45953d279d16a12a0df2ebe58f4f4f9556add1d',
 'clinical-review-cranial-teaching-batch.test.ts':'7ff0fdfef16f9c7f924e305a33b2c046ab0e32b3c7b887de32f983189835eda4',
 'clinical-review-elbow-arterial-ultrasound.test.ts':'d4cc33e00c914c01b6bca84962172eb49e6bb76be6bce1541336f80811b5c346',
 'clinical-review-forearm-arterial-tour.test.ts':'9aa6fda53a42e3ddc6ad1f936e2cbec0e9a39d486f796f8afbf72ecb999f46ab',
};
const seams={
 'clinical-review-circle-willis.test.ts':"  const currentRevision=admitCircleWillis('9fba9a1e24b6669aafd48e945d55fc0939d50ab2');\n",
 'clinical-review-coronary-xray.test.ts':' const currentRevision=admitCoronaryXray(revision);\n',
 'clinical-review-cranial-teaching-batch.test.ts':" const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck','shoulder']});\n",
 'clinical-review-elbow-arterial-ultrasound.test.ts':" const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck','shoulder']});\n",
 'clinical-review-forearm-arterial-tour.test.ts':" const currentRevision=admitPreservedClinicalReview({revision:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2',sourceHashes,learnerModules:['head-neck']});\n",
};
const preservedAssertion={
 'clinical-review-circle-willis.test.ts':'assert.equal(viewer.personalRecordsIncluded, false);',
 'clinical-review-coronary-xray.test.ts':'assert.equal(learner.patientDataIncluded,false);',
 'clinical-review-cranial-teaching-batch.test.ts':'assert.equal(record.sourceSha256,digest,path);',
 'clinical-review-elbow-arterial-ultrasound.test.ts':'assert.equal(pins.baseline,baseline);',
 'clinical-review-forearm-arterial-tour.test.ts':"assert.equal(tour.status,'draft');",
};
const lf=value=>value.replace(/\r\n/g,'\n');
function one(value,find,replacement,label){
 assert.equal(value.split(find).length,2,label+': one declared seam');
 return value.replace(find,replacement);
}
function reconstruct(name,text){
 let result=lf(text);
 if(name==='clinical-review-cranial-teaching-batch.test.ts'||name==='clinical-review-elbow-arterial-ultrasound.test.ts'){
  result=one(result,"import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",'',name+': exact runtime import');
  result=one(result,' const deliveryPin=validateCurrentAtlasDelivery();\n assert.equal(deliveryPin.source,currentRevision);\n','',name+': current Review pin');
  result=one(result,'assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);',
   'assert.equal(manifest.sourceCommit,currentRevision,module);',name+': independent runtime family');
 }
 const special=name.includes('circle-willis')||name.includes('coronary-xray');
 result=one(result,special
  ?"import {admit"+(name.includes('circle-willis')?'CircleWillis':'CoronaryXray')+"} from './next-five-special-admission.mjs';\n"
  :"import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';\n",'',name+': import');
 result=one(result,seams[name],'',name+': call');
 if(name.includes('circle-willis'))
  result=one(result,'assert.equal(manifest.revision, currentRevision);',
   "assert.equal(manifest.revision, '9fba9a1e24b6669aafd48e945d55fc0939d50ab2');",name+': manifest');
 else if(name.includes('forearm-arterial-tour')){
  const sourceHashes="const sourceHashes={\n 'lib/forearm-arterial-tour.ts':'5a39f29d9195a4c1f154ea01adbdf0c3824177c363590f5e808009992634ae1d',\n 'content/forearm-arterial-tour-pins.json':'4f39db9be069d2f91c373b8835fa1b55a7487677d42b783f32b1cb2938b292a5',\n 'lib/regional-tours.ts':'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',\n} as const;\n";
  result=one(result,sourceHashes,'',name+': exact source hashes');
  result=one(result,'assert.equal(learner.sourceCommit,currentRevision);',
   "assert.equal(learner.sourceCommit,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');",name+': learner');
 }else{
  assert(result.includes('currentRevision'),name+': current manifest assertions');
  result=result.replaceAll('currentRevision','revision');
 }
 if(name.includes('coronary-xray')){
  result=one(result,
   "  // The module audit hashes Atlas working-tree bytes. Admit the exact active\n  // checkout representation; the special admission verifies any EOL difference.\n  const learnerBytes=path===sourcePaths[0]\n   ? readFileSync(atlas+'/'+path) : committed;\n",
   "  // The module audit hashes Atlas working-tree bytes. This existing JSON pin is\n  // checked out with CRLF, while the immutable Git object and Review copy use LF.\n  const learnerBytes=path===sourcePaths[0]\n   ? Buffer.from(Buffer.from(committed).toString('utf8').replace(/\\n/g,'\\r\\n')) : committed;\n",
   name+': source EOL seam');
  result=one(result,"import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';\n",'',name+': locator');
  result=one(result,'const atlas=checkedAtlasHistoryRepo(revision);',
   "const atlas='F:/VisibleMedicine/atlas';",name+': original root');
  result=one(result," {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});",
   ' {cwd:atlas,windowsHide:true,maxBuffer:32e6});',name+': NoReplace hardening');
 }
 return result;
}
for(const [name,hash]of Object.entries(originalSha))test(name+' retains original assertions',()=>{
 const bytes=readFileSync(new URL('./fixtures/next-five-admissions/'+name+'.raw',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,name+': original bytes');
 const original=lf(bytes.toString('utf8'));
 const candidate=lf(readFileSync(new URL('./'+name,import.meta.url),'utf8'));
 assert.equal(reconstruct(name,candidate),original);
 const mutated=one(candidate,preservedAssertion[name],
  preservedAssertion[name].replace('assert.equal(','assert.notEqual('),name+': tamper target');
 assert.notEqual(mutated,candidate);
 assert.notEqual(reconstruct(name,mutated),original,'Substantive assertion mutation must fail');
 const badSeam=candidate.replace(seams[name],seams[name].replace('admit','forgedAdmit'));
 assert.notEqual(badSeam,candidate);
 assert.throws(()=>reconstruct(name,badSeam),'Admission mutation must fail');
 if(name==='clinical-review-cranial-teaching-batch.test.ts'||name==='clinical-review-elbow-arterial-ultrasound.test.ts'){
  const runtimeSeam='assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);';
  assert.equal(candidate.split(runtimeSeam).length,2,name+': one exact runtime-family check');
  for(const mutant of [candidate.replace(runtimeSeam,''),candidate+runtimeSeam,
   candidate.replace(runtimeSeam,'assert.equal(manifest.sourceCommit,currentRevision,module);')])
   assert.throws(()=>reconstruct(name,mutant),name+': runtime-family mutation refused');
 }
});
