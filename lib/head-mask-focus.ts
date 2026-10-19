// Yield to browser input between bounded runs; a Promise-only yield would still
// starve Close atlas / replacement events on the main thread.
export const HEAD_MASK_CHUNK_VOXELS=262144;

function abort(signal?:AbortSignal){
  if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');
}

/** Validate without changing bytes; retain the first closest occupied voxel.
 * This is a display focus, not a new mask boundary or anatomical landmark.
 */
export async function findHeadMaskFocus(mask:Uint8Array,shape:readonly number[],signal?:AbortSignal):Promise<number>{
  abort(signal);
  if(shape.length!==3||shape.some(n=>!Number.isSafeInteger(n)||n<1)||shape.reduce((a,b)=>a*b,1)!==mask.length)
    throw new Error('Mask dimensions do not match the verified buffer.');
  const [K,J,I]=shape;
  let best=-1,bestDistance=Infinity;
  for(let start=0;start<mask.length;start+=HEAD_MASK_CHUNK_VOXELS){
    if(start>0){await new Promise<void>(resolve=>setTimeout(resolve,0));abort(signal);}
    const end=Math.min(start+HEAD_MASK_CHUNK_VOXELS,mask.length);
    for(let n=start;n<end;n++){
      const value=mask[n];
      if(value!==0&&value!==1)throw new Error('The approved mask must be binary.');
      if(value===0)continue;
      const i=n%I,j=Math.floor(n/I)%J,k=Math.floor(n/(I*J));
      const distance=(i-I/2)**2+(j-J/2)**2+(k-K/2)**2;
      if(distance<bestDistance){best=n;bestDistance=distance;}
    }
  }
  abort(signal);
  return best;
}
