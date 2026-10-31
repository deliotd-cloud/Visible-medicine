import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {bodyChannelBaseline,bodyChannelExplorer} from './body-channel-source-epoch.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {restoreImagingBodyBeforeLearningSelection,verifyImagingBodySuccessor} from './imaging-status-body-source-inverse.mjs';

const featureRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const featureTree='1bd327fb20a52b35bec584675c457173c548e24b';
const revision=CURRENT_ATLAS_REVISION;
const previous='ec295ed9c1d28e4593a82a608b7d90071d6e43a7';
const learningRevision='0dfce15890cafc0a2b8e309193531daa29a672ed';
const atlas=process.env.VM_ATLAS_SOURCE_REPO ?? 'F:/VisibleMedicine/atlas';
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const source=(commit:string,path:string)=>execFileSync('git',['show',commit+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6});
// Shoulder has no reachable body-teaching chunk; inspect the actual entry graph.
function emittedCode(base:string,files:{path:string;sha256:string}[]) {
 const visited=new Set<string>(),code:string[]=[];
 const visit=(path:string)=>{
  if(visited.has(path))return;
  visited.add(path);
  const file=files.find(row=>row.path===path);
  assert(file,base+path+' in manifest');
  const bytes=readFileSync(base+path);
  assert.equal(sha(bytes),file.sha256,base+path);
  const text=bytes.toString();
  if(path.endsWith('.js'))code.push(text);
  for(const match of text.matchAll(/(?:assets\/|\.\/)([A-Za-z0-9_-]+\.js)/g))visit('assets/'+match[1]);
 };
 visit('index.html');
 return code.join('\n');
}

test('learner and Review distinguish the live Didanix adapter from website CT/MRI links',()=>{
 const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 assert.equal(pin.source,revision);
 assert.equal(sourceRoot.replaceAll('\\','/'),atlas.replaceAll('\\','/'));
 assert.equal(execFileSync('git',['rev-parse',featureRevision+'^{tree}'],{cwd:sourceRoot,encoding:'utf8'}).trim(),featureTree);
 assert.equal(execFileSync('git',['merge-base',learningRevision,revision],{cwd:sourceRoot,encoding:'utf8'}).trim(),learningRevision,
  'learning-selection source is an ancestor of current Atlas');
 const expectedBodyChanges=[
  '7181b153132b55a682ddbe6558f5dca181643bf0',
  '5c7346af577ae626c1ac06c0352f96bf84d36100',
  'bcb478b12a2739f6ab954de88eef9638d2a71fc7',
  '2bdab1455914ef50fe3cb32edc020abea2aaf743',
  'cf9b5091db90219981929f6a9cbfdf1056bac9d6',
  '5e75b9ce7e46fed291748108edd7565c97dee101',
  '39dbb747a44feb0f4bc83e757310c5e3d1b49580',
  'ea70b126efc1b9a4e9c9b576587f922650145e53',
 ];
 assert.deepEqual(execFileSync('git',['log','--format=%H',`${learningRevision}..${revision}`,'--','app/body-explorer.tsx'],
  {cwd:sourceRoot,encoding:'utf8'}).trim().split('\n'),expectedBodyChanges,
  'Only the eight authenticated successor commits changed BodyExplorer');
 const currentBodySource=source(revision,'app/body-explorer.tsx');
 const learningBodySource=source(learningRevision,'app/body-explorer.tsx');
 const reviewedPatch=readFileSync(new URL('./fixtures/imaging-body-learning-to-current.patch',import.meta.url));
 const actualPatch=execFileSync('git',['diff','--binary',learningRevision,revision,'--','app/body-explorer.tsx'],
  {cwd:sourceRoot,windowsHide:true,maxBuffer:2e6});
 const historicalBody=verifyImagingBodySuccessor(currentBodySource,learningBodySource,actualPatch,reviewedPatch);
 for(const path of ['app/imaging-link.tsx','app/imaging-comparison.tsx','app/body-explorer.tsx','lib/imaging-sync.ts','lib/imaging-comparison.ts','lib/anatomy-link-registry.ts']){
  const current=source(revision,path),feature=source(featureRevision,path);
  assert.deepEqual(path==='app/body-explorer.tsx'?restoreImagingBodyBeforeLearningSelection(historicalBody,feature):current,feature,path+': historical source held');
 }
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,revision);
 for(const path of ['app/imaging-link.tsx','app/imaging-comparison.tsx']){
  const row=review.files.find((f:{path:string})=>f.path===path);
  assert.equal(row.sourceSha256,sha(source(revision,path)));
  assert.equal(row.importedSha256,sha(readFileSync('atlas-review/'+path)));
 }
 for(const base of ['public/atlas-runtime/head-neck/','public/atlas-runtime/shoulder/','public/atlas-review-viewer/']){
  const manifest=json(base+'manifest.json');
  assert.equal(manifest.sourceCommit,base==='public/atlas-runtime/shoulder/'?pin.runtimeSources.shoulder:pin.source);
  const code=emittedCode(base,manifest.files);
  assert(code.includes('Didanix live link'),base);
  assert(code.includes('No live viewer'),base);
  assert(code.includes('Website CT/MRI anatomy comparisons use separate links.'),base);
  assert(code.includes('This status applies only to the live Didanix viewer connection.'),base);
 }
 // A presentation-only correction must not change consent, registration or selection.
 const hook=(commit:string)=>source(commit,'app/imaging-link.tsx').toString().replace(/\r\n/g,'\n').split('export function ImagingLink(')[0];
 assert.equal(hook(revision),hook(previous));
 for(const path of ['lib/imaging-sync.ts','lib/imaging-comparison.ts','lib/anatomy-link-registry.ts'])
  assert.deepEqual(source(revision,path),source(previous,path),path);
 // The original status-copy milestone preserved BodyExplorer byte-for-byte.
 // Later compact comparison only moves its existing header into a disclosure.
 const statusRevision='36dc97d2e54d2eb38053ad701380543624da9732';
 assert.deepEqual(source(statusRevision,'app/body-explorer.tsx'),source(previous,'app/body-explorer.tsx'));
 const oldBody=source(previous,'app/body-explorer.tsx').toString().replace(/\r\n/g,'\n');
 const currentBody=restoreImagingBodyBeforeLearningSelection(historicalBody,source(featureRevision,'app/body-explorer.tsx')).toString().replace(/\r\n/g,'\n');
 const newBody=source('4dee2178b4a3015e81fbdcf16a2f133193fac6af','app/body-explorer.tsx').toString().replace(/\r\n/g,'\n');
 assert.equal(newBody.split('<LazyBodyTeaching enabled={!exam}>').length,2);
 const precedingBody=newBody.replace('<LazyBodyTeaching enabled={!exam}>','<LazyBodyTeaching structure={selected} enabled={!exam}>');
 assert.equal(source(bodyChannelBaseline,'app/body-explorer.tsx').toString().replace(/\r\n/g,'\n'),precedingBody,
  'regional delivery adds only the complete current structure prop to BodyExplorer at the preceding source epoch');
 const uiBase=source('0f8944603ba440a4d859f95015e328394c089925','app/body-explorer.tsx').toString().replace(/\r\n/g,'\n');
 assert.equal(uiBase,bodyChannelExplorer(precedingBody),'Original channel epoch adds only the separately gated root-body channel');
 const selector=`                  <ExplodeStyleSelect
                    value={exam ? 'spatial' : layout}
                    disabled={exam || !available.length}
                    onChange={changeLayout}
                  />
`;
 const insertion=`                {layout === 'tray' && selectedId && enabledIds.has(selectedId) && (`;
 const advanced=`                <details className="body-advanced-view">
                  <summary>Advanced view</summary>
                  <div className="body-advanced-view-content">
                    <span>Separation layout</span>
                    <ExplodeStyleSelect
                      value={exam ? 'spatial' : layout}
                      disabled={exam || !available.length}
                      onChange={changeLayout}
                    />
                  </div>
                </details>
`;
 assert.equal(uiBase.split(selector).length,2);assert.equal(uiBase.split(insertion).length,2);
 assert.equal(currentBody,uiBase.replace(selector,'').replace(insertion,advanced+insertion),
  'Current UI only relocates the exact layout selector; consent, source routing, selection and every handler remain byte-exact');
 assert.equal(newBody.slice(newBody.indexOf('  const profile ='),newBody.indexOf('  const headerContent =')),oldBody.slice(oldBody.indexOf('  const profile ='),oldBody.indexOf('  return (\n    <AtlasWorkspace')));
 assert.equal(newBody.split('      </header>\n')[1],oldBody.split('      </header>\n')[1]);
 const headerBlock=oldBody.split('<header className="body-topbar"')[1];
 const oldHeader=headerBlock.slice(headerBlock.indexOf('\n')+1).split('      </header>')[0];
 const movedHeader=newBody.split('  const headerContent = <>\n')[1].split('  </>;')[0];
 assert.equal(movedHeader.replace(/\s/g,''),oldHeader.replace(/\s/g,''),'moving header preserves every existing control and handler');
});


test('current imaging status binding refuses forged source, Review and learner metadata',()=>{
 currentAtlasDeliveryRoot();
 const path='app/imaging-link.tsx',committed=source(revision,path);
 const review=json('atlas-review/manifest.json'),inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 const imported=readFileSync('atlas-review/'+path);
 const verify=(manifest:any,learnerInputs:any,bytes:Uint8Array=imported)=>{
  const row=manifest.files.find((file:{path:string})=>file.path===path);assert(row);
  assert.equal(row.sourceSha256,sha(committed),'committed source');
  assert.equal(row.importedSha256,sha(bytes),'Review import');
  assert.deepEqual(learnerInputs.filter((file:{path:string})=>file.path===path),
   [{path,sha256:sha(committed)}],'head-neck source input');
 };
 verify(review,inputs);
 const forgedSource=structuredClone(review);forgedSource.files.find((file:{path:string})=>file.path===path).sourceSha256='0'.repeat(64);
 assert.throws(()=>verify(forgedSource,inputs),/committed source/);
 const forgedImport=structuredClone(review);forgedImport.files.find((file:{path:string})=>file.path===path).importedSha256='0'.repeat(64);
 assert.throws(()=>verify(forgedImport,inputs),/Review import/);
 const changed=Buffer.from(imported);changed[0]^=1;assert.throws(()=>verify(review,inputs,changed),/Review import/);
 const forgedInput=structuredClone(inputs);forgedInput.find((file:{path:string})=>file.path===path).sha256='0'.repeat(64);
 assert.throws(()=>verify(review,forgedInput),/head-neck source input/);
});
