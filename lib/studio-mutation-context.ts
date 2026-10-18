export type StudioMutationContext = { actorId: string; organizationId: string };
const guardedActions=new Set(['create-course','create-course-from-template','update-course','create-workbook','save-release','duplicate-course','duplicate-workbook','create-invitation','create-cohort','assign-cohort-workbook','submit-release','review-release','publish-release']);
export const requiresStudioMutationContext=(action:unknown)=>typeof action==='string'&&guardedActions.has(action);
function part(value:unknown):value is string{return typeof value==='string'&&value.length>0&&value.length<=256&&value.trim()===value&&!/[\u0000-\u001f\u007f]/.test(value);}
export function parseStudioMutationContext(value:unknown):StudioMutationContext|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const object=value as Record<string,unknown>;
 if(Object.keys(object).length!==2||!Object.hasOwn(object,'actorId')||!Object.hasOwn(object,'organizationId')||!part(object.actorId)||!object.actorId.startsWith('edu:')||!part(object.actorId.slice(4))||!part(object.organizationId))return null;
 return {actorId:object.actorId,organizationId:object.organizationId};
}
export class StudioMutationContextError extends Error{
 reason:'changed'|'unavailable';
 mayHaveCommitted=false;
 constructor(reason:'changed'|'unavailable'='changed'){
  super(reason==='changed'?'Studio could not confirm this page’s signed-in context. Reload Studio before continuing. Check the saved item before retrying any uncertain save.':'Studio could not confirm this page’s signed-in context. Your input is still here. Retry the context check before continuing. Check the saved item before retrying any uncertain save.');
  this.name='StudioMutationContextError';
  this.reason=reason;
 }
}
export class StudioUncertainSaveError extends Error{
 constructor(){super('Studio could not confirm whether this save completed. Your input is unchanged. Review the saved item before allowing another submission.');this.name='StudioUncertainSaveError';}
}
// This proves only a server comparison at this request boundary. It is not an
// authorization grant, session watcher or confidentiality guarantee for a device.
export async function verifyStudioMutationContext(value:unknown):Promise<void>{
 const expected=parseStudioMutationContext(value);if(!expected)throw new StudioMutationContextError();
 let response:Response,body:unknown;
 try{
  response=await fetch('/api/studio?mutationContext=1',{method:'GET',credentials:'same-origin',cache:'no-store',headers:{'X-Studio-Mutation-Context':JSON.stringify(expected)}});
  body=await response.json();
 }catch{throw new StudioMutationContextError('unavailable');}
 const record=body&&typeof body==='object'&&!Array.isArray(body)?body as Record<string,unknown>:null;
 if(!response.ok)throw new StudioMutationContextError(response.status===401||response.status===409&&record?.code==='STUDIO_CONTEXT_CHANGED'?'changed':'unavailable');
 if(!body||typeof body!=='object'||Array.isArray(body)||(body as Record<string,unknown>).ok!==true||(body as Record<string,unknown>).action!=='verify-studio-mutation-context'||Object.hasOwn(body,'error'))throw new StudioMutationContextError('unavailable');
}
