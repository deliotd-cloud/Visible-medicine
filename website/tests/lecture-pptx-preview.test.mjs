/** Synthetic, private-only integration checks for the PPTX preview producer. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {before, test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {parsePreviewArgs, validatePreviewDestination, produceSlidePreview} from '../scripts/lecture-pptx-preview.mjs';

const website=fileURLToPath(new URL('../',import.meta.url));
const fixtureParent='F:/VisibleMedicine/staging/20261016-pptx-producer/test-fixtures';
const python='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const runtimePackages='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/X9kAAAAASUVORK5CYII=','base64'));
const fixtureCode=String.raw`
import base64, importlib.util, pathlib, sys, zlib
spec=importlib.util.spec_from_file_location('fixture',sys.argv[1]); module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
dest=pathlib.Path(sys.argv[2]); kind=sys.argv[3]
parts=module.package_parts()
good_png=base64.b64decode(sys.argv[4])
parts['ppt/media/image1.png']=good_png
parts['ppt/slides/_rels/slide10.xml.rels']=parts['ppt/slides/_rels/slide10.xml.rels'].replace(b'<Relationship Id="rLink" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://invalid.example/never-fetch" TargetMode="External"/>',b'')
if kind=='many':
  slides=[]; rels=[]
  for i in range(1,83):
    name=f'ppt/slides/slide{i}.xml'
    if i not in (2,10): parts[name]=parts['ppt/slides/slide2.xml'].replace(b'Follow-up',f'Synthetic slide {i}'.encode())
    slides.append(f'<p:sldId id="{300+i}" r:id="s{i}"/>')
    rels.append(f'<Relationship Id="s{i}" Type="{module.SLIDE}" Target="slides/slide{i}.xml"/>')
  parts['ppt/presentation.xml']=(f'<p:presentation xmlns:p="{module.P}" xmlns:r="{module.R}"><p:sldIdLst>'+''.join(slides)+'</p:sldIdLst></p:presentation>').encode()
  parts['ppt/_rels/presentation.xml.rels']=(f'<Relationships xmlns="{module.REL}">'+''.join(rels)+'</Relationships>').encode()
  parts['[Content_Types].xml']=parts['[Content_Types].xml'].replace(b'</Types>',(''.join(f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>' for i in range(1,83) if i not in (2,10))+'</Types>').encode())
elif kind=='external':
  parts['ppt/slides/_rels/slide10.xml.rels']=module.package_parts()['ppt/slides/_rels/slide10.xml.rels']
elif kind=='active':
  parts['ppt/embeddings/embedded.bin']=b'synthetic-embedded-object'
elif kind=='media':
  parts['[Content_Types].xml']=parts['[Content_Types].xml'].replace(b'</Types>',b'<Default Extension="svg" ContentType="image/svg+xml"/></Types>')
  parts['ppt/media/unknown.svg']=b'<svg xmlns="http://www.w3.org/2000/svg"/>'
elif kind=='pngSpoof':
  parts['ppt/media/image1.png']=b'<svg xmlns="http://www.w3.org/2000/svg"/>'
elif kind=='pngBadCrc':
  bad=bytearray(good_png);bad[29]^=1;parts['ppt/media/image1.png']=bytes(bad)
elif kind=='pngHuge':
  bad=bytearray(good_png);bad[16:24]=(4097).to_bytes(4,'big')+(1).to_bytes(4,'big');bad[29:33]=zlib.crc32(bad[12:29]).to_bytes(4,'big');parts['ppt/media/image1.png']=bytes(bad)
elif kind.startswith('jpeg'):
  good_jpeg=bytes.fromhex('ffd8ffc0000b080001000101011100ffd9')
  parts['[Content_Types].xml']=parts['[Content_Types].xml'].replace(b'<Default Extension="png" ContentType="image/png"/>',b'<Default Extension="jpeg" ContentType="image/jpeg"/>')
  parts['ppt/slides/_rels/slide10.xml.rels']=parts['ppt/slides/_rels/slide10.xml.rels'].replace(b'image1.png',b'image1.jpeg')
  parts['ppt/media/image1.jpeg']=good_jpeg if kind=='jpegValid' else (b'<svg/>' if kind=='jpegSpoof' else good_jpeg[:-2] if kind=='jpegTruncated' else bytes.fromhex('ffd8ffe000040000ffd9'))
  del parts['ppt/media/image1.png']
module.write_package(dest,parts)
`;
let root, decks, counter=0;
const readJson=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const exists=async file=>fs.stat(file).then(()=>true,()=>false);
const next=prefix=>path.join(root,`${String(++counter).padStart(3,'0')}-${prefix}`);
const options=(kind='many',output=next(kind))=>({input:decks[kind].path,expectedSha256:decks[kind].hash,privateRoot:root,output,label:'Synthetic teaching deck',python,runtimePackages,runtimeLabel:'bundled-synthetic-test'});
const renderer=(count,pixels=png)=>({count,entrySha256:'a'.repeat(64),async render(){return Uint8Array.from(pixels);}});
const run=async(kind='many',render=renderer(kind==='many'?82:2),output)=>produceSlidePreview(options(kind,output),{openRenderer:async()=>render});
before(async()=>{
  await fs.mkdir(fixtureParent,{recursive:true});
  root=await fs.mkdtemp(path.join(fixtureParent,'run-'));
  decks={};
  for(const kind of ['many','small','external','active','media','pngSpoof','pngBadCrc','pngHuge','jpegValid','jpegSpoof','jpegTruncated','jpegNoSof']){
    const file=path.join(root,`${kind}.pptx`);
    const result=spawnSync(python,['-B','-c',fixtureCode,path.join(website,'tests/lecture-pptx-intake.test.py'),file,kind,Buffer.from(png).toString('base64')],{encoding:'utf8'});
    assert.equal(result.status,0,`fixture ${kind}: ${result.stderr}`);
    decks[kind]={path:file,hash:sha(await fs.readFile(file))};
  }
});

test('CLI requires exactly the documented eight valued options',()=>{
  const args=['--input','a','--expected-sha256','b','--private-root','c','--output','d','--label','e','--python','f','--runtime-packages','g','--runtime-label','h'];
  assert.deepEqual(Object.keys(parsePreviewArgs(args)).sort(),Object.keys(options()).sort());
  for(const bad of [args.slice(0,-2),[...args,'--input','again'],[...args,'--unknown','x'],[...args,'--label'],['--input','--output',...args]])assert.throws(()=>parsePreviewArgs(bad));
});

test('fresh 82-slide result binds complete source and preserves private review gates',async()=>{
  const original=await fs.readFile(decks.many.path);
  const result=await run();
  const output=result.output;
  const [manifest,intake,map,receipt,raster]=await Promise.all(['preview/preview.json','evidence/intake.json','evidence/review-map.json','evidence/receipt.json','evidence/raster-preflight.json'].map(file=>readJson(path.join(output,file))));
  assert.equal(result.slides,82);
  assert.equal(manifest.sourceSlideCount,82);
  assert.equal(manifest.slides.length,82);
  assert.equal(map.slides.length,82);
  assert.equal(receipt.slides,82);
  assert.equal(map.moduleBoundaryReviewRequired,true);
  assert.equal(map.modulePlan,null);
  assert.equal(manifest.source.sha256,decks.many.hash);
  assert.equal(sha(await fs.readFile(path.join(output,'work/source.pptx'))),decks.many.hash);
  assert.deepEqual(await fs.readFile(decks.many.path),original);
  assert.equal(sha(await fs.readFile(path.join(output,'evidence/intake.json'))),manifest.intakeSha256);
  assert.equal(sha(await fs.readFile(path.join(output,'preview/preview.json'))),receipt.manifestSha256);
  assert.equal(sha(await fs.readFile(path.join(output,'evidence/review-map.json'))),receipt.reviewMapSha256);
  assert.equal(sha(await fs.readFile(path.join(output,'evidence/raster-preflight.json'))),receipt.rasterPreflightSha256);
  assert.equal(raster.schema,'vm-pptx-raster-preflight-v1');
  assert.equal(raster.sourceSha256,decks.many.hash);
  assert.equal(raster.intakeSha256,manifest.intakeSha256);
  assert.equal(raster.approved,false);
  assert.equal(raster.fullPixelDecodeVerified,false);
  assert.deepEqual(raster.assets.map(asset=>({part:asset.part,sha256:asset.sha256,bytes:asset.bytes,contentType:asset.contentType})),intake.assets.map(asset=>({part:asset.part,sha256:asset.sha256,bytes:asset.bytes,contentType:asset.contentType})));
  assert.deepEqual(raster.assets.map(asset=>[asset.width,asset.height]),[[1,1]]);
  assert.deepEqual(manifest.slides.map(s=>s.position),Array.from({length:82},(_,i)=>i+1));
  assert.deepEqual(manifest.slides.map(s=>s.part),intake.slides.map(s=>s.part));
  for(let i=0;i<82;i++){
    const slide=manifest.slides[i],source=intake.slides[i],review=map.slides[i];
    assert.equal(slide.partSha256,source.partSha256);
    assert.equal(review.anchor,source.anchor);
    assert.deepEqual(review.sourceTextBlocks,source.textBlocks);
    assert.deepEqual(review.sourceNotesBlocks,source.notesBlocks);
    assert.deepEqual(review.sourceNotesParts,source.notesParts);
    assert.deepEqual(review.directMediaPlacements,source.media);
    assert.equal(slide.image.sha256,sha(png));
    assert.deepEqual(await fs.readFile(path.join(output,'preview',slide.image.path)),Buffer.from(png));
    for(const gate of ['clinicalStatus','rightsStatus','privacyStatus','fidelityStatus','accessibilityStatus'])assert.equal(review[gate],'unreviewed');
  }
  assert.match(manifest.slides[9].notes,/Verify the image licence/);
  assert.equal(manifest.slides[9].part,'ppt/slides/slide10.xml');
  assert.deepEqual(map.assets,intake.assets);
  assert.deepEqual(map.relationships,intake.relationships);
  for(const value of [result,receipt]){
    assert.equal(value.readyForPublication,false);
    assert.equal(value.liveImport,false);
  }
  for(const gate of ['clinicalApproved','rightsApproved','privacyApproved','visualFidelityApproved','accessibilityApproved','publiclyUploaded'])assert.equal(receipt[gate],false);
});

test('partial render failure leaves no completion manifest and does not change source',async()=>{
  const output=next('partial');let calls=0;
  const original=await fs.readFile(decks.small.path);
  await assert.rejects(produceSlidePreview(options('small',output),{openRenderer:async()=>({count:2,entrySha256:'a'.repeat(64),async render(){return ++calls===2?new Uint8Array(0):Uint8Array.from(png);}})}));
  assert.equal(calls,2);
  assert.equal(await exists(path.join(output,'preview/preview.json')),false);
  assert.equal((await readJson(path.join(output,'failure.json'))).readyForPublication,false);
  assert.deepEqual(await fs.readFile(decks.small.path),original);
});

test('count mismatch, invalid PNG, and source pin failure never complete',async()=>{
  for(const [name,render] of [['count',renderer(1)],['invalid-png',renderer(2,new Uint8Array(40))],['oversize-png',renderer(2,new Uint8Array(16*1024*1024+1))]]){
    const output=next(name);await assert.rejects(run('small',render,output));
    assert.equal(await exists(path.join(output,'preview/preview.json')),false);
    assert.equal(await exists(path.join(output,'failure.json')),true);
  }
  const output=next('pin');
  await assert.rejects(produceSlidePreview({...options('small',output),expectedSha256:'0'.repeat(64)},{openRenderer:async()=>{throw Error('renderer must not open');}}));
  assert.equal(await exists(path.join(output,'preview/preview.json')),false);
  assert.equal(sha(await fs.readFile(decks.small.path)),decks.small.hash);
});

test('existing output, including a prior receipt, is never overwritten',async()=>{
  const output=next('existing');await fs.mkdir(output);const receipt=path.join(output,'receipt.json');await fs.writeFile(receipt,'prior private receipt');
  await assert.rejects(run('small',renderer(2),output));
  assert.equal(await fs.readFile(receipt,'utf8'),'prior private receipt');
  assert.equal(await exists(path.join(output,'failure.json')),false);
});

test('destination guards reject escapes, repository, hosted, public, and linked paths',async t=>{
  const privateRoot=path.join(root,'dest-guards');await fs.mkdir(privateRoot);
  const cases=[path.join(root,'outside'),path.join(website,'tests','forbidden-preview-output'),path.join(privateRoot,'public')];
  for(const target of cases)await assert.rejects(validatePreviewDestination(privateRoot,target));
  const repo=path.join(root,'repo');await fs.mkdir(path.join(repo,'.git'),{recursive:true});
  await assert.rejects(validatePreviewDestination(repo,path.join(repo,'output')));
  const hosted=path.join(root,'hosted');await fs.mkdir(path.join(hosted,'.openai'),{recursive:true});await fs.writeFile(path.join(hosted,'.openai','hosting.json'),'{}');
  await assert.rejects(validatePreviewDestination(hosted,path.join(hosted,'output')));
  const link=path.join(root,'linked-root');
  try{await fs.symlink(privateRoot,link,'junction');await assert.rejects(validatePreviewDestination(link,path.join(link,'output')));}catch(error){if(error?.code==='EPERM'||error?.code==='EACCES')t.diagnostic('Junction creation unavailable; validation case skipped.');else throw error;}
});

test('path syntax and producer argument guards refuse ambiguous selections',async()=>{
  for(const bad of ['relative/private','\\\\server\\share\\private',`${root}:stream`])await assert.rejects(validatePreviewDestination(bad,path.join(root,'output')));
  for(const bad of ['relative/output','\\\\server\\share\\output',`${root}\\output:stream`])await assert.rejects(validatePreviewDestination(root,bad));
  const good=options('small');
  for(const bad of [{...good,extra:'bypass'},{...good,expectedSha256:'A'.repeat(64)},{...good,label:'bad\nlabel'}])await assert.rejects(produceSlidePreview(bad,{openRenderer:async()=>renderer(2)}));
});

test('real intake rejects external links, active parts, and unsupported media before renderer opens',async()=>{
  for(const kind of ['external','active','media']){
    let opened=false;const output=next(kind);
    await assert.rejects(produceSlidePreview(options(kind,output),{openRenderer:async()=>{opened=true;return renderer(2);}}),kind);
    assert.equal(opened,false,kind);
    assert.equal(await exists(path.join(output,'preview/preview.json')),false,kind);
    assert.equal(await exists(path.join(output,'failure.json')),true,kind);
  }
});

test('raster preflight accepts a bounded JPEG source and keeps it unapproved',async()=>{
  const result=await run('jpegValid',renderer(2));
  const raster=await readJson(path.join(result.output,'evidence/raster-preflight.json'));
  const receipt=await readJson(path.join(result.output,'evidence/receipt.json'));
  assert.deepEqual(raster.assets.map(asset=>[asset.contentType,asset.width,asset.height]),[['image/jpeg',1,1]]);
  assert.equal(raster.approved,false);
  assert.equal(raster.fullPixelDecodeVerified,false);
  assert.equal(receipt.readyForPublication,false);
  assert.equal(receipt.rasterPreflightSha256,sha(await fs.readFile(path.join(result.output,'evidence/raster-preflight.json'))));
});

test('fresh raster preflight rejects disguised, corrupt, huge, and incomplete media before renderer opens',async()=>{
  for(const kind of ['pngSpoof','pngBadCrc','pngHuge','jpegSpoof','jpegTruncated','jpegNoSof']){
    let opened=false;const output=next(kind);
    await assert.rejects(produceSlidePreview(options(kind,output),{openRenderer:async()=>{opened=true;return renderer(2);}}),kind);
    assert.equal(opened,false,kind);
    assert.equal(await exists(path.join(output,'evidence/intake.json')),true,kind);
    assert.equal(await exists(path.join(output,'preview/preview.json')),false,kind);
    assert.equal(await exists(path.join(output,'failure.json')),true,kind);
    assert.equal(sha(await fs.readFile(decks[kind].path)),decks[kind].hash,kind);
  }
});

test('original-source mutation during rendering refuses completion and preserves snapshot',async()=>{
  const source=path.join(root,'mutable-synthetic.pptx');
  const original=await fs.readFile(decks.small.path);await fs.writeFile(source,original);
  const output=next('mutated-source');
  let changed=false;
  try{
    await assert.rejects(produceSlidePreview({...options('small',output),input:source},{openRenderer:async()=>({count:2,entrySha256:'a'.repeat(64),async render(){if(!changed){changed=true;await fs.appendFile(source,Buffer.from('synthetic-mutation'));}return Uint8Array.from(png);}})}),/Source or snapshot changed/);
    assert.equal(changed,true);
    assert.equal(await exists(path.join(output,'preview/preview.json')),false);
    assert.equal(await exists(path.join(output,'failure.json')),true);
    assert.deepEqual(await fs.readFile(path.join(output,'work/source.pptx')),original);
  }finally{await fs.writeFile(source,original);}
  assert.deepEqual(await fs.readFile(source),original);
});

test('rerun against completed output retains receipt and manifest without a failure artifact',async()=>{
  const output=next('completed-rerun');
  await run('small',renderer(2),output);
  const receiptPath=path.join(output,'evidence/receipt.json'),manifestPath=path.join(output,'preview/preview.json');
  const [receipt,manifest]=await Promise.all([fs.readFile(receiptPath),fs.readFile(manifestPath)]);
  await assert.rejects(run('small',renderer(2),output));
  assert.deepEqual(await fs.readFile(receiptPath),receipt);
  assert.deepEqual(await fs.readFile(manifestPath),manifest);
  assert.equal(await exists(path.join(output,'failure.json')),false);
});

test('repeated and grouped image placement evidence survives the complete private producer unchanged',async()=>{
  const placementCode=fixtureCode.replace('module.write_package(dest,parts)',String.raw`
import copy, xml.etree.ElementTree as ET
slide=ET.fromstring(parts['ppt/slides/slide10.xml'])
ns={'p':module.P,'a':module.A}
tree=slide.find('p:cSld/p:spTree',ns)
picture=tree.find('p:pic',ns)
properties=picture.find('p:spPr',ns)
xfrm=ET.SubElement(properties,'{'+module.A+'}xfrm',{'rot':'5400000','flipH':'1'})
ET.SubElement(xfrm,'{'+module.A+'}off',{'x':'100','y':'200'})
ET.SubElement(xfrm,'{'+module.A+'}ext',{'cx':'300','cy':'400'})
ET.SubElement(picture.find('p:blipFill',ns),'{'+module.A+'}srcRect',{'l':'12500','r':'2500'})
group=ET.SubElement(tree,'{'+module.P+'}grpSp')
nonvisual=ET.SubElement(group,'{'+module.P+'}nvGrpSpPr')
ET.SubElement(nonvisual,'{'+module.P+'}cNvPr',{'id':'10','name':'Synthetic group'})
gp=ET.SubElement(group,'{'+module.P+'}grpSpPr')
gt=ET.SubElement(gp,'{'+module.A+'}xfrm',{'flipV':'1'})
for name,values in [('off',{'x':'1000','y':'2000'}),('ext',{'cx':'6000','cy':'8000'}),('chOff',{'x':'0','y':'0'}),('chExt',{'cx':'600','cy':'800'})]: ET.SubElement(gt,'{'+module.A+'}'+name,values)
second=copy.deepcopy(picture)
second.find('p:nvPicPr/p:cNvPr',ns).set('id','12')
second.find('p:spPr/a:xfrm/a:off',ns).set('x','500')
group.append(second)
parts['ppt/slides/slide10.xml']=ET.tostring(slide)
module.write_package(dest,parts)
`);
  const input=path.join(root,'source-placement.pptx');
  const fixture=spawnSync(python,['-B','-c',placementCode,path.join(website,'tests/lecture-pptx-intake.test.py'),input,'small',Buffer.from(png).toString('base64')],{encoding:'utf8'});
  assert.equal(fixture.status,0,fixture.stderr);
  const original=await fs.readFile(input),output=next('source-placement');
  await produceSlidePreview({...options('small',output),input,expectedSha256:sha(original)},{openRenderer:async()=>renderer(2)});
  const [intake,map,receipt]=await Promise.all(['evidence/intake.json','evidence/review-map.json','evidence/receipt.json'].map(file=>readJson(path.join(output,file))));
  const media=intake.slides[0].media;
  assert.equal(media.length,2);
  assert.deepEqual(map.slides[0].directMediaPlacements,media);
  assert.deepEqual(media.map(item=>item.shapeId),['4','12']);
  assert.equal(media[0].part,media[1].part);
  assert.equal(media[0].sha256,media[1].sha256);
  assert.notEqual(media[0].sourceXmlPath,media[1].sourceXmlPath);
  assert.notEqual(media[0].sourceShapePath,media[1].sourceShapePath);
  assert.deepEqual(media.map(item=>item.localTransformEmu.offset.x),['100','500']);
  assert.equal(media[0].localTransformEmu.rotation,'5400000');
  assert.equal(media[0].localTransformEmu.flipH,'1');
  assert.deepEqual(media[0].ancestorGroups,[]);
  assert.equal(media[1].ancestorGroups.length,1);
  assert.equal(media[1].ancestorGroups[0].shapeId,'10');
  assert.deepEqual(media[1].ancestorGroups[0].localTransformEmu.childExtent,{cx:'600',cy:'800'});
  assert.deepEqual(media[1].sourceCrop.attributes,{l:'12500',r:'2500'});
  for(const item of media){assert.equal(item.caption,null);assert.equal(item.rightsStatus,'unreviewed');assert.equal(item.privacyStatus,'unreviewed');}
  for(const gate of ['clinicalStatus','rightsStatus','privacyStatus','fidelityStatus','accessibilityStatus'])assert.equal(map.slides[0][gate],'unreviewed');
  assert.deepEqual(map.slides[0].anatomyReferences,[]);
  assert.equal(receipt.readyForPublication,false);
  assert.equal(receipt.liveImport,false);
  assert.equal(receipt.reviewMapSha256,sha(await fs.readFile(path.join(output,'evidence/review-map.json'))));
  assert.deepEqual(await fs.readFile(input),original);
});
