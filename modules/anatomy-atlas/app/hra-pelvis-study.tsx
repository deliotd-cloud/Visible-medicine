'use client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { IndependentStudyView, IndependentStudyLinkControl } from './independent-study-navigation';
import type { IndependentStudyLink } from '@/lib/independent-study-links';
import { hraPelvisDefinition } from '@/lib/hra-pelvis';
import { createHraPelvisSupplement } from './hra-pelvis-supplement';

export const hraPelvisSupplement = createHraPelvisSupplement({
  studyLink: (definition, selectedId, studyId, view) => <IndependentStudyLinkControl definition={definition} selectedId={selectedId} studyId={studyId} view={view} />,
});

export default function HraPelvisDialog({ onClose, initialLink }: { onClose: () => void; initialLink?: IndependentStudyLink }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="eye-layers-dialog um-knee-dialog" showCloseButton={false}>
      <div className="eye-layer-heading">
        <div><DialogTitle>Female pelvis · separate reference</DialogTitle>
          <DialogDescription>41 source surfaces · HRA v1.10 · CC BY 4.0 · Review pending</DialogDescription></div>
        <Button variant="outline" size="sm" onClick={onClose}><ArrowLeft />Back to atlas</Button>
      </div>
      <IndependentStudyView definition={hraPelvisDefinition} supplement={hraPelvisSupplement} link={initialLink} />
    </DialogContent>
  </Dialog>;
}
