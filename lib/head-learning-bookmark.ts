import {HEAD_LINK_REVISION} from './head-atlas-links.ts';
import {headLearningNavigation,headLearningSequencesForModality,type HeadLearningPosition,HEAD_LEARNING_REVISION} from './head-atlas-learning.ts';
import {headLinksCurrent} from './head-link-availability.ts';
import {headMriLearningSequences,HEAD_MRI_LEARNING_REVISION} from './head-mri-learning.ts';
import {headInsulaLearningSequences,HEAD_INSULA_LEARNING_REVISION} from './head-insula-learning.ts';
import {headOrbitalLearningSequences,HEAD_ORBITAL_LEARNING_REVISION} from './head-orbital-learning.ts';
import {headCtBoneLearningSequences,HEAD_CT_BONE_LEARNING_REVISION} from './head-ct-bone-learning.ts';
import {headCtFacialLearningSequences,HEAD_CT_FACIAL_LEARNING_REVISION} from './head-ct-facial-learning.ts';
import {headCerebellarLearningSequences,HEAD_CEREBELLAR_LEARNING_REVISION} from './head-cerebellar-learning.ts';

export const HEAD_LEARNING_BOOKMARK_KEY='vm.head-learning-bookmark.v1';

/** One explicitly saved tour step. This is neither progress nor completion. */
export type HeadLearningBookmark={
  schema:1;
  sequenceId:string;
  conceptId:string;
  headRevision:string;
  sequenceRevision:string;
};

const bookmarkKeys=['schema','sequenceId','conceptId','headRevision','sequenceRevision'] as const;
const MAX_BOOKMARK_LENGTH=512;

function currentSequenceRevision(sequenceId:string):string|null{
  if(headCerebellarLearningSequences.some(sequence=>sequence.id===sequenceId))return HEAD_CEREBELLAR_LEARNING_REVISION;
  if(headMriLearningSequences.some(sequence=>sequence.id===sequenceId))return HEAD_MRI_LEARNING_REVISION;
  if(headInsulaLearningSequences.some(sequence=>sequence.id===sequenceId))return HEAD_INSULA_LEARNING_REVISION;
  if(headOrbitalLearningSequences.some(sequence=>sequence.id===sequenceId))return HEAD_ORBITAL_LEARNING_REVISION;
  if(headCtBoneLearningSequences.some(sequence=>sequence.id===sequenceId))return HEAD_CT_BONE_LEARNING_REVISION;
  if(headCtFacialLearningSequences.some(sequence=>sequence.id===sequenceId))return HEAD_CT_FACIAL_LEARNING_REVISION;
  return headLearningSequencesForModality('CT').some(sequence=>sequence.id===sequenceId)
    ?HEAD_LEARNING_REVISION:null;
}

function validBookmark(value:unknown):value is HeadLearningBookmark{
  if(!headLinksCurrent()||!value||typeof value!=='object'||Array.isArray(value))return false;
  try{
    if(Object.getPrototypeOf(value)!==Object.prototype)return false;
    const keys=Reflect.ownKeys(value);
    if(keys.length!==bookmarkKeys.length||bookmarkKeys.some(key=>!keys.includes(key)))return false;
    if(bookmarkKeys.some(key=>!Object.hasOwn(Object.getOwnPropertyDescriptor(value,key)??{},'value')))return false;
    const bookmark=value as Record<string,unknown>;
    if(bookmark.schema!==1||typeof bookmark.sequenceId!=='string'||typeof bookmark.conceptId!=='string'||
      typeof bookmark.headRevision!=='string'||typeof bookmark.sequenceRevision!=='string'||
      bookmark.headRevision!==HEAD_LINK_REVISION)return false;
    const sequence=headLearningSequencesForModality().find(item=>item.id===bookmark.sequenceId);
    return !!sequence&&sequence.concepts.includes(bookmark.conceptId)&&
      bookmark.sequenceRevision===currentSequenceRevision(bookmark.sequenceId)&&
      !!(headLearningNavigation({sequenceId:bookmark.sequenceId,conceptId:bookmark.conceptId})||headLearningNavigation({sequenceId:bookmark.sequenceId,conceptId:bookmark.conceptId},'CT'));
  }catch{return false;}
}

export function createHeadLearningBookmark(position:HeadLearningPosition):HeadLearningBookmark|null{
  if(!position||typeof position.sequenceId!=='string'||typeof position.conceptId!=='string')return null;
  const sequenceRevision=currentSequenceRevision(position.sequenceId);
  if(!sequenceRevision)return null;
  const bookmark:HeadLearningBookmark={schema:1,sequenceId:position.sequenceId,conceptId:position.conceptId,
    headRevision:HEAD_LINK_REVISION,sequenceRevision};
  return validBookmark(bookmark)?bookmark:null;
}

export function parseHeadLearningBookmark(raw:string|null):HeadLearningBookmark|null{
  if(typeof raw!=='string'||raw.length===0||raw.length>MAX_BOOKMARK_LENGTH)return null;
  try{
    const value:unknown=JSON.parse(raw);
    return validBookmark(value)?value:null;
  }catch{return null;}
}

/** Build fresh first-party URLs from validated IDs; serialized URLs are never accepted. */
export function resolveHeadLearningBookmark(bookmark:HeadLearningBookmark):ReturnType<typeof headLearningNavigation>{
  if(!validBookmark(bookmark))return null;
  const position={sequenceId:bookmark.sequenceId,conceptId:bookmark.conceptId};
  return headLearningNavigation(position)??headLearningNavigation(position,'CT');
}
