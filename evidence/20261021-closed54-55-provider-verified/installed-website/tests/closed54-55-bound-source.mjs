// Immutable fallback for the two closed Website deliveries. Never a live-current admission.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readRevision53} from './historical-head-manual-recovery-delivery-53.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const source55='46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd';
const witness=new Map([
 ['components/HeadAtlasComparisonNavigation.tsx',['HeadAtlasComparisonNavigation-54.tsx.raw','05d32d7e3fc96e56af9bab7c76ed622d2e6063cd8378ecc4d1f50d0a6f9432d4',54]],
 ['components/HeadAtlasLinkedModel.tsx',['HeadAtlasLinkedModel-54.tsx.raw','c90fd4b9a51a4fa67ef390fb6b79515825fd662160f83cabd127b7283b8d2fab',54]],
 ['docs/anatomy-coverage/index.json',['anatomy-coverage-index-55.json.raw','5a7d458d8010c66c76a2be7817bd72cdcfbfa932ff5b1dcc2d0b835be6102f8a',55]],
 ['lib/anatomy-coverage-view.ts',['anatomy-coverage-view-55.ts.raw','4918e25d38bff5e11480b3a0ec857bd6c615aebdc2c5c0fc37500f92ba61b8f5',55]],
 ['scripts/import-clinical-review.mjs',['import-clinical-review-55.mjs.raw','9ab934dcc6f349000ff20f10311416f32c21bf07a29b98daad53abdc10602a7a',55]],
]);
const atlas55=new Map([
 ['atlas-review/app/body-content.ts','2f0632827570e5e21bcdc28346e0972cff6cecdb82616d9869960c94b84ec8e2'],
 ['atlas-review/content/body-review-display-pins.json','b58cc25840046a4ab3e88b28aec44ec5dbe279ba1e10f1c6442dd86e25971f6c'],
 ['atlas-review/content/regional-teaching/foot.json','3f3f3e1a21f54cd5f3eaf09f130464aabe12735df870c60ec898c5cd4deddc0b'],
 ['atlas-review/content/superficial-medial-plantar-ultrasound-pins.json','8f3987affe58b593d19e2fd91cf51a26bec129e19bfa1104c0310abb10889059'],
 ['atlas-review/content/superficial-medial-plantar-ultrasound.ts','39f901e9d35b4915117787ee322e2639ce8e1d4ea437ced04ba301dcc1fff701'],
 ['atlas-review/lib/superficial-medial-plantar-ultrasound.ts','e9ff06a3e819969c62ee51cf6969c52e6a9660164ca1f9a4f63395cbe73a18be'],
]);
const witnessRoot=new URL('./fixtures/closed54-55-provider/',import.meta.url);
function readWitness(path,row){
 const [file,digest]=row,bytes=readFileSync(new URL(file,witnessRoot));
 assert(bytes.length>0&&bytes.length<250_000,path+' bounded historical witness');
 assert.equal(sha(bytes),digest,path+' exact historical witness');
 return bytes;
}
function readAtlas55(path,digest){
 const root=checkedAtlasHistoryRepo(source55),sourcePath=path.slice('atlas-review/'.length);
 const bytes=execFileSync('git',['show',source55+':'+sourcePath],{cwd:root,windowsHide:true,maxBuffer:3_000_000,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(sha(bytes),digest,path+' exact historical Git source');
 return bytes;
}
export function readClosed54Or55BoundSource(epoch,path){
 assert(epoch===54||epoch===55,'Closed source epoch');
 assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..'));
 const row=witness.get(path);
 if(row&&(row[2]===54||epoch===55))return readWitness(path,row);
 if(epoch===55){
  const digest=atlas55.get(path);
  if(digest)return readAtlas55(path,digest);
 }
 return readRevision53(path);
}
