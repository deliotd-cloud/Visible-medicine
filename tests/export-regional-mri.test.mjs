import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {compileRegionalMriExport,writeRegionalMriExport} from '../scripts/export-regional-mri.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const stage=process.platform==='win32'?'F:/VisibleMedicine/staging/20261013-knee-private-export/test-fixtures':
  join(tmpdir(),'visible-medicine-regional-export-test-fixtures');
const affine=(di=[1,0,0],dj=[0,1,0],dk=[0,0,1],origin=[0,0,0])=>[
  [di[0],dj[0],dk[0],origin[0]],[di[1],dj[1],dk[1],origin[1]],[di[2],dj[2],dk[2],origin[2]],[0,0,0,1]];
const vector=value=>`(${value.join(',')})`;
function nrrd({type='uint8',sizes=[3,2,2],directions=[[1,0,0],[0,1,0],[0,0,1]],origin=[0,0,0],payload,encoding='raw',endian='little'}){
  const header=`NRRD0005\ntype: ${type}\ndimension: 3\nsizes: ${sizes.join(' ')}\nencoding: ${encoding}\nendian: ${endian}\nspace: right-anterior-superior\nspace directions: ${directions.map(vector).join(' ')}\nspace origin: ${vector(origin)}\nkinds: domain domain domain\n\n`;
  return Buffer.concat([Buffer.from(header),encoding==='gzip'?gzipSync(payload):Buffer.from(payload)]);
}
function imageBytes(){const values=[1,256,32769,65535,5,6,7,8,9,10,11,12];
  const big=Buffer.alloc(values.length*2),little=Buffer.alloc(values.length*2);
  values.forEach((value,i)=>{big.writeUInt16BE(value,i*2);little.writeUInt16LE(value,i*2);});return{big,little};}
function fixture(){
  const bytes=imageBytes(),nativeMask=Uint8Array.from([0,1,0,0,1,0,0,0,0,1,0,0]),derivedMask=Uint8Array.from([1,0,0,0,0,1,0,0]);
  const files=new Map([
    ['image.nrrd',nrrd({type:'uint16',payload:bytes.big,encoding:'gzip',endian:'big'})],
    ['native.nrrd',nrrd({payload:nativeMask})],
    ['derived.nrrd',nrrd({sizes:[2,2,2],directions:[[2,0,0],[0,2,0],[0,0,2]],payload:derivedMask})],
  ]);
  const spec=(path,array,shape_kji,matrix)=>({path,fileSha256:sha(files.get(path)),arraySha256:sha(array),shape_kji,ijk_to_ras:matrix});
  const baseReview={revision:'f'.repeat(64),scope:'Scope is limited to this source sequence and explicit partial coverage.'};
  const annotation=(id,label,status,geometry,coverage='partial')=>({id,anatomyId:`knee.${id}`,label,laterality:'left',coverage,
    review:{status,...baseReview},geometry});
  const plan={schema:'visible-medicine.regional-mri-export/1',region:'knee',laterality:'left',series:[{
    id:'knee-axial-t2',label:'Axial T2',image:spec('image.nrrd',bytes.little,[2,2,3],affine()),annotations:[
      annotation('native-meniscus','Meniscus accepted','accepted-scoped',{kind:'mask',...spec('native.nrrd',nativeMask,[2,2,3],affine()),gridKind:'source-native',mappingRevision:'a'.repeat(64)}),
      annotation('derived-ligament','Ligament provisional','provisional',{kind:'mask',...spec('derived.nrrd',derivedMask,[2,2,2],affine([2,0,0],[0,2,0],[0,0,2])),gridKind:'derived-source-ras',mappingRevision:'b'.repeat(64)}),
      annotation('point-focus','Point accepted','accepted-scoped',{kind:'points',points_ras_mm:[[1,1,0]]},'complete'),
      annotation('curve-markup','Curve accepted','accepted-scoped',{kind:'curve',points_ras_mm:[[0,0,0],[1,1,0]]}),
      annotation('deferred','Deferred anatomy','deferred',{kind:'none'},'not-assessed'),
    ],
  }]};
  return{plan,files,bytes,nativeMask,derivedMask,readSource:async path=>{assert(files.has(path),`unexpected source ${path}`);return files.get(path);}};
}
async function compile(item=fixture()){return compileRegionalMriExport(item.plan,{readSource:item.readSource});}
function target(){mkdirSync(stage,{recursive:true});return join(mkdtempSync(join(stage,'synthetic-')),'export');}
const write=(compiled,destination,privateRoot=stage)=>writeRegionalMriExport(compiled,destination,{privateRoot});

test('compiles exact endian-normalized native and derived assets without mutating source',async()=>{
  const item=fixture(),before=new Map([...item.files].map(([path,bytes])=>[path,Buffer.from(bytes)])),planBefore=structuredClone(item.plan);
  const compiled=await compile(item),series=compiled.manifest.series[0],annotations=series.annotations;
  assert.deepEqual(item.plan,planBefore);for(const[path,bytes]of item.files)assert.deepEqual(bytes,before.get(path));
  assert.equal(series.image.dtype,'uint16');assert.deepEqual(series.image.shape_kji,[2,2,3]);assert.deepEqual(series.image.ijk_to_ras,affine());
  assert.deepEqual([...compiled.assets.get(series.image.file)],[...item.bytes.little]);assert.equal(series.image.sha256,sha(item.bytes.little));
  assert.equal(annotations[0].geometry.gridKind,'source-native');assert.deepEqual(annotations[0].geometry.grid.ijk_to_ras,affine());
  assert.deepEqual([...compiled.assets.get(annotations[0].geometry.file)],[...item.nativeMask]);
  assert.equal(annotations[1].geometry.gridKind,'derived-source-ras');assert.deepEqual(annotations[1].geometry.grid.shape_kji,[2,2,2]);
  assert.deepEqual(annotations[1].geometry.grid.ijk_to_ras,affine([2,0,0],[0,2,0],[0,0,2]));
  assert.deepEqual([...compiled.assets.get(annotations[1].geometry.file)],[...item.derivedMask]);
  assert.equal(annotations[0].sourceImageSha256,series.image.sha256);
  for(const entry of annotations)assert.equal(entry.seriesId,series.id);
  assert.equal(annotations[1].review.status,'provisional');assert.equal(annotations[1].review.scope,item.plan.series[0].annotations[1].review.scope);
  assert.deepEqual(annotations[2].geometry,{kind:'points',points_ras_mm:[[1,1,0]]});
  assert.deepEqual(annotations[3].geometry,{kind:'curve',points_ras_mm:[[0,0,0],[1,1,0]]});
  assert.deepEqual(annotations[4].geometry,{kind:'none'});assert.equal(annotations[4].review.status,'deferred');
  assert.deepEqual(compiled.report.statusCounts,{'accepted-scoped':3,provisional:1,deferred:1});
  assert.equal(compiled.report.resampled,false);assert.equal(compiled.report.registration,'none');
  assert.equal(compiled.revision,sha(compiled.manifestBytes));
});

test('writes a new private folder with exact pinned manifest and asset bytes',async()=>{
  const compiled=await compile(),destination=target(),saved=write(compiled,destination);
  assert.equal(saved.revision,compiled.revision);assert.equal(saved.files,compiled.assets.size+1);
  assert.deepEqual(readFileSync(join(destination,'manifest.json')),compiled.manifestBytes);
  for(const[path,bytes]of compiled.assets)assert.deepEqual([...readFileSync(join(destination,path))],[...bytes]);
  assert.deepEqual(readdirSync(destination).sort(),['manifest.json','sequence-01']);
  assert.throws(()=>write(compiled,destination),/overwriting is forbidden/);
});

test('rejects unbound paths, plan fields, source hash and independently checked grid mismatch',async()=>{
  const item=fixture();item.plan.extra='invented';await assert.rejects(compile(item),/Unsupported export plan fields/);
  delete item.plan.extra;item.plan.series[0].image.fileSha256='0'.repeat(64);
  await assert.rejects(compile(item),/pinned source/);
  item.plan.series[0].image.fileSha256=sha(item.files.get('image.nrrd'));
  item.plan.series[0].image.ijk_to_ras[0][0]=1.1;
  await assert.rejects(compile(item),/Decoded source grid differs/);
  item.plan.series[0].image.ijk_to_ras[0][0]=1;
  item.plan.series[0].image.path='unknown.nrrd';
  await assert.rejects(compile(item),/unexpected source/);
});

test('rejects mismatched native mask grid, nonbinary mask and implicit label extraction',async()=>{
  const mismatch=fixture();mismatch.plan.series[0].annotations[0].geometry.gridKind='source-native';
  const moved=nrrd({payload:mismatch.nativeMask,origin:[.5,0,0]});mismatch.files.set('native.nrrd',moved);
  const movedGrid=mismatch.plan.series[0].annotations[0].geometry;
  movedGrid.fileSha256=sha(moved);movedGrid.ijk_to_ras=affine([1,0,0],[0,1,0],[0,0,1],[.5,0,0]);
  await assert.rejects(compile(mismatch),/Native mask and source image grid differ/);
  const nonbinary=fixture();const original=nonbinary.files.get('native.nrrd');
  const bad=Buffer.from(original);bad[bad.length-2]=2;nonbinary.files.set('native.nrrd',bad);
  const g=nonbinary.plan.series[0].annotations[0].geometry;g.fileSha256=sha(bad);g.arraySha256=sha(bad.subarray(bad.length-12));
  await assert.rejects(compile(nonbinary),/binary uint8; label extraction is not implicit/);
  const label=fixture();const labelBytes=Uint8Array.from([0,1,2,0,1,0,0,0,0,1,0,0]);
  label.files.set('native.nrrd',nrrd({payload:labelBytes}));const labelGeometry=label.plan.series[0].annotations[0].geometry;
  labelGeometry.fileSha256=sha(label.files.get('native.nrrd'));labelGeometry.arraySha256=sha(labelBytes);
  await assert.rejects(compile(label),/binary uint8; label extraction is not implicit/);
});

test('rejects 45-degree ambiguous native view before creating an output',async()=>{
  const item=fixture(),c=Math.SQRT1_2,directions=[[c,c,0],[-c,c,0],[0,0,1]];
  const image=nrrd({type:'uint16',payload:item.bytes.big,encoding:'gzip',endian:'big',directions});
  item.files.set('image.nrrd',image);
  const spec=item.plan.series[0].image;spec.fileSha256=sha(image);spec.ijk_to_ras=affine(...directions);
  const destination=target();
  await assert.rejects(compile(item),/too oblique|ambiguous/);
  assert.equal(existsSync(destination),false);
});

test('rejects overwrite, website destination and altered compiled asset bytes before output',async()=>{
  const compiled=await compile();
  const site=resolve(fileURLToPath(new URL('..',import.meta.url))),withinSite=join(site,'not-a-private-export');
  assert.throws(()=>write(compiled,withinSite),/outside the website checkout/);
  assert.throws(()=>write(compiled,'relative-export'),/new absolute private export directory/);
  const destination=target(),image=compiled.manifest.series[0].image.file;
  compiled.assets.get(image)[0]^=1;
  assert.throws(()=>write(compiled,destination),/Compiled asset changed/);
  assert.equal(existsSync(destination),false);
  const unsafe=await compile(),unsafeTarget=target(),first=unsafe.assets.keys().next().value;
  unsafe.assets.delete(first);unsafe.assets.set('../escape.raw',Uint8Array.from([1]));
  assert.throws(()=>write(unsafe,unsafeTarget),/Unsafe compiled asset/);
  assert.equal(existsSync(unsafeTarget),false);
});

test('rejects altered manifest object and omitted assets against pinned manifest bytes',async()=>{
  const compiled=await compile(),destination=target(),image=compiled.manifest.series[0].image.file;
  compiled.assets.get(image)[0]^=1;
  compiled.manifest.series[0].image.sha256=sha(compiled.assets.get(image));
  assert.throws(()=>write(compiled,destination),/integrity mismatch|Compiled asset changed/);
  assert.equal(existsSync(destination),false);
  const missing=await compile(),missingTarget=target();missing.assets.delete(missing.manifest.series[0].annotations[0].geometry.file);
  assert.throws(()=>write(missing,missingTarget),/integrity mismatch|missing/i);
  assert.equal(existsSync(missingTarget),false);
});

test('rejects an arbitrary lookalike result that never passed compiler validation',async()=>{
  const compiled=await compile(),forged={...compiled,assets:new Map(compiled.assets)},destination=target();
  assert.throws(()=>write(forged,destination),/owned verified compiler result/);
  assert.equal(existsSync(destination),false);
});

test('requires an explicit private root and refuses targets outside it before mkdir',async()=>{
  const compiled=await compile(),destination=target(),differentRoot=mkdtempSync(join(stage,'different-root-'));
  assert.throws(()=>writeRegionalMriExport(compiled,destination),/outside the explicitly approved private export root/);
  assert.throws(()=>write(compiled,destination,differentRoot),/outside the explicitly approved private export root/);
  assert.throws(()=>write(compiled,destination,'relative-root'),/outside the explicitly approved private export root/);
  assert.equal(existsSync(destination),false);
});

test('refuses any Git checkout even when its root is explicitly supplied',async()=>{
  const compiled=await compile();mkdirSync(stage,{recursive:true});
  const gitRoot=mkdtempSync(join(stage,'synthetic-git-'));mkdirSync(join(gitRoot,'.git'));
  const destination=join(gitRoot,'export');
  assert.throws(()=>write(compiled,destination,gitRoot),/inside a Git checkout/);
  assert.equal(existsSync(destination),false);
});
