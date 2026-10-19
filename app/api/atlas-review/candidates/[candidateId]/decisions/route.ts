import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {authorizeAtlasDelivery} from '@/lib/atlas-delivery-access';
import {AtlasModelError} from '@/lib/atlas-model-storage';
import {ClinicalReviewAccessError} from '@/lib/clinical-review-access';
import {getFrozenDecisions,postFrozenDecision} from '@/lib/frozen-review-api';
import registry from '@/lib/clinical-review-candidate-registry.json';
export const runtime='edge';export const dynamic='force-dynamic';
type Context={params:Promise<{candidateId:string}>};
async function handle(request:Request,{params}:Context){return runClinicalReview(request,async authorized=>{
  const {candidateId}=await params;
  const user=await getChatGPTUser();
  try{await authorizeAtlasDelivery(env.DB,user?.userId??null,{audience:'administrator-review',manifestRevision:candidateId});}
  catch(error){if(error instanceof AtlasModelError)throw new ClinicalReviewAccessError(error.status,error.message);throw error;}
  return request.method==='GET'?getFrozenDecisions(authorized,candidateId,registry,env.DB):postFrozenDecision(authorized,candidateId,registry,env.DB);
});}
export {handle as GET,handle as POST};
