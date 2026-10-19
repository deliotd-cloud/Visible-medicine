import {HEAD_MANIFEST_SHA256,openValidatedHeadPackage,safeHeadPackagePath,voxelCount,type HeadManifest,type HeadPackageAsset,type LocalHeadPackage} from './head-atlas-import.ts';
import {notifyHeadProgress,type HeadReadObserver} from './head-load-progress.ts';

const MANIFEST_LIMIT=16777216;
const ASSET_COPY_BUDGET=1048576;
const ASSET_READ_BUDGET=256;
const IMAGE_LIMIT=536870912;
const MASK_LIMIT=134217728;
const MESH_LIMIT=50331648;
const widths:Record<string,number>={uint8:1,int8:1,uint16:2,int16:2,uint32:4,int32:4,float32:4,float64:8};
const localHosts=new Set(['localhost','127.0.0.1','[::1]']);
type Fetcher=typeof fetch;

function cancelled(signal?:AbortSignal){if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');}
function sourceError():Error{return new Error('The local head source could not be read. Check the local preview and try again.');}
function declaredSize(count:number,width:number,limit:number):number{
  const size=count*width;
  if(!Number.isSafeInteger(size)||size<1||size>limit)throw new Error('A required asset is missing or too large.');
  return size;
}
function width(dtype:string,allowed:string[]):number{
  if(!allowed.includes(dtype)||!widths[dtype])throw new Error('Unsupported scalar data type.');
  return widths[dtype];
}
async function readBounded(response:Response,limit:number,signal?:AbortSignal):Promise<ArrayBuffer>{
  cancelled(signal);
  const contentLength=response.headers.get('content-length');
  if(contentLength!==null&&(!/^\d+$/.test(contentLength)||Number(contentLength)>limit))throw new Error('A required asset is missing or too large.');
  if(!response.body){const bytes=await response.arrayBuffer();cancelled(signal);if(bytes.byteLength>limit)throw new Error('A required asset is missing or too large.');return bytes;}
  const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  const onAbort=()=>{void reader.cancel().catch(()=>{});};
  signal?.addEventListener('abort',onAbort,{once:true});
  try{
    for(;;){cancelled(signal);const {done,value}=await reader.read();cancelled(signal);if(done)break;
      size+=value.byteLength;if(size>limit)throw new Error('A required asset is missing or too large.');chunks.push(value);
    }
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes.buffer;
  }catch(error){cancelled(signal);if(error instanceof Error&&error.message==='A required asset is missing or too large.')throw error;throw sourceError();}
  finally{signal?.removeEventListener('abort',onAbort);if(signal?.aborted||size>limit)void reader.cancel().catch(()=>{});reader.releaseLock();}
}
// Asset lengths come from the pinned, validated manifest. Keep only the final
// destination in memory while still reading to EOF to reject a late extra chunk.
async function readExactAsset(response:Response,size:number,signal?:AbortSignal,onProgress?:HeadReadObserver):Promise<ArrayBuffer>{
  cancelled(signal);
  const contentLength=response.headers.get('content-length');
  if(contentLength!==null&&(!/^\d+$/.test(contentLength)||!Number.isSafeInteger(Number(contentLength))||Number(contentLength)!==size)){
    void response.body?.cancel().catch(()=>{});
    throw new Error('A required asset is missing or too large.');
  }
  let lastPercent=-1;
  const report=(loadedBytes:number)=>{
    if(!onProgress||signal?.aborted)return;
    const percent=Math.floor(loadedBytes/size*100);if(percent===lastPercent)return;
    lastPercent=percent;notifyHeadProgress(onProgress,{loadedBytes,totalBytes:size});
  };
  report(0);if(signal?.aborted){void response.body?.cancel().catch(()=>{});cancelled(signal);}
  if(!response.body){
    const bytes=await response.arrayBuffer();cancelled(signal);
    if(bytes.byteLength!==size)throw new Error('A required asset is missing or too large.');
    report(size);cancelled(signal);
    return bytes;
  }
  const bytes=new Uint8Array(size);
  const reader=response.body.getReader();let offset=0,copiedSinceYield=0,readsSinceYield=0,complete=false,cancellationRequested=false;
  const cancelReader=()=>{if(cancellationRequested)return;cancellationRequested=true;void reader.cancel().catch(()=>{});};
  const onAbort=cancelReader;
  const yieldToTimer=async()=>{
    cancelled(signal);
    await new Promise<void>(resolve=>setTimeout(resolve,0));
    cancelled(signal);copiedSinceYield=0;readsSinceYield=0;
  };
  signal?.addEventListener('abort',onAbort,{once:true});
  try{
    for(;;){
      cancelled(signal);
      const {done,value}=await reader.read();cancelled(signal);
      if(done){if(offset!==size)throw new Error('A required asset is missing or too large.');complete=true;return bytes.buffer;}
      if(!(value instanceof Uint8Array)||value.byteLength>size-offset)throw new Error('A required asset is missing or too large.');
      readsSinceYield++;
      for(let copied=0;copied<value.byteLength;){
        const count=Math.min(value.byteLength-copied,ASSET_COPY_BUDGET-copiedSinceYield);
        bytes.set(value.subarray(copied,copied+count),offset);
        copied+=count;offset+=count;copiedSinceYield+=count;
        if(copiedSinceYield===ASSET_COPY_BUDGET){
          report(offset);
          await yieldToTimer();
        }
      }
      report(offset);cancelled(signal);
      if(readsSinceYield===ASSET_READ_BUDGET)await yieldToTimer();
    }
  }catch(error){
    cancelled(signal);
    if(error instanceof Error&&error.message==='A required asset is missing or too large.')throw error;
    throw sourceError();
  }finally{
    signal?.removeEventListener('abort',onAbort);
    if(!complete)cancelReader();
    reader.releaseLock();
  }
}
function localUrl(origin:string,path:string):string{
  const url=new URL(origin);if(url.protocol!=='http:'||!localHosts.has(url.hostname)||url.username||url.password)throw new Error('The local head source is available only in a loopback preview.');
  return new URL(path,url).toString();
}
async function get(fetcher:Fetcher,url:string,signal?:AbortSignal):Promise<Response>{
  cancelled(signal);
  try{return await fetcher(url,{method:'GET',headers:{'X-Visible-Medicine-Local':'1'},credentials:'same-origin',mode:'same-origin',redirect:'error',cache:'no-store',signal});}
  catch(error){cancelled(signal);if(error instanceof DOMException&&error.name==='AbortError')throw error;throw sourceError();}
}
function requireLocalResponse(response:Response):void{
  if(!response.ok||response.headers.get('x-visible-medicine-local')!=='1')throw sourceError();
}

/** Test seam: the product entry point below always supplies the fixed approved manifest hash. */
export async function openHeadPackageFromLocalSource(fetcher:Fetcher,origin:string,expectedHash:string,signal?:AbortSignal):Promise<LocalHeadPackage|null>{
  const base=localUrl(origin,'/__vm-local-head/manifest.json');
  const response=await get(fetcher,base,signal);
  if(response.status===404)return null;
  requireLocalResponse(response);
  const bytes=await readBounded(response,MANIFEST_LIMIT,signal);
  // Validate the exact release and inventory before exposing any lazy asset.
  const pkg=await openValidatedHeadPackage(bytes,new Map(),expectedHash);cancelled(signal);
  const specs=new Map<string,{size:number;hash:string}>();const seen=new Map<string,string>();
  const add=(path:string,hash:string,size:number)=>{
    path=safeHeadPackagePath(path);if(path==='manifest.json'||!Number.isSafeInteger(size))throw sourceError();
    const key=path.toLowerCase(),prior=seen.get(key);if(prior&&prior!==path)throw new Error('Duplicate package path.');seen.set(key,path);
    const previous=specs.get(path);if(previous&&(previous.size!==size||previous.hash!==hash))throw sourceError();
    specs.set(path,{size,hash});if(specs.size>4999)throw sourceError();
  };
  const manifest:HeadManifest=pkg.manifest;
  for(const modality of ['CT','MRI'] as const){
    const study=manifest.studies[modality],image=study.image;
    add(image.file,image.sha256,declaredSize(voxelCount(image.shape_kji),width(image.dtype,Object.keys(widths)),IMAGE_LIMIT));
    for(const entry of study.entries){
      if(entry.mask){const mask=entry.mask;add(mask.file,mask.sha256,declaredSize(voxelCount(mask.shape_kji),width(mask.dtype,['uint8']),MASK_LIMIT));}
      if(entry.mesh){const mesh=entry.mesh;
        if(!Number.isSafeInteger(mesh.point_count)||mesh.point_count<1||mesh.point_count>2000000||!Number.isSafeInteger(mesh.triangle_count)||mesh.triangle_count<1||mesh.triangle_count>4000000)throw new Error('Unsupported surface size.');
        add(mesh.positions_file,mesh.positions_sha256,declaredSize(mesh.point_count*3,width(mesh.positions_dtype,['float32','float64']),MESH_LIMIT));
        add(mesh.indices_file,mesh.indices_sha256,declaredSize(mesh.triangle_count*3,width(mesh.indices_dtype,['uint16','uint32']),MESH_LIMIT));
      }
    }
  }
  const files=new Map<string,HeadPackageAsset>();
  for(const [path,spec] of specs)files.set(path,{
    size:spec.size,
    async arrayBuffer(assetSignal?:AbortSignal,onProgress?:HeadReadObserver){
      cancelled(signal);cancelled(assetSignal);
      const controller=new AbortController();const forward=()=>controller.abort();
      signal?.addEventListener('abort',forward,{once:true});assetSignal?.addEventListener('abort',forward,{once:true});
      if(signal?.aborted||assetSignal?.aborted)controller.abort();
      try{
        const url=localUrl(origin,`/__vm-local-head/asset?path=${encodeURIComponent(path)}`);
        const assetResponse=await get(fetcher,url,controller.signal);requireLocalResponse(assetResponse);
        const data=await readExactAsset(assetResponse,spec.size,controller.signal,onProgress);
        cancelled(signal);cancelled(assetSignal);return data;
      }finally{signal?.removeEventListener('abort',forward);assetSignal?.removeEventListener('abort',forward);}
    },
  });
  return {...pkg,files,source:'configured-local'};
}

export function openConfiguredHeadPackage(signal?:AbortSignal):Promise<LocalHeadPackage|null>{
  if(typeof window==='undefined')throw new Error('The local head source requires a browser preview.');
  return openHeadPackageFromLocalSource(fetch,window.location.origin,HEAD_MANIFEST_SHA256,signal);
}
