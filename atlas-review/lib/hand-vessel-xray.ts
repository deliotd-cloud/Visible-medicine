import pins from '../content/hand-vessel-xray-pins.json' with {type:'json'};
import {handVesselXrayFacts,handVesselXrayLimitations,handVesselXrayNote} from '../content/hand-vessel-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family=keyof typeof handVesselXrayFacts;
const families:Readonly<Record<Family,readonly string[]>>={
 metacarpalArtery:['FMA22864','FMA22865'],radialis:['FMA22777','FMA22778'],
 commonFirst:['FMA22856','FMA85118'],commonSecond:['FMA85119','FMA85120'],
 commonThird:['FMA85121','FMA85122'],commonFourth:['FMA85123','FMA85124'],
 properMiddleLateral:['FMA22858','FMA22860'],properIndexMedial:['FMA23050','FMA23051'],
 properRingMedial:['FMA23052'],properLittleLateral:['FMA23054','FMA23055'],
 properMiddleMedial:['FMA85112'],properRingLateral:['FMA85115','FMA85116'],
 deepVenousArch:['FMA22912','FMA22913'],superficialVenousArch:['FMA22915','FMA22916'],
 dorsalNetwork:['FMA62506','FMA62507'],metacarpalVein:['FMA22920','FMA22921'],
 indexVein:['FMA85096','FMA85097'],middleVein:['FMA85098','FMA85099'],ringVein:['FMA85100','FMA85101'],
};
const bindings=new Map(pins.entries.flatMap(entry=>{
 const family=entry.family as Family;
 return Object.hasOwn(families,family)&&families[family].includes(entry.identity.fmaId)
  ?[[entry.identity.id,{signature:sourceCanonical(entry.identity),family}] as const]:[];
}));
/** Named reference context only, not normal plain-film visibility or angiographic filling. */
export function handVesselXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='xray')return undefined;
 const binding=bindings.get(s.id);
 if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
 const fact=handVesselXrayFacts[binding.family];
 return{readiness:'draft',title:`${s.name} · X-ray vascular context · draft`,body:fact.body,
  bullets:[...fact.bullets,`Retained source: ${s.fmaId} · ${s.laterality} · ${s.sources.length} recorded component${s.sources.length===1?'':'s'}.`,
   `Source limit: ${s.coverageNote}`,...handVesselXrayLimitations],citations:[...fact.references],note:handVesselXrayNote};
}
