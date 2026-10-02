import pins from '../content/nested-teaching-bindings.v1.json' with { type: 'json' };
import femoralPins from '../content/femoral-component-teaching-bindings.v1.json' with { type: 'json' };
import mcaPins from '../content/mca-source-teaching-bindings.v1.json' with { type: 'json' };
import picaPins from '../content/pica-source-teaching-bindings.v1.json' with { type: 'json' };
import {
  nestedConcepts,
  nestedTeachingReferences,
  type NestedConcept,
} from '../content/nested-teaching.ts';
import {
  nestedPartsFor,
  nestedBundleHash,
  type NestedStudy,
} from './nested-anatomy.ts';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`,
      )
      .join(',')}}`;
  return JSON.stringify(value);
};
export function nestedTeachingFor(
  parent: BodyStructure,
  study: NestedStudy,
  selected: BodyStructure,
): NestedConcept | null {
  const activePins = study === 'femoral-components' ? femoralPins
    : study === 'cranial-artery-components'
      ? (['FMA50519','FMA50520'].includes(parent.fmaId) ? picaPins : mcaPins)
      : pins;
  const pinnedParent = activePins.parents.find((p) => p.id === parent.id);
  if (!pinnedParent || canonical(pinnedParent) !== canonical(parent))
    return null;
  const current = nestedPartsFor(parent, study).find(
    (s) => s.id === selected.id,
  );
  const binding = activePins.bindings.find(
    (p) =>
      p.study === study &&
      p.parentId === parent.id &&
      p.structure.id === selected.id,
  );
  if (
    !binding ||
    !current ||
    canonical(binding.structure) !== canonical(current) ||
    canonical(selected) !== canonical(current) ||
    binding.sourceHash !== nestedBundleHash(study, current.bundle)
  )
    return null;
  const concept = nestedConcepts.find(
    (c) =>
      c.id === binding.conceptId &&
      c.study === study &&
      c.fmaIds.includes(selected.fmaId),
  );
  // This authored contract contains JSON data only, and callers get detached
  // arrays/sections so no viewer can mutate the shared lesson registry.
  return concept
    ? (JSON.parse(JSON.stringify(concept)) as NestedConcept)
    : null;
}

/** Missing modalities stay pending; no borrowed root-body paragraph becomes a
 * structure-specific child guide or a registered clinical correspondence. */
export function nestedTopicLesson(
  concept: NestedConcept,
  tab: ContentTab,
): ContentLesson {
  if (
    tab === 'ct' ||
    tab === 'mri' ||
    tab === 'xray' ||
    tab === 'ultrasound'
  ) {
    const imaging = concept.imaging?.[tab];
    if (imaging)
      return {
        title: `${tab === 'ultrasound' ? 'Ultrasound' : tab === 'xray' ? 'X-ray' : tab.toUpperCase()} · ${imaging.readiness === 'draft' ? 'teaching draft' : 'pending'}`,
        body: imaging.body,
        note: 'Teaching only; specialist review pending. The 3D surface is not a scan, segmentation or diagnostic measurement. No scan access or synchronization is provided.',
        readiness: imaging.readiness,
        citations: imaging.references.map(
          (ref) => nestedTeachingReferences[ref].url,
        ),
      };
    return {
      title: `${tab === 'ultrasound' ? 'Ultrasound' : tab === 'xray' ? 'X-ray' : tab.toUpperCase()} · pending`,
      body: 'Structure-specific imaging teaching and approved scan correspondence have not yet been added for this part.',
      note: 'The 3D surface is not a scan, segmentation or diagnostic measurement.',
      readiness: 'pending',
    };
  }
  if (tab === 'quiz')
    return {
      title: 'Self-check',
      body: concept.quiz.question,
      readiness: 'draft',
      note:
        concept.quiz.basis === 'model-scope'
          ? 'This question checks the current source-model scope, not a clinical finding.'
          : undefined,
      citations: concept.quiz.references.map(
        (ref) => nestedTeachingReferences[ref].url,
      ),
    };
  const section = concept.sections[tab];
  return {
    title: {
      anatomy: 'Anatomy',
      function: 'Function',
      clinical: 'Clinical context',
      pathology: 'Pathology',
    }[tab],
    body: section.body,
    readiness: section.readiness,
    citations: section.references.map(
      (ref) => nestedTeachingReferences[ref].url,
    ),
  };
}
export { nestedTeachingReferences };
