import {isCurrentRegionalMriSpecimenSelection,publicSpecimenTarget,type RegionalMriSpecimenSelection} from './regional-mri-specimen-focus.ts';
import {isCurrentRegionalMriBodySelection,publicBodyTarget,type RegionalMriBodySelection} from './regional-mri-body-focus.ts';
import type {RegionalMriInlineInspection} from './regional-mri-inline-inspection.ts';

export type RegionalMriReferenceSelection=RegionalMriSpecimenSelection|RegionalMriBodySelection;
/** Two independent opaque channel proofs, never a deserialized approval or spatial match. */
export function isCurrentRegionalMriReferenceSelection(value:unknown):value is RegionalMriReferenceSelection{
 return isCurrentRegionalMriSpecimenSelection(value)||isCurrentRegionalMriBodySelection(value);
}
/** Presentation identity only; never a substitute for the separately owned MRI handoff. */
export function regionalMriReferenceMatchesRequested(value:unknown,inspection:RegionalMriInlineInspection):boolean{
 if(isCurrentRegionalMriBodySelection(value)){
  const expected=publicBodyTarget(inspection),target=value.target;
  return expected!==null&&value.atlasRevision===inspection.atlasRevision&&
   value.region===new URL(inspection.target.href,'https://visible-medicine.invalid').searchParams.get('region')&&
   target.kind===expected.kind&&target.id===expected.id&&target.source===expected.source&&target.laterality===expected.laterality;
 }
 if(isCurrentRegionalMriSpecimenSelection(value)){
  const expected=publicSpecimenTarget(inspection),target=value.target;
  return expected!==null&&value.atlasRevision===inspection.atlasRevision&&target.scope===expected.scope&&
   target.id===expected.id&&target.source===expected.source&&target.revision===expected.revision&&target.laterality===expected.laterality;
 }
 return false;
}
