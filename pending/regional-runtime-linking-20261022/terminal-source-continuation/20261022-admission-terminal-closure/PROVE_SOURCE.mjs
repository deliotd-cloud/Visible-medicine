import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const stage='F:/VisibleMedicine/staging/20261022-admission-terminal-closure';
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const names=['radial-eus-current-transition.test.mjs','salpingopharyngeus-integration-register.test.mjs','ui-teaching-admission-contract.test.mjs'];
const sha=b=>createHash('sha256').update(b).digest('hex');
const replace=(text,a,b)=>{assert.equal(text.split(a).length,2,`Unique seam: ${a.slice(0,80)}`);return text.replace(a,b);};
function exactLineInverse(before,after,expected,name){
 const old=before.toString().match(/[^\n]*\n|[^\n]+$/g)??[];
 const code=after.toString().match(/[^\n]*\n|[^\n]+$/g)??[];
 const dp=Array.from({length:old.length+1},()=>new Uint16Array(code.length+1));
 for(let i=old.length-1;i>=0;i--)for(let j=code.length-1;j>=0;j--)
  dp[i][j]=old[i]===code[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
 const hunks=[];let i=0,j=0,recovered='',current=null;
 while(i<old.length||j<code.length){
  if(i<old.length&&j<code.length&&old[i]===code[j]){
   if(current){hunks.push(current);current=null;}
   recovered+=code[j];i++;j++;continue;
  }
  current??={removed:[],added:[],oldLine:i+1,newLine:j+1};
  if(i<old.length&&(j===code.length||dp[i+1][j]>=dp[i][j+1])){current.removed.push(old[i]);recovered+=old[i++];}
  else current.added.push(code[j++]);
 }
 if(current)hunks.push(current);
 assert.deepEqual(Buffer.from(recovered),before,`Full CODE to V5 inverse: ${name}`);
 assert.deepEqual(hunks.map(h=>[h.removed.length,h.added.length]),expected,`Only enumerated source seams: ${name}`);
 for(let n=0;n<hunks.length;n++){
  const mark=expectedMarks[name][n];
  assert(hunks[n].added.join('').includes(mark),`Named seam ${n+1}: ${name}`);
 }
 return hunks;
}
const expectedHunks={
 'radial-eus-current-transition.test.mjs':[[1,6],[1,50],[1,1],[1,1],[0,2],[1,1],[2,6]],
 'salpingopharyngeus-integration-register.test.mjs':[[0,1],[0,1],[1,5]],
 'ui-teaching-admission-contract.test.mjs':[[2,6],[0,2]],
};
const expectedMarks={
 'radial-eus-current-transition.test.mjs':['const prefix=','Exact reviewed clinical admission','prefix+source190','validateRevision52Delivery({pin:','const live=validateSiteCurrentAtlasDelivery()','current 6d7 source','const previous='],
 'salpingopharyngeus-integration-register.test.mjs':['import assert','import {validateCurrentAtlasDelivery}','historicalNavigation43ValidateCurrentAtlasDelivery();'],
 'ui-teaching-admission-contract.test.mjs':["assert.equal(live.source,'6d7a356",'6036a7a59dcc1fd75eee4a23af34ca2a568d86b6^{tree}'],
};
for(const name of names){
 const raw=readFileSync(join(stage,'RAW/tests',name));
 const baseline=readFileSync(join(website,'tests',name));
 assert.deepEqual(raw,baseline,`Full V5 original: ${name}`);
 const code=readFileSync(join(stage,'CODE/tests',name));
 assert.notEqual(sha(code),sha(raw),`Changed test: ${name}`);
 exactLineInverse(raw,code,expectedHunks[name],name);
}
const radial=readFileSync(join(stage,'CODE/tests',names[0]),'utf8');
const start=radial.indexOf("test('current attributes derive exactly");
const end=radial.indexOf("test('current52 preserves",start);
assert(start>=0&&end>start);
const sourceURL=pathToFileURL(join(website,'tests/radial-eus-current-transition.test.mjs')).href;
const body=radial.slice(start,end).replaceAll('import.meta.url',JSON.stringify(sourceURL));
const run=read=>new Function('test','assert','readFileSync','sha','read','replace','execFileSync',body)(
 (_,fn)=>fn(),assert,readFileSync,sha,read,replace,
 (command,args,opts)=>execFileSync(command,args,{...opts,cwd:website}));
run(path=>readFileSync(join(website,path)));
const policy=readFileSync(join(website,'.gitattributes'));
for(const [from,to] of [
 ['tests/atlas190-current-delivery.test.mjs text eol=lf','tests/atlas190-current-delivery.test.mjs -text'],
 ['tests/clinical-review-hepatic-venous-xray.test.ts text eol=lf','tests/clinical-review-hepatic-venous-xray.test.ts -text'],
 ['tests/plexus-presentation-rebind.test.mjs text eol=lf','tests/plexus-presentation-rebind.test.mjs -text'],
]){
 const changed=replace(policy.toString(),from,to);
 assert.throws(()=>run(path=>path==='.gitattributes'?Buffer.from(changed):readFileSync(join(website,path))),`Policy mutation refused: ${from}`);
}
const sal=readFileSync(join(stage,'CODE/tests',names[1]),'utf8');
assert(sal.includes('historicalNavigation43ValidateCurrentAtlasDelivery();'));
assert(sal.includes('validateCurrentAtlasDelivery({pin,read})'));
const ui=readFileSync(join(stage,'CODE/tests',names[2]),'utf8');
assert(ui.includes("assert.equal(live.reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99')"));
const {validateCurrentAtlasDelivery}=await import(pathToFileURL(join(website,'tests/current-atlas-delivery.mjs')).href);
const {readRevision52,validateRevision52Delivery}=await import(pathToFileURL(join(website,'tests/historical-native-head-history-delivery-52.mjs')).href);
const {readNative52}=await import(pathToFileURL(join(website,'tests/native-head-52-source.mjs')).href);
const oldPin=JSON.parse(readNative52('tests/fixtures/current-atlas-delivery.json'));
assert.deepEqual(readNative52('tests/fixtures/current-atlas-delivery.json'),readRevision52('tests/fixtures/current-atlas-delivery.json'));
assert.equal(validateRevision52Delivery({pin:oldPin}).source,'6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb');
const live=validateCurrentAtlasDelivery();
assert.equal(live.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(live.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');
assert.equal(live.reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');
assert.equal(live.reviewSourceFiles,1558);
assert.equal(live.runtimeSources['head-neck'],live.source);
for(const name of ['shoulder','lower-limb','female-pelvis'])assert.equal(live.runtimeSources[name],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
assert.throws(()=>validateCurrentAtlasDelivery({pin:oldPin}));
assert.throws(()=>validateCurrentAtlasDelivery({pin:{...live,runtimeSources:{...live.runtimeSources,shoulder:live.source}}}));
const atlas='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const git=(...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString().trim();
for(const [old,tree] of [['87ed7e343260c7df48a40d53503f25bbfd34cfa5','bfcfa898ace1d25083f21b681274c5bc816564d7'],['6036a7a59dcc1fd75eee4a23af34ca2a568d86b6','6da62962106cfab9419b09618547a9da5e3aafc6']]){
 assert.equal(git('rev-parse',old+'^{tree}'),tree);
 git('merge-base','--is-ancestor',old,live.source);
}
console.log(JSON.stringify({sourceOnly:true,rawV5Exact:3,fullCodeToV5Inverses:3,policyExactInverse:true,policyMutationRefusals:3,historicalSchema1AndCurrentSchema2:true,currentRuntimeRefusals:2,historicalAncestors:2,codeHashes:Object.fromEntries(names.map(name=>[name,sha(readFileSync(join(stage,'CODE/tests',name)))]))}));
