import {env} from 'cloudflare:workers';
import type {AuthContext} from './auth';
import {parseStudioMutationContext,StudioMutationContextError} from './studio-mutation-context';

export async function assertStudioMutationContext(auth:AuthContext,value:unknown):Promise<void>{
 const expected=parseStudioMutationContext(value);
 // Client identity is a comparison, never permission. Authentication has
 // already supplied the actor; domain mutations still enforce all their roles,
 // ownership, account state, entitlement, publication and CAS predicates.
 if(!expected||expected.actorId!==auth.userId)throw new StudioMutationContextError();
 try{
  const session=env.DB.withSession('first-primary');
  // Match db/platform.ts's current-organization selection without provisioning,
  // schema writes, content reads or a new organization-selection policy.
  const row=await session.prepare(`SELECT o.id FROM organizations o JOIN organization_memberships m ON m.organization_id=o.id WHERE m.user_id=? AND m.status='active' ORDER BY o.created_at LIMIT 1`).bind(auth.userId).first<{id:string}>();
  if(!row||row.id!==expected.organizationId)throw new StudioMutationContextError();
 }catch(error){if(error instanceof StudioMutationContextError)throw error;throw new StudioMutationContextError('unavailable');}
}
