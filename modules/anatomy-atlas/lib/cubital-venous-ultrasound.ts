import source from '../public/models/bodyparts3d/cubital-veins/catalog.json' with { type: 'json' };
import { cubitalVenousUltrasoundReferences, cubitalVenousUltrasoundTopics } from '../content/cubital-venous-ultrasound';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(source.structures.map(s => [s.id, sourceCanonical(s)]));
const topics = Object.values(cubitalVenousUltrasoundTopics);

/** Four exact admitted source records only; no patient-image correspondence. */
export function cubitalVenousUltrasoundLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound' || identities.get(s.id) !== sourceCanonical(s)) return undefined;
  const topic = topics.find(candidate => (candidate.fmaIds as readonly string[]).includes(s.fmaId));
  if (!topic) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · Ultrasound venous orientation · draft`,
    body: topic.body,
    bullets: [...topic.bullets,
      'Source limit: No skin depth, lumen, compressibility, Doppler waveform, patency, continuous junction or safe access route is encoded in the mesh.'],
    citations: topic.references.map(key => cubitalVenousUltrasoundReferences[key]),
    note: 'Introductory teaching for revision-bound radiologist review. No patient images, registered scan, procedure instruction or clinical approval. Case, Atlas and paid-lecture access remain independent.',
  };
}
