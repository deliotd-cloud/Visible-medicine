import {atlasModules} from './catalog';
import {searchAtlasStructureLearning} from './atlas-structure-search';
import {searchEducation} from './platform-governance';
import {filterSearchKind,normalizeSearchQuery,type SearchKind} from './search-kind';

type Results=Awaited<ReturnType<typeof searchEducation>>;
export type PublicEducationSearch={results:Results;availability:'complete'|'partial'};

/** Keep source-bound public anatomy findable when the publication database fails. */
export async function searchPublicEducation(queryValue:string,kind:SearchKind):Promise<PublicEducationSearch>{
  const query=normalizeSearchQuery(queryValue);
  if(query.length<2)return {results:[],availability:'complete'};
  try{
    return {results:await searchEducation(query,kind),availability:'complete'};
  }catch{
    if(kind==='cases'||kind==='courses'||kind==='workbooks')return {results:[],availability:'partial'};
    const normalizedQuery=query.replace(/[%_]/g,'').toLowerCase().trim();
    if(normalizedQuery.length<2)return {results:[],availability:'partial'};
    // A source-constructor failure is separate from repository unavailability;
    // let it surface rather than inventing or silently replacing an anatomy link.
    const staticResults=[
      ...searchAtlasStructureLearning(normalizedQuery),
      ...atlasModules.filter(item=>[item.title,item.region,item.modality,item.description,...item.systems]
        .join(' ').toLowerCase().includes(query.toLowerCase()))
        .map(item=>({kind:'Atlas',title:item.title,summary:item.description,
          href:`/atlas/${item.slug}`,meta:`${item.modality} · ${item.region}`})),
    ];
    return {results:filterSearchKind(staticResults,kind).slice(0,30),availability:'partial'};
  }
}
