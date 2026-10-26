/** Browser-only, read-only inspection of a held published ultrasound packet. */
export interface LocalReviewFile { name:string; webkitRelativePath?:string; size:number; arrayBuffer():Promise<ArrayBuffer> }
export interface ReviewFigure {
 figure:number; file:string; sha256:string; bytes:number; widthPixels:number; heightPixels:number;
 sourceUrl:string; id:string; title:string; draftPrompt:string; extent:string; changes:string;
 rightsHold:string|null; clinicalReview:'not-reviewed'; privacyReview:'not-reviewed'; publication:'not-cleared';
 patientLaterality:null; fmaId:null; atlasStructureId:null; mask:null; imageTo3DTransform:null;
}
export interface ReviewPacket {
 schema:'vm-published-ultrasound-review-packet/1'; sourceIntakeSha256:string;
 article:{title:string;author:string;year:number;journal:string;doi:string;url:string;htmlSha256:string};
 license:{declared:string;url:string;copyright:string;assetSpecificReviewComplete:false;privacyClearance:false;clinicalApproval:false;publicationClearance:false;notice:string};
 figures:ReviewFigure[];
 mainVisualScreen:{all5OriginalsViewedAtNativeResolution:boolean;visiblePersonalNameDateOrIdentifierObserved:boolean;meaning:string;figure4:string;figure6:string};
 reviewInboxImported:false;normalLearnerInventoryImported:false;readinessEnabled:false;patientSpaceRegistration:false;decisionWrites:false;revisionSha256:string;
}
export interface LoadedReferencePacket {packet:ReviewPacket;packetSha256:string;images:Readonly<Record<string,string>>;dispose():void}
export const referenceLimits=Object.freeze({packetBytes:128*1024,imageBytes:16*1024*1024,companionBytes:128*1024,totalBytes:96*1024*1024,files:15,dimensions:4096,pixels:16_000_000});
const HEX=/^[0-9a-f]{64}$/; const CONTROL=/[\u0000-\u001f\u007f]/;
function fail(message:string):never{throw new Error(`Local reference packet: ${message}`)}
function abort(signal?:AbortSignal){if(signal?.aborted)throw new DOMException('Local inspection cancelled','AbortError')}
function fields(value:unknown,keys:readonly string[],label:string):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))fail(`${label} must be an object`);
 const record=value as Record<string,unknown>,actual=Object.keys(record);
 if(actual.length!==keys.length||actual.some(key=>!keys.includes(key)))fail(`${label} has missing or unsupported fields`);
 return record;
}
function str(value:unknown,label:string,max=3000){if(typeof value!=='string'||!value.trim()||value.length>max||CONTROL.test(value))fail(`${label} is invalid`);return value as string}
function hash(value:unknown,label:string){if(typeof value!=='string'||!HEX.test(value))fail(`${label} is invalid`);return value as string}
function int(value:unknown,min:number,max:number,label:string){if(!Number.isSafeInteger(value)||(value as number)<min||(value as number)>max)fail(`${label} is out of range`);return value as number}
function pending(value:unknown,expected:unknown,label:string){if(value!==expected)fail(`${label} must remain held`)}
async function sha(bytes:ArrayBuffer|Uint8Array<ArrayBuffer>){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('')}
const rootKeys=['schema','sourceIntakeSha256','article','license','figures','mainVisualScreen','reviewInboxImported','normalLearnerInventoryImported','readinessEnabled','patientSpaceRegistration','decisionWrites','revisionSha256'];
const figureKeys=['figure','file','sha256','bytes','widthPixels','heightPixels','sourceUrl','id','title','draftPrompt','extent','changes','rightsHold','clinicalReview','privacyReview','publication','patientLaterality','fmaId','atlasStructureId','mask','imageTo3DTransform'];
/** JSON.parse accepts duplicate object keys. This bounded token walk rejects them before parsing the packet.
 * JSON.parse still owns syntax validation and decoded string semantics (including escaped key spellings). */
function rejectDuplicateJsonKeys(text:string){
 let i=0;const space=()=>{while(i<text.length&&/\s/.test(text[i]))i++};
 const quoted=()=>{const start=i++;for(;i<text.length;i++){
  if(text[i]==='\\'){i++;continue}if(text[i]==='"'){i++;return JSON.parse(text.slice(start,i)) as string}
 }return fail('unterminated JSON string')};
 const value=(depth:number):void=>{
  if(depth>32)fail('packet JSON nesting exceeds limit');space();
  if(text[i]==='"'){quoted();return}
  if(text[i]==='{'){
   i++;space();const keys=new Set<string>();if(text[i]==='}'){i++;return}
   while(i<text.length){space();if(text[i]!=='"')fail('invalid JSON object key');const key=quoted();
    if(keys.has(key))fail(`duplicate JSON object key: ${key.slice(0,60)}`);keys.add(key);
    space();if(text[i++]!==':')fail('invalid JSON object');value(depth+1);space();
    if(text[i]===','){i++;continue}if(text[i]==='}'){i++;return}fail('invalid JSON object');
   }return fail('unterminated JSON object');
  }
  if(text[i]==='['){i++;space();if(text[i]===']'){i++;return}while(i<text.length){value(depth+1);space();if(text[i]===','){i++;continue}if(text[i]===']'){i++;return}fail('invalid JSON array')}return fail('unterminated JSON array')}
  while(i<text.length&&!/[\s,\]}]/.test(text[i]))i++;
 };
 value(0);space();if(i!==text.length)fail('trailing JSON tokens');
}
export async function parseLocalReferencePacket(bytes:ArrayBuffer,options:{expectedRevision?:string;expectedPacketSha256?:string;signal?:AbortSignal}={}):Promise<{packet:ReviewPacket;packetSha256:string}>{
 abort(options.signal);
 if(bytes.byteLength<100||bytes.byteLength>referenceLimits.packetBytes)fail('packet JSON size is outside limits');
 const packetSha256=await sha(bytes);abort(options.signal);
 if(options.expectedPacketSha256!==undefined&&(hash(options.expectedPacketSha256,'expected packet SHA-256')!==packetSha256))fail('packet bytes do not match the expected source');
 let parsed:unknown;try{const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);JSON.parse(text);rejectDuplicateJsonKeys(text);parsed=JSON.parse(text)}catch(error){if(error instanceof Error&&error.message.startsWith('Local reference packet:'))throw error;fail('packet is not valid UTF-8 JSON')}
 const root=fields(parsed,rootKeys,'packet');pending(root.schema,'vm-published-ultrasound-review-packet/1','schema');
 hash(root.sourceIntakeSha256,'source intake SHA-256');hash(root.revisionSha256,'revision');
 const article=fields(root.article,['title','author','year','journal','doi','url','htmlSha256'],'article');
 for(const key of ['title','author','journal','doi','url'])str(article[key],`article ${key}`);int(article.year,1900,2200,'article year');hash(article.htmlSha256,'article HTML SHA-256');
 const license=fields(root.license,['declared','url','copyright','assetSpecificReviewComplete','privacyClearance','clinicalApproval','publicationClearance','notice'],'licence');
 for(const key of ['declared','url','copyright','notice'])str(license[key],`licence ${key}`);
 for(const key of ['assetSpecificReviewComplete','privacyClearance','clinicalApproval','publicationClearance'])pending(license[key],false,`licence ${key}`);
 for(const key of ['reviewInboxImported','normalLearnerInventoryImported','readinessEnabled','patientSpaceRegistration','decisionWrites'])pending(root[key],false,key);
 const screen=fields(root.mainVisualScreen,['all5OriginalsViewedAtNativeResolution','visiblePersonalNameDateOrIdentifierObserved','meaning','figure4','figure6'],'visual screen');
 for(const key of ['all5OriginalsViewedAtNativeResolution','visiblePersonalNameDateOrIdentifierObserved'])if(typeof screen[key]!=='boolean')fail(`visual screen ${key} is invalid`);
 for(const key of ['meaning','figure4','figure6'])str(screen[key],`visual screen ${key}`);
 if(!Array.isArray(root.figures)||root.figures.length<1||root.figures.length>12)fail('figure count is outside limits');
 let total=0;const names=new Set<string>(),ids=new Set<string>(),numbers=new Set<number>();
 for(const raw of root.figures){
  const f=fields(raw,figureKeys,'figure'),number=int(f.figure,1,999,'figure number');
  const name=str(f.file,'figure file',120);
  if(!/^[A-Za-z0-9][A-Za-z0-9._-]*\.jpe?g$/i.test(name)||name.includes('..')||name.toLowerCase()==='review_packet.json')fail('figure filename is unsafe');
  if(names.has(name.toLowerCase())||numbers.has(number))fail('duplicate figure filename or number');names.add(name.toLowerCase());numbers.add(number);
  const id=str(f.id,'figure ID',300);if(ids.has(id))fail('duplicate figure ID');ids.add(id);
  hash(f.sha256,'figure SHA-256');total+=int(f.bytes,100,referenceLimits.imageBytes,'figure bytes');
  const width=int(f.widthPixels,1,referenceLimits.dimensions,'figure width'),height=int(f.heightPixels,1,referenceLimits.dimensions,'figure height');
  if(width*height>referenceLimits.pixels)fail('figure pixel count exceeds limit');
  for(const key of ['sourceUrl','title','draftPrompt','extent','changes'])str(f[key],`figure ${key}`,key==='draftPrompt'?8000:3000);
  if(f.rightsHold!==null)str(f.rightsHold,'rights hold');
  if(number===6&&f.rightsHold===null)fail('Figure 6 requires its additional schematic-origin hold');
  pending(f.clinicalReview,'not-reviewed','clinical review');pending(f.privacyReview,'not-reviewed','privacy review');pending(f.publication,'not-cleared','publication');
  for(const key of ['patientLaterality','fmaId','atlasStructureId','mask','imageTo3DTransform'])pending(f[key],null,key);
 }
 if(total>referenceLimits.totalBytes)fail('figure bytes exceed total limit');
 const revisionObject={...root};delete revisionObject.revisionSha256;
 const revision=await sha(new TextEncoder().encode(JSON.stringify(revisionObject)));abort(options.signal);
 if(revision!==root.revisionSha256)fail('packet revision does not match its fields');
 if(options.expectedRevision!==undefined&&hash(options.expectedRevision,'expected revision')!==revision)fail('packet revision does not match the expected source');
 return {packet:parsed as ReviewPacket,packetSha256};
}
function path(file:LocalReviewFile){const raw=file.webkitRelativePath;
 if(typeof raw!=='string'||!raw||raw.length>300||CONTROL.test(raw)||raw.includes('\\')||raw.startsWith('/')||/^[A-Za-z]:/.test(raw))fail('select one local folder');
 const parts=raw.split('/');if(parts.length!==2||parts.some(part=>!part||part==='.'||part==='..'||part.includes(':'))||parts[1]!==file.name)fail('folder must contain packet and JPEGs directly');
 return {folder:parts[0],name:parts[1]};
}
function jpegDimensions(bytes:Uint8Array){
 if(bytes.length<100||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)fail('image is not a complete JPEG');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let pos=2,width=0,height=0,scan=false;
 for(let count=0;count<2048&&pos<bytes.length;count++){
  if(bytes[pos++]!==255)fail('invalid JPEG marker');while(bytes[pos]===255)pos++;
  const marker=bytes[pos++];if(marker===0xda){scan=true;break}if(marker===0xd9||marker===undefined)break;
  if(marker===1||(marker>=0xd0&&marker<=0xd7))continue;
  if(pos+2>bytes.length)fail('truncated JPEG segment');const len=view.getUint16(pos);
  if(len<2||pos+len>bytes.length)fail('invalid JPEG segment');
  if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
   if(len<8||width)fail('invalid JPEG dimensions');height=view.getUint16(pos+3);width=view.getUint16(pos+5);
  }pos+=len;
 }
 if(!scan||!width||!height)fail('JPEG dimensions are missing');return {width,height};
}
export async function loadLocalReferencePacket(files:readonly LocalReviewFile[],options:{expectedRevision?:string;expectedPacketSha256?:string;signal?:AbortSignal}={}):Promise<LoadedReferencePacket>{
 abort(options.signal);
 if(!Array.isArray(files)||files.length<2||files.length>referenceLimits.files)fail('choose a packet folder within file-count limits');
 const found=new Map<string,LocalReviewFile>(),folded=new Set<string>();let folder:string|undefined;
 for(const file of files){if(!file||typeof file.arrayBuffer!=='function'||!Number.isSafeInteger(file.size))fail('invalid local file');
  const p=path(file);if(folder===undefined)folder=p.folder;else if(folder!==p.folder)fail('select exactly one folder');
  const key=p.name.toLowerCase();if(folded.has(key))fail('duplicate or case-ambiguous filename');folded.add(key);
  const companion=p.name==='review.html'||p.name==='THIRD_PARTY_NOTICES.txt';
  if(p.name!=='REVIEW_PACKET.json'&&!companion&&!/^[A-Za-z0-9][A-Za-z0-9._-]*\.jpe?g$/i.test(p.name))fail('unexpected file in folder');
  const max=p.name==='REVIEW_PACKET.json'?referenceLimits.packetBytes:companion?referenceLimits.companionBytes:referenceLimits.imageBytes;
  if(file.size<1||file.size>max)fail('file size is outside limits');found.set(p.name,file);
 }
 const manifest=found.get('REVIEW_PACKET.json');if(!manifest)fail('REVIEW_PACKET.json is missing');
 const manifestBytes=await manifest.arrayBuffer();abort(options.signal);if(manifestBytes.byteLength!==manifest.size)fail('packet size changed during read');
 const {packet,packetSha256}=await parseLocalReferencePacket(manifestBytes,options);abort(options.signal);
 const companions=Number(found.has('review.html'))+Number(found.has('THIRD_PARTY_NOTICES.txt'));
 if(found.size!==packet.figures.length+1+companions)fail('folder has missing or extra figures');
 const urls:Record<string,string>=Object.create(null);let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;for(const url of Object.values(urls))URL.revokeObjectURL(url)};
 try{
  if(typeof createImageBitmap!=='function')fail('browser cannot verify JPEG dimensions');
  for(const figure of packet.figures){abort(options.signal);const file=found.get(figure.file);
   if(!file||file.size!==figure.bytes)fail('figure is missing or byte count differs');
   const buffer=await file.arrayBuffer();abort(options.signal);if(buffer.byteLength!==file.size)fail('figure size changed during read');
   const bytes=new Uint8Array(buffer),encoded=jpegDimensions(bytes);
   if(encoded.width!==figure.widthPixels||encoded.height!==figure.heightPixels)fail('encoded JPEG dimensions differ');
   if(await sha(buffer)!==figure.sha256)fail('figure SHA-256 differs');abort(options.signal);
   const blob=new Blob([buffer],{type:'image/jpeg'});let bitmap:ImageBitmap|null=null;
   try{bitmap=await createImageBitmap(blob);abort(options.signal);if(bitmap.width!==encoded.width||bitmap.height!==encoded.height)fail('decoded JPEG dimensions differ')}
   catch(error){if(error instanceof DOMException&&error.name==='AbortError')throw error;fail('JPEG could not be decoded with expected dimensions')}
   finally{bitmap?.close()}
   abort(options.signal);urls[figure.file]=URL.createObjectURL(blob);
  }
  abort(options.signal);return {packet,packetSha256,images:Object.freeze(urls),dispose};
 }catch(error){dispose();throw error}
}
