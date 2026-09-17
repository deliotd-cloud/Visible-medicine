'use client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './study-surface';
import { IndependentStudyView, IndependentStudyLinkControl } from './independent-study-navigation';
import type { IndependentStudyLink } from '@/lib/independent-study-links';
import { hraPelvisDefinition } from '@/lib/hra-pelvis';
import { createHraPelvisSupplement } from './hra-pelvis-supplement';

export const hraPelvisSupplementFor=(assetBase='')=>createHraPelvisSupplement({assetBase,
  studyLink: (definition, selectedId, studyId, view) => <IndependentStudyLinkControl assetBase={assetBase} definition={definition} selectedId={selectedId} studyId={studyId} view={view} />,
});
export const hraPelvisSupplement=hraPelvisSupplementFor();

export default function HraPelvisDialog({ onClose, initialLink,assetBase='' }: { onClose: () => void; initialLink?: IndependentStudyLink;assetBase?:string }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="eye-layers-dialog um-knee-dialog" showCloseButton={false}>
      <div className="eye-layer-heading">
        <div><DialogTitle>Female pelvis · separate reference</DialogTitle>
          <DialogDescription>41 pelvic surfaces + 2 ureters · HRA v1.10 · CC BY 4.0 · Review pending</DialogDescription></div>
        <Button variant="outline" size="sm" onClick={onClose}><ArrowLeft />Back to atlas</Button>
      </div>
      <IndependentStudyView assetBase={assetBase} definition={hraPelvisDefinition} supplement={assetBase?hraPelvisSupplementFor(assetBase):hraPelvisSupplement} link={initialLink} />
    </DialogContent>
  </Dialog>;
}
