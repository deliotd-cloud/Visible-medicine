'use client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { SpecimenSupplement } from './um-knee-study';
import { IndependentStudyView, IndependentStudyLinkControl } from './independent-study-navigation';
import type { IndependentStudyLink } from '@/lib/independent-study-links';
import {
  backLayersDefinition,
  backLayersSource,
  backLayersColors,
} from '@/lib/back-layers';
import {
  backLayersPractice,
  backLayersTeachingFor,
} from '@/lib/back-layers-teaching';
import { backLayersReferences } from '@/content/back-layers-teaching';
import { SpecimenLearning } from './um-limb-learning';
import type {
  SpecimenDefinition,
  SpecimenSurface,
} from '@/lib/independent-specimen';
import type { SpecimenTopic } from '@/lib/specimen-links';

export function BackLayersTeaching({
  surface,
  definition = backLayersDefinition,
  initialTopic,
}: {
  surface: SpecimenSurface;
  definition?: SpecimenDefinition;
  initialTopic?: SpecimenTopic;
}) {
  return (
    <SpecimenLearning
      definition={definition}
      selected={surface}
      initialTopic={initialTopic}
      resolveLesson={backLayersTeachingFor}
      attachmentLabels={{ proximal: 'Origin', distal: 'Insertion' }}
      referenceTitles={backLayersReferences}
    />
  );
}
export const backLayersSupplement: SpecimenSupplement = {
  studyLink: (definition, selectedId, studyId, view) => <IndependentStudyLinkControl definition={definition} selectedId={selectedId} studyId={studyId} view={view} />,
  colors: backLayersColors,
  identification: backLayersPractice,
  learning: (surface, definition) => (
    <BackLayersTeaching surface={surface} definition={definition} />
  ),
  sourceDetails: (
    <>
      <p>{backLayersSource.credit}</p>
      <p>
        <a href={backLayersSource.url} target="_blank" rel="noreferrer">
          Official version-3 source
        </a>{' '}
        ·{' '}
        <a href={backLayersSource.licenseUrl} target="_blank" rel="noreferrer">
          CC BY-SA 2.1 Japan
        </a>
      </p>
      <p>
        14 muscle surfaces and 34 bones from the original 99%-reduced release.
        One common display transform; no mirroring, fitting, new decimation,
        repaired edges or omitted triangles.
      </p>
      <p>
        Latissimus and multifidus are additional reference representations, not
        registered additions to the newer body. Trapezius parts and rhomboids
        provide context. Disconnected fragments and edge contacts remain visible
        source limitations.
      </p>
      <p>
        No complete deep-back muscle stack, thoracolumbar fascia, discs, nerves,
        cord, validated attachment map or surgical plane. Source fragments are
        not individual fascicles.
      </p>
      <p>
        <a href={backLayersSource.archive} target="_blank" rel="noreferrer">
          Download official original source archive (about 127 MB)
        </a>
        <br />
        <a href="/models/bodyparts3d-v3/back-layers/back-layers.glb" download>
          Download display model
        </a>{' '}
        ·{' '}
        <a href="/models/bodyparts3d-v3/back-layers/NOTICE.md">
          Asset reuse notice
        </a>
      </p>
      <p>
        The official archive includes the full version-3 release. Selected
        originals and licence evidence are also retained in the project backup.
        The assets and their adaptations retain ShareAlike rights; subscriptions
        must not restrict recipients’ licensed asset reuse.
      </p>
      <p>
        Teaching and device review are pending. No CT/MRI/X-ray/US scan, patient
        registration, approved clinical examination or paid-lecture access is
        supplied.
      </p>
    </>
  ),
};
export default function BackLayersDialog({ onClose, initialLink }: { onClose: () => void; initialLink?: IndependentStudyLink }) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="eye-layers-dialog um-knee-dialog"
        showCloseButton={false}
      >
        <div className="eye-layer-heading">
          <div>
            <DialogTitle>Back layers · separate specimen</DialogTitle>
            <DialogDescription>
              14 muscle surfaces · BodyParts3D / DBCLS ·{' '}
              <a
                href={backLayersSource.licenseUrl}
                target="_blank"
                rel="noreferrer"
              >
                CC BY-SA 2.1 JP
              </a>{' '}
              · Review pending
            </DialogDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft />
            Back to atlas
          </Button>
        </div>
        <IndependentStudyView definition={backLayersDefinition} supplement={backLayersSupplement} link={initialLink} />
      </DialogContent>
    </Dialog>
  );
}
