import {searchStructureLearning,STRUCTURE_LEARNING_SEARCH_LIMIT,type StructureLearningSearchRow} from './structure-learning-search.ts';
import {searchBodyStructuresWithIdentity} from './body-structure-search.ts';
import {createLectureAnatomyReference} from './lecture-anatomy-reference.ts';
import {relatedLectureHref} from './lecture-related-links.ts';

/** Only identical root selections coalesce; a nested head part is not its parent mesh. */
function currentHeadRoot(row:StructureLearningSearchRow):string|null{
  if(!row.learningHref)return null;
  const related=new URL(row.learningHref,'https://atlas.invalid');
  const concept=related.searchParams.get('concept');
  if(!concept)return null;
  const reference=createLectureAnatomyReference(concept);
  if(!reference||reference.kind!=='head-concept-v1'||
    row.href!==reference.atlasTarget||
    row.learningHref!==relatedLectureHref(concept,reference.headRevision))return null;
  const target=new URL(reference.atlasTarget,'https://atlas.invalid');
  const p=target.searchParams;
  if(target.pathname!=='/atlas/head-neck-3d'||p.get('study')!=='1'||
    ['focus','detail','part','partSource'].some(key=>p.has(key)))return null;
  const id=p.get('structure'),source=p.get('source'),side=p.get('side');
  return id&&source&&side?JSON.stringify([id,source,side]):null;
}

/** Shared anatomy budget keeps search concise without changing published-resource access. */
export function searchAtlasStructureLearning(value:unknown):StructureLearningSearchRow[]{
  const head=searchStructureLearning(value);
  const roots=new Set(head.map(currentHeadRoot).filter((key):key is string=>key!==null));
  const body=searchBodyStructuresWithIdentity(value).filter(({row,identity})=>{
    const p=new URL(row.href,'https://atlas.invalid').searchParams;
    return !roots.has(JSON.stringify([identity.structureId,p.get('source'),p.get('side')]));
  }).map(result=>result.row);
  return [...head,...body].slice(0,STRUCTURE_LEARNING_SEARCH_LIMIT);
}
