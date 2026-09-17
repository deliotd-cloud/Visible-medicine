import data from '../public/models/bodyparts3d/anterior-cardiac-vein/catalog.json' with {type:'json'};
import {applyBodySourceAddition,sourceCanonical,type BodySourceAddition} from './body-source-additions';
import type {BodyCatalog,BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const source=data as unknown as BodySourceAddition;
export function addAnteriorCardiacVein(catalog:BodyCatalog){return applyBodySourceAddition(catalog,source);}
export function anteriorCardiacVeinLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(!source.structures.some(p=>sourceCanonical(p)===sourceCanonical(s)))return undefined;
  const citations=['https://pubmed.ncbi.nlm.nih.gov/1163193/','https://pubmed.ncbi.nlm.nih.gov/12645157/'];
  const note='Original educational draft for revision-bound radiologist review. Source-surface contact does not demonstrate drainage openings, a connected lumen or patient registration. Atlas, imaging-case and paid-lecture access remain independent.';
  if(tab==='anatomy')return {readiness:'draft',title:s.name+' · Anatomy · draft',body:'Anterior cardiac veins course on the anterior right-ventricular surface toward the right atrium. Their number, course and atrial drainage arrangements vary; common channels can occur.',bullets:['This selection keeps two original mesh components together under one source identity, not two newly named veins.','Do not confuse this group with the great cardiac vein anteriorly or the middle cardiac vein posteriorly.','Use the cardiac-venous study to remove the covering heart, inspect the source group, then Undo and reassemble before comparing relationships.',s.coverageNote ?? 'Source geometry remains unvalidated.'],citations,note};
  if(tab==='function')return {readiness:'draft',title:s.name+' · Function · draft',body:'These veins return blood from the anterior right-ventricular myocardium toward the right atrium through routes that need not pass through the coronary sinus.',bullets:['The static surfaces do not establish a complete drainage territory, normal branching pattern, flow direction or patent lumen.','A visible crossing or apparent join with the right coronary artery is a spatial relationship, not an artery-to-vein communication.'],citations,note};
  if(tab==='quiz')return {readiness:'draft',title:s.name+' · Self-check · draft',body:'Must every cardiac vein return blood through the coronary sinus?',bullets:['No. Anterior cardiac veins provide routes toward the right atrium outside the coronary-sinus pathway.','Identify the anterior source group, then compare the existing great and middle cardiac veins. The supplied surfaces do not verify their drainage junctions.'],citations,note};
  return {readiness:'pending',title:s.name+' · Review pending',body:'Structure-specific imaging and clinical teaching remain to be authored and reviewed.',bullets:[],note:'No patient scan, validated imaging visibility, diagnosis, intervention or registered correspondence is supplied.'};
}
