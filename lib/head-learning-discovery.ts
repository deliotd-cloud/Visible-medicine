export type HeadLearningDiscoveryFilter={view:'all'|'3D'|'CT'|'MRI';query:string};

/** Catalogue filters only. Never transport study identity, access or scan data. */
export function parseHeadLearningDiscovery(params:Record<string,string|string[]|undefined>):HeadLearningDiscoveryFilter|null{
  if(!params||typeof params!=='object'||Array.isArray(params))return null;
  if(Object.entries(params).some(([key,value])=>value!==undefined&&key!=='view'&&key!=='q'))return null;
  const view=Object.hasOwn(params,'view')?params.view:undefined;
  const query=Object.hasOwn(params,'q')?params.q:undefined;
  if(view!==undefined&&view!=='all'&&view!=='3D'&&view!=='CT'&&view!=='MRI')return null;
  if(query!==undefined&&(typeof query!=='string'||query.length>120||/[\u0000-\u001f\u007f-\u009f]/.test(query)))return null;
  return {view:view??'all',query:(query??'').trim().replace(/\s+/g,' ')};
}
