import {sha256} from '@noble/hashes/sha2.js';

export const HEAD_ASSET_HASH_CHUNK_BYTES = 1024 * 1024;

function abort(signal?:AbortSignal){
  if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');
}

/** Hash the retained asset buffer through bounded views, yielding between large batches. */
export async function sha256HeadAsset(bytes:ArrayBuffer,signal?:AbortSignal):Promise<string>{
  abort(signal);
  const hash=sha256.create();
  try{
    const input=new Uint8Array(bytes);
    const cooperative=input.byteLength>HEAD_ASSET_HASH_CHUNK_BYTES;
    for(let offset=0;offset<input.byteLength;offset+=HEAD_ASSET_HASH_CHUNK_BYTES){
      abort(signal);
      hash.update(input.subarray(offset,Math.min(offset+HEAD_ASSET_HASH_CHUNK_BYTES,input.byteLength)));
      if(cooperative){
        await new Promise<void>(resolve=>setTimeout(resolve,0));
        abort(signal);
      }
    }
    abort(signal);
    const digest=hash.digest();
    return Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
  }catch(error){
    hash.destroy();
    throw error;
  }
}
