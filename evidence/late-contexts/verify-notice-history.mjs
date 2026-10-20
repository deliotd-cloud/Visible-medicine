import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import esbuild from 'file:///F:/VisibleMedicine/staging/20261020-combined-website-ui/website/node_modules/esbuild/lib/main.js';
const stage='F:/VisibleMedicine/staging/20261020-late-regression-contexts',site='F:/VisibleMedicine/staging/20261020-combined-website-ui/website',atlas='F:/VisibleMedicine/staging/20261020-inferior-thyroid-mra-source';
const sha=b=>createHash('sha256').update(b).digest('hex');
const {readNoticeHistoricalImport}=await import(pathToFileURL(stage+'/review/files/tests/review-change-import-history.mjs'));
const old=file=>JSON.parse(readNoticeHistoricalImport(file));
const historical=old('atlas-review/manifest.json'),inputs=old('atlas-review/integration-inputs.json'),viewer=old('public/atlas-review-viewer/manifest.json');
const previous=JSON.parse(fs.readFileSync('F:/VisibleMedicine/recovery/checkpoints/20261014-nested-duct-website/website-current-source/source/atlas-review/manifest.json'));
assert.equal(historical.files.length,1499);assert.equal(previous.files.length,1444);
assert.equal(historical.files.filter(row=>!previous.files.some(old=>old.path===row.path)).length,55);
assert.equal(inputs.sourceCommit,historical.revision);assert.equal(viewer.sourceCommit,historical.revision);assert.equal(historical.websiteIntegrationSha256,inputs.sha256);assert.equal(viewer.websiteIntegrationSha256,inputs.sha256);assert.equal(sha(JSON.stringify(inputs.inputs)),inputs.sha256);assert.equal(viewer.personalRecordsIncluded,false);
const git=(rev,file)=>execFileSync('git',['--no-replace-objects','-C',atlas,'show',rev+':'+file],{windowsHide:true,maxBuffer:16e6});
const paths=['app/review/review-change-notice.css','app/review/review-change-notice.tsx','lib/review-change-summary.ts','app/review/body/body-decision-editor.tsx','app/review/nested/workspace.tsx','app/review/specimens/workspace.tsx'];
process.env.VM_ATLAS_SOURCE_REPO=atlas;
const {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot}=await import(pathToFileURL(site+'/tests/current-atlas-delivery.mjs'));const pin=validateCurrentAtlasDelivery();currentAtlasDeliveryRoot();
const current=JSON.parse(fs.readFileSync(site+'/atlas-review/manifest.json'));assert.equal(current.files.length,1548);assert.equal(current.files.length,pin.reviewSourceFiles);
for(const file of paths){const prior=historical.files.find(row=>row.path===file),now=current.files.find(row=>row.path===file);assert(prior&&now);assert.equal(prior.sourceSha256,sha(git(historical.revision,file)));assert.equal(prior.importedSha256,sha(readNoticeHistoricalImport('atlas-review/'+file)));assert.equal(now.sourceSha256,sha(git(pin.source,file)));assert.equal(now.importedSha256,sha(fs.readFileSync(site+'/atlas-review/'+file)));}
for(const file of ['atlas-review/../lib/repository.ts','atlas-review/missing.ts','public/models/scan.dcm'])assert.throws(()=>readNoticeHistoricalImport(file));
const name='tests/clinical-review-change-notice.test.ts';const before=fs.readFileSync(stage+'/review/before/'+name,'utf8').replaceAll('\r\n','\n');let inverse=fs.readFileSync(stage+'/review/files/'+name,'utf8').replaceAll('\r\n','\n');
const removeStart=inverse.indexOf('    // Retain the complete original 1499/55 import proof');const originalStart=inverse.indexOf("    const liveManifest = json('atlas-review/manifest.json');",removeStart);assert(removeStart>0&&originalStart>removeStart);inverse=inverse.slice(0,removeStart)+inverse.slice(originalStart);
const newStart=inverse.indexOf('    }\n    const pin = validateCurrentAtlasDelivery();');const newEnd=inverse.indexOf('\n  });',newStart);assert(newStart>0&&newEnd>newStart);inverse=inverse.slice(0,newStart)+inverse.slice(newEnd+1);
function undo(from,to){assert.equal(inverse.split(from).length,2);inverse=inverse.replace(from,to);}
undo("import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",'');undo("import {readNoticeHistoricalImport} from './review-change-import-history.mjs';\n",'');undo('const atlas = currentAtlasDeliveryRoot();',"const atlas = 'F:/VisibleMedicine/atlas';");undo('const currentRevision = CURRENT_ATLAS_REVISION;',"const currentRevision = '408759d57644b05402e98a937e7cf6338b5509cf';");assert.equal(sha(inverse),sha(before),'every original assertion retained in complete normalized source inverse');
esbuild.transformSync(fs.readFileSync(stage+'/review/files/'+name,'utf8'),{loader:'ts',format:'esm'});
console.log(JSON.stringify({historicalRevision:historical.revision,historicalFiles:1499,historicalAdded:55,currentRevision:pin.source,currentFiles:1548,sourceImportPairsChecked:12,unsafePathsRefused:3,originalAssertionsRetained:true,typescriptSyntax:true,fullModuleRun:false,canonicalInstalled:false}));
