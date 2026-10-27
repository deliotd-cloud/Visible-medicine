import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const sf='F:/VisibleMedicine/staging/20261027-tour-step-native/SOURCE_CANDIDATE.json';
const wf='F:/VisibleMedicine/staging/20261027-tour-step-website/SOURCE_PROPOSAL.json';
const bf='F:/VisibleMedicine/staging/20261027-tour-step-native/BUILD_VERIFIED.json';
assert.equal(hash(sf),'10ddf4f58a23f6eea111c09fb5ed4c132c96a46af1a4d5b6bdc72ae0caf797a4');
assert.equal(hash(wf),'ee690e83da8c3a42a8da1a8439b36a60a3f398393308c0224ca4864b8c6fccb7');
assert(json(bf).passing&&json(wf).nativeRuntimeImportPending);
const native=json(sf),parent=json(wf),phase=process.argv[2];assert(['exports','website'].includes(phase));
for(const name of phase==='exports'?['export-scene-study-runtimes','run-scene-study-runtime-exports']:['prepare-scene-study-website']){
 let s=fs.readFileSync(name+'-20261027.mjs','utf8');
 const pairs=[
 ['20261027-scene-study-native','20261027-tour-step-native'],
 ['20261027-scene-study-runtime-exports','20261027-tour-step-runtime-exports'],
 ['20261027-body-review-focus-runtime-exports','20261027-scene-study-runtime-exports'],
 ['20261027-scene-study-website','20261027-tour-step-integrated-website'],
 ['20261027-lecture-slide-focus/SOURCE_CANDIDATE.json','20261027-tour-step-website/SOURCE_PROPOSAL.json'],
 ['17fcdb3d8c4577e8f4c6e310dac72a863d55e162433e0732eedad9d16796d0d9',hash(sf)],
 ['737e84d77c68ec05e9b06ece4176822f601cbbfbba63b1f1f8ebe71937dd1bba',hash(wf)],
 ['14fdf11d69f74fe9a4bbff378d263678f3f9edffa0dc1ad5de7cb44a8d7e41f5',hash(bf)],
 ['pendingSceneStudy','pendingTourStepEntry'],['scene-study-runtime','tour-step-runtime'],
 ['export-scene-study-runtimes','export-tour-step-runtimes'],
 ["const revision = 'ea2413a6ea7e932f3ed6911bea15797037519ab7';","const revision = '"+parent.atlasHead+"';"]];
 for(const [a,b] of pairs)s=s.replaceAll(a,b);
 const to=name.replace('scene-study','tour-step')+'-20261027.mjs';
 fs.writeFileSync(to,s,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});
}
console.log(JSON.stringify({prepared:phase,nativeHead:native.head,parentWebsite:parent.website}));
