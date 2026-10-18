import pins from '../content/genicular-imaging-pins.json' with {type:'json'};
import {genicularUltrasoundTopics, type GenicularUltrasoundGroup} from '../content/genicular-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected = [
  ['right-middle-genicular-artery','FMA22562','right','middle'],
  ['left-middle-genicular-artery','FMA22563','left','middle'],
  ['right-inferior-lateral-genicular-artery','FMA43892','right','inferior-lateral'],
  ['left-inferior-lateral-genicular-artery','FMA43893','left','inferior-lateral'],
] as const;
const bindings = new Map(expected.map(([name,fma,side,group]) => {
  const id=`vm:anatomy:body:leg:${side}:vessel:${name}`;
  const matches=pins.entries.filter(e=>e.group===group&&e.identity.id===id&&
    e.identity.fmaId===fma&&e.identity.laterality===side&&e.identity.bundle==='genicular-arteries'&&
    e.identity.region==='leg'&&e.identity.system==='vessels'&&e.identity.category==='vessel');
  if(matches.length!==1)throw Error(`Expected one exact genicular US source identity: ${name}`);
  const {identity}=matches[0];
  return [id,{signature:sourceCanonical(identity),group:group as GenicularUltrasoundGroup,coverageNote:identity.coverageNote}] as const;
}));

/** Study-limited teaching; no inference of bilateral normal visibility or scan registration. */
export function genicularUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='ultrasound')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=genicularUltrasoundTopics[binding.group];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,...(binding.coverageNote?[binding.coverageNote]:[]),
      'The retained atlas surface is an independent reference, not an acquired ultrasound image or measured Doppler signal. Reassemble before conceptual comparison; source laterality and model colour do not establish patient side, a sonographic target, lumen, patency, perfusion or a complete arterial network.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; exact-revision radiologist review pending. No patient scan, publisher image, procedure advice, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
