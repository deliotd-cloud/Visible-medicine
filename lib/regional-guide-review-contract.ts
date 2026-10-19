import type {RegionalGuideReviewPacket} from './regional-guide-review.ts';

export const regionalGuideReviewChecks=[
 {id:'facts',label:'Check anatomy and teaching facts in the guided steps.'},
 {id:'scope',label:'Check teaching limits and absence of patient registration claims.'},
 {id:'sources',label:'Check step sources and attribution.'},
 {id:'navigation',label:'Check the guided learning order and available destinations.'},
] as const;
export type RegionalGuideReviewContext={schema:'vm-regional-guide-review-context-1';region:'knee';guideId:string;guideRevision:string;contentRevision:string;checklistVersion:'regional-guide-teaching-v1';approvalScope:'guide-teaching-only';patientRegistration:false;publicationApproval:false};
export type RegionalGuideDecision={status:'in-progress'|'changes-required'|'approved';notes:string;checks:Record<typeof regionalGuideReviewChecks[number]['id'],boolean>;attested:boolean};
export type RegionalGuideReviewEvent={eventSchema:'vm-regional-guide-teaching-review-event-1';context:RegionalGuideReviewContext;version:number;savedAt:string;decision:RegionalGuideDecision};
export type RegionalGuideReviewHistory={context:RegionalGuideReviewContext;history:RegionalGuideReviewEvent[];latestVersion:number;nextBefore:number|null;scope:'private-to-signed-in-account-and-institution'};
const exact=(v:unknown,keys:readonly string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
const decisionStatus=(v:unknown):v is RegionalGuideDecision['status']=>v==='in-progress'||v==='changes-required'||v==='approved';
const contextKeys=['schema','region','guideId','guideRevision','contentRevision','checklistVersion','approvalScope','patientRegistration','publicationApproval'];
export function parseRegionalGuideReviewContext(value:unknown):RegionalGuideReviewContext{
 if(!exact(value,contextKeys)||value.schema!=='vm-regional-guide-review-context-1'||value.region!=='knee'||typeof value.guideId!=='string'||!/^[-a-z0-9]{1,120}$/.test(value.guideId)||!text(value.guideRevision,300)||!value.guideRevision.trim()||typeof value.contentRevision!=='string'||!/^[a-f0-9]{64}$/.test(value.contentRevision)||value.checklistVersion!=='regional-guide-teaching-v1'||value.approvalScope!=='guide-teaching-only'||value.patientRegistration!==false||value.publicationApproval!==false)throw Error('Invalid guide teaching review context.');
 return Object.freeze({schema:value.schema,region:'knee',guideId:value.guideId,guideRevision:value.guideRevision,contentRevision:value.contentRevision,checklistVersion:'regional-guide-teaching-v1',approvalScope:'guide-teaching-only',patientRegistration:false,publicationApproval:false});
}
/** Construct only from the server-resolved canonical public guide packet. */
export function regionalGuideReviewContext(packet:RegionalGuideReviewPacket):RegionalGuideReviewContext{
 if(packet.schema!=='vm-regional-guide-review-packet-1'||packet.region!=='knee'||packet.approvalScope!=='guide-teaching-only'||packet.patientRegistration!==false||packet.publicationApproval!==false)throw Error('Invalid canonical guide review packet.');
 return parseRegionalGuideReviewContext({schema:'vm-regional-guide-review-context-1',region:packet.region,guideId:packet.guideId,guideRevision:packet.guideRevision,contentRevision:packet.contentRevision,checklistVersion:'regional-guide-teaching-v1',approvalScope:'guide-teaching-only',patientRegistration:false,publicationApproval:false});
}
export function sameRegionalGuideReviewContext(a:unknown,b:unknown){try{return JSON.stringify(parseRegionalGuideReviewContext(a))===JSON.stringify(parseRegionalGuideReviewContext(b));}catch{return false;}}
export function blankRegionalGuideDecision():RegionalGuideDecision{return {status:'in-progress',notes:'',checks:{facts:false,scope:false,sources:false,navigation:false},attested:false};}
export function validateRegionalGuideDecision(value:unknown):RegionalGuideDecision{
 if(!exact(value,['status','notes','checks','attested'])||!decisionStatus(value.status)||!text(value.notes,6000)||!exact(value.checks,regionalGuideReviewChecks.map(c=>c.id))||typeof value.checks.facts!=='boolean'||typeof value.checks.scope!=='boolean'||typeof value.checks.sources!=='boolean'||typeof value.checks.navigation!=='boolean'||typeof value.attested!=='boolean')throw Error('Invalid guide teaching decision.');
 if(value.status==='changes-required'&&value.notes.trim().length<10)throw Error('Describe required changes in at least 10 characters.');
 if(value.status==='approved'&&(!Object.values(value.checks).every(Boolean)||value.attested!==true))throw Error('Teaching approval requires all checks and explicit clinical reviewer attestation.');
 if(value.status!=='approved'&&value.attested!==false)throw Error('Attestation is only valid for teaching approval.');
 return Object.freeze({status:value.status,notes:value.notes,checks:Object.freeze({facts:value.checks.facts,scope:value.checks.scope,sources:value.checks.sources,navigation:value.checks.navigation}),attested:value.attested});
}
export function parseRegionalGuideReviewEvent(value:unknown):RegionalGuideReviewEvent{
 if(!exact(value,['eventSchema','context','version','savedAt','decision'])||value.eventSchema!=='vm-regional-guide-teaching-review-event-1'||typeof value.version!=='number'||!Number.isSafeInteger(value.version)||value.version<1||value.version>2147483647||typeof value.savedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.savedAt)||!Number.isFinite(Date.parse(value.savedAt))||new Date(value.savedAt).toISOString()!==value.savedAt)throw Error('Invalid saved guide teaching review.');
 return Object.freeze({eventSchema:value.eventSchema,context:parseRegionalGuideReviewContext(value.context),version:value.version,savedAt:value.savedAt,decision:validateRegionalGuideDecision(value.decision)});
}
export function parseRegionalGuideReviewHistory(value:unknown,expectedContext:RegionalGuideReviewContext,before=2147483648):RegionalGuideReviewHistory{
 const expected=parseRegionalGuideReviewContext(expectedContext);
 if(!Number.isSafeInteger(before)||before<1||before>2147483648||!exact(value,['context','history','latestVersion','nextBefore','scope'])||!sameRegionalGuideReviewContext(value.context,expected)||!Array.isArray(value.history)||value.history.length>20||typeof value.latestVersion!=='number'||!Number.isSafeInteger(value.latestVersion)||value.latestVersion<0||value.latestVersion>2147483647||value.scope!=='private-to-signed-in-account-and-institution')throw Error('Invalid guide teaching review history.');
 const latestVersion=value.latestVersion;let prior=before;
 const history=value.history.map((item:unknown)=>{const event=parseRegionalGuideReviewEvent(item);if(event.context.region!==expected.region||event.context.guideId!==expected.guideId||event.version>=prior||event.version>latestVersion)throw Error('Invalid guide teaching review order.');prior=event.version;return event;});
 if(before===2147483648&&value.latestVersion!==(history[0]?.version??0))throw Error('Invalid latest guide teaching version.');
 const next=history.length===20?history[19].version:null;
 if(value.nextBefore!==next)throw Error('Invalid guide teaching history cursor.');
 return Object.freeze({context:expected,history,latestVersion:value.latestVersion,nextBefore:next,scope:'private-to-signed-in-account-and-institution'});
}
