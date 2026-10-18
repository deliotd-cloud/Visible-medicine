import {headLinksCurrent} from './head-link-availability.ts';
import {HEAD_LINK_REVISION} from './head-atlas-links.ts';
import {headTeachingForReference} from './head-atlas-teaching.ts';
import {headMriOnlyTeachingForReference} from './head-mri-only-teaching.ts';
import {headInsulaTeachingForReference} from './head-insula-teaching.ts';
import {headOrbitalTeachingForReference} from './head-orbital-teaching.ts';
import {headCtBoneTeachingForReference} from './head-ct-bone-teaching.ts';

/** Match the existing reference teaching resolver; a mapped image does not
 * imply that a teaching note, quiz, clinical approval or entitlement exists. */
export function headReferenceLearningAvailable(conceptId:string,revision:string):boolean {
  if(!headLinksCurrent()||revision!==HEAD_LINK_REVISION)return false;
  return !!(headTeachingForReference(conceptId,revision)??headMriOnlyTeachingForReference(conceptId,revision)??headInsulaTeachingForReference(conceptId,revision)??headOrbitalTeachingForReference(conceptId,revision)??headCtBoneTeachingForReference(conceptId,revision));
}
