/** Offline, private PowerPoint review preparation. Never a course admission API. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseSlidePreviewManifest,readSlidePreviewImage} from '../lib/lecture-slide-preview.ts';

const MAX_SOURCE=256*1024*1024;
const ownPath=fileURLToPath(import.meta.url);
const intakeScript=fileURLToPath(new URL('./lecture-pptx-intake.py',import.meta.url));
const rasterScript=fileURLToPath(new URL('./lecture-pptx-raster-preflight.py',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const require=createRequire(import.meta.url);
const required=['input','expectedSha256','privateRoot','output','label','python','runtimePackages','runtimeLabel'];
function ensure(ok,message){if(!ok)throw new Error(message);}

export function parsePreviewArgs(args){
  const names={'--input':'input','--expected-sha256':'expectedSha256','--private-root':'privateRoot','--output':'output','--label':'label','--python':'python','--runtime-packages':'runtimePackages','--runtime-label':'runtimeLabel'};
  const result={};
  for(let i=0;i<args.length;i+=2){const name=names[args[i]];ensure(name&&!Object.hasOwn(result,name)&&typeof args[i+1]==='string'&&args[i+1]&&!args[i+1].startsWith('--'),'Use each documented option exactly once, with its value.');result[name]=args[i+1];}
  ensure(required.every(name=>Object.hasOwn(result,name)),'All documented options are required.');return result;
}

function absoluteLocal(value){
  ensure(typeof value==='string'&&path.isAbsolute(value)&&!value.startsWith('\\\\')&&!value.startsWith('//')&&!/[\x00-\x1f\x7f]/.test(value),'Select explicit absolute local paths.');
  const normalized=path.resolve(value),tail=normalized.slice(path.parse(normalized).root.length);
  ensure(!tail.includes(':'),'Alternate stream paths are not supported.');return normalized;
}
async function noLinks(value,existing=true){
  const target=absoluteLocal(value);let cursor=target;
  while(true){try{const info=await fs.lstat(cursor);ensure(!info.isSymbolicLink(),'Symlink or junction paths are not supported.');}catch(error){if(error.code!=='ENOENT'||existing||cursor!==target)throw error;}
    const parent=path.dirname(cursor);if(parent===cursor)break;cursor=parent;
  }return target;
}
const inside=(root,target)=>{const relative=path.relative(root,target);return relative!==''&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative);};
async function repositoryOrHosted(value){
  let cursor=value;
  while(true){for(const marker of ['.git',path.join('.openai','hosting.json')]){try{await fs.lstat(path.join(cursor,marker));return true;}catch(error){if(error.code!=='ENOENT'&&error.code!=='ENOTDIR')throw error;}}
    const parent=path.dirname(cursor);if(parent===cursor)break;cursor=parent;
  }return false;
}
export async function validatePreviewDestination(privateRoot,output){
  const root=await noLinks(privateRoot),destination=await noLinks(output,false);
  ensure((await fs.stat(root)).isDirectory()&&root!==path.parse(root).root,'Choose a scoped existing private staging directory.');
  ensure(inside(root,destination),'Output must be a new folder strictly inside the private root.');
  ensure((await fs.stat(path.dirname(destination))).isDirectory(),'The output parent must already exist.');
  try{await fs.lstat(destination);throw new Error('Output already exists; choose a new folder.');}catch(error){if(error.code!=='ENOENT')throw error;}
  ensure(!await repositoryOrHosted(root)&&!await repositoryOrHosted(path.dirname(destination)),'Private outputs must stay outside repositories and hosted source.');
  ensure(!destination.split(/[\\/]/).some(part=>/^(?:public|dist|wwwroot|out)$/i.test(part)),'Private output cannot use a public or distribution directory.');
  const website=fileURLToPath(new URL('../',import.meta.url));ensure(!inside(website,root)&&!inside(website,destination),'Output cannot be inside the website.');
  return{root,destination};
}
async function writeNew(file,bytes){await noLinks(path.dirname(file));const handle=await fs.open(file,'wx');try{await handle.writeFile(bytes);}finally{await handle.close();}}
async function fileHash(file){
  await noLinks(file);const handle=await fs.open(file,'r'),hash=createHash('sha256');let bytes=0;
  try{const buffer=Buffer.alloc(1024*1024);while(true){const chunk=await handle.read(buffer,0,buffer.length,null);if(!chunk.bytesRead)break;bytes+=chunk.bytesRead;ensure(bytes<=MAX_SOURCE,'File exceeded its hash-verification limit.');hash.update(buffer.subarray(0,chunk.bytesRead));}return hash.digest('hex');}
  finally{await handle.close();}
}
async function snapshotSource(input,snapshot,expected){
  const source=await noLinks(input);ensure(path.extname(source).toLowerCase()==='.pptx','Select a .pptx file.');
  const info=await fs.stat(source);ensure(info.isFile()&&info.size>0&&info.size<=MAX_SOURCE,'Source exceeds the 256 MiB limit or is not a file.');
  const reader=await fs.open(source,'r'),writer=await fs.open(snapshot,'wx');const hash=createHash('sha256');let bytes=0;
  try{const buffer=Buffer.alloc(1024*1024);while(true){const chunk=await reader.read(buffer,0,buffer.length,null);if(!chunk.bytesRead)break;bytes+=chunk.bytesRead;ensure(bytes<=MAX_SOURCE,'Source grew beyond its limit.');const value=buffer.subarray(0,chunk.bytesRead);hash.update(value);await writer.writeFile(value);}}
  finally{await reader.close();await writer.close();}
  ensure(bytes===info.size&&hash.digest('hex')===expected,'Source does not match the selected revision.');return{path:source,bytes,sha256:expected};
}
function plainNotes(slide){return slide.notesBlocks.filter(block=>block.placeholder==='body').map(block=>block.paragraphs.map(paragraph=>paragraph.text).join('\n')).join('\n');}
export function validatePreviewIntake(intake,source){
  ensure(intake?.schema==='visible-medicine-lecture-pptx-intake-v1'&&intake.state==='quarantined'&&intake.readyForPublication===false,'A fresh quarantined intake is required.');
  ensure(intake.source?.sha256===source.sha256&&intake.source?.bytes===source.bytes,'Intake source differs from the snapshot.');
  ensure(Array.isArray(intake.externalRelationships)&&intake.externalRelationships.length===0,'External relationships require separate handling before rendering.');
  ensure(Array.isArray(intake.activeParts)&&intake.activeParts.length===0,'Active or embedded parts are not supported by this renderer.');
  ensure(Array.isArray(intake.assets)&&intake.assets.every(asset=>['image/png','image/jpeg'].includes(asset.contentType)),'Only self-contained PNG/JPEG source media are supported.');
  ensure(!intake.issues.some(issue=>['unrecognized-relationship-location-held','orphan-relationships-held'].includes(issue)),'Unresolved relationships must be investigated before rendering.');
  const seed={schema:'vm-lecture-slide-preview-v1',state:'review-only',source:{label:'Preflight',sha256:source.sha256,bytes:source.bytes},intakeSha256:'0'.repeat(64),renderer:{name:'preflight',version:'1'},sourceSlideCount:intake.slides.length,
    slides:intake.slides.map(slide=>({position:slide.position,part:slide.part,partSha256:slide.partSha256,title:slide.title,notes:plainNotes(slide),image:{path:`slides/slide-${String(slide.position).padStart(4,'0')}.png`,sha256:'0'.repeat(64),bytes:33,width:1,height:1}}))};
  parseSlidePreviewManifest(JSON.stringify(seed));return seed.slides;
}
async function runPython(options,args,capture=false){
  return new Promise((resolve,reject)=>{
    const child=spawn(options.python,['-B',...args],{windowsHide:true,shell:false,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
    const chunks=[];
    let outputBytes=0,settled=false;const timer=setTimeout(()=>{child.kill();finish(new Error('Source intake exceeded its time limit.'));},60000);
    const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(Buffer.concat(chunks));};
    for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{outputBytes+=chunk.length;if(capture&&stream===child.stdout)chunks.push(chunk);if(outputBytes>1024*1024){child.kill();finish(new Error('Source intake diagnostics exceeded their limit.'));}});
    child.once('error',()=>finish(new Error('The selected Python runtime could not run source inspection.')));child.once('close',code=>finish(code===0?null:new Error('PowerPoint source inspection refused the selected package.')));
  });
}
async function inspectSnapshot(options,snapshot,intakePath){
  await runPython(options,[intakeScript,'--input',snapshot,'--expected-sha256',options.expectedSha256,'--private-root',options.output,'--output',intakePath]);
  const bytes=await fs.readFile(intakePath);ensure(bytes.length<=64*1024*1024,'Intake exceeded its size limit.');return{bytes,intake:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))};
}
async function artifactRenderer(options,snapshot){
  const entry=require.resolve('@oai/artifact-tool',{paths:[path.dirname(options.runtimePackages)]});
  ensure(inside(options.runtimePackages,entry),'The renderer must resolve inside the selected runtime package directory.');
  const entrySha256=await fileHash(entry);
  const tool=await import(pathToFileURL(entry).href);
  const presentation=await tool.PresentationFile.importPptx(await tool.FileBlob.load(snapshot));
  ensure(await fileHash(entry)===entrySha256,'The renderer entry changed during import.');
  return{count:presentation.slides.items.length,entrySha256,async render(index){const blob=await presentation.export({slide:presentation.slides.items[index],format:'png',scale:1});return new Uint8Array(await blob.arrayBuffer());}};
}

/** Renderer injection is a test seam, not a CLI option or approval mechanism. */
export async function produceSlidePreview(options,{openRenderer=artifactRenderer}={}){
  ensure(options&&Object.keys(options).length===required.length&&required.every(key=>typeof options[key]==='string'&&options[key]),'Use the documented producer options.');
  ensure(/^[a-f0-9]{64}$/.test(options.expectedSha256),'A lowercase SHA-256 source revision is required.');
  ensure(options.label.length<=500&&options.runtimeLabel.length<=500&&!/[\x00-\x1f\x7f]/.test(options.label+options.runtimeLabel),'Use bounded plain-text labels.');
  const {destination}=await validatePreviewDestination(options.privateRoot,options.output);
  options={...options,input:await noLinks(options.input),python:await noLinks(options.python),runtimePackages:await noLinks(options.runtimePackages),output:destination};
  ensure((await fs.stat(options.python)).isFile()&&(await fs.stat(options.runtimePackages)).isDirectory(),'Select the installed local runtimes.');
  await fs.mkdir(destination);let owned=true;
  try{
    for(const folder of ['work','evidence','preview','preview/slides'])await fs.mkdir(path.join(destination,folder));
    const snapshot=path.join(destination,'work/source.pptx'),intakePath=path.join(destination,'evidence/intake.json');
    const source=await snapshotSource(options.input,snapshot,options.expectedSha256);
    const producerSha256=await fileHash(ownPath),intakeProducerSha256=await fileHash(intakeScript),rasterProducerSha256=await fileHash(rasterScript);
    const {bytes:intakeBytes,intake}=await inspectSnapshot(options,snapshot,intakePath);
    const slides=validatePreviewIntake(intake,source),intakeSha256=sha(intakeBytes);
    const rasterBytes=await runPython(options,[rasterScript,'--input',snapshot,'--intake',intakePath,'--intake-sha256',intakeSha256,'--source-sha256',source.sha256],true);
    const rasterEvidence=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(rasterBytes));
    ensure(rasterEvidence.schema==='vm-pptx-raster-preflight-v1'&&rasterEvidence.sourceSha256===source.sha256&&rasterEvidence.intakeSha256===intakeSha256&&rasterEvidence.assets.length===intake.assets.length&&rasterEvidence.approved===false,'Raster preflight did not acknowledge the exact source.');
    await writeNew(path.join(destination,'evidence/raster-preflight.json'),rasterBytes);
    await noLinks(snapshot);ensure(await fileHash(snapshot)===source.sha256,'Snapshot changed before rendering.');
    const renderer=await openRenderer(options,snapshot);
    ensure(renderer.count===slides.length,'The renderer changed the source slide count.');
    let totalBytes=0;
    for(const [index,slide]of slides.entries()){
      const bytes=await renderer.render(index);ensure(bytes instanceof Uint8Array&&bytes.byteLength>=33&&bytes.byteLength<=16*1024*1024,'Rendered image is outside its byte limits.');
      const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
      slide.image={...slide.image,sha256:sha(bytes),bytes:bytes.byteLength,width:view.getUint32(16),height:view.getUint32(20)};
      totalBytes+=bytes.byteLength;ensure(totalBytes<=512*1024*1024,'Rendered images exceed the total limit.');
      // Run the exact reader contract before writing any render as a usable slide.
      const one={schema:'vm-lecture-slide-preview-v1',state:'review-only',source:{label:options.label,sha256:source.sha256,bytes:source.bytes},intakeSha256,renderer:{name:'@oai/artifact-tool',version:options.runtimeLabel},sourceSlideCount:1,slides:[{...slide,position:1,image:{...slide.image,path:'slides/slide-0001.png'}}]};
      parseSlidePreviewManifest(JSON.stringify(one));
      await readSlidePreviewImage({name:'render.png',size:bytes.byteLength,async arrayBuffer(){return Uint8Array.from(bytes).buffer;}},slide.image);
      await writeNew(path.join(destination,'preview',slide.image.path),bytes);
    }
    const manifest={schema:'vm-lecture-slide-preview-v1',state:'review-only',source:{label:options.label,sha256:source.sha256,bytes:source.bytes},intakeSha256,renderer:{name:'@oai/artifact-tool',version:options.runtimeLabel},sourceSlideCount:slides.length,slides};
    parseSlidePreviewManifest(JSON.stringify(manifest));
    const reviewMap={schema:'vm-pptx-conversion-review-map-v1',state:'review-only',source:{sha256:source.sha256,bytes:source.bytes},intakeSha256,
      assets:intake.assets,relationships:intake.relationships,modulePlan:null,moduleBoundaryReviewRequired:slides.length>80,
      slides:intake.slides.map(slide=>({position:slide.position,anchor:slide.anchor,part:slide.part,partSha256:slide.partSha256,sourceTextBlocks:slide.textBlocks,sourceNotesBlocks:slide.notesBlocks,sourceNotesParts:slide.notesParts,sourceTables:slide.tables,directMediaPlacements:slide.media,features:slide.features,
        anatomyReferences:[],inheritedMediaContextReviewRequired:true,clinicalStatus:'unreviewed',rightsStatus:'unreviewed',privacyStatus:'unreviewed',fidelityStatus:'unreviewed',accessibilityStatus:'unreviewed'}))};
    const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n'),manifestBytes=json(manifest),mapBytes=json(reviewMap);
    await writeNew(path.join(destination,'evidence/review-map.json'),mapBytes);
    ensure(await fileHash(options.input)===source.sha256&&await fileHash(snapshot)===source.sha256,'Source or snapshot changed during conversion.');
    ensure(await fileHash(ownPath)===producerSha256&&await fileHash(intakeScript)===intakeProducerSha256&&await fileHash(rasterScript)===rasterProducerSha256,'Producer source changed during conversion.');
    const receipt={schema:'vm-private-pptx-preview-receipt-v1',state:'rendered-private-review-only',source,intakeSha256,producerSha256,intakeProducerSha256,rasterProducerSha256,rasterPreflightSha256:sha(rasterBytes),renderer:manifest.renderer,rendererEntrySha256:renderer.entrySha256??null,slides:slides.length,totalPngBytes:totalBytes,manifestSha256:sha(manifestBytes),reviewMapSha256:sha(mapBytes),sourceSnapshotUnchanged:true,sourceOriginalUnchanged:true,
      readyForPublication:false,clinicalApproved:false,rightsApproved:false,privacyApproved:false,visualFidelityApproved:false,accessibilityApproved:false,liveImport:false,publiclyUploaded:false,animationsPreserved:false,editableObjectsConverted:false};
    await writeNew(path.join(destination,'evidence/receipt.json'),json(receipt));
    // Completion manifest comes last; a partial/failed render is not a preview package.
    await writeNew(path.join(destination,'preview/preview.json'),manifestBytes);owned=false;
    return{output:destination,slides:slides.length,manifestSha256:receipt.manifestSha256,reviewMapSha256:receipt.reviewMapSha256,readyForPublication:false,liveImport:false};
  }catch(error){if(owned){try{await writeNew(path.join(destination,'failure.json'),JSON.stringify({schema:'vm-private-pptx-preview-failure-v1',state:'failed',readyForPublication:false,liveImport:false,diagnostic:String(error?.message??error)},null,2)+'\n');}catch{/* Never overwrite prior output or hide the original failure. */}}throw error;}
}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(ownPath)){
  Promise.resolve().then(()=>produceSlidePreview(parsePreviewArgs(process.argv.slice(2)))).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error('Private preview not completed: '+error.message);process.exitCode=1;});
}
