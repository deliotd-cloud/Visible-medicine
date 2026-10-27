import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-pharyngeal-mri-website';
const parentFile='F:/VisibleMedicine/staging/20261027-head-layout-picker/SOURCE_CANDIDATE_V2.json';
const nativeFile='F:/VisibleMedicine/staging/20261027-pharyngeal-mri-native/SOURCE_CANDIDATE.json';
const prepFile=stage+'/PREPARATION.json';
assert.equal(hash(parentFile),'dfcec576a7f076f1785f3e7fd51c9810a4d7d0ec39f27b07efa35c467325465c');
assert.equal(hash(nativeFile),'34f73bcfcb3954ee0ea3aee6964db43981f5514c9ed4f14ac1c5b566a80c0353');
assert.equal(hash(prepFile),'ed6448fe33a6bd6d67f7dd97d2872d5a6c7a70ee5b1cab0142ffa2d9971a74c7');
const parent=json(parentFile),native=json(nativeFile),prep=json(prepFile);
const proposal='F:/VisibleMedicine/staging/20261027-pharyngeal-coverage-proposal';
const changes=[
 ['20261027-forehead-nerve-us-website','20261027-pharyngeal-mri-website'],
 ['20261027-forehead-nerve-us-native','20261027-pharyngeal-mri-native'],
 ['20261027-forehead-runtime-exports','20261027-pharyngeal-runtime-exports'],
 ['20261027-forehead-coverage-proposal','20261027-pharyngeal-coverage-proposal'],
 ['F:/VisibleMedicine/staging/20261027-inbox-deferred-return-v2/SOURCE_CANDIDATE.json',parentFile],
 ['F:/VisibleMedicine/staging/20261027-inbox-deferred-return-v2/website',parent.website],
 ['ce861516a2c68803726f9b1222fdf8d403a714960fea67ca8f2fe0e5d66b871a',hash(nativeFile)],
 ['fbc8b1cf903fa4e0dc967f4ae66135ed4f5512660113688dc82d82f786fe4a27',hash(parentFile)],
 ['c930e114beb94366e885add78080d5f9aa338c1014d8203c116fef7dcaa0cb5e',hash(prepFile)],
 ['a28d03acf07da97a927073d4794abf3b5ce907f7',native.head],
 ['a9f5930a853bfb7b419ffd756bb29cefc174f3da',parent.atlasHead],
 ['180330c12bb9b5abf1b7171adca83eeadaad476d',native.tree],
 ['fdab867b004812ec6f28f87074f72326e129e0ef',parent.atlasTree],
 ['forehead-nerve-ultrasound','pharyngeal-mri'],
 ['vm-forehead-website-preparation/1',prep.schema],
 ['vm-coherent-forehead-website-source/1','vm-coherent-pharyngeal-website-source/1'],
 ['forehead-website-stock-import','pharyngeal-website-stock-import'],
 ['forehead-website-integration','pharyngeal-website-integration'],
 ...['generate-forehead-website-coverage','run-forehead-coverage-seams','install-forehead-website-coverage','build-forehead-website-review','refresh-forehead-website-delivery-pin'].map(n=>[n+'-20261027.mjs',n.replace('forehead','pharyngeal')+'-20261027.mjs']),
];
function swap(text,edits){for(let n=0;n<edits.length;n++)text=text.replaceAll(edits[n][0],'___PHARYNGEAL_SWAP_'+n+'___');for(let n=0;n<edits.length;n++)text=text.replaceAll('___PHARYNGEAL_SWAP_'+n+'___',edits[n][1]);return text;}
assert(!fs.existsSync(proposal));fs.mkdirSync(proposal+'/witness',{recursive:true});
for(const[p,name]of [['docs/anatomy-coverage/index.json','index.json.raw'],['lib/anatomy-coverage-view.ts','anatomy-coverage-view.ts.raw'],['scripts/check-anatomy-coverage.mjs','check-anatomy-coverage.mjs.raw']])fs.copyFileSync(prep.website+'/'+p,proposal+'/witness/'+name,fs.constants.COPYFILE_EXCL);
const oldHelper='F:/VisibleMedicine/staging/20261027-forehead-coverage-proposal/prepare-seams.mjs';
const oldIndex='F:/VisibleMedicine/staging/20261027-forehead-coverage-proposal/witness/index.json.raw';
let helper=swap(fs.readFileSync(oldHelper,'utf8'),[...changes,[hash(oldIndex),hash(prep.website+'/docs/anatomy-coverage/index.json')]]);
const map=new Map(parent.sourceRows.map(r=>[r.path,r.sha256])),section=helper.match(/const expectedWebsiteCode = \{[\s\S]*?\n\};/)[0];
helper=helper.replace(section,section.replace(/'([^']+)': '([a-f0-9]{64})'/g,(_m,p)=>{const h=map.get(p);assert(h,p);assert.equal(hash(prep.website+'/'+p),h,p);return "'"+p+"': '"+h+"'";}));
fs.writeFileSync(proposal+'/prepare-seams.mjs',helper,{flag:'wx'});
execFileSync(process.execPath,['--check',proposal+'/prepare-seams.mjs'],{windowsHide:true});
const adaptations=[];
for(const name of ['import-forehead-website-stock','generate-forehead-website-coverage','run-forehead-coverage-seams','install-forehead-website-coverage','build-forehead-website-review','refresh-forehead-website-delivery-pin','run-forehead-website-integration','seal-forehead-website-source']){
 const from=name+'-20261027.mjs',to=name.replace('forehead','pharyngeal')+'-20261027.mjs';
 const text=swap(fs.readFileSync(from,'utf8'),[...changes,[hash(oldHelper),hash(proposal+'/prepare-seams.mjs')]]);
 fs.writeFileSync(to,text,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});
 adaptations.push({from,fromSha256:hash(from),to,toSha256:hash(to)});
}
const oldInputs=json(prep.website+'/docs/anatomy-coverage/index.json').evidence.sourceInputs,nativeMap=new Map(native.sourceRows.map(r=>[r.path,r.sha256]));
assert.equal(Object.keys(oldInputs).length,171);assert.deepEqual(Object.entries(oldInputs).filter(([p,h])=>nativeMap.get(p)!==h),[]);
fs.writeFileSync(stage+'/STOCK_RECIPES.json',JSON.stringify({at:new Date().toISOString(),adaptations,coverageInputs:171,changedCoverageInputs:[],helper:{path:proposal+'/prepare-seams.mjs',sha256:hash(proposal+'/prepare-seams.mjs')},historicalRecipesAndTestsUntouched:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({recipes:adaptations.length,coverageInputsUnchanged:171,preparationSchema:prep.schema}));
