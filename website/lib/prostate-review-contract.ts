export type ProstateReviewContext={schema:'vm-prostate-review-context-1';modelRevision:string;contentRevision:string;checklistVersion:'prostate-zones-v1';approvalScope:'schematic-model-and-teaching-only';patientRegistration:false;publicationApproval:false};
export type ProstateReviewStatus='not-reviewed'|'changes-required'|'approved';
export type ProstateDecision={geometry:ProstateReviewStatus;teaching:ProstateReviewStatus;notes:string;attested:boolean};
export type ProstateReviewEvent={eventSchema:'vm-prostate-zones-review-event-1';context:ProstateReviewContext;version:number;savedAt:string;decision:ProstateDecision};
export type ProstateReviewHistory={context:ProstateReviewContext;history:ProstateReviewEvent[];latestVersion:number;nextBefore:number|null;scope:'private-to-signed-in-account-and-institution'};
const exact=(v:unknown,keys:readonly string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const digest=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const status=(v:unknown):v is ProstateReviewStatus=>v==='not-reviewed'||v==='changes-required'||v==='approved';
const contextKeys=['schema','modelRevision','contentRevision','checklistVersion','approvalScope','patientRegistration','publicationApproval'];
export function parseProstateReviewContext(value:unknown):ProstateReviewContext{
 if(!exact(value,contextKeys)||value.schema!=='vm-prostate-review-context-1'||!digest(value.modelRevision)||!digest(value.contentRevision)||value.checklistVersion!=='prostate-zones-v1'||value.approvalScope!=='schematic-model-and-teaching-only'||value.patientRegistration!==false||value.publicationApproval!==false)throw Error('Invalid prostate review context.');
 return Object.freeze({schema:'vm-prostate-review-context-1',modelRevision:value.modelRevision,contentRevision:value.contentRevision,checklistVersion:'prostate-zones-v1',approvalScope:'schematic-model-and-teaching-only',patientRegistration:false,publicationApproval:false});
}
/** Construct only from server-resolved review material. */
export function prostateReviewContext({revision,modelRevision}:{revision:unknown;modelRevision:unknown}):ProstateReviewContext{
 return parseProstateReviewContext({schema:'vm-prostate-review-context-1',modelRevision,contentRevision:revision,checklistVersion:'prostate-zones-v1',approvalScope:'schematic-model-and-teaching-only',patientRegistration:false,publicationApproval:false});
}
export function sameProstateReviewContext(a:unknown,b:unknown){try{return JSON.stringify(parseProstateReviewContext(a))===JSON.stringify(parseProstateReviewContext(b));}catch{return false;}}
export function blankProstateDecision():ProstateDecision{return {geometry:'not-reviewed',teaching:'not-reviewed',notes:'',attested:false};}
export function validateProstateDecision(value:unknown):ProstateDecision{
 if(!exact(value,['geometry','teaching','notes','attested'])||!status(value.geometry)||!status(value.teaching)||typeof value.notes!=='string'||value.notes.length>6000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value.notes)||typeof value.attested!=='boolean')throw Error('Invalid prostate review decision.');
 if((value.geometry==='changes-required'||value.teaching==='changes-required')&&value.notes.trim().length<10)throw Error('Describe required changes in at least 10 characters.');
 if((value.geometry==='approved'||value.teaching==='approved')!==value.attested)throw Error('Approval requires an explicit reviewer attestation for the selected sections only.');
 return Object.freeze({geometry:value.geometry,teaching:value.teaching,notes:value.notes,attested:value.attested});
}
export function parseProstateReviewEvent(value:unknown):ProstateReviewEvent{
 if(!exact(value,['eventSchema','context','version','savedAt','decision'])||value.eventSchema!=='vm-prostate-zones-review-event-1'||typeof value.version!=='number'||!Number.isSafeInteger(value.version)||value.version<1||value.version>2147483647||typeof value.savedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.savedAt)||!Number.isFinite(Date.parse(value.savedAt))||new Date(value.savedAt).toISOString()!==value.savedAt)throw Error('Invalid saved prostate review.');
 return Object.freeze({eventSchema:'vm-prostate-zones-review-event-1',context:parseProstateReviewContext(value.context),version:value.version,savedAt:value.savedAt,decision:validateProstateDecision(value.decision)});
}
export function parseProstateReviewHistory(value:unknown,expectedContext:ProstateReviewContext,before=2147483648):ProstateReviewHistory{
 const expected=parseProstateReviewContext(expectedContext);
 if(!Number.isSafeInteger(before)||before<1||before>2147483648||!exact(value,['context','history','latestVersion','nextBefore','scope'])||!sameProstateReviewContext(value.context,expected)||!Array.isArray(value.history)||value.history.length>20||typeof value.latestVersion!=='number'||!Number.isSafeInteger(value.latestVersion)||value.latestVersion<0||value.latestVersion>2147483647||value.scope!=='private-to-signed-in-account-and-institution')throw Error('Invalid prostate review history.');
 const latestVersion=value.latestVersion;
 let prior=before;const history=value.history.map((item:unknown)=>{const event=parseProstateReviewEvent(item);if(event.version>=prior||event.version>latestVersion||event.context.checklistVersion!==expected.checklistVersion||event.context.approvalScope!==expected.approvalScope||event.context.patientRegistration!==false||event.context.publicationApproval!==false)throw Error('Invalid prostate review order.');prior=event.version;return event;});
 if(before===2147483648&&value.latestVersion!==(history[0]?.version??0))throw Error('Invalid latest prostate review version.');
 const next=history.length===20?history[19].version:null;if(value.nextBefore!==next)throw Error('Invalid prostate review cursor.');
 return Object.freeze({context:expected,history,latestVersion:value.latestVersion,nextBefore:next,scope:'private-to-signed-in-account-and-institution'});
}
