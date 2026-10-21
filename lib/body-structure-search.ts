import reviewManifest from '@/atlas-review/manifest.json';
import runtimeManifest from '@/public/atlas-runtime/head-neck/manifest.json';
import publicCatalog from '@/public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json';
import importedCatalog from '@/atlas-review/public/models/bodyparts3d/full-body/catalog.json';
import {bodyDisplayCatalog} from '@/atlas-review/lib/body-display-catalog';
import {anatomySearchWordMatches,joinAnatomyHyphens,normalizeAnatomySearch,structureSearchAliases} from '@/atlas-review/lib/anatomy-search';
import {makeStudyLink,type StudySide} from '@/atlas-review/lib/study-links';
import type {BodyCatalog,BodyStructure} from '@/atlas-review/app/body-types';
import {atlasBodyRegions} from '@/lib/atlas-navigation';
import type {StructureLearningSearchRow} from '@/lib/structure-learning-search';
import {createLectureBodyReference} from './lecture-body-reference.ts';
import {bodyRelatedLectureHref} from './lecture-body-related-links.ts';

export const BODY_STRUCTURE_SEARCH_LIMIT=12;
const hex40=/^[a-f0-9]{40}$/;
const hex64=/^[a-f0-9]{64}$/;
type SearchItem={structure:BodyStructure;label:string;labelKey:string;sourceKey:string;idKey:string;fmaKey:string;aliases:string[]};
type Candidate={item:SearchItem;rank:number};
type SearchIndex={catalog:BodyCatalog;revision:string;items:SearchItem[]};

/** Exact source identity for the coordinator's head/body duplicate reconciliation. */
export type BodyStructureSearchIdentity={structureId:string;fmaId:string;sourceRevision:string};
export type BodyStructureSearchResult={row:StructureLearningSearchRow;identity:BodyStructureSearchIdentity};

let cached:SearchIndex|null|undefined;
function currentIndex():SearchIndex|null{
  if(cached!==undefined)return cached;
  cached=null;
  const revision=runtimeManifest.sourceCommit;
  if(typeof revision!=='string'||!hex40.test(revision)||reviewManifest.revision!==revision)return null;
  const runtimeFile=runtimeManifest.files.find(file=>file.path==='models/bodyparts3d/full-body/catalog.json');
  const reviewFile=reviewManifest.files.find(file=>file.path==='public/models/bodyparts3d/full-body/catalog.json');
  if(!runtimeFile||!reviewFile||!hex64.test(runtimeFile.sha256)||
    runtimeFile.sha256!==reviewFile.sourceSha256||runtimeFile.sha256!==reviewFile.importedSha256||
    JSON.stringify(publicCatalog)!==JSON.stringify(importedCatalog))return null;
  try{
    const catalog=bodyDisplayCatalog(importedCatalog as unknown as BodyCatalog);
    const validRegions=new Set<string>(atlasBodyRegions.map(region=>region.id));
    const seen=new Set<string>();
    if(!catalog.structures.length||catalog.sourceVersion!==publicCatalog.sourceVersion||
      catalog.structures.some(s=>!s.id||seen.has(s.id)||!seen.add(s.id)||
        !validRegions.has(s.region)||!s.regions.includes(s.region)||
        !catalog.bundles.some(bundle=>bundle.id===s.bundle&&hex64.test(bundle.sha256))))return null;
    cached={catalog,revision,items:catalog.structures.map(structure=>({
      structure,label:structure.name,
      labelKey:normalizeAnatomySearch(joinAnatomyHyphens(structure.name)),
      sourceKey:normalizeAnatomySearch(joinAnatomyHyphens(structure.sourceName)),
      idKey:normalizeAnatomySearch(structure.id),fmaKey:normalizeAnatomySearch(structure.fmaId),
      aliases:structureSearchAliases(structure).map(alias=>normalizeAnatomySearch(alias)),
    }))};
    return cached;
  }catch{return null;}
}

function allWords(text:string,words:string[]):boolean{
  return words.every(word=>anatomySearchWordMatches(text,word));
}
function score(item:SearchItem,needle:string,words:string[]):number|null{
  if(item.labelKey===needle)return 0;
  if(item.fmaKey===needle||item.idKey===needle)return 1;
  if(item.aliases.includes(needle))return 2;
  const side=item.structure.laterality;
  if((side==='left'||side==='right')&&item.aliases.includes(needle.replace(new RegExp(`^${side} `),'')))return 2;
  if(item.labelKey.startsWith(needle))return 3;
  if(allWords(item.labelKey,words))return 4;
  if(item.sourceKey===needle||item.sourceKey.startsWith(needle)||allWords(item.sourceKey,words))return 5;
  if(item.aliases.some(alias=>alias.startsWith(needle)||allWords(`${side} ${alias}`,words)))return 6;
  if(allWords(item.idKey,words)||allWords(item.fmaKey,words))return 7;
  return null;
}

/** Public source labels and source-bound Atlas navigation only. No review material or image mapping. */
export function searchBodyStructuresWithIdentity(value:unknown):BodyStructureSearchResult[]{
  if(typeof value!=='string'||value.length>80||/[\p{C}%_*<>]/u.test(value))return [];
  const needle=normalizeAnatomySearch(value);
  if(needle.replace(/\s/g,'').length<2)return [];
  const index=currentIndex();if(!index)return [];
  const words=needle.split(' ').filter(Boolean);
  const candidates:Candidate[]=[];
  for(const item of index.items){const rank=score(item,needle,words);if(rank!==null)candidates.push({item,rank});}
  candidates.sort((a,b)=>a.rank-b.rank||a.item.label.localeCompare(b.item.label,'en')||a.item.structure.id.localeCompare(b.item.structure.id,'en'));
  const rows:BodyStructureSearchResult[]=[];
  for(const {item} of candidates){
    if(rows.length===BODY_STRUCTURE_SEARCH_LIMIT)break;
    const s=item.structure,side:StudySide=s.laterality==='left'||s.laterality==='right'?s.laterality:'both';
    const study=makeStudyLink(index.catalog,s.region,s.id,side);
    if(!study)continue;
    const parsed=new URL(study,'https://atlas.invalid');
    if(parsed.pathname!==(s.region==='whole-body'?'/':`/regions/${s.region}`))continue;
    const source=parsed.searchParams.get('source');
    if(!source||!hex64.test(source))continue;
    const href='/atlas/3d?'+new URLSearchParams({region:s.region,atlasRevision:index.revision,
      study:'1',structure:s.id,side,source}).toString();
    const learningHref=bodyRelatedLectureHref(createLectureBodyReference(s.id));
    rows.push({
      identity:{structureId:s.id,fmaId:s.fmaId,sourceRevision:index.revision},
      row:{kind:'Anatomy concept',title:item.label,
        summary:s.representation?.coverage==='partial'
          ?`Partial source representation. ${s.representation.description}`
          :'Source-based 3D anatomy reference; anatomical review pending.',
        href,meta:`3D Atlas · ${s.fmaId} · ${s.region}`,
        ...(learningHref?{learningHref}:{})},
    });
  }
  return rows;
}
export function searchBodyStructures(value:unknown):StructureLearningSearchRow[]{
  return searchBodyStructuresWithIdentity(value).map(result=>result.row);
}
