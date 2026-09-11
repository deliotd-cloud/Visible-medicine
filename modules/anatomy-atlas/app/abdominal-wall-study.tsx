'use client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { KneeSpecimenView, type SpecimenSupplement } from './um-knee-study';
import { abdominalWallDefinition, abdominalWallSource, abdominalWallColors, abdominalWallNote, abdominalWallReading } from '@/lib/abdominal-wall';
import type { SpecimenSurface } from '@/lib/independent-specimen';

export function AbdominalWallTeaching({ surface }: { surface: SpecimenSurface }) {
  const note = abdominalWallNote(surface);
  return <details className="um-knee-details"><summary>Anatomy & function · draft</summary>
    <p>{note ?? 'This named bone is context from the same source release. Muscle attachment footprints are not separately mapped.'}</p>
    {note && <a href={abdominalWallReading} target="_blank" rel="noreferrer">Further anatomy reading</a>}
    <p>Clinical review pending. CT/MRI/X-ray/US images, pathology examples and source-bound examination questions are not yet supplied for this specimen.</p>
  </details>;
}
export const abdominalWallSupplement: SpecimenSupplement = {
  colors: abdominalWallColors,
  learning: surface => <AbdominalWallTeaching surface={surface} />,
  sourceDetails: <>
    <p>{abdominalWallSource.credit}</p>
    <p><a href={abdominalWallSource.url} target="_blank" rel="noreferrer">Official version-3 source</a> · <a href={abdominalWallSource.licenseUrl} target="_blank" rel="noreferrer">CC BY-SA 2.1 Japan</a></p>
    <p>Original 99%-reduced source surfaces, with one shared display transform and teaching colours. No sculpting, mirroring, fitting or removed source triangles. Kept separate from version 4: matching FMA concepts do not establish matching coordinates.</p>
    <p>No complete sheath, aponeuroses, linea alba, inguinal canal or neurovascular dissection plane is claimed. Partial skeletal context and source intersections need anatomical review.</p>
    <p><a href="/models/bodyparts3d-v3/abdominal-wall/original-source.zip" download>Download original sources & licence</a><br />
      <a href="/models/bodyparts3d-v3/abdominal-wall/abdominal-wall.glb" download>Download display model</a> · <a href="/models/bodyparts3d-v3/abdominal-wall/NOTICE.md">Asset reuse notice</a></p>
    <p>The anatomy assets and their adaptations remain ShareAlike. No imaging synchronisation, patient registration or paid lecture entitlement is granted.</p>
  </>,
};
export default function AbdominalWallDialog({ onClose }: { onClose: () => void }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="eye-layers-dialog um-knee-dialog" showCloseButton={false}>
      <div className="eye-layer-heading">
        <div><DialogTitle>Abdominal wall · separate specimen</DialogTitle>
          <DialogDescription>8 muscle surfaces · BodyParts3D / DBCLS · <a href={abdominalWallSource.licenseUrl} target="_blank" rel="noreferrer">CC BY-SA 2.1 JP</a> · Review pending</DialogDescription></div>
        <Button variant="outline" size="sm" onClick={onClose}><ArrowLeft />Back to atlas</Button>
      </div>
      <KneeSpecimenView specimen={abdominalWallDefinition} supplement={abdominalWallSupplement} />
    </DialogContent>
  </Dialog>;
}
