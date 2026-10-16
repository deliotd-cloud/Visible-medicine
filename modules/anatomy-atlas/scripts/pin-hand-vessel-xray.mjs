import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline='8d32653eaac8b86521618c824214dd6af8e35e29';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const old=path=>execFileSync('git',['show',`${baseline}:${path}`],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const api=await exactSourceHistoryApi(baseline,'display-review');
const catalog=api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
// Explicit identities and ordered archived components, never name-only matching.
const specs=[
 ['metacarpalArtery','FMA22864','Right palmar metacarpal artery','right',['FJ2289']],
 ['metacarpalArtery','FMA22865','Left palmar metacarpal artery','left',['FJ2237']],
 ['radialis','FMA22777','Right arteria radialis indicis','right',['FJ2342','FJ2363']],
 ['radialis','FMA22778','Left arteria radialis indicis','left',['FJ2314','FJ2332']],
 ['commonFirst','FMA22856','Right first common palmar digital artery','right',['FJ2343']],
 ['commonFirst','FMA85118','Left first common palmar digital artery','left',['FJ2315']],
 ['commonSecond','FMA85119','Right second common palmar digital artery','right',['FJ2344']],
 ['commonSecond','FMA85120','Left second common palmar digital artery','left',['FJ2316']],
 ['commonThird','FMA85121','Right third common palmar digital artery','right',['FJ2345']],
 ['commonThird','FMA85122','Left third common palmar digital artery','left',['FJ2317']],
 ['commonFourth','FMA85123','Right fourth common palmar digital artery','right',['FJ2370']],
 ['commonFourth','FMA85124','Left fourth common palmar digital artery','left',['FJ2337']],
 ['properMiddleLateral','FMA22858','Lateral proper palmar digital artery of right middle finger','right',['FJ2365']],
 ['properMiddleLateral','FMA22860','Lateral proper palmar digital artery of left middle finger','left',['FJ2334']],
 ['properIndexMedial','FMA23050','Medial proper palmar digital artery of right index finger','right',['FJ2364']],
 ['properIndexMedial','FMA23051','Medial proper palmar digital artery of left index finger','left',['FJ2333']],
 ['properRingMedial','FMA23052','Medial proper palmar digital artery of right ring finger','right',['FJ2369']],
 ['properLittleLateral','FMA23054','Lateral proper palmar digital artery of right little finger','right',['FJ2368']],
 ['properLittleLateral','FMA23055','Lateral proper palmar digital artery of left little finger','left',['FJ2336']],
 ['properMiddleMedial','FMA85112','Medial proper palmar digital artery of right middle finger','right',['FJ2367']],
 ['properRingLateral','FMA85115','Lateral proper palmar digital artery of right ring finger','right',['FJ2366']],
 ['properRingLateral','FMA85116','Lateral proper palmar digital artery of left ring finger','left',['FJ2335']],
 ['deepVenousArch','FMA22912','Right deep palmar venous arch','right',['FJ2281']],
 ['deepVenousArch','FMA22913','Left deep palmar venous arch','left',['FJ2229']],
 ['superficialVenousArch','FMA22915','Right superficial palmar venous arch','right',['FJ2301']],
 ['superficialVenousArch','FMA22916','Left superficial palmar venous arch','left',['FJ2249']],
 ['dorsalNetwork','FMA62506','Dorsal venous network of right hand','right',['FJ2280']],
 ['dorsalNetwork','FMA62507','Dorsal venous network of left hand','left',['FJ2228']],
 ['metacarpalVein','FMA22920','Right palmar metacarpal vein','right',['FJ2290','FJ2350','FJ2353']],
 ['metacarpalVein','FMA22921','Left palmar metacarpal vein','left',['FJ2238','FJ2320','FJ2323']],
 ['indexVein','FMA85096','Proper palmar digital vein of right index finger','right',['FJ2354','FJ2355']],
 ['indexVein','FMA85097','Proper palmar digital vein of left index finger','left',['FJ2324','FJ2325']],
 ['middleVein','FMA85098','Proper palmar digital vein of right middle finger','right',['FJ2356','FJ2357']],
 ['middleVein','FMA85099','Proper palmar digital vein of left middle finger','left',['FJ2326','FJ2340']],
 ['ringVein','FMA85100','Proper palmar digital vein of right ring finger','right',['FJ2358','FJ2359']],
 ['ringVein','FMA85101','Proper palmar digital vein of left ring finger','left',['FJ2327','FJ2328']],
];
assert.equal(specs.length,36);assert.equal(new Set(specs.map(s=>s[0])).size,19);
const entries=specs.map(([family,fmaId,name,laterality,files])=>{
 const rows=catalog.structures.filter(s=>s.fmaId===fmaId);assert.equal(rows.length,1);
 const identity=rows[0];assert.equal(identity.name,name);assert.equal(identity.laterality,laterality);
 assert.equal(identity.region,'hand');assert.equal(identity.category,'vessel');assert.equal(identity.system,'vessels');
 assert.deepEqual(identity.sources.map(s=>s.file),files);
 const previous=api.bodyLesson(identity,'xray');assert.equal(previous.readiness,'pending');
 return{family,identity,previous};
});
const bundles=catalog.bundles.filter(bundle=>entries.some(entry=>entry.identity.bundle===bundle.id));
for(const bundle of bundles){const path='public'+new URL(bundle.url,'https://local.invalid').pathname,bytes=readFileSync(path);assert.deepEqual(bytes,old(path));assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
const report={baseline,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries};
const output=JSON.stringify(report,null,2)+'\n',path='content/hand-vessel-xray-pins.json';
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),output);else writeFileSync(path,output,{flag:'wx'});
console.log(JSON.stringify({baseline,entries:36,families:19,bundles:bundles.length,sourceGeometryChanged:false,clinicalApproval:false}));
