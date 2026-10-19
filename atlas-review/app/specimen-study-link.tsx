'use client';
import { useState } from 'react';
import { Button } from '@/atlas-review/components/ui/button';
import { Input } from '@/atlas-review/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/atlas-review/components/ui/select';
import { makeSpecimenLink } from '@/atlas-review/lib/um-limb-navigation';
import type { SpecimenDefinition } from '@/atlas-review/lib/independent-specimen';
import { specimenTopicLabels, type SpecimenTopic } from '@/atlas-review/lib/specimen-links';
import { availableSpecimenTopics } from '@/atlas-review/lib/um-limb-teaching';
import type { DissectionView } from './dissection-data';
import type {ContainedLimbStudyBase} from '@/atlas-review/lib/model-delivery';

export function SpecimenStudyLink({ definition, selectedId, studyId, view, basePath, reviewAvailable = true }: { definition: SpecimenDefinition; selectedId: string; studyId: string | null; view: DissectionView; basePath?: '/atlas-runtime/lower-limb/index.html'|ContainedLimbStudyBase; reviewAvailable?: boolean }) {
  const [topic, setTopic] = useState<SpecimenTopic | null>(null);
  const topics = availableSpecimenTopics(definition, selectedId);
  const canonical = makeSpecimenLink(definition, { selectedId, studyId, view, topic });
  const href = canonical && basePath ? basePath + (basePath.includes('?')?'&':'?') + canonical.slice(canonical.indexOf('?')+1) : canonical;
  return <details className="um-knee-details"><summary>Link to this study</summary>
    <Select value={topic ?? 'model'} items={[{value:'model',label:'3D model'},...topics.map(t=>({value:t,label:specimenTopicLabels[t]+' notes'}))]} onValueChange={v => setTopic(topics.includes(v as SpecimenTopic) ? v as SpecimenTopic : null)}>
      <SelectTrigger aria-label="Study link opens"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="model">3D model</SelectItem>{topics.map(t => <SelectItem key={t} value={t}>{specimenTopicLabels[t]} notes</SelectItem>)}</SelectContent>
    </Select>
    {!studyId && <p>Custom dissection: the link opens this structure with the region’s source context. Hidden tissues and separation are not saved.</p>}
    {href ? <CopySpecimenLink key={href} href={href} /> : <p>A link cannot be made for this source binding.</p>}
    {href && reviewAvailable && <p><a href={`/workspace/atlas-review/specimens?specimen=${encodeURIComponent(definition.key)}&structure=${encodeURIComponent(selectedId)}`} target="_blank" rel="noreferrer">Review this structure</a></p>}
    <p>Opens the selected source, study and camera direction at the model’s original positions. No access permissions, scan alignment or quiz answers are included.</p>
  </details>;
}
export function CopySpecimenLink({ href }: { href: string }) {
  const [status, setStatus] = useState(''), [fallback, setFallback] = useState('');
  async function copy() {
    const absolute = new URL(href, window.location.origin).href;
    try { await navigator.clipboard.writeText(absolute); setStatus('Study link copied. Access restrictions still apply.'); setFallback(''); }
    catch { setFallback(absolute); setStatus('Automatic copy is unavailable. Select and copy the link below.'); }
  }
  return <><div className="eye-layer-actions"><Button size="sm" variant="outline" onClick={copy}>Copy link</Button><a href={href}>Open linked view</a></div>
    {status && <p role="status">{status}</p>}{fallback && <Input aria-label="Study link to copy" readOnly value={fallback} onFocus={e => e.currentTarget.select()} />}</>;
}
