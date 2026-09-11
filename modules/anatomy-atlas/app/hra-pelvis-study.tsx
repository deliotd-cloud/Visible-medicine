'use client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { KneeSpecimenView, type SpecimenSupplement } from './um-knee-study';
import { SpecimenLearning } from './um-limb-learning';
import { hraPelvicReferenceTitles } from '@/content/hra-pelvic-teaching';
import {
  hraPelvisDefinition,
  hraPelvisSource,
  hraPelvisColors,
} from '@/lib/hra-pelvis';
import {
  hraPelvicTeaching,
  hraPelvicPractice,
} from '@/lib/hra-pelvis-teaching';
export const hraPelvisSupplement: SpecimenSupplement = {
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
        <a href="/models/hra-pelvis/pelvis.glb" download>
          Display model
        </a>{' '}
        · <a href="/models/hra-pelvis/NOTICE.md">Asset reuse notice</a>
      </p>
      <p>
        Clinical/imaging notes are draft and incomplete; your radiologist’s
        sign-off remains pending. Atlas access does not unlock separately paid
        imaging or lectures.
      </p>
    </>
  ),
};
export default function HraPelvisDialog({ onClose }: { onClose: () => void }) {
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
            <DialogTitle>Female pelvis · separate reference</DialogTitle>
            <DialogDescription>
              41 source surfaces · HRA v1.10 · CC BY 4.0 · Review pending
            </DialogDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft />
            Back to atlas
          </Button>
        </div>
        <KneeSpecimenView
          specimen={hraPelvisDefinition}
          supplement={hraPelvisSupplement}
        />
      </DialogContent>
    </Dialog>
  );
}
