import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261021-camera-zoom-contract-proposal';
const candidate='F:/VisibleMedicine/staging/20261021-source190-website/website';
const p='tests/atlas-guided-camera.test.ts';
const row=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json').find(r=>r.path===p);assert(row);
const original=read(candidate+'/'+p).toString();assert.equal(sha(Buffer.from(original)),row.sha256);
const marker="test('current camera source, import, and four runtimes retain the keyboard transition'";
const begin=original.indexOf(marker),end=original.indexOf("\ntest(",begin+marker.length);assert(begin>0&&end>begin);
const current=original.slice(begin,end);assert.equal(current.split('  keyboardContract(').length,3);
const updated=current.replaceAll('  keyboardContract(','  currentKeyboardContract(');
const insertion='function assertRuntimeFiles';assert.equal(original.split(insertion).length,2);
const helper=String.raw`// Current zoom-capable source supplies the actual camera as a fourth argument.
// Historical three-argument source retains its complete original contract.
function currentKeyboardContract(source:string){
  const pattern=/return bindCameraKeyboard\(gl\.domElement, \(\) => controls\.current, \(\) => \{([\s\S]*?)\}, camera\);/g;
  const matches=[...source.matchAll(pattern)];
  assert.equal(matches.length,1,'source190 perspective binding must supply its zoom camera');
  const call=matches[0][0];
  keyboardContract(source.replace(call,call.replace(/\}, camera\);$/,'});')));
}

`;
let proposed=original.slice(0,begin)+updated+original.slice(end);
proposed=proposed.replace(insertion,helper+insertion);
const negative=String.raw`
test('current camera contract rejects a missing zoom-camera argument without relaxing historical source',()=>{
  const source=atlas(currentAtlas,cameraPath).toString();
  const ending='    }, camera);';
  assert.equal(source.split(ending).length,2);
  assert.throws(()=>currentKeyboardContract(source.replace(ending,'    });')),
    /source190 perspective binding must supply its zoom camera/);
});
`;
proposed+=negative;
const inverse=proposed.slice(0,-negative.length).replace(helper,'').replace(updated,current);
assert.equal(inverse,original,'Entire original three native tests and legacy contract reconstruct exactly');
assert(!fs.existsSync(root));fs.mkdirSync(root);fs.mkdirSync(root+'/preimages');
fs.writeFileSync(root+'/preimages/atlas-guided-camera.test.ts',Buffer.from(original),{flag:'wx'});
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify({stage:root,site:candidate,atlas:'F:/VisibleMedicine/staging/20261021-atlas-combined-source',
 path:p,beforeSha256:row.sha256,sha256:sha(Buffer.from(proposed)),exactWholeSourceInverse:true,
 reason:'Actual full-suite failure is an obsolete three-argument source regex; source190 supplies its camera for keyboard zoom. Historical contract is unchanged; current contract strictly requires the fourth camera argument before applying every prior sweep/capture assertion. A negative case refuses its removal.',
 candidateEdited:false,canonicalInstalled:false,privateDataCopied:false},null,2)+'\n',{flag:'wx'});
console.log(['*** Begin Patch','*** Add File: '+root+'/atlas-guided-camera.test.ts',...proposed.replace(/\n$/,'').split('\n').map(l=>'+'+l),'*** End Patch'].join('\n'));
