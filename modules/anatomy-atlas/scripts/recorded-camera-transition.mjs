// Test-only bridge for two historical tour validators. Keep their original
// camera golden; admit only the independently saved keyboard-interruption fix.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const cameraBases=new Set(['a10f1fd19c7dcf27470943f4775cb509f7da811f','a1f7f82d524f5c40e53151a2d4e36f29d8e85d0f']);
const cameraParent='952d758104102f5853e00e846cb3448511daa960';
export const recordedCameraFix='5ee900136898121566377a4d0abd3e509d5699d0';
export const originalCameraSha256='cad2aa9543c94c2d751a1593cda90e2db4c84a2b639d6d380b131a74ea0f09f9';
export const acceptedCameraSha256='5b645a3e14cc8792bdab2be9e5369d40add37005b53a6aa9b40dd39123fa96d9';
const sha=b=>createHash('sha256').update(b).digest('hex');
const recorded=(revision,path)=>execFileSync('git',['show',revision+':'+path],{windowsHide:true,maxBuffer:4e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
export function assertRecordedGuidedCameraTransition(base,current){
 assert(cameraBases.has(base),'Unrecorded camera baseline');assert(Buffer.isBuffer(current),'Camera comparison requires bytes');
 const original=recorded(base,'app/fitted-camera.tsx');
 assert.equal(sha(original),originalCameraSha256,'Original historical camera golden retained');
 assert.deepEqual(original,recorded(cameraParent,'app/fitted-camera.tsx'),'Both tour baselines share the saved pre-fix camera');
 const needle='    return bindCameraKeyboard(gl.domElement, () => controls.current, () => {\n';
 const addition='      // A consumed keyboard rotation is manual inspection, just like an orbit\n      // gesture. Do not overwrite its live pose on the next guided-tour frame.\n      transition.current = null;\n';
 assert.equal(original.toString().split(needle).length,2,'Single recorded keyboard callback');
 const accepted=recorded(recordedCameraFix,'app/fitted-camera.tsx');
 assert.equal(sha(accepted),acceptedCameraSha256,'Saved camera-fix bytes');
 assert.deepEqual(accepted,Buffer.from(original.toString().replace(needle,needle+addition)),'Exactly the three saved lines, no other camera changes');
 assert.deepEqual(current,accepted,'Current camera must retain the exact recorded interruption fix');
 return {base,originalSha256:originalCameraSha256,acceptedSha256:acceptedCameraSha256,recordedCameraFix};
}

// The Circle of Willis test also predates later test-only package commands.
// Preserve its original complete package golden, plus the exact recorded delta.
const packageBase='a1f7f82d524f5c40e53151a2d4e36f29d8e85d0f';
export const recordedPackageEpoch='182a60bd8942998f808fff87f8a6aa4d8c49f39a';
const originalPackageSha256='301a6d070e7b3ca538c14a0851955caa7f1164b88d8be1cc8c0641865fe4d6b1';
const acceptedPackageSha256='335d570de623b1fefe14538fd5ab3d17ebd6debc6c3449310a6ea3b9ba4c6a04';
const addedCommands=['lower-venous-tour:test','hand-arterial-ultrasound:test','hand-arterial-tour:test','hand-arterial-ct:test','renderer-review-scope:test','mca-source-teaching:test','pica-source-teaching:test','thoracic-core-reasoning:test','interosseous-membrane-projection:test','colic-arterial-mri:test','abdominal-vascular-mri:test','shoulder-girdle-imaging:test','thoracoabdominal-orientation:test','body-system-toggle:test'];
export function assertRecordedTourPackageTransition(base,current){
 assert.equal(base,packageBase,'Unrecorded package baseline');assert(Buffer.isBuffer(current),'Package comparison requires bytes');
 const original=recorded(base,'package.json'),accepted=recorded(recordedPackageEpoch,'package.json');
 assert.equal(sha(original),originalPackageSha256,'Original complete package golden retained');
 assert.equal(sha(accepted),acceptedPackageSha256,'Exact saved package epoch');
 const before=JSON.parse(original),after=JSON.parse(accepted);
 assert.deepEqual({...after,scripts:null},{...before,scripts:null},'Every non-script field, dependency and engine unchanged');
 assert.deepEqual(Object.keys(after.scripts).filter(key=>!(key in before.scripts)),addedCommands);
 assert.deepEqual(Object.keys(before.scripts).filter(key=>after.scripts[key]!==before.scripts[key]),['camera-keyboard:test']);
 assert.equal(after.scripts['camera-keyboard:test'],before.scripts['camera-keyboard:test']+' && node scripts/test-guided-camera-interruption.mjs');
 const restored=structuredClone(after);for(const key of addedCommands)delete restored.scripts[key];
 restored.scripts['camera-keyboard:test']=before.scripts['camera-keyboard:test'];
 assert.deepEqual(restored,before,'All original package fields and test commands retained');
 assert.deepEqual(current,accepted,'No unrecorded package or command change allowed');
 return {base,recordedPackageEpoch,addedTestCommands:addedCommands.length,dependenciesChanged:false};
}
