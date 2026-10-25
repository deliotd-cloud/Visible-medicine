import {parseUltrasoundStudy,ULTRASOUND_MANIFEST,UltrasoundStudyError,type UltrasoundRegion,type UltrasoundStudy} from './ultrasound-study';

export type LoadedUltrasoundStudy={
 readonly study:UltrasoundStudy;readonly revision:string;
 readonly images:Readonly<Record<string,string>>;
 /** Revoke only this load's object URLs; safe to call more than once. */
 dispose():void;
};
export const ultrasoundFileLimits=Object.freeze({manifestBytes:256*1024,imageBytes:16*1024*1024,totalImageBytes:128*1024*1024,selectedFiles:128,maximumDimension:4096});
const fail=(message:string):never=>{throw new UltrasoundStudyError(message);};
const aborted=(signal?:AbortSignal)=>{if(signal?.aborted)throw new DOMException('Local folder loading cancelled.','AbortError');};
const sha=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
function pathOf(file:File):{folder:string;name:string}{
 const path=file.webkitRelativePath||file.name;
 if(typeof path!=='string'||path.length>512||/[\u0000-\u001f\u007f\\]/.test(path)||path.startsWith('/')||/^[A-Za-z]:/.test(path))return fail('Choose one teaching folder with its images directly inside it.');
 const parts=path.split('/');if(parts.length>2||parts.some(part=>!part||part==='.'||part==='..'))return fail('Keep the manifest and images directly inside one teaching folder.');
 return {folder:parts.length===2?parts[0]:'',name:parts.at(-1)!};
}
function encodedDimensions(bytes:Uint8Array):{width:number;height:number;mime:'image/png'|'image/jpeg'}{
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length>=24&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)){
  if(String.fromCharCode(...bytes.subarray(12,16))!=='IHDR')return fail('An image has an invalid PNG header.');
  let offset=8;while(offset+12<=bytes.length){const size=view.getUint32(offset),end=offset+size+12;if(end>bytes.length)return fail('A PNG image is truncated.');const kind=String.fromCharCode(...bytes.subarray(offset+4,offset+8));if(kind==='acTL')return fail('Use still PNG or JPEG images, rather than an animated image.');offset=end;if(kind==='IEND')break;}
  return {width:view.getUint32(16),height:view.getUint32(20),mime:'image/png'};
 }
 if(bytes.length>=4&&bytes[0]===255&&bytes[1]===216){
  let offset=2;const sof=new Set([192,193,194,195,197,198,199,201,202,203,205,206,207]);
  for(let count=0;count<2048&&offset<bytes.length;count++){
   if(bytes[offset++]!==255)return fail('A JPEG image has an invalid header.');while(bytes[offset]===255)offset++;
   const marker=bytes[offset++];if(marker===undefined||marker===218||marker===217)break;if(marker===1||marker>=208&&marker<=215)continue;
   if(offset+2>bytes.length)break;const length=view.getUint16(offset);if(length<2||offset+length>bytes.length)break;
   if(sof.has(marker)){if(length<8)break;return {width:view.getUint16(offset+5),height:view.getUint16(offset+3),mime:'image/jpeg'};}offset+=length;
  }
 }
 return fail('An image is not a supported still PNG or JPEG.');
}
/** No fetch, upload, storage, telemetry or remote decoder. Only selected files
 * named by the manifest are read. Declared rights do not establish clearance. */
export async function loadUltrasoundStudy(files:readonly File[],options:{signal?:AbortSignal;expectedRegion?:UltrasoundRegion}={}):Promise<LoadedUltrasoundStudy>{
 const {signal,expectedRegion}=options;aborted(signal);
 if(!Array.isArray(files)||files.length<2||files.length>ultrasoundFileLimits.selectedFiles)return fail('Choose the manifest and its images from one teaching folder.');
 const byName=new Map<string,File>(),seen=new Set<string>();let root:string|null=null;
 for(const file of files){const path=pathOf(file);if(root===null)root=path.folder;else if(root!==path.folder)return fail('Choose files from one teaching folder at a time.');const normalized=path.name.toLowerCase();if(seen.has(normalized))return fail('The selected folder has ambiguous duplicate filenames.');seen.add(normalized);byName.set(path.name,file);}
 const manifest=byName.get(ULTRASOUND_MANIFEST);if(!manifest||manifest.size<1||manifest.size>ultrasoundFileLimits.manifestBytes)return fail('Select a folder containing ultrasound-atlas.json (up to 256 KB).');
 const manifestBytes=await manifest.arrayBuffer();aborted(signal);if(manifestBytes.byteLength!==manifest.size)return fail('The manifest changed while loading.');
 let value:unknown;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(manifestBytes));}catch{return fail('The teaching manifest is not valid UTF-8 JSON.');}
 const study=parseUltrasoundStudy(value);if(expectedRegion&&study.region!==expectedRegion)return fail('This teaching folder belongs to another region. Choose that region before loading it.');
 const revision=await sha(manifestBytes);aborted(signal);
 const descriptors=new Map(study.frames.map(frame=>[frame.image.file,frame.image]));let total=0;
 for(const [name]of descriptors){const file=byName.get(name);if(!file||file.size<1||file.size>ultrasoundFileLimits.imageBytes)return fail('A required image is missing, empty or larger than 16 MB.');total+=file.size;}
 if(total>ultrasoundFileLimits.totalImageBytes)return fail('Keep the teaching images below 128 MB in total.');
 const urls:Record<string,string>=Object.create(null);let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;for(const url of Object.values(urls))URL.revokeObjectURL(url);};
 try{
  if(typeof createImageBitmap!=='function')return fail('This browser cannot verify local image dimensions. Try a current desktop browser.');
  for(const [name,descriptor]of descriptors){
   aborted(signal);const file=byName.get(name)!,bytes=await file.arrayBuffer();aborted(signal);
   if(bytes.byteLength!==file.size||await sha(bytes)!==descriptor.sha256)return fail('An image does not match this teaching manifest. The study was not opened.');aborted(signal);
   const encoded=encodedDimensions(new Uint8Array(bytes));
   if(encoded.width<1||encoded.height<1||encoded.width>4096||encoded.height>4096)return fail('An encoded image exceeds the supported dimensions.');
   if((/\.png$/i.test(name)?'image/png':'image/jpeg')!==encoded.mime)return fail('An image filename does not match its encoded type.');
   const blob=new Blob([bytes],{type:encoded.mime});let bitmap:ImageBitmap|null=null;
   try{bitmap=await createImageBitmap(blob);aborted(signal);if(bitmap.width!==descriptor.width||bitmap.height!==descriptor.height)return fail('An image does not match its declared pixel dimensions.');}
   catch(error){if(error instanceof UltrasoundStudyError||(error instanceof DOMException&&error.name==='AbortError'))throw error;return fail('An image could not be decoded safely.');}
   finally{bitmap?.close();}
   aborted(signal);urls[name]=URL.createObjectURL(blob);
  }
  aborted(signal);return Object.freeze({study,revision,images:Object.freeze(urls),dispose});
 }catch(error){dispose();throw error;}
}
