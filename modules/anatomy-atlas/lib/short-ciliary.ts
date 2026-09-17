import data from '../public/models/bodyparts3d/short-ciliary/catalog.json' with { type: 'json' };
import { applyBodySourceAddition, sourceCanonical, type BodySourceAddition } from './body-source-additions';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export function addShortCiliary(catalog: BodyCatalog) { return applyBodySourceAddition(catalog, source); }
export function shortCiliaryLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (!source.structures.some(p => sourceCanonical(p) === sourceCanonical(s))) return undefined;
  if (tab === 'anatomy') return {
    readiness: 'draft', title: 'Short ciliary nerve · Source anatomy · draft',
    body: 'This source-defined bilateral group supplies one original mesh file on each side. Use the laterality filter to inspect either file beside the available ganglion and orbital context; Both sides restores the complete source group.',
    bullets: [
      'One unsided FMA identity is retained. Display-side metadata does not create separately validated left/right anatomical concepts.',
      'Each file contains two topological components; visible projections and connected components do not establish normal nerve count or a complete ocular autonomic pathway.',
      'Reassemble before comparing relationships. Near contact does not prove fibre continuity, precise globe entry, an operative plane or patient correspondence.',
    ],
    note: 'Original-source orientation draft; revision-bound radiologist review required.',
    citations: ['https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html'],
  };
  return {readiness:'pending',title:`${s.name} · Review pending`,body:'Structure-specific functional, clinical, pathology, imaging and assessment teaching remains to be authored and reviewed.',bullets:[],note:'No scan registration, individual-nerve imaging visibility or procedural guidance is established by this source model.'};
}
