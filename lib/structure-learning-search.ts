import {createLectureAnatomyReference,lectureAnatomyOptions} from './lecture-anatomy-reference.ts';
import {relatedLectureHref} from './lecture-related-links.ts';

export const STRUCTURE_LEARNING_SEARCH_LIMIT=12;
export type StructureLearningSearchRow={
  kind:'Anatomy concept';title:string;summary:string;href:string;meta:string;
};

const terms=(value:string)=>value.toLocaleLowerCase('en').match(/[\p{L}\p{N}]+/gu)??[];
const words=(value:string)=>terms(value.normalize('NFKC'));

function rank(query:string,queryWords:string[],label:string,id:string):number|null{
  const normalizedLabel=label.normalize('NFKC').toLocaleLowerCase('en');
  const idWords=words(id),labelWords=words(label);
  const joinedId=idWords.join(' '),joinedLabel=labelWords.join(' ');
  if(query===normalizedLabel||query===joinedLabel)return 0;
  if(query===id.toLowerCase()||query===joinedId)return 1;
  if(joinedLabel.startsWith(queryWords.join(' ')))return 2;
  if(joinedId.startsWith(queryWords.join(' ')))return 3;
  if(queryWords.every(term=>labelWords.some(word=>word.startsWith(term))))return 4;
  if(queryWords.every(term=>idWords.some(word=>word.startsWith(term))))return 5;
  return null;
}

/** Public concept navigation only. Every result is re-pinned through current constructors. */
export function searchStructureLearning(queryValue:unknown):StructureLearningSearchRow[]{
  if(typeof queryValue!=='string')return [];
  const query=queryValue.normalize('NFKC').trim().slice(0,80).replace(/[%_]/g,'').toLocaleLowerCase('en').trim();
  const queryWords=words(query);
  if(queryWords.join('').length<2)return [];
  const found:Array<{score:number;id:string;row:StructureLearningSearchRow}>=[];
  const seen=new Set<string>();
  for(const option of lectureAnatomyOptions()){
    if(seen.has(option.conceptId))continue;
    seen.add(option.conceptId);
    const score=rank(query,queryWords,option.label,option.conceptId);
    if(score===null)continue;
    const reference=createLectureAnatomyReference(option.conceptId);
    if(!reference)continue;
    const href=relatedLectureHref(reference.conceptId,reference.headRevision);
    if(!href)continue;
    const imageOnly=reference.kind==='head-image-concept-v1';
    found.push({score,id:option.conceptId,row:{
      kind:'Anatomy concept',title:option.label,
      summary:imageOnly?'CT/MRI reference concept across separate, unregistered images.':'Anatomy reference concept for 3D Atlas and related learning navigation.',
      href,meta:imageOnly?'CT/MRI concept reference':'3D Atlas concept reference',
    }});
  }
  found.sort((a,b)=>a.score-b.score||a.row.title.localeCompare(b.row.title,'en')||a.id.localeCompare(b.id,'en'));
  return found.slice(0,STRUCTURE_LEARNING_SEARCH_LIMIT).map(item=>item.row);
}
