import pins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
import {colicArteryUltrasoundTopics} from '../content/colic-artery-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected=[
  ['vm:anatomy:body:abdomen:midline:vessel:middle-colic-artery','FMA14810','midline','FJ3542','b77b34cda312ffba8034c41a5457a0ad052d28439efd228ef90724ec3c4adce4'],
  ['vm:anatomy:body:abdomen:right:vessel:right-colic-artery','FMA14811','right','FJ3590','d4099403f391139ea5716f10f441489d1f8abaa7b39a0e21596efe5457bddbd0'],
] as const;

const bindings:ReadonlyMap<string,{signature:string;fmaId:keyof typeof colicArteryUltrasoundTopics}>=
  new Map(expected.map(([id,fmaId,side,file,sha256])=>{
    const matches=pins.entries.filter(entry=>entry.identity.id===id);
    if(matches.length!==1)throw Error('Unexpected colic artery ultrasound source count.');
    const source=matches[0].identity;
    if(source.fmaId!==fmaId||source.nodeName!==fmaId||source.laterality!==side||
      source.region!=='abdomen'||source.regions.length!==1||source.regions[0]!=='abdomen'||
      source.system!=='vessels'||source.category!=='vessel'||source.sourceTree!=='isa'||
      source.bundle!=='abdomen-vessels-mesenteric'||source.sources.length!==1||
      source.sources[0].file!==file||source.sources[0].sha256!==sha256||
      source.validation.status!=='unvalidated'||source.validation.anatomicalReview!==false)
      throw Error('Unexpected colic artery ultrasound source identity.');
    return [id,{signature:sourceCanonical(source),fmaId}] as const;
  }));

/** Exact source-root selections only; neither modality is routine transabdominal US. */
export function colicArteryUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='ultrasound')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||binding.signature!==sourceCanonical(s))return undefined;
  const topic=colicArteryUltrasoundTopics[binding.fmaId];
  return {
    readiness:'draft',
    title:`${s.name} · ${topic.title} · draft`,
    body:topic.body,
    bullets:[...topic.bullets],
    citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No routine transabdominal visibility is guaranteed. No published imagery or text, patient imaging or registration, flow or patency measurement, procedural route or clinical approval is supplied. This static donor surface is not an acquired ultrasound view. Atlas, imaging-case and paid-lecture entitlements remain separate.',
  };
}
