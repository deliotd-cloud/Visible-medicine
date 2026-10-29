import pin from '../content/appendicular-artery-ultrasound-pin.json' with {type:'json'};
import {sourceCanonical} from './body-source-additions.ts';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected=sourceCanonical(pin.identity);
/** Useful appendix Doppler context; no claimed identification of this named artery. */
export function appendicularArteryUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='ultrasound'||sourceCanonical(s)!==expected)return undefined;
  return {
    readiness:'pending',
    title:'Appendicular artery · ultrasound context · evidence pending',
    body:'Distinguish the named arterial supply from Doppler signals in the appendix wall. The references below describe appendiceal vascularity; they do not validate identification of this exact 3D artery on an acquired ultrasound image.',
    bullets:[
      'Orient to the appendix first: demonstrate continuity with the caecum and a blind-ending tubular structure in longitudinal and transverse views. The UW Medicine protocol then adds Doppler assessment of vascularity.',
      'A 1996 study found wall hyperaemia in many inflamed appendices, but six gangrenous appendices lacked hyperaemia. An absent signal alone therefore cannot establish a normal appendix or exclude disease.',
      'A 2011 study of children without clinical signs of appendicitis detected mural vascularity in only one visualized appendix. This is an observation about wall flow under that study protocol, not a detection rate for the named appendicular artery.',
      'Seeing wall flow is not equivalent to tracing the appendicular artery. Failure to see this small named vessel does not, by itself, establish occlusion; the reference mesh supplies no Doppler measurements.',
    ],
    citations:[
      'https://depts.washington.edu/usrad/wordpress/wp-content/uploads/2022/03/Appendix-Protocol-2.2022.pdf',
      'https://pubmed.ncbi.nlm.nih.gov/8816547/',
      'https://pubmed.ncbi.nlm.nih.gov/21425275/',
    ],
    note:'Source-backed context; specific artery-identification evidence and revision-bound radiologist review remain pending. No acquired image, flow simulation, vessel-patency assessment or patient-space registration is supplied. Interpret imaging with the complete examination and clinical findings.',
  };
}
