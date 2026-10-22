// A timer yield lets browser input cancel a large verified surface while it is
// being validated. Small surfaces finish in the current turn.
export const HEAD_SURFACE_CHUNK_SCALARS=262144;

function abort(signal?:AbortSignal){
  if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');
}

async function validateChunks(length:number,check:(index:number)=>void,signal?:AbortSignal){
  abort(signal);
  for(let start=0;start<length;start+=HEAD_SURFACE_CHUNK_SCALARS){
    if(start>0){await new Promise<void>(resolve=>setTimeout(resolve,0));abort(signal);}
    const end=Math.min(start+HEAD_SURFACE_CHUNK_SCALARS,length);
    for(let index=start;index<end;index++)check(index);
  }
  abort(signal);
}

/** Inspect the original typed arrays in place; never transform or copy them. */
export async function validateHeadSurface(
  positions:Float32Array|Float64Array,
  indices:Uint16Array|Uint32Array,
  pointCount:number,
  signal?:AbortSignal,
):Promise<void>{
  await validateChunks(positions.length,index=>{
    const value=positions[index];
    if(!Number.isFinite(value)||Math.abs(value)>100000)throw new Error('Invalid world-space surface point.');
  },signal);
  await validateChunks(indices.length,index=>{
    if(indices[index]>=pointCount)throw new Error('Surface index is out of bounds.');
  },signal);
}
