'use client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { SpecimenSupplement } from './um-knee-study';
import { IndependentStudyView, IndependentStudyLinkControl } from './independent-study-navigation';
import type { IndependentStudyLink } from '@/lib/independent-study-links';
import { SpecimenLearning } from './um-limb-learning';
import { hraRenalDefinition, hraRenalSource, hraRenalColors } from '@/lib/hra-renal';
import { hraRenalTeaching, hraRenalPractice } from '@/lib/hra-renal-teaching';
import { hraRenalReferenceTitles } from '@/content/hra-renal-teaching';
import { modelDeliveryUrl } from '@/lib/model-delivery';

export function hraRenalSupplementFor(assetBase = ''): SpecimenSupplement { return {
  studyLink: (definition, selectedId, studyId, view) => <IndependentStudyLinkControl assetBase={assetBase} definition={definition} selectedId={selectedId} studyId={studyId} view={view} />,
  colors: hraRenalColors, identification: hraRenalPractice,
  tissueGroups: [
    { id: 'capsule', name: 'Capsules', color: '#ddcfad' },
    { id: 'cortex', name: 'Cortex & columns', color: '#ba8291' },
    { id: 'medulla', name: 'Pyramids', color: '#ac626c' },
    { id: 'papilla', name: 'Papillae', color: '#ce9b94' },
    { id: 'collecting', name: 'Collecting & ureters', color: '#d6b477' },
    { id: 'hilum', name: 'Hilum surfaces', color: '#d3bca6' },
    { id: 'artery', name: 'Arteries', color: '#bf514d' },
    { id: 'vein', name: 'Vein', color: '#597dba' },
  ],
  learning: (selected, definition) => <SpecimenLearning definition={definition} selected={selected} resolveLesson={hraRenalTeaching} referenceTitles={hraRenalReferenceTitles} />,
  sourceDetails: <>
    <p>{hraRenalSource.credit}</p>
    <p><a href={hraRenalSource.metadataUrl} target="_blank" rel="noreferrer">Official release metadata</a> · <a href={hraRenalSource.licenseUrl} target="_blank" rel="noreferrer">CC BY 4.0</a></p>
    <p>82 source selections, not 82 distinct anatomical concepts. Original triangles retained, with positive uniform display scaling only. Colours are diagrammatic teaching styles, not histology.</p>
    <p>Three defective surfaces remain held: left outer cortex, right renal columns and left renal vein. Their absence is not normal anatomy. No mirroring, filling, welding, fragment deletion or invented replacement.</p>
    <p>Open cut boundaries and separate inner/outer shells remain. The left source has 11 papillary parts but 10 minor-calyx parts: letters and nearby positions do not prove drainage connections. No complete lumen, urine flow, nephron microanatomy or operative plane is demonstrated.</p>
    <p>This separate female reference is not registered to the main body or patient CT/MRI. No source imagery or separately paid lectures are unlocked. Anatomy, clinical and imaging notes are drafts; unsupported topics show pending, and your radiologist sign-off remains required.</p>
    <p>Identification practice excludes arbitrary source-letter questions; choose Hila, Pelves &amp; ureters or All supplied surfaces to enable it.</p>
    <p><a href={modelDeliveryUrl('/models/hra-renal/kidneys.glb', assetBase)} download>Display model</a> · <a href={modelDeliveryUrl('/models/hra-renal/NOTICE.md', assetBase)}>Asset reuse notice</a></p>
  </>,
}; }
export const hraRenalSupplement = hraRenalSupplementFor();
export default function HraRenalDialog({ onClose, initialLink, assetBase = '' }: { onClose: () => void; initialLink?: IndependentStudyLink; assetBase?: string }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="eye-layers-dialog um-knee-dialog" showCloseButton={false}>
      <div className="eye-layer-heading"><div>
        <DialogTitle>Kidneys · separate reference</DialogTitle>
        <DialogDescription>82 source surfaces · HRA v1.10 · CC BY 4.0 · Review pending</DialogDescription>
      </div><Button variant="outline" size="sm" onClick={onClose}><ArrowLeft />Back to atlas</Button></div>
      <IndependentStudyView assetBase={assetBase} definition={hraRenalDefinition} supplement={assetBase ? hraRenalSupplementFor(assetBase) : hraRenalSupplement} link={initialLink} />
    </DialogContent>
  </Dialog>;
}
