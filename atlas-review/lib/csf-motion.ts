import data from '../content/csf-motion.v1.json' with {type:'json'};
import {ventricularGuide} from './ventricular-guide';
import {ventricleCatalog} from './ventricles';
import type {BodyStructure} from '../app/body-types';

export const csfMotionReferences=[{title:'Chen et al. · Respiratory and cardiac CSF motion (MRI study)',
  url:'https://pubmed.ncbi.nlm.nih.gov/26241682/'}];
const canonical=(v:unknown):string=>Array.isArray(v)?`[${v.map(canonical).join(',')}]`:
  v&&typeof v==='object'?`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${canonical((v as Record<string,unknown>)[k])}`).join(',')}}`:JSON.stringify(v);
export function csfMotionFor(parent:BodyStructure){
  if(data.schemaVersion!==1||data.periodSeconds!==4||canonical(data.axis)!=='[0,1,0]'||
    !ventricularGuide(parent)||canonical(parent)!==canonical(data.parent)||
    canonical(data.bundle)!==canonical(ventricleCatalog.bundles.find(b=>b.id==='ventricles'))||
    data.records.length!==4||new Set(data.records.map(r=>r.structure.id)).size!==4||
    data.records.some(r=>canonical(r.structure)!==canonical(ventricleCatalog.structures.find(s=>s.id===r.structure.id))||
      r.tracks.length!==40||r.tracks.some(t=>t.center.length!==3||!t.center.every(Number.isFinite)||
        !Number.isFinite(t.phase)||!Number.isFinite(t.amplitude)||t.amplitude<=0)))return null;
  return {title:'CSF motion · schematic',status:'draft' as const,periodSeconds:data.periodSeconds,
    axis:[...data.axis],markerCount:160,sourceBundleHash:data.bundle.sha256,
    limitation:'Gentle back-and-forth markers illustrate that CSF can oscillate. Their direction, timing, amplitude and density are arbitrary display choices—not measured physiology, net circulation or a fluid-dynamics simulation. Markers stay in separate supplied ventricular spaces: no flow through unsegmented foramina, aqueduct, outlets or subarachnoid spaces. No pressure, obstruction, glymphatic clearance, patient-specific flow or CT/MRI registration is inferred. Draft pending radiologist review.',
    references:csfMotionReferences.map(r=>({...r}))};
}
export function csfMotionAllowed(s:{requested:boolean;reducedMotion:boolean;pageHidden:boolean;ready:boolean;explode:number;cut:boolean;exam:boolean}){
  return s.requested&&!s.reducedMotion&&!s.pageHidden&&s.ready&&s.explode===0&&!s.cut&&!s.exam;
}
export function csfTracksFor(structure:BodyStructure,bundleHash:string){
  if(!csfMotionFor(data.parent as BodyStructure)||bundleHash!==data.bundle.sha256)return [];
  const matches=data.records.filter(r=>canonical(r.structure)===canonical(structure));
  return matches.length===1?matches[0].tracks:[];
}
/** Continuous reversible position, with no frame-rate-dependent velocity. */
export function csfMarkerY(center:number,amplitude:number,phase:number,seconds:number){
  return center+amplitude*Math.sin(seconds*Math.PI*2/data.periodSeconds+phase);
}
