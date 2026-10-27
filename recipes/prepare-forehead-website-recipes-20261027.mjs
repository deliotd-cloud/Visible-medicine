import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash,json} from './bounded-source-hash-20261026.mjs';
const phase=process.argv[2],stage='F:/VisibleMedicine/staging/20261027-forehead-nerve-us-website';
const parentFile='F:/VisibleMedicine/staging/20261027-inbox-deferred-return-v2/SOURCE_CANDIDATE.json',nativeFile='F:/VisibleMedicine/staging/20261027-forehead-nerve-us-native/SOURCE_CANDIDATE.json';
assert.equal(hash(parentFile),'fbc8b1cf903fa4e0dc967f4ae66135ed4f5512660113688dc82d82f786fe4a27');assert.equal(hash(nativeFile),'ce861516a2c68803726f9b1222fdf8d403a714960fea67ca8f2fe0e5d66b871a');
const parent=json(parentFile),native=json(nativeFile),proposal='F:/VisibleMedicine/staging/20261027-forehead-coverage-proposal';
const common=[['20261026-tongue-website','20261027-forehead-nerve-us-website'],['20261026-tongue-coverage-proposal','20261027-forehead-coverage-proposal'],['20261026-tongue-imaging-native','20261027-forehead-nerve-us-native'],['20261026-tongue-runtime-exports','20261027-forehead-runtime-exports'],['20261026-workbook-history-website','20261027-inbox-deferred-return-v2'],['de19377dc8e1a0c18180e3286f9dfae94209d338ead7f6cb1cd8b5575f0d73fa',hash(parentFile)],['a3d4688d49f2cce6eb16c0418d46c776c51d386e315a3933d1b69ad4a13e3e38',hash(nativeFile)],['vm-tongue-website-preparation/1','vm-forehead-website-preparation/1']];
function swap(text,edits){for(let n=0;n<edits.length;n++)text=text.replaceAll(edits[n][0],'___FOREHEAD_SWAP_'+n+'___');for(let n=0;n<edits.length;n++)text=text.replaceAll('___FOREHEAD_SWAP_'+n+'___',edits[n][1]);return text;}
const adaptations=[];
function adapt(from,to,edits=[]){const original=fs.readFileSync(from,'utf8'),text=swap(original,[...common,...edits]);fs.writeFileSync(to,text,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});adaptations.push({from,fromSha256:hash(from),to,toSha256:hash(to)});}
if(phase==='prepare'){
  adapt('prepare-tongue-website-20261026.mjs','prepare-forehead-website-20261027.mjs',[["const revision = '643fd47491a41a0207f106806c17035cb938048b';","const revision = '"+parent.atlasHead+"';"]]);
  console.log(JSON.stringify({prepared:true,requiresFourVerifiedExports:true}));
}else if(phase==='stock'){
  const pf=stage+'/PREPARATION.json',prep=json(pf),added=['content/forehead-nerve-ultrasound-pins.json','content/forehead-nerve-ultrasound.ts','lib/forehead-nerve-ultrasound.ts'],oldAdded=['content/tongue-imaging-pins.json','content/tongue-imaging.ts','lib/tongue-imaging.ts'];
  const prepSwap=['669948174fd6b0a8657ef723442a4a4e84522ee691421250245fa66e661f3529',hash(pf)];
  adapt('import-tongue-website-stock-20261026.mjs','import-forehead-website-stock-20261027.mjs',[prepSwap,['tongue-website-stock-import','forehead-website-stock-import'],[JSON.stringify(oldAdded),JSON.stringify(added)]]);
  assert(!fs.existsSync(proposal));fs.mkdirSync(proposal+'/witness',{recursive:true});
  for(const[p,name]of [['docs/anatomy-coverage/index.json','index.json.raw'],['lib/anatomy-coverage-view.ts','anatomy-coverage-view.ts.raw'],['scripts/check-anatomy-coverage.mjs','check-anatomy-coverage.mjs.raw']])fs.copyFileSync(prep.website+'/'+p,proposal+'/witness/'+name,fs.constants.COPYFILE_EXCL);
  let helper=swap(fs.readFileSync('F:/VisibleMedicine/staging/20261026-tongue-coverage-proposal/prepare-seams.mjs','utf8'),[...common,prepSwap,['6ce2153ec403e2abdd41a1cce897dc08f5caf338',native.head],['643fd47491a41a0207f106806c17035cb938048b',parent.atlasHead],['dd16053e8b375e775d2663c2db92d5acfcacc7b2',native.tree],['c60859afad4441ef342f6bda126b54c87559459e',parent.atlasTree],['d018b84d648b60704255684b27b2e9b0ad96b99fc6adbddb07711e067287600d',hash(prep.website+'/docs/anatomy-coverage/index.json')]]);
  const map=new Map(parent.sourceRows.map(r=>[r.path,r.sha256])),section=helper.match(/const expectedWebsiteCode = \{[\s\S]*?\n\};/)[0];
  helper=helper.replace(section,section.replace(/'([^']+)': '([a-f0-9]{64})'/g,(_m,p)=>{const h=map.get(p);assert(h,p);assert.equal(hash(prep.website+'/'+p),h,p);return "'"+p+"': '"+h+"'";}));
  fs.writeFileSync(proposal+'/prepare-seams.mjs',helper,{flag:'wx'});execFileSync(process.execPath,['--check',proposal+'/prepare-seams.mjs'],{windowsHide:true});
  for(const name of ['generate','install'])adapt(name+'-tongue-website-coverage-20261026.mjs',name+'-forehead-website-coverage-20261027.mjs');
  adapt('run-tongue-coverage-seams-20261026.mjs','run-forehead-coverage-seams-20261027.mjs',[prepSwap,['1fc0fbcb730b7c9150dff3bf1e398a3d9499f4d7afeb1592fa27e1dca6a66fca',hash(proposal+'/prepare-seams.mjs')]]);
  const inputSwap=[JSON.stringify(oldAdded.map(p=>'atlas-review/'+p)),JSON.stringify(added.map(p=>'atlas-review/'+p))];
  adapt('build-tongue-website-review-20261026.mjs','build-forehead-website-review-20261027.mjs',[inputSwap]);
  adapt('refresh-tongue-website-delivery-pin-20261026.mjs','refresh-forehead-website-delivery-pin-20261027.mjs');
  adapt('run-tongue-website-integration-20261026.mjs','run-forehead-website-integration-20261027.mjs',[
    ...['generate-tongue-website-coverage','run-tongue-coverage-seams','install-tongue-website-coverage','build-tongue-website-review','refresh-tongue-website-delivery-pin'].map(n=>[n+'-20261026.mjs',n.replace('tongue','forehead')+'-20261027.mjs']),['tongue-website-integration','forehead-website-integration']]);
  adapt('seal-tongue-website-source-20261026.mjs','seal-forehead-website-source-20261027.mjs',[inputSwap,['vm-coherent-tongue-website-source/1','vm-coherent-forehead-website-source/1']]);
  const oldInputs=json(prep.website+'/docs/anatomy-coverage/index.json').evidence.sourceInputs,nativeMap=new Map(native.sourceRows.map(r=>[r.path,r.sha256]));
  assert.equal(Object.keys(oldInputs).length,171);assert.deepEqual(Object.entries(oldInputs).filter(([p,h])=>nativeMap.get(p)!==h),[]);
  fs.writeFileSync(stage+'/STOCK_RECIPES.json',JSON.stringify({at:new Date().toISOString(),adaptations,expectedAddedImportedPaths:added,expectedAddedReviewInputs:added.map(p=>'atlas-review/'+p),coverageInputs:171,changedCoverageInputs:[],helper:{path:proposal+'/prepare-seams.mjs',sha256:hash(proposal+'/prepare-seams.mjs')},historicalRecipesAndTestsUntouched:true},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({recipes:adaptations.length,additionalImportedSources:3,coverageInputsUnchanged:171}));
}else throw Error('Choose prepare or stock');
