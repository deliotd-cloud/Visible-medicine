import catalogue from '../public/models/fda-shoulder-draft/catalog.json';
import {fdaReferenceCatalogueSha256} from './fda-shoulder-reference';
type Params=Record<string,string|string[]|undefined>;
/** The empty source inspector is distinct from an exact linked selection. */
export function parseFdaReferenceSelection(params:Params):{selectedId?:string;expectedRevision:string}|null{
 const keys=Object.keys(params);
 if(!keys.length)return {expectedRevision:fdaReferenceCatalogueSha256};
 if(keys.length!==2||!keys.includes('structure')||!keys.includes('referenceRevision')||typeof params.structure!=='string'||typeof params.referenceRevision!=='string')return null;
 if(params.referenceRevision!==fdaReferenceCatalogueSha256||!catalogue.structures.some(s=>s.id===params.structure))return null;
 return {selectedId:params.structure,expectedRevision:fdaReferenceCatalogueSha256};
}
