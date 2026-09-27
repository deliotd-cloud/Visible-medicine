import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import { selectionBounds } from './selection-visibility';

export type RegionalTour = {
  id: string; title: string; description: string; region: string; revision: string;
  status: 'draft'; contextIds: string[]; limitations?: string;
  steps: Array<{ id: string; title: string; caption: string; selectedId: string;
    view: DissectionView; durationMs: number; fadeOthers: boolean; references: string[] }>;
};
const id=(side:string,kind:string,name:string)=>`vm:anatomy:body:thorax:${side}:${kind}:${name}`;
const airway='https://anatomy.ttuhscep.edu/schemes/lungs_ans.html';
const vessels=airway;
const arch='https://www.ncbi.nlm.nih.gov/books/NBK431104/';
const thoraxStep=(slug:string,title:string,selectedId:string,view:DissectionView,caption:string,references:string[])=>({id:slug,title,selectedId,view,caption,references,durationMs:14000,fadeOthers:true});
export const thoraxTour: RegionalTour = {
  id:'thoracic-airways-vessels', title:'Thoracic airways & vessels', region:'thorax',
  revision:'thoracic-airways-vessels-v1',status:'draft',
  description:'Six guided stops through the central airways and adjacent great vessels. Other surfaces fade to keep each target visible.',
  contextIds:[id('right','organ','right-lung'),id('left','organ','left-lung')],
  steps:[
    thoraxStep('trachea','Trachea',id('unpaired','organ','trachea'),'anterior','Begin with the tracheal surface between the lung outlines. This central airway leads towards the main bronchi. These separate exterior surfaces do not demonstrate a continuous airway lumen.',[airway]),
    thoraxStep('right-bronchus','Right main bronchus',id('right','organ','right-main-bronchus'),'right','Follow the proximal right main-bronchus surface towards the right lung. Compare its position with the trachea; this source does not provide a complete lobar bronchial tree.',[airway]),
    thoraxStep('left-bronchus','Left main bronchus',id('left','organ','left-main-bronchus'),'left','Now identify the left main-bronchus surface approaching the left lung. The tour retains the common source frame; fading makes the relationship visible without separating the structures.',[airway]),
    thoraxStep('aortic-arch','Aortic arch',id('midline','vessel','arch-of-aorta'),'left','Locate the aortic arch above the left main-bronchus region. In usual anatomy the arch curves over this airway. Assess the supplied surfaces as an orientation model, not a patient-specific relationship.',[arch]),
    thoraxStep('right-pulmonary-artery','Right pulmonary artery',id('right','vessel','right-pulmonary-artery'),'right','Compare the right pulmonary artery with the right main bronchus. In usual anatomy the artery passes anterior to the bronchus on its route towards the right lung.',[vessels]),
    thoraxStep('left-pulmonary-artery','Left pulmonary artery',id('left','vessel','left-pulmonary-artery'),'left','Compare the left pulmonary artery with the left main bronchus. In usual anatomy the artery is superior to the bronchus. These are selected exterior segments, not a complete hilar or lobar map.',[vessels]),
  ],
};
const cervicalId=(name:string)=>`vm:anatomy:body:spine:midline:bone:${name}`;
const cervicalReference='https://anatomy.ttuhscep.edu/schemes/back_tables.html';
const cervicalStep=(slug:string,title:string,name:string,view:DissectionView,caption:string)=>({
  id:slug,title,selectedId:cervicalId(name),view,caption,references:[cervicalReference],durationMs:14000,fadeOthers:true,
});
export const cervicalSpineTour: RegionalTour = {
  id:'cervical-spine-orientation',title:'Cervical spine: C1 to T1',region:'spine',
  revision:'cervical-spine-orientation-v1',status:'draft',
  description:'Five guided stops from the atlas to the cervicothoracic junction. C4–C6 remain as faded context in the original source frame.',
  limitations:'Selected bony source surfaces only; discs, ligaments, spinal cord and nerve roots are not shown in this tour. Typical features vary between individuals. No joint-motion simulation, acquired imaging or spatial registration. Draft pending radiologist review.',
  contextIds:['fourth-cervical-vertebra','fifth-cervical-vertebra','sixth-cervical-vertebra'].map(cervicalId),
  steps:[
    cervicalStep('c1','C1 · Atlas','atlas','anterior','Begin at C1. Unlike a typical vertebra, atlas forms a ring with anterior and posterior arches rather than a vertebral body. Use the faded C2 surface below for orientation.'),
    cervicalStep('c2','C2 · Axis','axis','right','Locate the dens rising from C2 towards the anterior arch of C1. Compare these neighbouring bones without separating them; this tour does not simulate their movement.'),
    cervicalStep('c3','C3 · Typical cervical vertebra','third-cervical-vertebra','posterior','Use C3 to orient the mid-cervical series. Typical cervical features include a small body, transverse foramina and a bifid spinous process. Compare with the faded C4–C6 surfaces; fine details require source review.'),
    cervicalStep('c7','C7 · Vertebra prominens','seventh-cervical-vertebra','posterior','Follow the series down to C7. Its spinous process is usually longer and non-bifid compared with the mid-cervical vertebrae. This is a typical distinction, not a reliable patient-level numbering rule on its own.'),
    cervicalStep('t1','T1 · Cervicothoracic junction','first-thoracic-vertebra','left','Finish at T1, below C7. Thoracic vertebrae bear rib-articulation facets. Compare the bony transition here; ribs and soft tissues are outside this tour, and no patient scan is aligned.'),
  ],
};
export const regionalTours=[thoraxTour,cervicalSpineTour];
export const regionalTourFor=(region:string)=>regionalTours.find(t=>t.region===region)??null;
export const regionalTourLimitations=(tour:RegionalTour)=>tour.limitations??'Selected exterior source surfaces only; no complete lumen, bronchial tree, surgical plane, acquired imaging or spatial registration. Draft pending radiologist review.';

/** Resolve exact identities; never substitute a similarly named surface. */
export function regionalTourStructures(catalog:BodyCatalog,tour:RegionalTour):BodyStructure[] {
  const ids=[...new Set([...tour.contextIds,...tour.steps.map(s=>s.selectedId)])];
  return ids.map(id=>{
    const matches=catalog.structures.filter(s=>s.id===id&&s.regions.includes(tour.region));
    if(matches.length!==1||catalog.bundles.filter(b=>b.id===matches[0].bundle).length!==1)
      throw Error('The guided tour does not match the available anatomy source.');
    return matches[0];
  });
}
export function regionalTourFrame(catalog:BodyCatalog,tour:RegionalTour) {
  return selectionBounds(regionalTourStructures(catalog,tour).filter(s=>tour.steps.some(step=>step.selectedId===s.id)));
}
/** Complete sequence plus all visible context is material review evidence. */
export function regionalTourEvidence(catalog:BodyCatalog,structureId:string) {
  return regionalTours.filter(t=>[...t.contextIds,...t.steps.map(s=>s.selectedId)].includes(structureId)).map(tour=>{
    const structures=regionalTourStructures(catalog,tour);
    return structuredClone({tour,structures,bundles:catalog.bundles.filter(b=>structures.some(s=>s.bundle===b.id)),
      coordinateSystem:catalog.coordinateSystem,sourceVersion:catalog.sourceVersion,frame:regionalTourFrame(catalog,tour),
      transitionMs:1800,transition:'quintic-orbit',separation:0,
      limitations:regionalTourLimitations(tour)});
  });
}
