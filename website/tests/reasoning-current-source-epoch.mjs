// Later question cohorts extend the registry; the complete earlier source must
// still be recoverable without changing any existing question or source guard.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=value=>createHash('sha256').update(value).digest('hex');
const cohorts=[
 ['ventricularLandmark','ventricular-landmark'],['upperCervical','upper-cervical'],
 ['hipRelationships','hip-relationships'],['carpalRelationships','carpal-relationships'],
 ['midfootRelationships','midfoot-relationships'],['forearmMechanics','forearm-mechanics'],
 ['lowerArterial','lower-arterial'],['upperVascular','upper-vascular'],['cervicalVascular','cervical-vascular'],
];
export function restoreReasoningRegistry(current,historical){
 assert.equal(sha(historical),'c6b053f9b2d199bfcd3cb1508c833f5f6ccf1a7b2331c1ab073aa1a32a117824','Authenticated original reasoning registry');
 assert.equal(sha(current),'462883b2806932ec7a58585cc56078758e01f52b8f0b08b42fd732edd25352ee','Reviewed current reasoning registry');
 let text=Buffer.from(current).toString('utf8');
 assert.deepEqual(Buffer.from(text),Buffer.from(current),'Lossless current registry');
 const remove=seam=>{assert.equal(text.split(seam).length,2,'Exactly one declared registry extension');text=text.replace(seam,'');};
 for(const [name,file]of cohorts){
  remove(`import { ${name}ReasoningConcepts, ${name}ReasoningSourceMatches } from './${file}-reasoning';\n`);
  remove(`  ...${name}ReasoningConcepts,\n`);
 }
 remove(' || lowerArterialReasoningSourceMatches(s, c.key) || upperVascularReasoningSourceMatches(s, c.key) || cervicalVascularReasoningSourceMatches(s, c.key)');
 remove(' || carpalRelationshipsReasoningSourceMatches(s, c.key) || midfootRelationshipsReasoningSourceMatches(s, c.key)');
 for(const [name,file]of cohorts.filter(([name])=>['ventricularLandmark','upperCervical','hipRelationships','forearmMechanics'].includes(name)))
  remove(`      (!c.key.startsWith('${file}-') || ${name}ReasoningSourceMatches(s, c.key)) &&\n`);
 const restored=Buffer.from(text);
 assert.deepEqual(restored,Buffer.from(historical),'Every original reasoning question and guard survives exactly');
 return restored;
}
