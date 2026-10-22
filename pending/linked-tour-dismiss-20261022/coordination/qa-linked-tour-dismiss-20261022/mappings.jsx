// Synthetic metadata, route and bookmark doubles. No patient/clinical data or API.
export const HEAD_LINK_REVISION='synthetic-only';
export const HEAD_LINK_REVISION_NOTICE='Synthetic revision unavailable';
export const headLinksCurrent=()=>true;
const concepts=['synthetic-alpha','synthetic-beta'];
export function headConceptById(conceptId){const index=concepts.indexOf(conceptId);return index<0?null:{conceptId,label:index?'Synthetic Beta':'Synthetic Alpha',headRevision:HEAD_LINK_REVISION};}
export function headLearningSequencesForModality(){return[{id:'synthetic-tour',label:'Synthetic orientation',concepts}];}
export function headLearningLinks({sequenceId,conceptId}){const index=concepts.indexOf(conceptId);return sequenceId==='synthetic-tour'&&index>=0?{atlasHref:'/qa-step?headTour=synthetic-tour&headStep='+index+'&headRevision='+HEAD_LINK_REVISION}:null;}
export function headLearningNavigation(position){const index=concepts.indexOf(position.conceptId);if(index<0||position.sequenceId!=='synthetic-tour')return null;const dest=i=>i<0||i>=concepts.length?null:{href:headLearningLinks({sequenceId:position.sequenceId,conceptId:concepts[i]}).atlasHref,label:headConceptById(concepts[i]).label};return{sequenceLabel:'Synthetic orientation',index,total:2,label:headConceptById(position.conceptId).label,previous:dest(index-1),next:dest(index+1),exitHref:'/qa-tour-picker',current:headLearningLinks(position)};}
export const createLectureTourContext=()=>({kind:'unavailable'});
export const relatedLectureHref=()=>null;
export const HeadLearningBookmark=()=>null;
export const useRouter=()=>({push:href=>window.__qaRouterPushes.push(href)});
