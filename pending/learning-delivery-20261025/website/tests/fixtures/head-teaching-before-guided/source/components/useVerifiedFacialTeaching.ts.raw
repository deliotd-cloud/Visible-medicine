'use client';
import {useEffect,useState} from 'react';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {verifiedHeadCtFacialTeachingRevision,HEAD_CT_FACIAL_TEACHING_REVISION} from '../lib/head-ct-facial-teaching.ts';
import {verifiedHeadCtFacialClinicalRevision,HEAD_CT_FACIAL_CLINICAL_REVISION} from '../lib/head-ct-facial-clinical.ts';

export const FACIAL_CONCEPTS=new Set(['bone-left-zygomatic','bone-right-zygomatic','bone-mandible']);

/** Both independent source-bound packets must verify before a consumer exposes either. */
export function useVerifiedFacialTeaching(revision:string):boolean {
  const [state,setState]=useState<{revision:string;ready:boolean}>({revision,ready:false});
  useEffect(()=>{
    let active=true;
    setState({revision,ready:false});
    if(revision!==HEAD_LINK_REVISION)return ()=>{active=false;};
    Promise.all([verifiedHeadCtFacialTeachingRevision(revision),verifiedHeadCtFacialClinicalRevision(revision)])
      .then(([teaching,clinical])=>{if(active)setState({revision,ready:teaching===HEAD_CT_FACIAL_TEACHING_REVISION&&clinical===HEAD_CT_FACIAL_CLINICAL_REVISION});})
      .catch(()=>{if(active)setState({revision,ready:false});});
    return ()=>{active=false;};
  },[revision]);
  return revision===HEAD_LINK_REVISION&&state.revision===revision&&state.ready;
}
