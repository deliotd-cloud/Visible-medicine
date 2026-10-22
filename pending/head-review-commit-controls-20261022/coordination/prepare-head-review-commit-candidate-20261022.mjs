// Independent UI draft: never mutate the source under the complete stock run.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261022-head-review-commit-candidate',site=stage+'/website';
const receipt='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/SOURCE.json',parent=json(receipt),worker='F:/VisibleMedicine/staging/20261022-head-review-commit-controls',result=json(worker+'/RESULT.json');
assert.equal(sha(read(receipt)),'65d2838d513a79ecbf5f9a7eb085354c34b6ebfe0d584c445922eda8e2574522');assert.equal(result.baseline.sourceSha256,sha(read(receipt)));
for(const row of [...result.proposal,...result.preimages])assert.equal(sha(read(worker+'/'+row.path)),row.sha256,row.path);
const component='components/HeadAtlasPracticeReview.tsx',before=read(parent.website+'/'+component),after=read(worker+'/website/'+component);assert.equal(sha(before),result.preimages[0].sha256);
assert(!fs.existsSync(stage));fs.mkdirSync(stage);runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site]);runGit(['-C',site,'read-tree','HEAD']);
const slab=Buffer.alloc(65536);function hash(file){const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
for(const row of parent.sourceRows){const from=parent.website+'/'+row.path;assert.equal(hash(from),row.sha256,row.path);const to=containedTarget(site,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
const changed=[],added=[],witness=[];
function put(relative,bytes){const to=containedTarget(site,relative),old=parent.sourceRows.find(r=>r.path===relative);if(old){assert.equal(hash(to),old.sha256);changed.push(relative);}else{assert(!fs.existsSync(to));added.push(relative);}fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes);}
function one(text,from,to){assert.equal(text.split(from).length,2,from.slice(0,100));return text.replace(from,to);}
function modify(relative,fn){const original=read(parent.website+'/'+relative),next=Buffer.from(fn(original.toString()));put(relative,next);witness.push({path:relative,before:sha(original),after:sha(next)});}
put(component,after);witness.push({path:component,before:sha(before),after:sha(after)});
// Keep all original imports portable; only add real commit effect support.
modify('tests/head-practice-focused-review-ui.test.ts',text=>{
 text=one(text,'type Host={values:unknown[];cursor:number};','type Host={values:unknown[];cursor:number;effects?:(()=>void|(()=>void))[]};');
 text=one(text,'const hooks={','const hooks={\n  useLayoutEffect(effect:()=>void|(()=>void)){host?.effects?.push(effect);},');
 return one(text,'const draw=(h:Host,props:Props)=>{h.cursor=0;host=h;try{return Review(props);}finally{host=undefined;}};',
  'const draw=(h:Host,props:Props)=>{h.cursor=0;h.effects=[];host=h;try{const tree=Review(props);for(const effect of h.effects)effect();return tree;}finally{host=undefined;}};');
});
modify('tests/head-review-study-set-ui.test.ts',text=>{
 text=one(text,'type Host={values:unknown[];cursor:number};','type Host={values:unknown[];cursor:number;effects?:(()=>void|(()=>void))[]};');
 text=one(text,'const hooks={','const hooks={\n  useLayoutEffect(effect:()=>void|(()=>void)){host?.effects?.push(effect);},');
 return one(text,'const draw=(h:Host,props:Props)=>{h.cursor=0;host=h;try{return Review(props);}finally{host=undefined;}};',
  'const draw=(h:Host,props:Props)=>{h.cursor=0;h.effects=[];host=h;try{const tree=Review(props);for(const effect of h.effects)effect();return tree;}finally{host=undefined;}};');
});
modify('tests/head-practice-review.test.ts',text=>one(text,'const hooks={','const hooks={\n  // These render/filter checks do not invoke guarded practice/add actions.\n  useLayoutEffect(){},'));
let lifecycle=read(worker+'/website/tests/head-practice-review-commit-controls.test.mjs').toString();
lifecycle=one(lifecycle,"const baseline='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/website';\n",'');
lifecycle=one(lifecycle,'const baseRequire=createRequire(`${baseline}/tests/head-practice-focused-review-ui.test.ts`);','const baseRequire=createRequire(import.meta.url);');
lifecycle=one(lifecycle,'const componentRequire=createRequire(`${baseline}/components/HeadAtlasPracticeReview.tsx`);',"const componentRequire=createRequire(new URL('../components/HeadAtlasPracticeReview.tsx',import.meta.url));");
lifecycle=one(lifecycle,"const source=readFileSync(new URL(process.env.VM_REVIEW_SOURCE==='original'?'../../preimages/HeadAtlasPracticeReview.tsx':'../components/HeadAtlasPracticeReview.tsx',import.meta.url),'utf8');", "const source=readFileSync(new URL('../components/HeadAtlasPracticeReview.tsx',import.meta.url),'utf8');");
assert(!lifecycle.includes('F:/')&&!lifecycle.includes('process.env'));
put('tests/head-practice-review-commit-controls.test.mjs',Buffer.from(lifecycle));
// Immutable preimages are code, not automatically executed tests or passing claims.
for(const row of witness)put('tests/fixtures/head-review-commit-before/'+path.basename(row.path)+'.raw',read(parent.website+'/'+row.path));
const paths=[...parent.sourceRows.map(r=>r.path),...added].sort(),sourceRows=paths.map(relative=>({path:relative,bytes:fs.statSync(site+'/'+relative).size,sha256:hash(site+'/'+relative)}));
const old=new Map(parent.sourceRows.map(r=>[r.path,r.sha256]));assert.deepEqual(sourceRows.filter(r=>old.has(r.path)&&old.get(r.path)!==r.sha256).map(r=>r.path).sort(),changed.sort());
const source={at:new Date().toISOString(),website:site,atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,review:parent.review,parentSource:receipt,parentSourceSha256:sha(read(receipt)),sourceRows,sourcePaths:sourceRows.length,changedPaths:changed,addedPaths:added,witness,workerReceipt:worker+'/RESULT.json',workerReceiptSha256:sha(read(worker+'/RESULT.json')),status:'unbound-ui-draft-not-an-admitted-delivery',reviewBindingPending:true,typesBuildAndBrowserPending:true,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(stage+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});fs.copyFileSync(new URL(import.meta.url),stage+'/prepare-head-review-commit-candidate-20261022.mjs',fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify({receipt:stage+'/SOURCE.json',sha256:sha(read(stage+'/SOURCE.json')),paths:sourceRows.length,changed:changed.length,added:added.length,reviewBindingPending:true,ownerPreviewChanged:false}));
