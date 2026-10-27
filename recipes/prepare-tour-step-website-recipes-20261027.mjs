import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-tour-step-integrated-website',pp=stage+'/PREPARATION.json',prep=json(pp),parent=json(prep.parent.path),native=json(prep.native.path);
const oldStage='F:/VisibleMedicine/staging/20261027-scene-study-website',op=json(oldStage+'/PREPARATION.json'),oldParent=json(op.parent.path),oldNative=json(op.native.path);
assert.equal(prep.parent.sha256,'ee690e83da8c3a42a8da1a8439b36a60a3f398393308c0224ca4864b8c6fccb7');
assert.equal(prep.native.sha256,'10ddf4f58a23f6eea111c09fb5ed4c132c96a46af1a4d5b6bdc72ae0caf797a4');
const proposal='F:/VisibleMedicine/staging/20261027-tour-step-coverage-proposal',old='F:/VisibleMedicine/staging/20261027-scene-study-coverage-proposal';
fs.mkdirSync(proposal+'/witness',{recursive:true});
for(const [p,n] of [['docs/anatomy-coverage/index.json','index.json.raw'],['lib/anatomy-coverage-view.ts','anatomy-coverage-view.ts.raw'],['scripts/check-anatomy-coverage.mjs','check-anatomy-coverage.mjs.raw']])fs.copyFileSync(prep.website+'/'+p,proposal+'/witness/'+n,fs.constants.COPYFILE_EXCL);
const names=['import-scene-study-website-stock','generate-scene-study-website-coverage','run-scene-study-coverage-seams','install-scene-study-website-coverage','build-scene-study-website-review','refresh-scene-study-website-delivery-pin','run-scene-study-website-integration','seal-scene-study-website-source'];
const pairs=[[oldStage,stage],[old,proposal],[op.parent.path,prep.parent.path],[oldParent.website,parent.website],[op.parent.sha256,prep.parent.sha256],[op.native.sha256,prep.native.sha256],[hash(oldStage+'/PREPARATION.json'),hash(pp)],[oldNative.head,native.head],[oldParent.atlasHead,parent.atlasHead],[oldNative.tree,native.tree],[oldParent.atlasTree,parent.atlasTree],[oldNative.atlas,native.atlas],['F:/VisibleMedicine/staging/20261027-scene-study-native','F:/VisibleMedicine/staging/20261027-tour-step-native'],['F:/VisibleMedicine/staging/20261027-scene-study-runtime-exports','F:/VisibleMedicine/staging/20261027-tour-step-runtime-exports'],[hash(old+'/witness/index.json.raw'),hash(proposal+'/witness/index.json.raw')],...names.map(n=>[n+'-20261027.mjs',n.replace('scene-study','tour-step')+'-20261027.mjs'])];
function swap(s,extra=[]){const rows=[...pairs,...extra].sort((a,b)=>b[0].length-a[0].length);for(let i=0;i<rows.length;i++)s=s.replaceAll(rows[i][0],'___TOUR_STEP_'+i+'___');for(let i=0;i<rows.length;i++)s=s.replaceAll('___TOUR_STEP_'+i+'___',rows[i][1]);return s;}
let helper=swap(fs.readFileSync(old+'/prepare-seams.mjs','utf8'));
const rowMap=new Map(parent.sourceRows.map(r=>[r.path,r.sha256])),section=helper.match(/const expectedWebsiteCode = \{[\s\S]*?\n\};/)[0];
helper=helper.replace(section,section.replace(/'([^']+)': '([a-f0-9]{64})'/g,(_m,p)=>{assert.equal(hash(prep.website+'/'+p),rowMap.get(p),p);return "'"+p+"': '"+rowMap.get(p)+"'";}));
fs.writeFileSync(proposal+'/prepare-seams.mjs',helper,{flag:'wx'});
const records=[];
for(const name of names){
 const from=name+'-20261027.mjs',to=name.replace('scene-study','tour-step')+'-20261027.mjs';
 let s=swap(fs.readFileSync(from,'utf8'),[[hash(old+'/prepare-seams.mjs'),hash(proposal+'/prepare-seams.mjs')]]);
 s=s.replaceAll("assert.deepEqual(added,['app/scene-study-fallback.tsx'])","assert.deepEqual(added,[])");
 s=s.replaceAll('oldManifest.files.length+1)','oldManifest.files.length)').replaceAll("json(parent.website+'/atlas-review/manifest.json').files.length+1)","json(parent.website+'/atlas-review/manifest.json').files.length)").replaceAll('oldInputs.inputs.length+1)','oldInputs.inputs.length)').replaceAll("[...oldInputs.inputs.map(r=>r.path),'atlas-review/app/scene-study-fallback.tsx'].sort()","oldInputs.inputs.map(r=>r.path).sort()");
 if(name.startsWith('seal-'))s=s.replace('const rows=[...paths]',"paths.add('tests/regional-tour-step-delivery.test.mjs');assert.equal(hash(site+'/tests/regional-tour-step-delivery.test.mjs'),json(stage+'/ADDITIONAL_TEST.json').sha256);\nconst rows=[...paths]");
 fs.writeFileSync(to,s,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});records.push({from,fromSha256:hash(from),to,toSha256:hash(to)});
}
const inputs=json(prep.website+'/docs/anatomy-coverage/index.json').evidence.sourceInputs,nativeRows=new Map(native.sourceRows.map(r=>[r.path,r.sha256]));assert.equal(Object.keys(inputs).length,171);assert.deepEqual(Object.entries(inputs).filter(([p,h])=>nativeRows.get(p)!==h),[]);
const test='F:/VisibleMedicine/staging/20261027-tour-step-integration-tests/regional-tour-step-delivery.test.mjs';fs.copyFileSync(test,prep.website+'/tests/regional-tour-step-delivery.test.mjs',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(stage+'/ADDITIONAL_TEST.json',JSON.stringify({path:'tests/regional-tour-step-delivery.test.mjs',source:test,sha256:hash(test)},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/STOCK_RECIPES.json',JSON.stringify({at:new Date().toISOString(),adaptations:records,coverageInputs:171,changedCoverageInputs:[],newImportedSourcePaths:[],helper:{path:proposal+'/prepare-seams.mjs',sha256:hash(proposal+'/prepare-seams.mjs')},historicalRecipesAndTestsUntouched:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:records.length,coverageInputsUnchanged:171,newImportedSourcePaths:0}));
