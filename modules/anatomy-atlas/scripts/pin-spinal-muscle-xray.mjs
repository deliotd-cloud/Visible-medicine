import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline='4e9f53851cdc55b89ca8bfc1b6d07e19445fc2ad';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const old=path=>execFileSync('git',['show',`${baseline}:${path}`],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const api=await exactSourceHistoryApi(baseline,'display-review');
const catalog=api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
// Explicit names/sides/ordered original components: no region/substring promotion.
const pairs=[
 ['trapeziusAscending','FMA33581','FMA33583','Ascending part of right trapezius','Ascending part of left trapezius','FJ1520','FJ1520M'],
 ['trapeziusDescending','FMA33586','FMA33587','Descending part of right trapezius','Descending part of left trapezius','FJ1521','FJ1521M'],
 ['trapeziusTransverse','FMA33584','FMA33585','Transverse part of right trapezius','Transverse part of left trapezius','FJ1554','FJ1554M'],
 ['iliocostalisCervicis','FMA22744','FMA22745','Right iliocostalis cervicis','Left iliocostalis cervicis','FJ1526','FJ1526M'],
 ['iliocostalisLumborum','FMA22740','FMA22741','Right iliocostalis lumborum','Left iliocostalis lumborum','FJ1527','FJ1527M'],
 ['iliocostalisThoracis','FMA22742','FMA22743','Right iliocostalis thoracis','Left iliocostalis thoracis','FJ1528','FJ1528M'],
 ['longissimusCapitis','FMA22754','FMA22756','Right longissimus capitis','Left longissimus capitis','FJ1533','FJ1533M'],
 ['longissimusCervicis','FMA22757','FMA22758','Right longissimus cervicis','Left longissimus cervicis','FJ1534','FJ1534M'],
 ['longissimusThoracis','FMA22751','FMA22753','Right longissimus thoracis','Left longissimus thoracis','FJ1535','FJ1535M'],
 ['semispinalisCapitis','FMA22876','FMA22877','Right semispinalis capitis','Left semispinalis capitis','FJ1538','FJ1538M'],
 ['semispinalisCervicis','FMA22874','FMA22875','Right semispinalis cervicis','Left semispinalis cervicis','FJ1539','FJ1539M'],
 ['semispinalisThoracis','FMA22872','FMA22873','Right semispinalis thoracis','Left semispinalis thoracis','FJ1540','FJ1540M'],
 ['spleniusCapitis','FMA22728','FMA22729','Right splenius capitis','Left splenius capitis','FJ1545','FJ1545M'],
 ['spleniusCervicis','FMA22726','FMA22727','Right splenius cervicis','Left splenius cervicis','FJ1546','FJ1546M'],
 ['serratusPosteriorInferior','FMA13405','FMA13406','Right serratus posterior inferior','Left serratus posterior inferior','FJ1541','FJ1541M'],
 ['serratusPosteriorSuperior','FMA13403','FMA13404','Right serratus posterior superior','Left serratus posterior superior','FJ1542','FJ1542M'],
 ['obliquusInferior','FMA32536','FMA32537','Right obliquus capitis inferior','Left obliquus capitis inferior','FJ1584','FJ1563'],
 ['obliquusSuperior','FMA32534','FMA32535','Right obliquus capitis superior','Left obliquus capitis superior','FJ1585','FJ1564'],
 ['rectusPosteriorMajor','FMA32530','FMA32531','Right rectus capitis posterior major','Left rectus capitis posterior major','FJ1589','FJ1567'],
 ['rectusPosteriorMinor','FMA32532','FMA32533','Right rectus capitis posterior minor','Left rectus capitis posterior minor','FJ1590','FJ1568'],
 ['interspinalisThoracis','FMA22890','FMA22891','Right interspinalis thoracis','Left interspinalis thoracis','FJ1551','FJ1551M'],
 ['cervicalRotator','FMA81752','FMA81753','Right cervical rotator','Left cervical rotator','FJ1524','FJ1524M'],
 ['lumbarRotator','FMA23089','FMA23090','Right lumbar rotator','Left lumbar rotator','FJ1522','FJ1522M'],
 ['levatoresCostarumBreves','FMA74077','FMA74078','Set of right levatores costarum breves','Set of left levatores costarum breves','FJ1462','FJ1462M'],
];
const specs=pairs.flatMap(([family,right,left,rightName,leftName,rightFile,leftFile])=>[
 [family,right,rightName,'right',[rightFile]],[family,left,leftName,'left',[leftFile]],
]).concat([
 ['interspinalesCervicis','FMA71309','Set of interspinales cervicis','midline',['FJ1552','FJ1552M']],
 ['interspinalesLumborum','FMA71307','Set of interspinales lumborum','midline',['FJ1550','FJ1550M']],
 ['thoracicRotator','FMA23083','Thoracic rotator','midline',['FJ1525','FJ1525M']],
 ['lumbarIntertransversariusLateral','FMA22850','Lateral lumbar intertransversarius','midline',['FJ1547','FJ1547M']],
 ['lumbarIntertransversariusMedial','FMA22851','Medial lumbar intertransversarius','midline',['FJ1548','FJ1548M']],
 ['cervicalIntertransversariiAnterior','FMA71442','Set of anterior cervical intertransversarii','midline',['FJ1549','FJ1549M']],
 ['cervicalIntertransversariiPosterior','FMA71443','Set of posterior cervical intertransversarii','midline',['FJ1553','FJ1553M']],
 ['spinalis','FMA77179','Spinalis','midline',['FJ1543','FJ1543M','FJ1544','FJ1544M']],
]);
assert.equal(specs.length,56);assert.equal(new Set(specs.map(s=>s[0])).size,32);
const entries=specs.map(([family,fmaId,name,laterality,files])=>{
 const rows=catalog.structures.filter(s=>s.fmaId===fmaId);assert.equal(rows.length,1);
 const identity=rows[0];assert.equal(identity.name,name);assert.equal(identity.laterality,laterality);
 assert.equal(identity.region,'spine');assert.equal(identity.category,'muscle');assert.equal(identity.system,'muscles');
 assert.deepEqual(identity.sources.map(s=>s.file),files);
 const previous=api.bodyLesson(identity,'xray');assert.equal(previous.readiness,'pending');
 return{family,identity,previous};
});
const bundles=catalog.bundles.filter(bundle=>entries.some(entry=>entry.identity.bundle===bundle.id));
for(const bundle of bundles){const path='public'+new URL(bundle.url,'https://local.invalid').pathname,bytes=readFileSync(path);assert.deepEqual(bytes,old(path));assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
const report={baseline,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries};
const output=JSON.stringify(report,null,2)+'\n',path='content/spinal-muscle-xray-pins.json';
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),output);else writeFileSync(path,output,{flag:'wx'});
console.log(JSON.stringify({baseline,entries:entries.length,families:new Set(entries.map(e=>e.family)).size,bundles:bundles.length,sourceGeometryChanged:false,clinicalApproval:false}));
