import type { BodyStructure } from '../app/body-types';
import type { ContentSection, ContentTab } from '../app/anatomy-data';
import { contentTabs, type ContentLesson } from './content-types';
import { sourceCanonical } from './body-source-additions';

/** Learner-only reader. Review continues to use the complete synchronous resolver. */
export type BodyTeachingModule = {
  bodyLesson(structure: BodyStructure, tab: ContentTab): ContentLesson;
  bodyContent(structure: BodyStructure, tab: ContentTab): ContentSection;
  accepts(structure: BodyStructure): boolean;
};
type SnapshotEntry = { identity: string; lessons: Record<ContentTab, ContentLesson> };
export type RegionalTeachingSnapshot = {
  schemaVersion: 1;
  region: string;
  entries: SnapshotEntry[];
  undefinedPaths: Array<Array<string | number>>;
};

/** Unlike a JSON round-trip, retain explicitly undefined optional fields. */
function detached<T>(value: T): T {
  if (Array.isArray(value)) return value.map(detached) as T;
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, detached(item)])) as T;
  return value;
}

/** Generated public teaching only: no decisions, registrations or approval state. */
export function decodeRegionalTeachingSnapshot(input: unknown, region: string): BodyTeachingModule {
  const snapshot = detached(input) as RegionalTeachingSnapshot;
  if (!snapshot || snapshot.schemaVersion !== 1 || snapshot.region !== region ||
      !Array.isArray(snapshot.entries) || !Array.isArray(snapshot.undefinedPaths))
    throw Error('Invalid regional teaching snapshot');
  for (const path of snapshot.undefinedPaths) {
    if (!Array.isArray(path) || !path.length || path[0] !== 'entries')
      throw Error('Invalid teaching optional-field path');
    let parent: unknown = snapshot;
    for (const [index, key] of path.entries()) {
      if ((typeof key !== 'string' && typeof key !== 'number') ||
          ['__proto__', 'prototype', 'constructor'].includes(String(key)) ||
          !parent || typeof parent !== 'object' || !Object.hasOwn(parent, key))
        throw Error('Invalid teaching optional-field path');
      const record = parent as Record<string | number, unknown>;
      if (index === path.length - 1) {
        if (record[key] !== null) throw Error('Invalid teaching optional-field marker');
        record[key] = undefined;
      } else parent = record[key];
    }
  }
  const lessons = new Map<string, Record<ContentTab, ContentLesson>>();
  for (const entry of snapshot.entries) {
    if (!entry || typeof entry.identity !== 'string' || !entry.identity ||
        lessons.has(entry.identity) || !entry.lessons ||
        Object.keys(entry.lessons).length !== contentTabs.length)
      throw Error('Invalid teaching source identity');
    for (const tab of contentTabs) {
      const lesson = entry.lessons[tab];
      if (!lesson || typeof lesson.title !== 'string' || typeof lesson.body !== 'string' ||
          !['draft', 'identity-only', 'pending', 'generated-identification'].includes(lesson.readiness))
        throw Error('Invalid regional teaching lesson');
    }
    lessons.set(entry.identity, entry.lessons);
  }
  function bodyLesson(structure: BodyStructure, tab: ContentTab): ContentLesson {
    const entry = lessons.get(sourceCanonical(structure));
    if (!entry || !contentTabs.includes(tab))
      throw Error('Teaching reader does not cover this complete source identity');
    return detached(entry[tab]);
  }
  return Object.freeze({
    accepts: (structure: BodyStructure) => structure.region === region && lessons.has(sourceCanonical(structure)),
    bodyLesson,
    bodyContent(structure: BodyStructure, tab: ContentTab): ContentSection {
      const { readiness: _readiness, ...section } = bodyLesson(structure, tab);
      return section;
    },
  });
}
