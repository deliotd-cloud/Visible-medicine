import test from 'node:test';
import assert from 'node:assert/strict';
import {parseStudioInvitationPage, isStudioInvitationRevocation} from '../lib/studio-invitation-response.ts';
const row = () => ({id:'invite:one',label:'Synthetic course group',status:'active',uses:0,maxUses:25,createdAt:'2026-01-01T00:00:00Z',expiresAt:'2099-01-01T00:00:00Z'});
const page = () => ({ok:true,action:'list-course-invitations',releaseId:'release:one',checkedAt:'2026-10-17T00:00:00Z',invitations:[row()],nextCursor:null});
test('invitation metadata accepts exact release-bound metadata and empty pages',()=>{assert.equal(parseStudioInvitationPage(page(),'release:one')?.invitations.length,1);assert.equal(parseStudioInvitationPage({...page(),invitations:[]},'release:one')?.invitations.length,0);assert.equal(parseStudioInvitationPage(page(),'other'),null);});
test('metadata rejects unexpected secret fields, errors, false receipts and malformed timestamps',()=>{
 for(const value of [null,[],{...page(),error:'secret'},{...page(),token:'secret'},{...page(),ok:false},{...page(),checkedAt:'bad'},{...page(),action:'create-invitation'},{...page(),invitations:[{...row(),code_hash:'SECRET'}]}])assert.equal(parseStudioInvitationPage(value,'release:one'),null);
});
test('metadata validates every row and does not silently discard invalid entries',()=>{
 for(const item of [{...row(),uses:-1},{...row(),uses:1.5},{...row(),maxUses:0},{...row(),maxUses:Infinity},{...row(),label:'x'.repeat(201)},{...row(),status:'active\n'},{...row(),id:''},{...row(),expiresAt:'bad'}])assert.equal(parseStudioInvitationPage({...page(),invitations:[row(),item]},'release:one'),null);
 assert.equal(parseStudioInvitationPage({...page(),invitations:[row(),row()]},'release:one'),null);
});
test('cursor must bind the last row of a full fifty-item page',()=>{
 const invitations=Array.from({length:50},(_,i)=>({...row(),id:'invite:'+i})),last=invitations.at(-1)!;
 const value={...page(),invitations,nextCursor:{id:last.id,createdAt:last.createdAt}};
 assert.deepEqual(parseStudioInvitationPage(value,'release:one')?.nextCursor,value.nextCursor);
 for(const nextCursor of [{id:'foreign',createdAt:last.createdAt},{id:last.id,createdAt:'2026-01-02'},{...value.nextCursor,secret:'x'},[]])assert.equal(parseStudioInvitationPage({...value,nextCursor},'release:one'),null);
 assert.equal(parseStudioInvitationPage({...value,invitations:[row()]},'release:one'),null);
 assert.equal(parseStudioInvitationPage({...value,invitations:[...invitations,{...row(),id:'extra'}]},'release:one'),null);
});
test('revocation acknowledgement requires exact action, identity and status without additional data',()=>{
 const value={ok:true,action:'revoke-course-invitation',invitationId:'invite:one',status:'revoked'};
 assert(isStudioInvitationRevocation(value,'invite:one'));
 for(const item of [null,{...value,error:'x'},{...value,invitationCode:'SECRET'},{...value,status:'active'},{...value,ok:false},{...value,action:'create-invitation'}])assert(!isStudioInvitationRevocation(item,'invite:one'));
 assert(!isStudioInvitationRevocation(value,'invite:two'));
});
