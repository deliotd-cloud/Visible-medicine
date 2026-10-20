import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261020-shared-history-contexts/closed56';
const site='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const file='tests/closed57-original-tests.test.mjs',target=stage+'/files/'+file;
const names=['current-atlas-delivery-57-closed.test.mjs','current-atlas-delivery-56-to-57-closed.test.mjs','historical-head-toolbar-css-preservation-57-closed.test.mjs'];
for(const name of [file,...names.map(n=>'tests/'+n)]){
 const dest=stage+'/files/'+name;assert(!fs.existsSync(dest));
 fs.copyFileSync(site+'/'+name,dest,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(dest)),sha(read(site+'/'+name)));
}
fs.copyFileSync(site+'/'+file,stage+'/before/'+file,fs.constants.COPYFILE_EXCL);
const before=read(stage+'/before/tests/closed56-femoral-epoch.test.mjs').toString();
const after=read(stage+'/files/tests/closed56-femoral-epoch.test.mjs').toString();
const first=text=>text.slice(text.indexOf("test('closed56 femoral guards"),text.indexOf("test('closed56 documents"));
assert(first(before)&&first(after));
const edits=[
 ["import {revision56,readRevision56,validateCurrentAtlasDelivery as validateClosed56}","import {revision56,readRevision56,historicalAtlasGitRoot,validateCurrentAtlasDelivery as validateClosed56}"],
 [first(before),first(after)],
 [' assert.deepEqual(validateClosed56(),revision56);',' assert.deepEqual(validateClosed56(),revision56);\n assert(historicalAtlasGitRoot());'],
 [" assert.equal(pin.source,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');"," assert.equal(pin.source,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');"],
 [" assert.equal(pin.sourceTree,'83720d136f899876bd947323e6552c4d3e171210');"," assert.equal(pin.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');\n assert.notEqual(pin.source,revision56.source);"],
 [' assert(currentAtlasDeliveryRoot());',' assert(currentAtlasDeliveryRoot());\n assert.throws(()=>validateCurrentAtlasDelivery({pin:revision56}));'],
];
let reconstructed=before;
for(const [old,next] of edits){assert.equal(reconstructed.split(old).length,2);reconstructed=reconstructed.replace(old,next);}
assert.equal(reconstructed,after,'Every epoch-file change is explicitly accounted for');
for(const [old,next] of edits.toReversed()){assert.equal(reconstructed.split(next).length,2);reconstructed=reconstructed.replace(next,old);}
assert.equal(reconstructed,before,'Byte-exact full epoch inverse');
const loop="for(const [name,digest,candidate,edits] of cases)test(name+' preserves every old assertion and expected literal',()=>{";
const anchor=' assert.equal(readFileSync(new URL(\'./\'+candidate,import.meta.url),\'utf8\'),exact);';
const extra=" if(name==='closed56-femoral-epoch.test.mjs'){\n  const previous=exact;\n  for(const [before,after] of closed56CurrentEdits){assert.equal(exact.split(before).length,2,before);exact=exact.replace(before,after);}\n  let inverse=exact;\n  for(const [before,after] of closed56CurrentEdits.toReversed()){assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}\n  assert.equal(inverse,previous,'Complete epoch migration inverse');\n }\n";
const header='// Explicit later current-source seams; original closed57 fixtures stay immutable.\nconst closed56CurrentEdits='+JSON.stringify(edits,null,1)+';\n\n';
const patch='*** Begin Patch\n*** Update File: '+target+'\n@@\n-'+loop+'\n+'+(header+loop).split('\n').join('\n+')+'\n@@\n-'+anchor+'\n+'+(extra+anchor).split('\n').join('\n+')+'\n*** End Patch';
fs.writeFileSync(stage+'/COMPANION_PREPARATION.json',JSON.stringify({file,beforeSha256:sha(read(target)),epochBeforeSha256:sha(Buffer.from(before)),epochAfterSha256:sha(Buffer.from(after)),exactFullEpochInverse:true,explicitSeams:edits.length,scope:'Preserves all four original closed57 cases and raw fixture hashes; adds exact later epoch-source seams and reverse proof only.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({patch}));
