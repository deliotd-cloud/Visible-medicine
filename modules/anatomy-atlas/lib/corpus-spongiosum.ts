import data from '../public/models/bodyparts3d/corpus-spongiosum/catalog.json' with {type:'json'};
import {applyBodySourceAddition,sourceCanonical,type BodySourceAddition} from './body-source-additions';
import type {BodyCatalog,BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const source=data as unknown as BodySourceAddition;
export function addCorpusSpongiosum(catalog:BodyCatalog){return applyBodySourceAddition(catalog,source);}
export function corpusSpongiosumLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(!source.structures.some(p=>sourceCanonical(p)===sourceCanonical(s)))return undefined;
  const citations=['https://training.seer.cancer.gov/anatomy/reproductive/male/penis.html'];
  const note='Source-bound teaching draft; anatomical and radiologist review pending. Bulb/shaft representation only: the glans and paired cavernous bodies are not added. No skin, tunical layers, neurovascular supply, dynamic function or scan registration is depicted.';
  if(tab==='anatomy')return {readiness:'draft',title:s.name+' · Anatomy · draft',
    body:'The corpus spongiosum is the ventral erectile column surrounding the spongy urethra. Its distal expansion forms the glans in typical anatomy; this selected source does not include that separate glans surface.',
    bullets:['Compare the existing Urethra selection in Pelvis or Whole body. Whole-source proximity does not verify an enclosed or continuous lumen.','The two corpora cavernosa are anatomically distinct; they are not separate selections in this addition.'],note,citations};
  if(tab==='function')return {readiness:'draft',title:s.name+' · Function · draft',
    body:'Erectile tissue accompanies the urethral passage through the penis. The model is static and does not simulate filling, outflow or urethral patency.',bullets:[],note,citations};
  if(tab==='quiz')return {readiness:'draft',title:s.name+' · Self-check · draft',
    body:'Which erectile column surrounds the spongy urethra?',bullets:['Answer: corpus spongiosum.','The glans is its distal expansion, not a third corpus cavernosum.'],note,citations};
  return {readiness:'pending',title:s.name+' · Review pending',body:'Structure-specific imaging, pathology and clinical teaching remain pending.',bullets:[],note:'No patient scan, diagnostic conclusion, intervention or registered imaging correspondence is supplied.'};
}
