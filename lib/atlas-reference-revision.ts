const SOURCE_REVISION=/^[a-f0-9]{40}$/;

/** Optional source pin for public 3D navigation; it is not clinical approval. */
export function atlasReferenceRevisionCurrent(
  params:Record<string,string|string[]|undefined>,currentRevision:string,
):boolean{
  if(!params||typeof params!=='object'||Array.isArray(params)||typeof currentRevision!=='string'||!SOURCE_REVISION.test(currentRevision))return false;
  if(!Object.hasOwn(params,'atlasRevision'))return true;
  const requested=params.atlasRevision;
  return typeof requested==='string'&&SOURCE_REVISION.test(requested)&&requested===currentRevision;
}
