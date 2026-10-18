import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const base='public/atlas-runtime/head-neck/';
const featureWebsite='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const featureSource='88cea927d48729769b96ad8fe680b0872b7e6687';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const websiteBytes=(path:string)=>execFileSync('git',['show',featureWebsite+':'+path],{maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const websiteJson=(path:string)=>JSON.parse(websiteBytes(path).toString());
const tray=(runtime:string)=>{
  assert.match(runtime,/===`tray`&&\w+&&\w+\.has\(\w+\).{0,150}"aria-label":\w+\?`Show full tray`:`Frame selected tray entry`/);
  assert.ok(runtime.includes('Show every entry in the tray'));
  assert.ok(runtime.includes('Zoom to the selected entry without hiding others'));
  assert.match(runtime,/onClick:\(\)=>\{\w+\(\w+=>!\w+\),\w+\(1\)\}/);
  assert.ok(runtime.includes('Selected entry framed · Others remain in the tray · Turn off Frame selection for the overview · Not anatomical positions'));
};

test('generated regional viewer exposes selected-entry Tray framing without widening access',()=>{
  const historicalManifestBytes=websiteBytes(base+'manifest.json');
  assert.equal(sha(historicalManifestBytes),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
  const historicalManifest=JSON.parse(historicalManifestBytes.toString());
  assert.equal(historicalManifest.sourceCommit,featureSource);
  const historicalInputs=websiteJson(base+'source-inputs.json') as {path:string;sha256:string}[];
  assert.equal(historicalInputs.find(input=>input.path==='app/body-explorer.tsx')?.sha256,
    '2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0');
  assert.equal(sha(execFileSync('git',['show',featureSource+':app/body-explorer.tsx'],{cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),historicalInputs.find(input=>input.path==='app/body-explorer.tsx')?.sha256);
  const historicalInventoryBytes=websiteBytes('lib/atlas-model-inventory.json');
  assert.equal(sha(historicalInventoryBytes),'b452f2b43d0183f76e20031885795ef034a3cabb856e2643d0e1c44ea839b1dc');
  const historicalInventory=JSON.parse(historicalInventoryBytes.toString());
  assert.deepEqual(historicalInventory.sources.find((source:{module:string})=>source.module==='head-neck'),{
    module:'head-neck',sourceCommit:historicalManifest.sourceCommit,manifestSha256:sha(historicalManifestBytes),modelPaths:136,
  });
  const historicalBundle=(historicalManifest.files as {path:string;sha256:string}[])
    .find(file=>file.path.startsWith('assets/index-')&&file.path.endsWith('.js'));
  assert.ok(historicalBundle,'historical regional viewer bundle');
  const historicalRuntime=websiteBytes(base+historicalBundle.path);
  assert.equal(sha(historicalRuntime),historicalBundle.sha256);
  tray(historicalRuntime.toString());

  const pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,CURRENT_ATLAS_REVISION);
  const currentAtlas=currentAtlasDeliveryRoot();
  const manifestBytes=readFileSync(base+'manifest.json');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,pin.source);
  for(const m of [historicalManifest,manifest])for(const flag of ['clinicalApproved','patientDataIncluded','imagingConnection','standaloneReviewConnection'])
    assert.equal(m[flag],false,flag);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  const bodyExplorer=inputs.find(input=>input.path==='app/body-explorer.tsx');
  assert.ok(bodyExplorer,'current body explorer input');
  const source=execFileSync('git',['show',pin.source+':app/body-explorer.tsx'],{cwd:currentAtlas,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(bodyExplorer.sha256,sha(source));
  const changedInputs=structuredClone(inputs);
  changedInputs.find(input=>input.path==='app/body-explorer.tsx')!.sha256='0'.repeat(64);
  assert.throws(()=>validateCurrentAtlasDelivery({pin,read:(path:string)=>path===base+'source-inputs.json'?Buffer.from(JSON.stringify(changedInputs)):readFileSync(path)}),/Current delivery changed: public\/atlas-runtime\/head-neck\/source-inputs.json/);
  const file=(manifest.files as {path:string;sha256:string}[])
    .find(file=>file.path.startsWith('assets/index-')&&file.path.endsWith('.js'));
  assert.ok(file,'regional viewer bundle');
  const bytes=readFileSync(base+file.path);
  assert.equal(sha(bytes),file.sha256);
  tray(bytes.toString());
  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(inventory.sources.find((item:{module:string})=>item.module==='head-neck'),{
    module:'head-neck',sourceCommit:pin.source,manifestSha256:sha(manifestBytes),modelPaths:136,
  });
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
