import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {assertToolbarCurrentDisplay} from './toolbar-current-source-role.mjs';

const stage='F:/VisibleMedicine/staging/20261024-toolbar-website';
const site=stage+'/website';
const old='F:/VisibleMedicine/staging/20261024-orbital-ct-website/website';
const source='b8ec59eeb0ec554b86d7ce01be992967e203b6a5';
const parent='80d323ec504afc7867e3e716bf735681a29ab5bc';
const tree='777e90bcf7448bf530ce381f401d71739b0019c5';
const oldTree='6bef533e9242fbd33d8393cf62082030bf6e1042';
const read=(root,path)=>readFileSync(root+'/'+path);
const json=(root,path)=>JSON.parse(read(root,path));
const sha=b=>createHash('sha256').update(b).digest('hex');
const prep=json(stage,'PREPARATION.json');
const oldReceipt=JSON.parse(readFileSync(prep.parentReceipt));
const require=createRequire(site+'/package.json');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');

async function actualButton(root){
 const result=await build({stdin:{contents:"export {Button,buttonVariants} from './components/ui/button';",
  resolveDir:root+'/atlas-review',loader:'tsx'},absWorkingDir:root,bundle:true,write:false,
  format:'cjs',platform:'node',jsx:'automatic',packages:'external'});
 const scope={exports:{}};
 runInNewContext(result.outputFiles[0].text,{module:scope,exports:scope.exports,require});
 return scope.exports;
}

test('actual imported Base UI Button adds only the variant attribute',async()=>{
 const now=await actualButton(site),before=await actualButton(old);
 for(const variant of ['default','outline','secondary','ghost','destructive','link']){
  const props={variant,size:'icon','aria-label':'Toggle labels','aria-pressed':variant==='secondary',
   disabled:false,type:'button',tabIndex:0};
  const child=React.createElement('svg',{'aria-hidden':true});
  const fresh=renderToStaticMarkup(React.createElement(now.Button,props,child));
  const original=renderToStaticMarkup(React.createElement(before.Button,props,child));
  assert(fresh.includes(`data-variant="${variant}"`));
  assert.equal(fresh.replace(` data-variant="${variant}"`,''),original,variant);
  assert.equal(now.buttonVariants(props),before.buttonVariants(props),variant);
 }
 for(const props of [{},{variant:null},{variant:'secondary',disabled:true,'aria-label':'Unavailable labels'},
  {variant:'ghost',type:'submit',name:'action',value:'reset',tabIndex:-1}]){
  const fresh=renderToStaticMarkup(React.createElement(now.Button,props,'Action'));
  const original=renderToStaticMarkup(React.createElement(before.Button,props,'Action'));
  assert.equal(fresh.replace(/ data-variant="[^"]+"/,''),original);
 }
});

const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4)
 .reduce((n,v,i)=>n+v*[0.2126,0.7152,0.0722][i],0);
const contrast=(a,b)=>{const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);
 return(values[0]+0.05)/(values[1]+0.05);};
const hex=s=>s.match(/../g).map(v=>Number.parseInt(v,16));
test('imported selected and hover CSS are exact scoped contrast seams',()=>{
 const css=read(site,'atlas-review/app/body-explorer.css').toString();
 const prior=read(old,'atlas-review/app/body-explorer.css').toString();
 const globals=read(site,'atlas-review/app/globals.css').toString();
 const selected=".body-toolbar button[data-variant='secondary'] {\n  background: var(--vm-teal);\n  color: var(--vm-midnight);\n}";
 const oldSelected=".body-toolbar button[data-variant='secondary'] {\n  background: #5b7851;\n}";
 const hover=".body-toolbar button[data-variant='ghost']:hover {\n  background: var(--vm-midnight);\n  color: var(--vm-ivory);\n}\n";
 assert.equal(css.split(selected).length,2);assert.equal(css.split(hover).length,2);
 assert.equal(css.replace(selected,oldSelected).replace(hover,''),prior);
 const color=name=>hex(globals.match(new RegExp(`--vm-${name}: #([a-f0-9]{6})`))[1]);
 assert(contrast(color('teal'),color('midnight'))>=4.5);
 assert(contrast(color('ivory'),color('midnight'))>=4.5);
});

test('imported Review retains model, lesson, tour, package and licence source bytes',()=>{
 const paths=['package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md',
  'atlas-review/content/regional-teaching/head-neck.json','atlas-review/lib/guided-playback.ts',
  'atlas-review/lib/regional-tours.ts','atlas-review/lib/hamstring-tours.ts',
  'atlas-review/lib/posterior-calf-tour.ts','atlas-review/lib/shoulder-tours.ts',
  'atlas-review/lib/body-review-context.ts','atlas-review/app/body-content.ts',
  'atlas-review/public/models/bodyparts3d/full-body/catalog.json'];
 for(const path of paths)assert.deepEqual(read(site,path),read(old,path),path);
 const previous=json(old,'lib/atlas-model-inventory.json');
 const current=json(site,'lib/atlas-model-inventory.json');
 assert.deepEqual(current.models,previous.models);assert.equal(current.models.length,137);
 assert.equal(current.schemaVersion,previous.schemaVersion);
 assert.equal(current.purpose,previous.purpose);
 assert.equal(current.learnerDelivery,previous.learnerDelivery);
 assert.deepEqual(current.sources.map(({sourceCommit,manifestSha256,...stable})=>stable),
  previous.sources.map(({sourceCommit,manifestSha256,...stable})=>stable));
 assert.equal(current.sources.length,4);
 for(const entry of current.sources){
  assert.equal(entry.sourceCommit,source);
  assert.equal(entry.manifestSha256,sha(read(site,`public/atlas-runtime/${entry.module}/manifest.json`)));
 }
 const manifest=json(site,'atlas-review/manifest.json');
 const binding=json(site,'atlas-review/integration-inputs.json');
 assert.equal(manifest.revision,source);assert.equal(binding.sourceCommit,source);
 assert.equal(binding.sha256,sha(JSON.stringify(binding.inputs)));
 assert.equal(manifest.websiteIntegrationSha256,binding.sha256);
});

test('nine shoulder geometry display stamps advance with fixed source and teaching',()=>{
 const previous=json(old,'atlas-review/content/review-revisions.json');
 const current=json(site,'atlas-review/content/review-revisions.json');
 const binding=json(site,'atlas-review/integration-inputs.json');
 assert.equal(current.websiteIntegrationSha256,binding.sha256);
 assert.notEqual(current.websiteIntegrationSha256,previous.websiteIntegrationSha256);
 assert.equal(current.modelHash,previous.modelHash);
 const native=json(stage,'atlas/content/review-revisions.json');
 assert.equal(native.modelHash,previous.modelHash);
 assert.deepEqual(current.sourceRevisions,native.revisions,
  'Imported source revisions are the actual freshly generated native stamps');
 const beforeDisplay=new Map(previous.display),afterDisplay=new Map(current.display);
 assert.deepEqual([...afterDisplay.keys()],[...beforeDisplay.keys()]);
 assert.deepEqual([...afterDisplay].filter(([path,digest])=>beforeDisplay.get(path)!==digest).map(([path])=>path),
  ['app/body-explorer.css']);
 assert.equal(afterDisplay.get('app/body-explorer.css'),sha(read(site,'atlas-review/app/body-explorer.css')));
 const ids=Object.keys(current.sourceRevisions);
 assert.equal(ids.length,9);assert.deepEqual(ids,Object.keys(previous.sourceRevisions));
 for(const id of ids){
  const tracks=current.sourceRevisions[id];
  assert.notEqual(tracks.geometry,previous.sourceRevisions[id].geometry);
  assert.equal(tracks.teaching,previous.sourceRevisions[id].teaching);
  assert.equal(tracks.imaging,null);
  for(const track of ['geometry','teaching']){
   assert.equal(current.revisions[id][track],sha(JSON.stringify({source:tracks[track],website:binding.sha256})));
   assert.notEqual(current.revisions[id][track],previous.revisions[id][track]);
  }
  assert.equal(current.revisions[id].imaging,null);
 }
});

test('old delivery theorem and adjacent source helper reconstruct byte for byte',()=>{
 assert.equal(sha(readFileSync(prep.parentReceipt)),prep.parentReceiptSha256);
 const oldTest=read(stage,'preimages/tests/current-atlas-delivery.test.mjs.raw');
 assert.equal(sha(oldTest),oldReceipt.sourceRows.find(r=>r.path==='tests/current-atlas-delivery.test.mjs').sha256);
 const currentTest=read(site,'tests/current-atlas-delivery.test.mjs').toString();
 const restored=currentTest.replaceAll(source,parent).replace(tree,oldTree);
 assert.equal(restored,oldTest.toString(),'Entire old test body survives exact source/tree seam');
 const oldHelper=read(stage,'preimages/tests/adjacent-current-tour-source-role.mjs.raw');
 assert.equal(sha(oldHelper),oldReceipt.sourceRows.find(r=>r.path==='tests/adjacent-current-tour-source-role.mjs').sha256);
 const now=read(site,'tests/adjacent-current-tour-source-role.mjs').toString();
 const addedImport="import {assertToolbarCurrentSource,assertToolbarCurrentDisplay} from './toolbar-current-source-role.mjs';\n";
 const branch=` if(sourceCommit==='${source}'){
  const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,sourceCommit);
  assertToolbarCurrentSource({atlasRoot,sourceCommit});
  assertToolbarCurrentDisplay({root:site,manifest:JSON.parse(readFileSync(site+'/atlas-review/manifest.json')),binding:JSON.parse(readFileSync(site+'/atlas-review/integration-inputs.json'))});
  return {sha256:'b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d',gitBlob:'3c5647f29383ba5699b6d387ff528f6b0f8f57b9',oldSha256:'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',oldGitBlob:'fb65a9c68d8753fc1789c7e6281e36c2889e0136'};
 }
`;
 assert.equal(now.split(addedImport).length,2);assert.equal(now.split(branch).length,2);
 assert.equal(now.replace(addedImport,'').replace(branch,''),oldHelper.toString(),
  'Entire 80d/b79/5e75 helper survives exact early dispatch');
});

test('old current pin and forged imported Button input refuse admission',()=>{
 const stale=json(old,'tests/fixtures/current-atlas-delivery.json');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:stale,root:site,read:p=>read(site,p)}));
 const manifest=json(site,'atlas-review/manifest.json');
 const binding=json(site,'atlas-review/integration-inputs.json');
 assertToolbarCurrentDisplay({root:site,manifest,binding,read:p=>read(site,p)});
 assert.throws(()=>assertToolbarCurrentDisplay({root:site,manifest,binding,
  read:p=>p==='atlas-review/components/ui/button.tsx'?Buffer.from('tampered'):read(site,p)}),
  /atlas-review\/components\/ui\/button.tsx/);
});
