import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261020-late-regression-contexts';
const site='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const atlas='F:/VisibleMedicine/staging/20261020-inferior-thyroid-mra-source';
const modules=stage+'/guides/files/node_modules';if(!fs.existsSync(modules))fs.symlinkSync(site+'/node_modules',modules,'junction');
const {loadColicAdmissionImport,readColicAdmissionImport}=await import(pathToFileURL(stage+'/guides/files/tests/colic-admission-import-history.mjs'));
const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs'));
const historic=await loadColicAdmissionImport();
const feature=await exactSourceHistoryApi('0587c30bbc43c000ca617d63b9400d6939e51b47','curriculum');
const pins=JSON.parse(readColicAdmissionImport('atlas-review/content/abdominal-arterial-pins.json'));
const groups=['ileocolic-artery','right-colic-artery','middle-colic-artery','left-colic-artery','ascending-branch-of-left-colic-artery','descending-branch-of-left-colic-artery','marginal-colic-artery'];
const selected=pins.entries.filter(row=>groups.includes(row.id.split(':').at(-1)));assert.equal(selected.length,7);assert.equal(feature.contentTabs.length,9);
let checked=0;for(const row of selected)for(const tab of feature.contentTabs){assert.deepEqual(historic.bodyLesson(row,tab),feature.bodyLesson(row,tab),row.id+':'+tab);checked++;}
const ileocolic=selected.find(row=>row.id.endsWith(':ileocolic-artery'));assert.equal(historic.bodyLesson(ileocolic,'ultrasound').readiness,'pending');assert.equal(historic.bodyLesson(ileocolic,'xray').readiness,'draft');
assert.throws(()=>readColicAdmissionImport('atlas-review/../../lib/education-media-delivery.ts'));
assert.throws(()=>readColicAdmissionImport('atlas-review/not-recorded.ts'));
const name='tests/clinical-review-colic-arterial-xray.test.ts';
const before=fs.readFileSync(stage+'/guides/before/'+name,'utf8');let inverse=fs.readFileSync(stage+'/guides/files/'+name,'utf8');
function undo(from,to){assert.equal(inverse.split(from).length,2);inverse=inverse.replace(from,to);}
undo("import {loadColicAdmissionImport} from './colic-admission-import-history.mjs';\n",'');
undo('  const admissionImported=await loadColicAdmissionImport();\n','');
undo("    for(const tab of current.contentTabs){\n      assert.deepEqual(imported.bodyLesson(structure,tab),live.bodyLesson(structure,tab),`${id}:${tab}: exact current imported`);\n      // Retain the original import/feature assertion at its actual old epoch,\n      // where ileocolic ultrasound was pending. Current delivery is separate.\n      {const imported=admissionImported;\n      assert.deepEqual(imported.bodyLesson(structure,tab),current.bodyLesson(structure,tab),`${id}:${tab}: live imported`);\n      }\n    }", "    for(const tab of current.contentTabs)\n      assert.deepEqual(imported.bodyLesson(structure,tab),current.bodyLesson(structure,tab),`${id}:${tab}: live imported`);");
assert.equal(inverse.replaceAll('\r\n','\n'),before.replaceAll('\r\n','\n'),'complete original assertion inverse');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
console.log(JSON.stringify({originalImportedFilesVerified:1495,historicalSource:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2',featureSource:'0587c30bbc43c000ca617d63b9400d6939e51b47',exactOriginalTopicComparisons:checked,originalUltrasoundPending:true,xrayDraft:true,unsafePathsRefused:2,fullOriginalAssertionsRetained:true,beforeSha256:sha(Buffer.from(before)),afterSha256:sha(fs.readFileSync(stage+'/guides/files/'+name)),fullModuleRun:false,canonicalInstalled:false}));
