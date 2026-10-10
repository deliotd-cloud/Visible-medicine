import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,createReadStream,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {loadCurrentSourceHolds} from './current-source-holds.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const text=readFileSync('docs/open3dmodel-plexus-source-inventory.json','utf8').replaceAll('\r\n','\n');
assert.equal(sha(text),'2dfd9f51ffb03e54c14b90ff1f0338db866f7d03801312272ce7550f32bb123a');
const report=JSON.parse(text),state=await loadCurrentSourceHolds();
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(state.catalog);
const raw=process.argv.find(arg=>arg.startsWith('--raw-source='))?.slice('--raw-source='.length);
async function fileSha(path){const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);return hash.digest('hex');}

test('new original archive has exact model rights and stays outside learner delivery',async()=>{
 assert.equal(report.declaredModelLicense,'CC-BY-SA-4.0');assert.equal(report.licenseUri,'https://creativecommons.org/licenses/by-sa/4.0/');assert.equal(report.grantPage,'https://anatomytool.org/open3dmodel-create');
 assert.equal(report.zip.bytes,21336550);assert.equal(report.zip.sha256,'70855490e82fc8cde6a30da60a46c1dfa62f32f115d3d5c1dd6dc496124c466b');assert.deepEqual(report.zip.entries,['upper-limb.obj']);
 assert.equal(report.obj.bytes,106049758);assert.equal(report.obj.sha256,'5c06349599cdf88aea078f56ea244a5e65b4242ea0b7af361aaebe8fd05a4bf7');assert.equal(report.obj.objects,532);assert.deepEqual(report.obj.materialLibraries,[]);
 assert.equal(report.assetAdmitted,false);assert.equal(report.clinicalApproved,false);assert.equal(report.registered,false);assert.equal(report.mirrored,false);assert.equal(report.sourceToBodyTransform,null);assert.match(report.coordinateUnits,/not independently established/);
 assert.deepEqual(report.snapshots.map(row=>row.name),['create.html','about.html','credit.html']);for(const row of report.snapshots){assert(row.bytes>0);assert.match(row.sha256,/^[a-f0-9]{64}$/);}
 assert.equal(catalog.structures.length,1104);const hashes=new Set([report.obj.sha256,...report.neuralObjects.map(row=>row.sourceGeometrySha256)]);assert(!catalog.structures.some(item=>item.sources.some(source=>hashes.has(source.sha256))));
 if(raw){for(const [name,row]of [['upper-limb-obj.zip',report.zip],['upper-limb.obj',report.obj]]){assert.equal(statSync(raw+'/'+name).size,row.bytes);assert.equal(await fileSha(raw+'/'+name),row.sha256);}for(const row of report.snapshots){assert.equal(statSync(raw+'/'+row.name).size,row.bytes);assert.equal(await fileSha(raw+'/'+row.name),row.sha256);}assert.equal(await fileSha(raw+'/source-inventory.json'),report.fullOfflineInventorySha256);}
});

test('source identities retain grouped divisions, polygon and frame limitations',()=>{
 assert.equal(report.neuralObjects.length,50);assert.equal(new Set(report.neuralObjects.map(row=>row.name)).size,50);assert.equal(report.expectedCoreObjectNames.length,15);
 for(const name of report.expectedCoreObjectNames){const row=report.neuralObjects.find(row=>row.name===name);assert(row,name);assert.equal(row.originalSourceNamedRight,true);}
 const divisions=report.neuralObjects.filter(row=>/divisions_of_brachial_plexus/.test(row.name));assert.equal(divisions.length,2);
 const sizes={};for(const row of report.neuralObjects){assert(row.vertices>0&&row.faces>0);assert.equal(row.crossObjectReferences,0);assert.equal(row.triangulated,false);assert.equal(row.topologyChecked,false);assert.equal(row.originalSourceNamedRight,row.name.endsWith('.r'));assert.match(row.sourceGeometrySha256,/^[a-f0-9]{64}$/);assert.equal(row.min.length,3);assert.equal(row.max.length,3);assert(row.min.every((value,i)=>Number.isFinite(value)&&Number.isFinite(row.max[i])&&value<=row.max[i]));assert.equal(Object.values(row.faceSizes).reduce((sum,value)=>sum+value,0),row.faces);for(const[size,count]of Object.entries(row.faceSizes))sizes[size]=(sizes[size]??0)+count;}
 assert.deepEqual(sizes,{'3':3624,'4':96516,'12':1});assert(report.neuralObjects.some(row=>!row.originalSourceNamedRight),'Do not silently invent side suffixes');
});
