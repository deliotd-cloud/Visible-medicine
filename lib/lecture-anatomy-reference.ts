import {headAtlasConceptOptions,headConceptById} from './head-atlas-links.ts';
import {headImageConceptById,headImageOnlyComparisonPacket,type HeadImageConceptLink} from './head-image-only-links.ts';
import {HEAD_IMAGE_ONLY_COMPARISON_REVISION} from './head-image-only-comparison-review.ts';
import {headImageHref} from './head-atlas-navigation.ts';
import {headLinksCurrent} from './head-link-availability.ts';

/** A publication snapshot of a concept link, never an authority to navigate. */
export type LectureAnatomyReference = {
  kind: 'head-concept-v1';
  conceptId: string;
  headRevision: string;
  atlasTarget: string;
} | {
  kind: 'head-image-concept-v1';
  conceptId: string;
  headRevision: string;
  ctTarget: string;
  mriTarget: string;
  comparisonRevision: string;
};

const atlasFields = ['kind', 'conceptId', 'headRevision', 'atlasTarget'] as const;
const imageFields = ['kind', 'conceptId', 'headRevision', 'ctTarget', 'mriTarget', 'comparisonRevision'] as const;
const conceptIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const revisionPattern = /^[a-f0-9]{64}$/;
const targetPrefix = '/atlas/head-neck-3d?';
const controlChars = /[\u0000-\u001f\u007f-\u009f]/;

function validConceptId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && conceptIdPattern.test(value);
}

function validAtlasTarget(value: unknown): value is string {
  return typeof value === 'string' && value.length > targetPrefix.length && value.length <= 2048 &&
    value.startsWith(targetPrefix) && !controlChars.test(value) &&
    !/[\\#\s]/.test(value);
}

function validImageTarget(value: unknown, modality:'ct'|'mri'): value is string {
  const prefix=`/atlas/${modality}-head?`;
  return typeof value==='string'&&value.length>prefix.length&&value.length<=2048&&
    value.startsWith(prefix)&&!controlChars.test(value)&&!/[\\#\s]/.test(value);
}

/** Validate the saved shape without requiring today's link revision or concept list. */
export function validateLectureAnatomyReference(value: unknown): LectureAnatomyReference {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) {
    throw new Error('Invalid lecture anatomy reference');
  }
  const keys = Reflect.ownKeys(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const kind = descriptors.kind?.value;
  const fields = kind==='head-concept-v1'?atlasFields:kind==='head-image-concept-v1'?imageFields:null;
  if (!fields || keys.length !== fields.length || keys.some(key => !fields.includes(key as never))) {
    throw new Error('Invalid lecture anatomy reference fields');
  }
  if (fields.some(key => !descriptors[key] || !Object.hasOwn(descriptors[key], 'value'))) {
    throw new Error('Invalid lecture anatomy reference fields');
  }
  const conceptId = descriptors.conceptId.value;
  const headRevision = descriptors.headRevision.value;
  if (!validConceptId(conceptId) || typeof headRevision !== 'string' || !revisionPattern.test(headRevision)) {
    throw new Error('Invalid lecture anatomy reference value');
  }
  if(kind==='head-concept-v1'){
    const atlasTarget=descriptors.atlasTarget.value;
    if(!validAtlasTarget(atlasTarget))throw new Error('Invalid lecture anatomy reference value');
    return {kind, conceptId, headRevision, atlasTarget};
  }
  const ctTarget=descriptors.ctTarget.value,mriTarget=descriptors.mriTarget.value;
  const comparisonRevision=descriptors.comparisonRevision.value;
  if(!validImageTarget(ctTarget,'ct')||!validImageTarget(mriTarget,'mri')||
    typeof comparisonRevision!=='string'||!revisionPattern.test(comparisonRevision)){
    throw new Error('Invalid lecture anatomy reference value');
  }
  return {kind,conceptId,headRevision,ctTarget,mriTarget,comparisonRevision};
}

/** Available 3D options plus the source-bound draft image-only identities. */
export function lectureAnatomyOptions():Array<{conceptId:string;label:string}>{
  if(!headLinksCurrent())return [];
  return [...headAtlasConceptOptions(),...headImageOnlyComparisonPacket().bindings.flatMap(item=>{
    const link=headImageConceptById(item.conceptId);
    return link&&!link.atlasHref&&link.ctHref&&link.mriHref?[{conceptId:link.conceptId,label:link.label}]:[];
  })].filter(option=>createLectureAnatomyReference(option.conceptId)!==null);
}

/** Create a pin from the current allowlisted head concept. */
export function createLectureAnatomyReference(conceptId: string): LectureAnatomyReference | null {
  if (!validConceptId(conceptId) || !headLinksCurrent()) return null;
  const link = headConceptById(conceptId);
  if(link){
    if(!validAtlasTarget(link.atlasHref))return null;
    return {kind: 'head-concept-v1', conceptId: link.conceptId,
      headRevision: link.headRevision, atlasTarget: link.atlasHref};
  }
  if(!headImageOnlyComparisonPacket().bindings.some(item=>item.conceptId===conceptId))return null;
  const image=headImageConceptById(conceptId);
  if(!image||image.atlasHref||!image.ctHref||!image.mriHref)return null;
  const ctTarget=headImageHref('CT',conceptId,null,image.headRevision);
  const mriTarget=headImageHref('MRI',conceptId,null,image.headRevision);
  if(!validImageTarget(ctTarget,'ct')||!validImageTarget(mriTarget,'mri'))return null;
  return {kind:'head-image-concept-v1',conceptId:image.conceptId,
    headRevision:image.headRevision,ctTarget,mriTarget,
    comparisonRevision:HEAD_IMAGE_ONLY_COMPARISON_REVISION};
}

/** Resolve only to a fresh, canonical link from the current source mapping. */
export function resolveLectureAnatomyReference(value: unknown): HeadImageConceptLink | null {
  let reference: LectureAnatomyReference;
  try {
    reference = validateLectureAnatomyReference(value);
  } catch {
    return null;
  }
  if (!headLinksCurrent()) return null;
  if(reference.kind==='head-concept-v1'){
    const link=headConceptById(reference.conceptId);
    return link&&reference.headRevision===link.headRevision&&reference.atlasTarget===link.atlasHref?link:null;
  }
  if(reference.comparisonRevision!==HEAD_IMAGE_ONLY_COMPARISON_REVISION||
    !headImageOnlyComparisonPacket().bindings.some(item=>item.conceptId===reference.conceptId))return null;
  const link=headImageConceptById(reference.conceptId);
  if(!link||link.atlasHref||!link.ctHref||!link.mriHref||reference.headRevision!==link.headRevision)return null;
  return reference.ctTarget===headImageHref('CT',link.conceptId,null,link.headRevision)&&
    reference.mriTarget===headImageHref('MRI',link.conceptId,null,link.headRevision)?link:null;
}
