import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

// Full source record at bd5465ee; a name or FMA match alone is insufficient.
const identity = {
  id:'vm:anatomy:body:abdomen:unspecified:vessel:ileocolic-artery',
  fmaId:'FMA14815',name:'Ileocolic artery',sourceName:'ileocolic artery',
  system:'vessels',category:'vessel',laterality:'unspecified',region:'abdomen',
  regions:['abdomen'],bundle:'abdomen-vessels-mesenteric',nodeName:'FMA14815',
  bounds:{min:[-0.3138050138950348,1.5446600914001465,0.7963600158691406],
    max:[-0.054398197680711746,1.8339098691940308,0.9436999559402466]},
  center:[-0.18410160578787327,1.6892849802970886,0.8700299859046936],
  anchor:[-0.1850760132074356,1.7021899223327637,0.8727099895477295],
  sourceTree:'isa',
  sources:[{file:'FJ3439',sha256:'a0e7715dace7a22773b5e976f415b6049fe84eeb8e91f01cb6a4582c31ced81a'}],
  coverageNote:'Unvalidated BodyParts3D 4.0 source surface in the unchanged common coordinate frame. Selected named vessel surface only, not a complete vascular tree. Branch continuity, calibre, bowel supply territories, variants and vessel relationships require specialist review. No flow, patency or procedural guidance is established.',
  provenance:{method:'licensed-source-mesh',license:'CC-BY-4.0',sourceVersion:'4.0',recovered:true},
  validation:{status:'unvalidated',anatomicalReview:false},
} as const;

const canonical=(value:unknown):string=>Array.isArray(value)
  ?`[${value.map(canonical).join(',')}]`
  :value&&typeof value==='object'
    ?`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical((value as Record<string,unknown>)[k])}`).join(',')}}`
    :JSON.stringify(value);
const expected=canonical(identity);

/** Original text about one published observation, not an artery-detection rate. */
export function ileocolicArteryUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='ultrasound'||canonical(s)!==expected)return undefined;
  return {
    readiness:'draft',
    title:'Ileocolic artery · ultrasound orientation · draft',
    body:'An ultrasound figure from one healthy child labels the ileocolic artery (IA) and ileocolic vein (IV). Use those labels as an orientation example, not evidence that the artery can routinely be identified across patients. The study investigated mesenteric lymph nodes, not artery-detection reliability.',
    bullets:[
      'Figure 1 presents color Doppler and superb microvascular imaging of a mesenteric lymph node in a healthy six-year-old child. The IA and IV labels identify the artery and vein in that example only.',
      'A 1997 report describes an ileocolic artery aneurysm and discusses Doppler ultrasound. Evidence from an abnormal case must not be used to infer normal appearance or routine visibility.',
      'The named root artery has its own catalogue identity. These references do not identify the ascending branch of its inferior branch or the appendicular artery in the displayed source model.',
    ],
    citations:[
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC6659467/',
      'https://pubmed.ncbi.nlm.nih.gov/9172672/',
    ],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No article image, scan, Doppler data or patient-space registration is supplied. The static BodyParts3D surface cannot establish flow, patency, branch continuity, diagnostic thresholds or clinical decisions. Atlas, case and lecture access remain independent.',
  };
}
