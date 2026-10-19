import {validateLectureAnatomyReference,type LectureAnatomyReference} from './lecture-anatomy-reference.ts';

export const MAX_LECTURE_ANATOMY_REFERENCES = 6;

/** Validate saved pins without requiring today's concept catalogue or link revision. */
export function validateLectureAnatomyReferences(value: unknown): LectureAnatomyReference[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype ||
      value.length < 1 || value.length > MAX_LECTURE_ANATOMY_REFERENCES)
    throw new Error('Invalid lecture anatomy reference collection');

  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1 ||
      keys.some(key => key !== 'length' &&
        (typeof key !== 'string' || !/^(?:0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)))
    throw new Error('Invalid lecture anatomy reference collection');

  const seen = new Set<string>();
  const references: LectureAnatomyReference[] = [];
  for (let index = 0; index < value.length; index++) {
    const descriptor = descriptors[index];
    if (!descriptor || !Object.hasOwn(descriptor, 'value'))
      throw new Error('Invalid lecture anatomy reference collection');
    const reference = validateLectureAnatomyReference(descriptor.value);
    if (seen.has(reference.conceptId))
      throw new Error('Duplicate lecture anatomy concept');
    seen.add(reference.conceptId);
    references.push(reference);
  }
  return references;
}

/** Read either saved form as cloned pins; malformed or ambiguous slides fail closed. */
export function lectureSlideAnatomyReferences(slide: {
  anatomyReference?: LectureAnatomyReference;
  anatomyReferences?: LectureAnatomyReference[];
}): LectureAnatomyReference[] {
  if (!slide || typeof slide !== 'object' || Array.isArray(slide)) return [];
  try {
    const hasSingle = Object.hasOwn(slide, 'anatomyReference');
    const hasCollection = Object.hasOwn(slide, 'anatomyReferences');
    if (hasSingle && hasCollection) return [];
    const descriptors = Object.getOwnPropertyDescriptors(slide);
    if (hasCollection) {
      const descriptor = descriptors.anatomyReferences;
      return descriptor && Object.hasOwn(descriptor, 'value')
        ? validateLectureAnatomyReferences(descriptor.value) : [];
    }
    if (hasSingle) {
      const descriptor = descriptors.anatomyReference;
      return descriptor && Object.hasOwn(descriptor, 'value')
        ? [validateLectureAnatomyReference(descriptor.value)] : [];
    }
  } catch {
    return [];
  }
  return [];
}
