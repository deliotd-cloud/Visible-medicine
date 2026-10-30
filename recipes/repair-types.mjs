import fs from 'node:fs';import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';
const root='G:/VisibleMedicine-temp/staging/20261030-quick-review',site=root+'/website',atlas='G:/VisibleMedicine-temp/staging/20261029-mandible-combined-native/atlas';
assert.equal(execFileSync('git',['-C',atlas,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
assert(!fs.existsSync(root+'/atlas'));fs.symlinkSync(atlas,root+'/atlas','junction');
for(const p of ['tests/foot-comparison-stream-bounds.test.ts','tests/foot-comparison.test.ts']){
 const before=fs.readFileSync(site+'/'+p,'utf8');fs.writeFileSync(root+'/before/'+p,before,{flag:'wx'});let text=before;
 text=text.replaceAll("gzipSync(bytes).toString('base64')","Buffer.from(gzipSync(bytes)).toString('base64')").replaceAll("gzipSync(Buffer.from(bytes.toString()+'x')).toString('base64')","Buffer.from(gzipSync(Buffer.from(bytes.toString()+'x'))).toString('base64')");
 assert.notEqual(text,before);fs.writeFileSync(site+'/'+p,text);
}
fs.writeFileSync(root+'/TYPE_REPAIRS.json',JSON.stringify({at:new Date().toISOString(),atlasSibling:{path:root+'/atlas',target:atlas,head:'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3'},tests:'Explicit Buffer wrapper before base64 encoding; runtime bytes and all assertions retained',productChanges:false},null,2)+'\n',{flag:'wx'});
