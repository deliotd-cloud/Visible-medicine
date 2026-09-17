'use client';
import {useMemo} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {bowelComponentInfo} from '@/lib/bowel-components';
import {makeStudyLink,type StudySide} from '@/lib/study-links';
import type {BodyCatalog} from './body-types';
export function BowelComponents({catalog,region,side,selectedId,disabled,onSelect,onShow}:{catalog:BodyCatalog;region:string;side:string;selectedId:string;disabled:boolean;onSelect:(id:string)=>void;onShow:(key:string)=>void}){
 const info=useMemo(()=>bowelComponentInfo(catalog,region,side,selectedId,disabled),[catalog,region,side,selectedId,disabled]);
 if(!info)return null;
 const whole=info.groups.some(g=>!g.completeHere)?makeStudyLink(catalog,'whole-body',selectedId,side as StudySide):null;
 return <details key={selectedId} className="body-study-tools body-motor-explorer body-bowel-components">
  <summary>Bowel components</summary>
  <p>Compare the bowel aggregates with their separately selectable junction and rectum. No duplicate surfaces are added.</p>
  {info.groups.map(g=><section key={g.key} aria-label={g.title}>
   <h3>{g.title}</h3>
   <Button className="h-auto whitespace-normal text-left" size="sm" variant="outline" onClick={()=>onShow(g.key)}>Show {g.completeHere?'':'available '}{g.title.toLowerCase()}</Button>
   <ul className="body-motor-targets">{g.rows.map(r=><li key={r.structure.id}>
    {r.availableHere?<Button size="sm" variant="ghost" onClick={()=>onSelect(r.structure.id)}>{r.structure.name}</Button>:<span className="body-attachment-unavailable">{r.structure.name} · outside this region</span>}
   </li>)}</ul>
  </section>)}
  {whole&&<p>Some components are outside this region. <Link href={whole} prefetch={false}>Open this selection in whole body</Link>, then choose Show.</p>}
  <details><summary>Scope & controls</summary>
   <p>Source-file coverage is not complete anatomical segmentation. The junction is not a validated cecum or valve. Bowel walls, lumen, sphincters and surgical planes are not supplied by this grouping. Radiologist review pending.</p>
   <p>Show resets cutaway, separation and camera, and enables Organs. Dissection Undo restores layers and removals, not the camera or system switch. Selecting a listed structure restores it if hidden. These unpaired source surfaces stay whole in Left/Right views.</p>
  </details>
 </details>;
}
