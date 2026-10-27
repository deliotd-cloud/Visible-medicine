export type HeadLearningDiscoveryFilter={view:'all'|'3D'|'CT'|'MRI';query:string;region?:string;headPage?:number;regionalPage?:number};

const MAX_CATALOGUE_PAGE=1000;
function parsePage(value:string|string[]|undefined):number|null{
  if(typeof value!=='string'||!/^[1-9]\d{0,3}$/.test(value))return null;
  const page=Number(value);
  return page<=MAX_CATALOGUE_PAGE?page:null;
}

/** Catalogue filters only. Never transport study identity, access or scan data. */
export function parseHeadLearningDiscovery(params:Record<string,string|string[]|undefined>,allowedRegionIds?:readonly string[]):HeadLearningDiscoveryFilter|null{
  if(!params||typeof params!=='object'||Array.isArray(params))return null;
  if(Object.entries(params).some(([key,value])=>value!==undefined&&key!=='view'&&key!=='q'&&key!=='headPage'&&key!=='regionalPage'&&!(key==='region'&&allowedRegionIds)))return null;
  const view=Object.hasOwn(params,'view')?params.view:undefined;
  const query=Object.hasOwn(params,'q')?params.q:undefined;
  const region=Object.hasOwn(params,'region')?params.region:undefined;
  const headPage=Object.hasOwn(params,'headPage')?parsePage(params.headPage):undefined;
  const regionalPage=Object.hasOwn(params,'regionalPage')?parsePage(params.regionalPage):undefined;
  if(headPage===null||regionalPage===null)return null;
  if(view!==undefined&&view!=='all'&&view!=='3D'&&view!=='CT'&&view!=='MRI')return null;
  if(query!==undefined&&(typeof query!=='string'||query.length>120||/[\u0000-\u001f\u007f-\u009f]/.test(query)))return null;
  if(region!==undefined&&(!allowedRegionIds||typeof region!=='string'||(region!=='all'&&!allowedRegionIds.includes(region))))return null;
  const filter:HeadLearningDiscoveryFilter={view:view??'all',query:(query??'').trim().replace(/\s+/g,' ')};
  if(region!==undefined)filter.region=region;
  if(headPage!==undefined)filter.headPage=headPage;
  if(regionalPage!==undefined)filter.regionalPage=regionalPage;
  return filter;
}
