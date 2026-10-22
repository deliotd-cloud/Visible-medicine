import assert from 'node:assert/strict';
import {realpathSync,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';

const atlas='F:/VisibleMedicine/atlas',revision='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree='e9165d7122361f809a267af1414b337b69097fe2';
const {VM_ATLAS_SOURCE_REPO:priorSource,...unconfigured}=process.env;
const before={...process.env};
const first=nativeAtlasEnvironment({atlas,revision,tree,environment:unconfigured});
assert.equal(realpathSync(first.VM_ATLAS_SOURCE_REPO),realpathSync(atlas));
assert.equal(first.GOMAXPROCS,'2');assert.equal(first.RAYON_NUM_THREADS,'1');
const second=nativeAtlasEnvironment({atlas,revision,tree,environment:first});
assert.deepEqual(second,first,'Explicit exact configuration is idempotent');
const refused=[];
for(const[label,args]of[
 ['different configured repository',{atlas,revision,tree,environment:{...unconfigured,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/website'}}],
 ['wrong revision',{atlas,revision:'0'.repeat(40),tree,environment:unconfigured}],
 ['wrong tree',{atlas,revision,tree:'0'.repeat(40),environment:unconfigured}],
 ['relative repository',{atlas:'atlas',revision,tree,environment:unconfigured}],
]){assert.throws(()=>nativeAtlasEnvironment(args));refused.push(label);}
assert.deepEqual({...process.env},before,'No parent or machine environment is modified');
const sha=b=>createHash('sha256').update(b).digest('hex');
const result={at:new Date().toISOString(),source:revision,tree,exactRoot:realpathSync(atlas),
 explicitSourceRootConfigured:true,refused,parentEnvironmentUnchanged:true,appliedToLiveRun:false,
 reason:'V6 failure186 resolves an undefined VM_ATLAS_SOURCE_REPO. Configure only the exact verified clean source in the next child process; do not remove its source-root assertion.',
 helperSha256:sha(readFileSync('native-atlas-environment-20261022.mjs')),
 ownerPreviewChanged:false,candidateChanged:false};
const stage='F:/VisibleMedicine/staging/20261022-native-source-environment';assert(!existsSync(stage));mkdirSync(stage);
writeFileSync(stage+'/PROOF.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({configuredExactSource:true,refusals:refused.length,parentEnvironmentChanged:false,liveRunChanged:false,
 receipt:stage+'/PROOF.json',sha256:sha(readFileSync(stage+'/PROOF.json'))}));
