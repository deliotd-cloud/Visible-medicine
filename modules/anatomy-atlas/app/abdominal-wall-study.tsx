'use client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './study-surface';
import type { SpecimenSupplement } from './um-knee-study';
import { IndependentStudyView, IndependentStudyLinkControl } from './independent-study-navigation';
import type { IndependentStudyLink } from '@/lib/independent-study-links';
import { abdominalWallDefinition, abdominalWallSource, abdominalWallColors } from '@/lib/abdominal-wall';
import type { SpecimenDefinition, SpecimenSurface } from '@/lib/independent-specimen';
import { abdominalWallPractice } from '@/lib/abdominal-wall-practice';
import { abdominalTeachingFor } from '@/lib/abdominal-wall-teaching';
import { abdominalSurfaceMatches } from '@/lib/abdominal-wall-binding';
import { abdominalReferenceTitles } from '@/content/abdominal-wall-teaching';
import { SpecimenLearning } from './um-limb-learning';
import type { SpecimenTopic } from '@/lib/specimen-links';
import { modelDeliveryUrl } from '@/lib/model-delivery';
import { abdominalGuidedDissection } from '@/lib/abdominal-guided-dissection';

export function AbdominalWallTeaching({ surface, definition = abdominalWallDefinition, initialTopic }: {
  surface: SpecimenSurface; definition?: SpecimenDefinition; initialTopic?: SpecimenTopic;
}) {
  if (surface.tissue === 'skeleton' && abdominalSurfaceMatches(definition, surface)) return <details className="um-knee-details"><summary>Learn · skeletal context</summary>
    <p>This named bone is context from the same source release. Muscle attachment footprints are not separately mapped; detailed bone teaching for this specimen is pending.</p>
  </details>;
  return <SpecimenLearning definition={definition} selected={surface} initialTopic={initialTopic}
    resolveLesson={abdominalTeachingFor} attachmentLabels={{ proximal: 'Origin', distal: 'Insertion' }} referenceTitles={abdominalReferenceTitles} />;
}
export function abdominalWallSupplementFor(assetBase = ''): SpecimenSupplement { return {
  guidedDissection: abdominalGuidedDissection,
  studyLink: (definition, selectedId, studyId, view) => <IndependentStudyLinkControl assetBase={assetBase} definition={definition} selectedId={selectedId} studyId={studyId} view={view} />,
  colors: abdominalWallColors,
  identification: abdominalWallPractice,
  learning: (surface, definition) => <AbdominalWallTeaching surface={surface} definition={definition} />,
  sourceDetails: <>
    <p>{abdominalWallSource.credit}</p>
    <p><a href={abdominalWallSource.url} target="_blank" rel="noreferrer">Official version-3 source</a> · <a href={abdominalWallSource.licenseUrl} target="_blank" rel="noreferrer">CC BY-SA 2.1 Japan</a></p>
    <p>Original 99%-reduced source surfaces, with one shared display transform and teaching colours. No sculpting, mirroring, fitting or removed source triangles. Kept separate from version 4: matching FMA concepts do not establish matching coordinates.</p>
    <p>No complete sheath, aponeuroses, linea alba, inguinal canal or neurovascular dissection plane is claimed. Partial skeletal context and source intersections need anatomical review.</p>
    <p><a href={abdominalWallSource.archive} target="_blank" rel="noreferrer">Download official original source archive (about 127 MB)</a><br />
      <a href={modelDeliveryUrl('/models/bodyparts3d-v3/abdominal-wall/abdominal-wall.glb', assetBase)} download>Download display model</a> · <a href={modelDeliveryUrl('/models/bodyparts3d-v3/abdominal-wall/NOTICE.md', assetBase)}>Asset reuse notice</a></p>
    <p>The official archive contains the full version-3 source, not just these 29 surfaces. The selected-source recovery ZIP is retained with the project backup.</p>
    <p>The anatomy assets and their adaptations remain ShareAlike. No imaging synchronisation, patient registration or paid lecture entitlement is granted.</p>
  </>,
}; }
export const abdominalWallSupplement = abdominalWallSupplementFor();
export default function AbdominalWallDialog({ onClose, initialLink, assetBase = '' }: { onClose: () => void; initialLink?: IndependentStudyLink; assetBase?: string }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="eye-layers-dialog um-knee-dialog" showCloseButton={false}>
      <div className="eye-layer-heading">
        <div><DialogTitle>Abdominal wall · separate specimen</DialogTitle>
          <DialogDescription>8 muscle surfaces · BodyParts3D / DBCLS · <a href={abdominalWallSource.licenseUrl} target="_blank" rel="noreferrer">CC BY-SA 2.1 JP</a> · Review pending</DialogDescription></div>
        <Button variant="outline" size="sm" onClick={onClose}><ArrowLeft />Back to atlas</Button>
      </div>
      <IndependentStudyView assetBase={assetBase} definition={abdominalWallDefinition} supplement={assetBase ? abdominalWallSupplementFor(assetBase) : abdominalWallSupplement} link={initialLink} />
    </DialogContent>
  </Dialog>;
}
