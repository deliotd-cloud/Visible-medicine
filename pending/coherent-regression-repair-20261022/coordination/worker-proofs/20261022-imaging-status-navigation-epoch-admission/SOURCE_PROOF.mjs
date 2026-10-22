// Pure byte/Git proof; never loads a website validator, test runner or transpiler.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {restoreImagingBodyBeforeLearningSelection} from './CODE/tests/imaging-status-body-source-inverse.mjs';
const site='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,'Unique full-source inverse');return s.replace(a,b);};
const names=['clinical-review-imaging-status.test.ts','historical-navigation-43-epoch.mjs'];
for(const name of names)assert.deepEqual(read('RAW/tests/'+name),readFileSync(site+'/tests/'+name),'Exact full frozen source');
let imaging=read('CODE/tests/'+names[0]).toString();
imaging=once(imaging,"import {restoreImagingBodyBeforeLearningSelection} from './imaging-status-body-source-inverse.mjs';\n",'');
imaging=once(imaging,
 " for(const path of ['app/imaging-link.tsx','app/imaging-comparison.tsx','app/body-explorer.tsx','lib/imaging-sync.ts','lib/imaging-comparison.ts','lib/anatomy-link-registry.ts']){\n  const current=source(revision,path),feature=source(featureRevision,path);\n  assert.deepEqual(path==='app/body-explorer.tsx'?restoreImagingBodyBeforeLearningSelection(current,feature):current,feature,path+': historical source held');\n }",
 " for(const path of ['app/imaging-link.tsx','app/imaging-comparison.tsx','app/body-explorer.tsx','lib/imaging-sync.ts','lib/imaging-comparison.ts','lib/anatomy-link-registry.ts'])\n  assert.deepEqual(source(revision,path),source(featureRevision,path),path+': historical source held');");
imaging=once(imaging,"  assert.equal(manifest.sourceCommit,base==='public/atlas-runtime/shoulder/'?pin.runtimeSources.shoulder:pin.source);",'  assert.equal(manifest.sourceCommit,revision);');
imaging=once(imaging," const currentBody=restoreImagingBodyBeforeLearningSelection(source(revision,'app/body-explorer.tsx'),source(featureRevision,'app/body-explorer.tsx')).toString().replace(/\\r\\n/g,'\\n');"," const currentBody=source(revision,'app/body-explorer.tsx').toString().replace(/\\r\\n/g,'\\n');");
assert.deepEqual(Buffer.from(imaging),read('RAW/tests/'+names[0]),'Whole imaging source inverse');
const beforeNav=read('RAW/tests/'+names[1]).toString(),currentNav=read('CODE/tests/'+names[1]).toString();
const start="const sourceUrl=pathToFileURL(path.join(root,'tests/current-atlas-delivery.mjs')).href;",end='\n\n/** Execute the exact original register43';
assert.equal(beforeNav.split(start).length,2);const from=beforeNav.indexOf(start),to=beforeNav.indexOf(end,from);assert(to>from);
const newer="assert.equal(sha(fs.readFileSync(new URL('./fixtures/closed56-validator/tests/current-atlas-delivery.mjs',import.meta.url))),\n 'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62','Exact frozen historical schema1 validator');\nexport function historicalNavigation43ValidateCurrentAtlasDelivery(options={}){\n const pin=options.pin??JSON.parse(readPath('tests/fixtures/current-atlas-delivery.json'));\n return validateHistoricalAtlasDelivery({...options,pin,read:options.read??readPath});\n}";
let restored=once(currentNav,"import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';\n",'');
restored=once(restored,newer,beforeNav.slice(from,to));assert.deepEqual(Buffer.from(restored),read('RAW/tests/'+names[1]),'Whole historical helper inverse');
assert.equal(sha(readFileSync(site+'/tests/fixtures/closed56-validator/tests/current-atlas-delivery.mjs')),'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62');
const atlas='F:/VisibleMedicine/atlas',currentRevision='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',featureRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const git=(revision,path)=>execFileSync('git',['--no-replace-objects','-C',atlas,'show',revision+':'+path],{windowsHide:true,maxBuffer:32e6});
const current=git(currentRevision,'app/body-explorer.tsx'),original=git(featureRevision,'app/body-explorer.tsx');
assert.deepEqual(restoreImagingBodyBeforeLearningSelection(current,original),original,'Actual pure adapter restores complete125142-byte feature source');
let refusals=0;
for(const [a,b] of [["from './atlas-learning-selection-channel';","from './forged-selection-channel';"],["exam || workspace.mode === 'practice'","false || workspace.mode === 'practice'"]]){
 assert(current.toString().includes(a));assert.throws(()=>restoreImagingBodyBeforeLearningSelection(Buffer.from(current.toString().replace(a,b)),original));refusals++;
}
assert.throws(()=>restoreImagingBodyBeforeLearningSelection(current,Buffer.concat([original,Buffer.from(' ')])));refusals++;
for(const path of ['app/imaging-link.tsx','app/imaging-comparison.tsx','lib/imaging-sync.ts','lib/imaging-comparison.ts','lib/anatomy-link-registry.ts'])assert.deepEqual(git(currentRevision,path),git(featureRevision,path),'Imaging source exactly unchanged: '+path);
const pin=JSON.parse(readFileSync(site+'/tests/fixtures/current-atlas-delivery.json'));
for(const [base,expected] of [['public/atlas-runtime/head-neck/',pin.runtimeSources['head-neck']],['public/atlas-runtime/shoulder/',pin.runtimeSources.shoulder],['public/atlas-review-viewer/',pin.source]])assert.equal(JSON.parse(readFileSync(site+'/'+base+'manifest.json')).sourceCommit,expected);
console.log(JSON.stringify({status:'PASS_SOURCE_ONLY',wholeOriginalInverses:2,actualAdapterPriorBytes:original.length,exactAddedChannelBytes:671,sourceMutationRefusals:refusals,strictCurrentValidatorUnchanged:true,historicalSchema1ValidatorExecuted:false,nativeTestsRun:false}));
