'use client';
import type { SpecimenSupplement } from './um-knee-study';
import { modelDeliveryUrl } from '@/lib/model-delivery';
import { SpecimenLearning } from './um-limb-learning';
import { hraPelvicReferenceTitles } from '@/content/hra-pelvic-teaching';
import {
  hraPelvisSource,
  hraPelvisColors,
} from '@/lib/hra-pelvis';
import {
  hraPelvicTeaching,
  hraPelvicPractice,
} from '@/lib/hra-pelvis-teaching';
export function createHraPelvisSupplement({ assetBase, studyLink }: { assetBase?: string; studyLink?: SpecimenSupplement['studyLink'] } = {}): SpecimenSupplement {
  return {
  studyLink,
  colors: hraPelvisColors,
  identification: hraPelvicPractice,
  tissueGroups: [
    { id: 'organ', name: 'Organ regions', color: '#b77980' },
    { id: 'ligament', name: 'Support surfaces', color: '#c5b68f' },
    { id: 'artery', name: 'Arteries', color: '#bf514d' },
    { id: 'vein', name: 'Veins', color: '#597dba' },
    { id: 'skeleton', name: 'Bone context', color: '#ddcfad' },
  ],
  learning: (selected, definition) => (
    <SpecimenLearning
      definition={definition}
      selected={selected}
      resolveLesson={hraPelvicTeaching}
      referenceTitles={hraPelvicReferenceTitles}
    />
  ),
  sourceDetails: (
    <>
      <p>{hraPelvisSource.credit}</p>
      <p>
        <a href={hraPelvisSource.metadataUrl} target="_blank" rel="noreferrer">
          Official release metadata
        </a>{' '}
        ·{' '}
        <a href={hraPelvisSource.licenseUrl} target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
      </p>
      <p>
        41 source surfaces; every retained triangle remains. Open boundaries and
        separate inner/outer shells are not filled, welded or reconstructed.
        Colours are teaching styles, not histology.
      </p>
      <p>
        Six sources are withheld: the reversed-label round-ligament pair,
        disputed uterine-end groups and overlapping anterior/posterior wall
        alternatives. No automatic relabelling or repair.
      </p>
      <p>
        This is a separate reference assembly, not complete female anatomy or
        the same subject as the main body. No pelvic floor, nerves, pregnancy
        model, continuous lumen, operative plane or CT/MRI registration is
        claimed.
      </p>
      <p>
        <a href={modelDeliveryUrl('/models/hra-pelvis/pelvis.glb', assetBase)} download>
          Display model
        </a>{' '}
        · <a href={modelDeliveryUrl('/models/hra-pelvis/NOTICE.md', assetBase)}>Asset reuse notice</a>
      </p>
      <p>
        Clinical/imaging notes are draft and incomplete; your radiologist’s
        sign-off remains pending. Atlas access does not unlock separately paid
        imaging or lectures.
      </p>
    </>
  ),
  };
}
