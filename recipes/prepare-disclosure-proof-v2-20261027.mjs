import fs from'node:fs';import assert from'node:assert/strict';import{hash,json}from'./bounded-source-hash-20261026.mjs';import{execFileSync}from'node:child_process';
let recipe=fs.readFileSync('prepare-disclosure-proof-repair-20261027.mjs','utf8');const once=(a,b)=>{assert.equal(recipe.split(a).length,2,a);recipe=recipe.replace(a,b);};
recipe=recipe.replaceAll('20261027-disclosure-proof-proposal','20261027-disclosure-proof-proposal-v2').replaceAll("stage:'F:/VisibleMedicine/staging/20261027-disclosure-proof-repair'","stage:'F:/VisibleMedicine/staging/20261027-disclosure-proof-repair-v2'");
once("let source=fs.readFileSync", "const edits=[];let source=fs.readFileSync");once("source=source.replace(a,b);};","source=source.replace(a,b);edits.push([a,b]);};");
once("source=source.slice(0,testStart)+source.slice(testStart).replaceAll('restoreNativeDisclosureConsumer(','restoreCurrentConsumer(');","const beforeTail=source.slice(testStart),afterTail=beforeTail.replaceAll('restoreNativeDisclosureConsumer(','restoreCurrentConsumer(');change(beforeTail,afterTail);");
once('source+=`','const extraTests=`');once("fs.writeFileSync(dir+'/'+file,source,{flag:'wx'});", "change(afterTail,afterTail+extraTests);fs.writeFileSync(dir+'/EDITS.json',JSON.stringify(edits,null,2)+'\\n',{flag:'wx'});fs.writeFileSync(dir+'/'+file,source,{flag:'wx'});");
fs.writeFileSync('prepare-disclosure-proof-v2-source-20261027.mjs',recipe,{flag:'wx'});execFileSync(process.execPath,['prepare-disclosure-proof-v2-source-20261027.mjs'],{stdio:'inherit',windowsHide:true});
const dir='F:/VisibleMedicine/staging/20261027-disclosure-proof-proposal-v2',config=json(dir+'/SUCCESSOR_CONFIG.json'),p=json(config.parent.path),patch=json(dir+'/PATCHSET.json'),file='tests/native-disclosure.test.mjs',fixture='tests/fixtures/native-disclosure-workspace-proof-transition.json',studio='tests/studio-route-disclosure.test.mjs';assert.equal(hash(dir+'/'+file),'9ae14bf7fc9c77f8b0ba66ec6da2483c57b2c8f22d0c2d36facfbe6ead5b5064');
const contract={schema:'vm-native-disclosure-workspace-proof/1',path:file,beforeSha256:hash(p.website+'/'+file),afterSha256:hash(dir+'/'+file),edits:json(dir+'/EDITS.json')};
fs.mkdirSync(dir+'/tests/fixtures',{recursive:true});fs.writeFileSync(dir+'/'+fixture,JSON.stringify(contract,null,2)+'\n',{flag:'wx'});
let t=fs.readFileSync(p.website+'/'+studio,'utf8').replaceAll('\r\n','\n');const marker=" let original=read('native-disclosure.test.mjs');";assert.equal(t.split(marker).length,2);t=t.replace(marker," let original=restoreWorkspaceDisclosureProof(read('native-disclosure.test.mjs'));" );
t+=`\n// Authenticate the complete added outer proof before running the unchanged
// Studio-era historical assertions. Current disclosure behaviour runs separately.
function restoreWorkspaceDisclosureProof(bytes){
 const raw=readFileSync(new URL('./fixtures/native-disclosure-workspace-proof-transition.json',import.meta.url));
 assert.equal(sha(raw),'${hash(dir+'/'+fixture)}','Exact Workspace disclosure-proof transition');
 const role=JSON.parse(raw);assert.equal(role.schema,'vm-native-disclosure-workspace-proof/1');assert.equal(role.path,'tests/native-disclosure.test.mjs');assert.equal(sha(bytes),role.afterSha256,'Exact current test source');
 let text=bytes.toString();for(const[from,to]of role.edits.toReversed()){assert.equal(text.split(to).length,2,'One exact inverse seam');text=text.replace(to,from);}
 assert.equal(sha(text),role.beforeSha256,'Entire prior native disclosure test retained');return text;
}
test('the outer Workspace proof rejects foreign or mixed test source',()=>{
 const source=readFileSync(new URL('./native-disclosure.test.mjs',import.meta.url),'utf8');
 assert.throws(()=>restoreWorkspaceDisclosureProof(source+'\\n'));
 assert.throws(()=>restoreWorkspaceDisclosureProof(source.replace('assert.equal(bytes.toString(),r.after)','assert.ok(true)')));
});\n`;
fs.writeFileSync(dir+'/'+studio,t,{flag:'wx'});for(const f of [fixture,studio])patch.installableFiles.push({path:f,beforeSha256:fs.existsSync(p.website+'/'+f)?hash(p.website+'/'+f):null,afterSha256:hash(dir+'/'+f)});
fs.writeFileSync(dir+'/PATCHSET_COMPLETE.json',JSON.stringify(patch,null,2)+'\n',{flag:'wx'});config.patchset={path:dir+'/PATCHSET_COMPLETE.json',sha256:hash(dir+'/PATCHSET_COMPLETE.json')};config.allowedPaths=patch.installableFiles.map(r=>r.path);config.reason+=' Preserve the exact preceding Studio historical proof through an authenticated reversible test-only transition.';fs.writeFileSync(dir+'/SUCCESSOR_COMPLETE.json',JSON.stringify(config,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({files:config.allowedPaths,fixture:hash(dir+'/'+fixture)}));
