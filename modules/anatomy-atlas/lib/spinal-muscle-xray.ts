import pins from '../content/spinal-muscle-xray-pins.json' with {type:'json'};
import {spinalMuscleXrayFacts,spinalMuscleXrayLimitations} from '../content/spinal-muscle-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family=keyof typeof spinalMuscleXrayFacts;
const families:Readonly<Record<Family,readonly string[]>>={
 trapeziusAscending:['FMA33581','FMA33583'],trapeziusDescending:['FMA33586','FMA33587'],trapeziusTransverse:['FMA33584','FMA33585'],
 iliocostalisCervicis:['FMA22744','FMA22745'],iliocostalisLumborum:['FMA22740','FMA22741'],iliocostalisThoracis:['FMA22742','FMA22743'],
 longissimusCapitis:['FMA22754','FMA22756'],longissimusCervicis:['FMA22757','FMA22758'],longissimusThoracis:['FMA22751','FMA22753'],
 semispinalisCapitis:['FMA22876','FMA22877'],semispinalisCervicis:['FMA22874','FMA22875'],semispinalisThoracis:['FMA22872','FMA22873'],
 spleniusCapitis:['FMA22728','FMA22729'],spleniusCervicis:['FMA22726','FMA22727'],
 serratusPosteriorInferior:['FMA13405','FMA13406'],serratusPosteriorSuperior:['FMA13403','FMA13404'],
 obliquusInferior:['FMA32536','FMA32537'],obliquusSuperior:['FMA32534','FMA32535'],
 rectusPosteriorMajor:['FMA32530','FMA32531'],rectusPosteriorMinor:['FMA32532','FMA32533'],
 interspinalisThoracis:['FMA22890','FMA22891'],interspinalesCervicis:['FMA71309'],interspinalesLumborum:['FMA71307'],
 cervicalRotator:['FMA81752','FMA81753'],lumbarRotator:['FMA23089','FMA23090'],thoracicRotator:['FMA23083'],
 lumbarIntertransversariusLateral:['FMA22850'],lumbarIntertransversariusMedial:['FMA22851'],
 cervicalIntertransversariiAnterior:['FMA71442'],cervicalIntertransversariiPosterior:['FMA71443'],
 levatoresCostarumBreves:['FMA74077','FMA74078'],spinalis:['FMA77179'],
};
const bindings=new Map(pins.entries.flatMap(entry=>{
 const family=entry.family as Family;
 return Object.hasOwn(families,family)&&families[family].includes(entry.identity.fmaId)
  ?[[entry.identity.id,{signature:sourceCanonical(entry.identity),family}] as const]:[];
}));

/** Bony orientation only: never muscle visibility or patient-space correspondence. */
export function spinalMuscleXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='xray')return undefined;
 const binding=bindings.get(s.id);
 if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
 const fact=spinalMuscleXrayFacts[binding.family];
 return{readiness:'draft',title:`${s.name} · X-ray orientation · draft`,body:fact.body,
  bullets:[fact.distinction,fact.projection,...spinalMuscleXrayLimitations],citations:[...fact.references],
  note:'Original educational draft; revision-bound radiologist review pending. No acquired image, clinical approval, diagnosis, validated muscle attachment or patient-space registration is supplied. Atlas, imaging-case and lecture access remain independent.'};
}
