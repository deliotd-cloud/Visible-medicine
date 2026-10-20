import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import esbuild from 'file:///F:/VisibleMedicine/staging/20261020-combined-website-ui/website/node_modules/esbuild/lib/main.js';
import {read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261020-late-regression-contexts';
const candidate='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const atlas='F:/VisibleMedicine/staging/20261020-inferior-thyroid-mra-source';
process.env.VM_ATLAS_SOURCE_REPO=atlas;
const {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}=await import(pathToFileURL(candidate+'/tests/current-atlas-delivery.mjs'));
const rows=[
 {group:'review',file:'tests/clinical-review-cervical-disc-tour.test.ts',before:'e5017957cb319b10e000dd9fb9a56a79e8e14089fd1bd0ffb4b58e445b1dbe12',after:'29685d95de9a1efbaa107b739aa2cb4ddb345ba780448c389afac602d29ea37f',remove:"import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n",from:'const atlas=currentAtlasDeliveryRoot();',to:"const atlas='F:/VisibleMedicine/atlas';"},
 {group:'review',file:'tests/clinical-review-coronary-sinus-xray.test.ts',before:'d57fb041284d07658aa0276c82c403c19805130eed09bae2c2d85307a7dcc5c1',after:'4be201ff8982d64de4e62c007da0dc797e5e819077b9fcb78be0b399988396f1',remove:"import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n",from:'const atlas=currentAtlasDeliveryRoot();',to:"const atlas='F:/VisibleMedicine/atlas';"},
 {group:'guides',file:'tests/clinical-review-continuous-guided-playback.test.ts',before:'e05405920ed158962392bf2ac1eb0e0cf0620adc2d5c48a510e1a2fbb0a9f312',after:'26cabf16c9c2166c0415efcf23e29612586ca29dec039ea0985a62bfd3b1003c',from:'const atlas=currentAtlasDeliveryRoot();',to:"const atlas='F:/VisibleMedicine/atlas';"},
 {group:'guides',file:'tests/atlas-thoracoabdominal-quiz-checks.mjs',before:'06352f5d29e34f612a626fa78c9295f2f923e5b9c596f34c904653f9e96e2a53',after:'0bb48b7d723c1d87262ccdf1eaa41e757c3d93f38c7fb1af8dce3bd6cc9ff6b7',from:'const atlasSource = currentAtlasDeliveryRoot();',to:"const atlasSource = 'F:/VisibleMedicine/atlas';"},
];
function once(text,from,to){assert.equal(text.split(from).length,2);return text.replace(from,to);}
for(const row of rows)test(row.file+': exact full-file inverse and syntax',()=>{
 const base=root+'/'+row.group,original=read(base+'/before/'+row.file),bytes=read(base+'/files/'+row.file);
 assert.equal(sha(original),row.before);assert.equal(sha(read(candidate+'/'+row.file)),row.before,'frozen target changed');assert.equal(sha(bytes),row.after);
 let inverse=bytes.toString();if(row.remove)inverse=once(inverse,row.remove,'');inverse=once(inverse,row.from,row.to);assert.deepEqual(Buffer.from(inverse),original);
 esbuild.transformSync(bytes.toString(),{loader:row.file.endsWith('.ts')?'ts':'js',format:'esm',target:'es2022'});
});
test('real current delivery requires exact87ed tree, Review and untouched source',()=>{
 const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');assert.equal(pin.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');assert.equal(pin.reviewIntegration,'b10311bfc3de1b628eb3d124d47c317ac4db2f7226e7ad1616e838d009af39d5');assert.equal(pin.reviewSourceFiles,1548);
 assert.equal(fs.realpathSync(currentAtlasDeliveryRoot()),fs.realpathSync(atlas));
 // This metadata reader does not inspect Git. Its caller separately checks
 // the actual tree; do not falsely claim a forged-tree check at this seam.
 for(const change of [{source:'f5097af8493701d64a8e2a2b5797df380f3b348a'},{reviewIntegration:'0'.repeat(64)},{reviewSourceFiles:1547}])assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,...change}}));
 const metadataOnly=validateCurrentAtlasDelivery({pin:{...pin,sourceTree:'0'.repeat(40)}});
 assert.equal(metadataOnly.sourceTree,'0'.repeat(40));
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),pin.sourceTree);
});
test('original and current quiz/source Git blobs exist in the exact repository',()=>{
 for(const [revision,file] of [['d6f25010210fd14aa2172605b78fa8cbc1875fb1','content/thoracoabdominal-organ-quiz-pins.json'],['87ed7e343260c7df48a40d53503f25bbfd34cfa5','content/thoracoabdominal-organ-quiz-pins.json'],['c978ecee3bdddfeaf2995ecbf62d5178e719c4fb','lib/guided-playback.ts'],['87ed7e343260c7df48a40d53503f25bbfd34cfa5','lib/guided-playback.ts']])assert.equal(runGit(['-C',atlas,'cat-file','-t',revision+':'+file]).toString().trim(),'blob');
});
test('wrong old repository is rejected rather than silently used as current',()=>{
 const previous=process.env.VM_ATLAS_SOURCE_REPO;process.env.VM_ATLAS_SOURCE_REPO='F:/VisibleMedicine/atlas';
 try{assert.throws(()=>currentAtlasDeliveryRoot(),/Atlas source revision changed/);}finally{process.env.VM_ATLAS_SOURCE_REPO=previous;}
});
