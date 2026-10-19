import {parseSavedHeadTeachingDraft,type SavedHeadTeachingDraft,type HeadTeachingDraftKind} from './head-teaching-review-contract.ts';

// Isolated from body/nested decisions, even though the append-only table is shared.
export const headTeachingDraftKey=JSON.stringify(['vm-head-teaching-drafts-1','ct-mri']);
const structure='head-learning-anatomy',track='teaching';
export const brainstemClinicalDraftKey=JSON.stringify(['vm-head-brainstem-clinical-drafts-1','ct-mri']);
export const ventricularClinicalDraftKey=JSON.stringify(['vm-head-ventricular-clinical-drafts-1','ct-mri']);
export const cerebellarClinicalDraftKey=JSON.stringify(['vm-head-cerebellar-clinical-drafts-1','ct-mri']);
export const deepGreyClinicalDraftKey=JSON.stringify(['vm-head-deep-grey-clinical-drafts-1','ct-mri']);
export const lobarClinicalDraftKey=JSON.stringify(['vm-head-lobar-clinical-drafts-1','ct-mri']);
export const hippocampalClinicalDraftKey=JSON.stringify(['vm-head-hippocampal-clinical-drafts-1','ct-mri']);
export const mriOnlyClinicalDraftKey=JSON.stringify(['vm-head-mri-only-clinical-drafts-1','mri-reference3d']);
export const mriAnatomyChecksDraftKey=JSON.stringify(['vm-head-mri-anatomy-checks-drafts-1','mri-reference3d']);
const storage=(kind:HeadTeachingDraftKind)=>{
  if(kind==='anatomy')return {key:headTeachingDraftKey,structure,track};
  if(kind==='brainstem-clinical')return {key:brainstemClinicalDraftKey,structure:'head-brainstem-clinical',track:'teaching'};
  if(kind==='ventricular-clinical')return {key:ventricularClinicalDraftKey,structure:'head-ventricular-clinical',track:'teaching'};
  if(kind==='cerebellar-clinical')return {key:cerebellarClinicalDraftKey,structure:'head-cerebellar-clinical',track:'teaching'};
  if(kind==='deep-grey-clinical')return {key:deepGreyClinicalDraftKey,structure:'head-deep-grey-clinical',track:'teaching'};
  if(kind==='lobar-clinical')return {key:lobarClinicalDraftKey,structure:'head-lobar-clinical',track:'teaching'};
  if(kind==='hippocampal-clinical')return {key:hippocampalClinicalDraftKey,structure:'head-hippocampal-clinical',track:'teaching'};
  if(kind==='mri-only-clinical')return {key:mriOnlyClinicalDraftKey,structure:'head-mri-only-clinical',track:'teaching'};
  if(kind==='mri-anatomy-checks')return {key:mriAnatomyChecksDraftKey,structure:'head-mri-anatomy-checks',track:'teaching'};
  throw Error('Invalid head teaching draft kind.');
};
const expectedScope=(kind:HeadTeachingDraftKind)=>kind==='anatomy'?'head-linked-teaching-drafts':kind==='brainstem-clinical'?'head-brainstem-clinical-drafts':kind==='cerebellar-clinical'?'head-cerebellar-clinical-drafts':kind==='deep-grey-clinical'?'head-deep-grey-clinical-drafts':kind==='lobar-clinical'?'head-lobar-clinical-drafts':kind==='hippocampal-clinical'?'head-hippocampal-clinical-drafts':kind==='mri-only-clinical'?'head-mri-only-clinical-drafts':kind==='mri-anatomy-checks'?'head-mri-anatomy-checks-drafts':'head-ventricular-clinical-drafts';
type Row={user_id:string;nested_key:string;structure_id:string;track:string;version:number;payload:string;saved_at:string};

export async function headTeachingDraftHistory(db:Pick<D1Database,'prepare'>,user:string,before=2147483648,kind:HeadTeachingDraftKind='anatomy'):Promise<SavedHeadTeachingDraft[]>{
  if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw Error('Invalid history cursor.');
  const tuple=storage(kind);
  const rows=await db.prepare(`SELECT user_id,nested_key,structure_id,track,version,payload,saved_at
    FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3
    AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`)
    .bind(user,tuple.key,tuple.structure,tuple.track,before).all<Row>();
  return rows.results.map(row=>{
    const saved=parseSavedHeadTeachingDraft(JSON.parse(row.payload));
    if(row.user_id!==user||row.nested_key!==tuple.key||row.structure_id!==tuple.structure||row.track!==tuple.track||
      saved.context.catalogScope!==expectedScope(kind)||saved.context.packetId!==tuple.structure||
      row.version!==saved.version||row.saved_at!==saved.savedAt)throw Error('Stored head teaching envelope mismatch.');
    return saved;
  });
}

export async function appendHeadTeachingDraft(db:Pick<D1Database,'prepare'>,user:string,saved:SavedHeadTeachingDraft,expected:number,kind:HeadTeachingDraftKind='anatomy'){
  const record=parseSavedHeadTeachingDraft(saved);
  const tuple=storage(kind);
  if(record.context.catalogScope!==expectedScope(kind)||record.context.packetId!==tuple.structure)throw Error('Wrong teaching packet identity.');
  if(!Number.isSafeInteger(expected)||expected<0||expected>2147483646||record.version!==expected+1)throw Error('Invalid append version.');
  const result=await db.prepare(`INSERT INTO atlas_personal_nested_review_events
    (user_id,nested_key,structure_id,track,version,payload,saved_at)
    SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE COALESCE((SELECT MAX(version)
      FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3 AND track=?4),0)=?8`)
    .bind(user,tuple.key,tuple.structure,tuple.track,record.version,JSON.stringify(record),record.savedAt,expected).run();
  return result.meta.changes===1;
}
