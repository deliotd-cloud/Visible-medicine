import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,lstatSync,realpathSync} from 'node:fs';
import {isAbsolute,resolve,relative,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {decodeScalarNrrd} from './regional-nrrd.mjs';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation} from '../lib/regional-mri-package.ts';

const HASH=/^[a-f0-9]{64}$/;
const compiledExports=new WeakMap();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=message=>{throw new Error(message);};
const buffer=bytes=>Uint8Array.from(bytes).buffer;
function exact(value,fields,name){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==fields.length||fields.some(k=>!Object.hasOwn(value,k)))fail(`Unsupported ${name} fields.`);
}
function hash(value){if(typeof value!=='string'||!HASH.test(value))fail('Missing independently pinned source hash.');}
function gridMatch(actual,expected){
  if(JSON.stringify(actual.shape_kji)!==JSON.stringify(expected.shape_kji)||!Array.isArray(expected.ijk_to_ras)||expected.ijk_to_ras.length!==4||
    expected.ijk_to_ras.some((r,i)=>!Array.isArray(r)||r.length!==4||r.some((n,j)=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n-actual.ijk_to_ras[i][j])>1e-9)))
    fail('Decoded source grid differs from the independent source check.');
}
async function scalar(spec,readSource){
  exact(spec,['path','fileSha256','arraySha256','shape_kji','ijk_to_ras'],'scalar source');
  hash(spec.fileSha256);hash(spec.arraySha256);
  if(typeof spec.path!=='string'||!spec.path)fail('Missing local source path.');
  const input=await readSource(spec.path);
  if(!(input instanceof Uint8Array)||sha(input)!==spec.fileSha256)fail('NRRD file differs from the pinned source.');
  const decoded=decodeScalarNrrd(input);
  if(sha(decoded.data)!==spec.arraySha256)fail('Decoded array differs from the independent source check.');
  gridMatch(decoded,spec);
  // Parsing valid NRRD is distinct from admission to our native-plane renderer.
  createNativeVolumeGeometry(decoded);
  return decoded;
}

/** Read-only conversion. readSource is caller-owned; the compiler performs no IO or resampling. */
export async function compileRegionalMriExport(plan,{readSource}={}){
  exact(plan,['schema','region','laterality','series'],'export plan');
  if(plan.schema!=='visible-medicine.regional-mri-export/1'||typeof readSource!=='function'||!Array.isArray(plan.series)||plan.series.length<1||plan.series.length>32)
    fail('Unsupported regional export plan.');
  const assets=new Map(),series=[],sources=[];
  let total=0,annotations=0;
  const put=(path,data)=>{total+=data.byteLength;if(total>1073741824)fail('Regional export exceeds 1 GiB.');assets.set(path,data);return sha(data);};
  for(const [si,entry]of plan.series.entries()){
    exact(entry,['id','label','image','annotations'],'source sequence');
    if(!Array.isArray(entry.annotations)||entry.annotations.length>5000||(annotations+=entry.annotations.length)>10000)fail('Unsupported source annotation count.');
    const image=await scalar(entry.image,readSource),folder=`sequence-${String(si+1).padStart(2,'0')}`;
    const file=folder+'/image.raw',imageHash=put(file,image.data),output=[];
    sources.push({id:entry.id,fileSha256:entry.image.fileSha256,arraySha256:imageHash,shape_kji:image.shape_kji});
    for(const [ai,a]of entry.annotations.entries()){
      exact(a,['id','anatomyId','label','laterality','coverage','review','geometry'],'source annotation');
      let geometry;
      if(a.geometry?.kind==='mask'){
        const g=a.geometry;
        exact(g,['kind','path','fileSha256','arraySha256','shape_kji','ijk_to_ras','gridKind','mappingRevision'],'source mask');
        const mask=await scalar(Object.fromEntries(['path','fileSha256','arraySha256','shape_kji','ijk_to_ras'].map(k=>[k,g[k]])),readSource);
        if(mask.dtype!=='uint8'||mask.data.some(n=>n!==0&&n!==1))fail('Source masks must already be binary uint8; label extraction is not implicit.');
        const maskFile=folder+`/mask-${String(ai+1).padStart(4,'0')}.raw`;
        geometry={kind:'mask',file:maskFile,sha256:put(maskFile,mask.data),shape_kji:mask.shape_kji,offset_kji:[0,0,0],
          grid:{shape_kji:mask.shape_kji,ijk_to_ras:mask.ijk_to_ras},gridKind:g.gridKind,mappingRevision:g.mappingRevision};
        sources.push({id:a.id,fileSha256:g.fileSha256,arraySha256:geometry.sha256,shape_kji:mask.shape_kji});
      }else if(a.geometry?.kind==='points'||a.geometry?.kind==='curve'){
        exact(a.geometry,['kind','points_ras_mm'],'source markup');
        geometry=structuredClone(a.geometry);
      }else {exact(a.geometry,['kind'],'absent source geometry');if(a.geometry.kind!=='none')fail('Unsupported source geometry.');geometry={kind:'none'};}
      output.push({...structuredClone(a),seriesId:entry.id,sourceImageSha256:imageHash,geometry});
    }
    series.push({id:entry.id,label:entry.label,image:{file,sha256:imageHash,dtype:image.dtype,shape_kji:image.shape_kji,ijk_to_ras:image.ijk_to_ras},annotations:output});
  }
  const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:plan.region,laterality:plan.laterality,
    coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series};
  const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n'),revision=sha(bytes);
  const handles=new Map([...assets].map(([path,data])=>[path,{size:data.byteLength,arrayBuffer:async()=>buffer(data)}]));
  const pkg=await openRegionalMriPackage(buffer(bytes),handles,revision);
  // Validate all emitted bytes and statuses through the unchanged real loader before writing.
  for(const entry of pkg.manifest.series){
    const study=await loadRegionalMriSeries(pkg,entry.id);
    for(const a of entry.annotations)if(a.geometry.kind!=='none'&&a.review.status!=='deferred')
      await loadRegionalMriAnnotation(pkg,study,a,undefined,a.review.status==='provisional'?{inspectProvisional:true}:undefined);
  }
  const result={manifest,manifestBytes:bytes,revision,assets,report:{series:series.length,annotations,totalAssetBytes:total,sources,
    statusCounts:Object.fromEntries(['accepted-scoped','provisional','deferred'].map(s=>[s,series.reduce((n,e)=>n+e.annotations.filter(a=>a.review.status===s).length,0)])),
    registration:'none',release:'local-private-draft',resampled:false}};
  compiledExports.set(result,{revision,assets:new Map([...assets].map(([path,data])=>[path,{size:data.byteLength,sha256:sha(data)}]))});
  return result;
}

export function writeRegionalMriExport(compiled,destination,{privateRoot}={}){
  const proof=compiledExports.get(compiled);if(!proof)fail('Only an owned verified compiler result can be persisted.');
  if(typeof destination!=='string'||!isAbsolute(destination)||existsSync(destination))fail('Choose a new absolute private export directory; overwriting is forbidden.');
  const target=resolve(destination),parent=dirname(target);
  if(!existsSync(parent)||!lstatSync(parent).isDirectory()||realpathSync(parent)!==resolve(parent))fail('Private output parent must be an existing non-linked directory.');
  const site=resolve(fileURLToPath(new URL('..',import.meta.url)));
  const inside=(path,root)=>{const rel=relative(root,path);return rel===''||rel!== '..'&&!rel.startsWith('..'+sep)&&!isAbsolute(rel);};
  if(inside(target,site))fail('Private exports must remain outside the website checkout.');
  if(typeof privateRoot!=='string'||!isAbsolute(privateRoot)||!existsSync(privateRoot)||!lstatSync(privateRoot).isDirectory()||
    realpathSync(privateRoot)!==resolve(privateRoot)||!inside(target,resolve(privateRoot)))fail('Destination is outside the explicitly approved private export root.');
  for(let ancestor=parent;;ancestor=dirname(ancestor)){
    if(existsSync(resolve(ancestor,'.git')))fail('Private exports cannot be written inside a Git checkout.');
    if(dirname(ancestor)===ancestor)break;
  }
  // Only a successfully compiled result with exact known asset paths can be persisted.
  if(compiled.revision!==proof.revision||sha(compiled.manifestBytes)!==proof.revision||
    sha(Buffer.from(JSON.stringify(compiled.manifest,null,2)+'\n'))!==proof.revision||compiled.assets.size!==proof.assets.size||compiled.assets.size<1||compiled.assets.size>10000)
    fail('Export result integrity mismatch.');
  for(const[path,data]of compiled.assets){
    if(!/^sequence-\d{2}\/(?:image|mask-\d{4})\.raw$/.test(path)||!(data instanceof Uint8Array))fail('Unsafe compiled asset.');
    const expected=proof.assets.get(path);
    if(!expected||data.byteLength!==expected.size||sha(data)!==expected.sha256)fail('Compiled asset changed before persistence.');
  }
  mkdirSync(target);
  for(const[path,data]of compiled.assets){const absolute=resolve(target,path);mkdirSync(dirname(absolute),{recursive:true});writeFileSync(absolute,data,{flag:'wx'});}
  writeFileSync(resolve(target,'manifest.json'),compiled.manifestBytes,{flag:'wx'});
  return {revision:compiled.revision,files:compiled.assets.size+1};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.length!==8||args[0]!=='--plan'||args[2]!=='--plan-sha256'||args[4]!=='--output'||args[6]!=='--private-root')fail('Usage: node scripts/export-regional-mri.mjs --plan <private.json> --plan-sha256 <independently checked hash> --output <new private folder> --private-root <explicitly approved private directory>');
  const planBytes=readFileSync(args[1]);hash(args[3]);if(sha(planBytes)!==args[3])fail('Private export plan revision mismatch.');
  const compiled=await compileRegionalMriExport(JSON.parse(planBytes),{readSource:path=>{
    if(!isAbsolute(path)||!lstatSync(path).isFile()||lstatSync(path).isSymbolicLink()||lstatSync(path).size>268500992)fail('Unsupported local scalar source.');
    return readFileSync(path);
  }});
  const saved=writeRegionalMriExport(compiled,args[5],{privateRoot:args[7]});
  console.log(JSON.stringify({...saved,...compiled.report}));
}
