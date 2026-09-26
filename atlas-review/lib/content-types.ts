import type { ContentSection, ContentTab } from '../app/anatomy-data';

export const contentTabs: readonly ContentTab[] = [
  'anatomy',
  'function',
  'ct',
  'mri',
  'xray',
  'ultrasound',
  'pathology',
  'clinical',
  'quiz',
];

/** Editorial coverage only; none of these values represents clinical approval. */
export type ContentReadiness =
  'draft' | 'identity-only' | 'pending' | 'generated-identification';
export type ContentLesson = ContentSection & {
  readiness: ContentReadiness;
};

export function draftLesson(section: ContentSection): ContentLesson {
  return { ...section, readiness: section.readiness ?? 'draft' };
}
