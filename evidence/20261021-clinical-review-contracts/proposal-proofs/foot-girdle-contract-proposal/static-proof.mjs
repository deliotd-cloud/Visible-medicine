import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {validateCurrentAtlasDelivery} from '../20261020-combined-website-ui/website/tests/current-atlas-delivery.mjs';

const old='F:/VisibleMedicine/staging/20261016-isolated-atlas-integration/canonical-original';
const current='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const bytes=(root,path)=>readFileSync(root+'/'+path);
const json=(root,path)=>JSON.parse(bytes(root,path));
const reviewPath='atlas-review/manifest.json';
const learnerPath='public/atlas-runtime/head-neck/manifest.json';
const inputPath='public/atlas-runtime/head-neck/source-inputs.json';
const currentPin=validateCurrentAtlasDelivery();
const expectedDocuments={
  [old]:{review:'8647dbb18e0f5b9f568ce0d630ea66c5761f7de052cec1883e8c46b756050603',learner:'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b',inputs:'51810a1c996c188141fec6467dfd0ff2ef6d79062e0797908f63aeac49bd3579',commit:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2'},
  [current]:{review:currentPin.documents[reviewPath],learner:currentPin.documents[learnerPath],inputs:currentPin.documents[inputPath],commit:currentPin.source},
};
const foot={
  'content/foot-vascular-quiz.ts':'3dc9fd1aa39ea472ea2d01b3e682a02524fdd902da2e44a71b3132714759bde9',
  'content/foot-vascular-quiz-pins.json':'9d6a38f9c1c5559f0bca4d7665ad863f04d5074b607a23205d226646c6ef1b66',
  'lib/foot-vascular-quiz.ts':'df617fe8a552a1d0b808c212497c77c879a18192a4094e269a4e0d94fc3eb791',
};
const girdle={
  'content/girdle-bone-ultrasound.ts':'055033a3486b6ce11643f9f8101337e9bc529aed6581ea31a2094a5f7139b855',
  'content/girdle-bone-ultrasound-pins.json':'70e96b85e050508f6d7d919a7055eef3a3cea3f813094cdcb961593e807a6850',
  'lib/girdle-bone-ultrasound.ts':'b42f6ccf57f032b983da3d6237371a08d1ce5c6c2118331fa884f4653967cf66',
};
const expectedGirdleIds=['left-clavicle','left-humerus','left-scapula','right-hip-bone','left-hip-bone'];
for(const root of [old,current]){
  const pin=expectedDocuments[root];
  assert.equal(sha(bytes(root,reviewPath)),pin.review);
  assert.equal(sha(bytes(root,learnerPath)),pin.learner);
  assert.equal(sha(bytes(root,inputPath)),pin.inputs);
  const review=json(root,reviewPath),learner=json(root,learnerPath),inputs=json(root,inputPath);
  assert.equal(review.revision,pin.commit);assert.equal(learner.sourceCommit,pin.commit);
  assert.equal(learner.patientDataIncluded,false);assert.equal(learner.clinicalApproved,false);
  for(const [path,expected] of Object.entries({...foot,...girdle})){
    assert.equal(review.files.find(row=>row.path===path)?.sourceSha256,expected,path);
    assert.equal(review.files.find(row=>row.path===path)?.importedSha256,expected,path);
    assert.equal(inputs.find(row=>row.path===path)?.sha256,expected,path);
    assert.equal(sha(bytes(root,'atlas-review/'+path)),expected,path);
  }
  const pins=json(root,'atlas-review/content/girdle-bone-ultrasound-pins.json');
  assert.equal(pins.entries.length,5);
  assert.deepEqual(pins.entries.map(row=>row.identity.id.split(':').at(-1)),expectedGirdleIds);
  const footPins=json(root,'atlas-review/content/foot-vascular-quiz-pins.json');
  assert.equal(footPins.entries.length,8);
}
assert.equal(sha(bytes(old,'atlas-review/app/body-content.ts')),'92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f');
// The local source checkout is dirty with a queued successor; read only the pinned commit object.
const sourceRepo='F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const git=(...args)=>execFileSync('git',args,{cwd:sourceRepo,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(git('rev-parse','HEAD').toString().trim(),currentPin.source);
assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),currentPin.sourceTree);
const currentBodySource=git('show',currentPin.source+':app/body-content.ts');
assert.equal(sha(bytes(current,'atlas-review/app/body-content.ts')),sha(currentBodySource));
const currentPanel=bytes(current,'atlas-review/app/review/body/review-dashboard.tsx').toString();
for(const text of ['Open this model in a separate tab','Draft answer key:','Draft explanation:','not clinical approval','not an approval or signature'])assert(currentPanel.includes(text),text);
process.stdout.write('old/current closed metadata and six unchanged feature files verified; five girdle and eight foot pins preserved\n');
