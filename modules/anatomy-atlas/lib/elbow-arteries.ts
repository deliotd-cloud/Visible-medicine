import data from '../public/models/bodyparts3d/elbow-arteries/catalog.json' with { type: 'json' };
import {
  applyBodySourceAddition,
  sourceCanonical,
  type BodySourceAddition,
} from './body-source-additions';
import {
  elbowArterialFacts,
  elbowArterialReference,
} from '../content/elbow-arterial';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
const pinned = new Map(
  source.structures.map((s) => [s.id, sourceCanonical(s)]),
);
export const addElbowArteries = (catalog: BodyCatalog) =>
  applyBodySourceAddition(catalog, source);
export function elbowArteryLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (pinned.get(s.id) !== sourceCanonical(s)) return undefined;
  const fact = elbowArterialFacts.find((f) =>
    (f.fmaIds as readonly string[]).includes(s.fmaId),
  );
  if (!fact) return undefined;
  const citations = [elbowArterialReference];
  const note =
    'Draft for radiologist review. Original source anatomy is unvalidated; no continuous lumen, perfusion territory, patient registration or clinical finding is established.';
  if (tab === 'anatomy')
    return {
      readiness: 'draft',
      title: `${s.name} · Anatomy · draft`,
      body: fact.anatomy,
      bullets: [
        'Use Arterial connections to compare the supplied parent and communication on this side.',
        'Both upper-arm and forearm workspaces include this elbow reference.',
        'Reset separation to 0% for source-position comparison. The separation controls do not simulate tissue planes or vascular filling.',
      ],
      citations,
      note,
    };
  if (tab === 'function')
    return {
      readiness: 'draft',
      title: `${s.name} · Function · draft`,
      body: 'These elbow arteries participate in alternative arterial routes around the joint. The available meshes do not measure blood flow or establish that any collateral route is adequate.',
      bullets: [
        'The relationship guide is conceptual; artificial separation does not change anatomical parentage.',
        'Isolate and restore selections to compare their finite source surfaces.',
      ],
      citations,
      note,
    };
  if (tab === 'quiz')
    return {
      readiness: 'draft',
      title: `${s.name} · Self-check · draft`,
      body: 'Which artery is the usual parent of this selection?',
      bullets: [
        `Answer: ${fact.parentName}.`,
        'A typical parent does not establish the branching pattern in an individual patient.',
      ],
      citations,
      note,
    };
  return {
    readiness: 'pending',
    title: `${s.name} · Review pending`,
    body: 'Structure-specific imaging, pathology and clinical teaching has not yet been authored and reviewed for this new source selection.',
    bullets: [],
    note: 'No scan or diagnostic finding is supplied.',
  };
}
