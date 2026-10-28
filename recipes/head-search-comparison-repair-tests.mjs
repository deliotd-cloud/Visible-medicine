import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261028-head-search-comparison',site=stage+'/website',root='F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes',receipt=stage+'/PRODUCT_CHANGE.json',change=JSON.parse(fs.readFileSync(receipt));
const sha=t=>createHash('sha256').update(t).digest('hex');fs.mkdirSync(stage+'/test-repair-preimages');fs.copyFileSync(receipt,stage+'/test-repair-preimages/PRODUCT_CHANGE_V1.json');const edits=[];
function edit(file,a,b){const text=fs.readFileSync(site+'/'+file,'utf8');assert.equal(text.split(a).length,2,file);const to=stage+'/test-repair-preimages/'+file.replaceAll('/','__');if(!fs.existsSync(to))fs.writeFileSync(to,text,{flag:'wx'});fs.writeFileSync(site+'/'+file,text.replace(a,b));edits.push({file,before:a,after:b});if(!change.changed.includes(file)&&!change.added.includes(file)&&file!=='tests/head-search-comparison.test.mjs')change.changed.push(file);}
edit('tests/head-search-comparison.test.mjs',".map(([,href,aria])=>({href:href.replaceAll('&amp;','&'),aria}))", ".map(([,href,aria])=>({href:href.replaceAll('&amp;','&'),aria:'Compare views for '+aria}))");
const discovery='tests/head-learning-library-discovery.test.ts';
edit(discovery,"import assert from 'node:assert/strict';","import assert from 'node:assert/strict';\nimport {headGuidedComparisonForStep} from '../lib/head-guided-comparison.ts';");
edit(discovery,'[expected.atlasHref,expected.ctHref,expected.mriHref]);',"[expected.atlasHref,expected.ctHref,expected.mriHref,headGuidedComparisonForStep('brainstem','brainstem-pons')!.activityHref]);");
edit(discovery,"startLinks(matches[0]).map(link=>link.text),['MRI']);","startLinks(matches[0]).map(link=>link.text),['MRI','Compare views']);");
for(const labels of ["['3D','MRI']","['3D','CT']"]){edit(discovery,`startLinks(match).map(link=>link.text),${labels});`,`startLinks(match).map(link=>link.text),${labels.slice(0,-1)},'Compare views']);`);}
edit(discovery,"startLinks(matchingSteps(view.render().html)[0]).map(link=>link.text),['CT','MRI']);","startLinks(matchingSteps(view.render().html)[0]).map(link=>link.text),['CT','MRI','Compare views']);");
edit(discovery,"[learning.headLearningLinks({sequenceId:'ct-facial-coverage',conceptId:'bone-mandible'})!.ctHref]);","[learning.headLearningLinks({sequenceId:'ct-facial-coverage',conceptId:'bone-mandible'})!.ctHref,headGuidedComparisonForStep('ct-facial-coverage','bone-mandible')!.activityHref]);");
edit('tests/head-learning-search-context.test.ts',"[learning.headLearningLinks({sequenceId:'deep-grey',conceptId:'deep-left-caudate'})!.mriHref]);","[learning.headLearningLinks({sequenceId:'deep-grey',conceptId:'deep-left-caudate'})!.mriHref,headGuidedComparisonForStep('deep-grey','deep-left-caudate')!.activityHref]);");
const old=fs.readFileSync('F:/VisibleMedicine/staging/20261025-guided-comparison-website/website/components/HeadAtlasLearningLibrary.tsx','utf8'),current=fs.readFileSync('F:/VisibleMedicine/staging/20261028-regional-scope-discovery/website/components/HeadAtlasLearningLibrary.tsx','utf8');
assert.equal(sha(old),'fd7c12c85a54736f53bb4023418921243ef695827c501bd2a59eeb335ff547c8');assert.equal(sha(current),'d7bebb5e8a4059f8b514779a37046bcab10a2b3ef90c3fe2ed7bcd74ecb31ba4');
const a=old.split('\n'),b=current.split('\n');assert(a.length<500&&b.length<500);
const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
const seams=[];let i=0,j=0,left=[],right=[];const flush=()=>{if(left.length||right.length){seams.push([left.join('\n')+'\n',right.join('\n')+'\n']);left=[];right=[];}};
while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){flush();i++;j++;}else if(j>=b.length||(i<a.length&&dp[i+1][j]>=dp[i][j+1]))left.push(a[i++]);else right.push(b[j++]);}flush();assert.equal(seams.length,5);
let restored=current;for(const[x,y]of seams.toReversed()){assert.equal(restored.split(y).length,2);restored=restored.replace(y,x);}assert.equal(restored,old);let rebuilt=old;for(const[x,y]of seams){assert.equal(rebuilt.split(x).length,2);rebuilt=rebuilt.replace(x,y);}assert.equal(rebuilt,current);
const fixture='tests/fixtures/head-search-comparison-paging-predecessor.json';fs.writeFileSync(site+'/'+fixture,JSON.stringify({before:sha(old),after:sha(current),seams},null,2)+'\n',{flag:'wx'});change.added.push(fixture);
edit('tests/head-search-comparison-predecessor.mjs',' return old;\n',` const paging=JSON.parse(fs.readFileSync(new URL('./fixtures/head-search-comparison-paging-predecessor.json',import.meta.url)));
 assert.equal(sha(old),paging.after);const paged=old;
 for(const[a,b]of paging.seams.toReversed()){assert.equal(old.split(b).length,2);old=old.replace(b,a);}
 assert.equal(sha(old),paging.before);let forward=old;
 for(const[a,b]of paging.seams){assert.equal(forward.split(a).length,2);forward=forward.replace(a,b);}assert.equal(forward,paged);
 return old;
`);
change.repairs={priorSource:'SOURCE_CANDIDATE.json',failedRun:'checks/tests-1/RESULT.json',edits,pagingPredecessor:{path:fixture,sha256:sha(fs.readFileSync(site+'/'+fixture))},purpose:'Preserve the older compact check across the already-shipped pagination delta; update exact link expectations for the new canonical action; fix a test-only aria parser.'};
fs.writeFileSync(receipt,JSON.stringify(change,null,2)+'\n');
const recipe=root+'/run.mjs';fs.copyFileSync(recipe,root+'/run-v1.mjs',fs.constants.COPYFILE_EXCL);let run=fs.readFileSync(recipe,'utf8');assert.equal(run.split("sf=stage+'/SOURCE_CANDIDATE.json'").length,2);run=run.replace("sf=stage+'/SOURCE_CANDIDATE.json'","sf=stage+'/SOURCE_CANDIDATE_V2.json'");fs.writeFileSync(recipe,run);
console.log(JSON.stringify({repairs:edits.length,pagingSeams:seams.length,changed:change.changed,added:change.added}));
